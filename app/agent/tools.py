from openai import OpenAI
from app.agent.deps import BotDeps
from app.escalation import notify_human
from pathlib import Path
from pydantic_ai import RunContext, Agent
from app.config import get_settings
import os
import json
from app.store.firestore_client import get_firestore_client
from app.whatsapp_client import send_whatsapp_image
from pydantic import BaseModel, Field
from typing import List, Optional
from google.cloud.firestore_v1.base_query import FieldFilter
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.openai import OpenAIProvider
import logging
import uuid
from datetime import datetime, timezone
from google.cloud import firestore
import re
import httpx

logger = logging.getLogger(__name__)
_settings = get_settings()

# Proveedor y modelo explícitos para OpenRouter
_provider = OpenAIProvider(
    base_url="https://openrouter.ai/api/v1",
    api_key=_settings.openai_api_key,
)
_ranker_model = OpenAIChatModel(_settings.openai_model, provider=_provider)

class CoincidenciasCatalogo(BaseModel):
    skus: List[str] = Field(
        default_factory=list,
        description="Lista de SKUs coincidentes con la intención del usuario. Máximo 4."
    )

# En versiones recientes de PydanticAI el argumento es output_type
_evaluador_catalogo = Agent(
    _ranker_model,
    output_type=CoincidenciasCatalogo,
    system_prompt=(
        "Eres un clasificador de inventario retail para WhatsApp. "
        "Analiza la consulta del cliente tolerando faltas ortográficas, modismos, jerga "
        "y términos coloquiales (ej. 'jin', 'yen', 'pantalon', 'corte recto'). "
        "Compara la consulta con el catálogo y devuelve ÚNICAMENTE los SKUs que mejor respondan a lo solicitado. "
        "Si no hay relación o no hay productos que coincidan, devuelve una lista vacía."
    )
)

async def consultar_inventario_firestore(ctx: RunContext[BotDeps], termino_busqueda: str) -> str:
    """Consulta productos en Firestore mediante IA para tolerar errores ortográficos y lenguaje coloquial.
    
    Args:
        termino_busqueda: Lo que el cliente pide o describe textualmente.
    """
    db = get_firestore_client()
    
    # 1. Leer productos activos en Firestore
    docs = db.collection("productos").where(filter=FieldFilter("activo", "==", True)).stream()
    productos = [doc.to_dict() for doc in docs]
    
    if not productos:
        return "El catálogo se encuentra vacío en este momento."

    # 2. Resumen compacto para evaluación rápida
    catalogo_resumen = [
        {
            "sku": p.get("sku"),
            "nombre": p.get("nombre"),
            "subcategoria": p.get("subcategoria"),
            "descripcion": p.get("descripcion"),
            "precio": p.get("precio"),
            "stock": p.get("stock")
        }
        for p in productos
    ]

    prompt_usuario = (
        f"Consulta del cliente: '{termino_busqueda}'\n\n"
        f"Catálogo disponible:\n{json.dumps(catalogo_resumen, ensure_ascii=False)}"
    )

    try:
        resultado = await _evaluador_catalogo.run(prompt_usuario)
        # En PydanticAI el output estructurado viene en .output
        output_obj = getattr(resultado, "output", getattr(resultado, "data", None))
        skus_encontrados = output_obj.skus if output_obj else []
    except Exception as e:
        logger.error(f"Error evaluando catálogo con IA: {e}")
        skus_encontrados = []

    if not skus_encontrados:
        return f"No se encontraron productos disponibles para '{termino_busqueda}'."

    # 3. Formatear la respuesta con datos reales de Firestore
    productos_dict = {p["sku"]: p for p in productos}
    coincidencias = []
    
    for sku in skus_encontrados:
        if sku in productos_dict:
            p = productos_dict[sku]
            coincidencias.append(
                f"- SKU: {p.get('sku')} | {p.get('nombre')} | Precio: ${p.get('precio'):.2f} | "
                f"Stock: {p.get('stock')} unid. | UrlFoto: {p.get('imagen_url')}"
            )

    return "Productos disponibles encontrados:\n" + "\n".join(coincidencias)

# Alias para compatibilidad con llamadas existentes
buscar_productos = consultar_inventario_firestore

PAGOS_PATH = Path(__file__).resolve().parents[2] / "context" / "pagos-simulados.json"

_settings = get_settings()

CATALOGO_PATH = Path(__file__).resolve().parents[2] / "context" / "catalogo-productos.md"

def conciliar_pago_simulado(referencia: str, total_esperado: float) -> tuple[bool, str]:
    if not PAGOS_PATH.exists():
        return False, "Base de datos bancaria no encontrada"
    try:
        pagos = json.loads(PAGOS_PATH.read_text(encoding="utf-8"))
        monto_pagado = pagos.get(str(referencia).strip())
        if monto_pagado is not None and float(monto_pagado) >= float(total_esperado):
            return True, "Conciliado Exitosamente"
        elif monto_pagado is not None:
            return False, f"Monto insuficiente (${monto_pagado} de ${total_esperado})"
        return False, "Referencia no encontrada en banco"
    except Exception as e:
        return False, f"Error bancario: {e}"
    
def enviar_foto_producto(ctx: RunContext[BotDeps], url_imagen: str, descripcion_breve: str) -> str:
    """Envía la fotografía de un producto al WhatsApp del cliente actual.
    
    Args:
        url_imagen: URL HTTPS pública de la imagen del producto (obtenida de consultar_inventario_firestore).
        descripcion_breve: Nombre y precio del producto para acompañar la imagen.
    """
    try:
        send_whatsapp_image(
            to_phone=ctx.deps.wa_id,
            image_url=url_imagen,
            caption=descripcion_breve
        )
        return "Imagen enviada con éxito al chat del cliente."
    except Exception as e:
        return f"No se pudo enviar la imagen: {str(e)}"

def transferir_a_caja(ctx: RunContext[BotDeps], items_resumen: str, total_estimado: float) -> str:
    """Transfiere la sesión del cliente al Agente Cajero para registrar pago y datos de entrega.
    
    Args:
        items_resumen: Lista o texto de productos elegidos (ej. '1x Pantalón Jean Clásico Denim Azul ($35.00)').
        total_estimado: Monto total de los artículos acordados.
    """
    ctx.deps.fase = "cajero"  # Cambia la fase en el estado persistido
    ctx.deps.carrito = items_resumen
    ctx.deps.total = total_estimado
    return f"Cliente transferido exitosamente a Caja con pedido: {items_resumen} por ${total_estimado:.2f}."

def registrar_pedido_firestore(
    ctx: RunContext[BotDeps],
    nombre_completo: str,
    cedula_id: str,
    telefono_contacto: str,
    region: str,
    direccion_exacta: str,
    punto_referencia: str,
    metodo_pago: str,
    referencia_pago: str
) -> str:
    """Registra formalmente el pedido en Firestore en la colección 'pedidos' para el panel web.
    
    Args:
        nombre_completo: Nombre y apellido del destinatario.
        cedula_id: Cédula de identidad (ej. 26996236).
        telefono_contacto: Teléfono móvil de contacto.
        region: Región asignada ('Capital', 'Centro' u 'Oriente').
        direccion_exacta: Dirección de entrega.
        punto_referencia: Referencia cercana para el repartidor.
        metodo_pago: Medio con el que pagó (Pago Móvil, Zelle, Zinli).
        referencia_pago: Número de confirmación de la transferencia.
    """
    try:
        db = get_firestore_client()
        pedido_id = f"PED-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"

        datos_orden = {
            "pedido_id": pedido_id,
            "wa_id": ctx.deps.wa_id,
            "cliente_nombre": nombre_completo,
            "cliente_cedula": cedula_id,
            "cliente_telefono": telefono_contacto,
            "region": region,
            "direccion": direccion_exacta,
            "referencia_direccion": punto_referencia,
            "items": ctx.deps.carrito or "Pantalón Jogger Urbano Deportivo ($26.00)",
            "total_usd": float(ctx.deps.total or 26.0),
            "metodo_pago": metodo_pago,
            "referencia_pago": referencia_pago,
            "estado_pago": "Por Verificar",
            "estado_despacho": "Pendiente",
            "fecha_creacion": firestore.SERVER_TIMESTAMP
        }

        db.collection("pedidos").document(pedido_id).set(datos_orden)
        print(f"\n=======================================================")
        print(f"✔ [FIRESTORE] Pedido {pedido_id} creado con éxito para {nombre_completo}")
        print(f"=======================================================\n")
        
        ctx.deps.fase = "logistica"
        return f"Éxito: Pedido {pedido_id} guardado correctamente en Firestore bajo la región {region}."
    except Exception as e:
        print(f"❌ Error al guardar en Firestore: {e}")
        return f"Error guardando el pedido: {str(e)}"

class ExtraccionCajero(BaseModel):
    nombre_completo: Optional[str] = None
    cedula_id: Optional[str] = None
    telefono_contacto: Optional[str] = None
    region: Optional[str] = Field("Capital", description="Capital, Centro u Oriente")
    direccion_exacta: Optional[str] = None
    punto_referencia: Optional[str] = None
    metodo_pago: Optional[str] = None
    referencia_pago: Optional[str] = None
    # --- NUEVOS CAMPOS ---
    items: Optional[str] = Field(
        None, 
        description="Prenda o productos específicos que el cliente acordó llevar (ej. '1x Jogger Deportivo Gris')"
    )
    monto_total: Optional[float] = Field(
        None, 
        description="Monto total acordado en dólares según el precio del catálogo (ej. 26.0 o 35.0)"
    )
    # ---------------------
    listo_para_conciliar: bool = Field(
        False, 
        description="True únicamente si ya tenemos al menos la referencia de pago y una dirección básica."
    )
    mensaje_cliente: str = Field(
        ..., 
        description="Respuesta al cliente. Si falta algún dato, formula una pregunta directa."
    )

def insertar_pedido_firestore(wa_id: str, carrito: str, total: float, datos: ExtraccionCajero) -> str:
    db = get_firestore_client()
    pedido_id = f"PED-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:5].upper()}"
    
    # Si por alguna razón el cajero no extrajo los items, los rescatamos de la sesión activa en Firestore
    items_finales = datos.items or carrito
    total_final = float(datos.monto_total or total or 0.0)

    if not items_finales or items_finales == "Productos seleccionados" or total_final == 0.0:
        # CAMBIO AQUÍ: Buscar sesiones que no estén ni despachadas ni perdidas
        sesiones = (
            db.collection("sesiones_bot")
            .where(filter=FieldFilter("wa_id", "==", wa_id))
            .where(filter=FieldFilter("fase", "not-in", ["despachado", "venta_perdida"]))
            .limit(1)
            .get()
        )
        if sesiones:
            sesion_data = sesiones[0].to_dict()
            items_finales = sesion_data.get("carrito", items_finales)
            total_final = float(sesion_data.get("total_estimado", total_final))

    direccion_procesada = normalizar_direccion_con_maps(datos.direccion_exacta or "Retiro en tienda")
    
    doc_data = {
        "pedido_id": pedido_id,
        "wa_id": wa_id,
        "cliente_nombre": datos.nombre_completo or "Cliente WhatsApp",
        "cliente_cedula": datos.cedula_id or "Sin Cédula",
        "cliente_telefono": datos.telefono_contacto or wa_id,
        "region": datos.region or "Capital",
        "direccion": direccion_procesada,
        "referencia_direccion": datos.punto_referencia or "N/A",
        "items": items_finales,
        "total_usd": total_final,
        "metodo_pago": datos.metodo_pago or "Pago Móvil",
        "referencia_pago": datos.referencia_pago or "N/A",
        "estado_pago": "Aprobado / Conciliado",
        "estado_despacho": "Pendiente por Despacho",
        "fecha_creacion": firestore.SERVER_TIMESTAMP
    }
    
    db.collection("pedidos").document(pedido_id).set(doc_data)
    return pedido_id
    
    db.collection("pedidos").document(pedido_id).set(doc_data)
    print(f"\n✔ [FIRESTORE] Pedido {pedido_id} creado con dirección normalizada.")
    print(f"   Dirección guardada: {direccion_procesada}\n")
    return pedido_id

def normalizar_direccion_con_maps(direccion_texto: str) -> str:
    """Detecta enlaces de Google Maps en el texto de la dirección y genera

    la URL directa navegable para el motorizado o panel de React.
    Costo $0/mes, no requiere API Keys de Google Maps Platform.
    """
    if not direccion_texto:
        return "Retiro en tienda / Sin dirección"

    # 1. Caso: El usuario pegó un link corto de Maps (maps.app.goo.gl o goo.gl/maps)
    patron_corto = r'https?://(?:maps\.app\.goo\.gl|goo\.gl/maps)/[a-zA-Z0-9_-]+'
    coincidencia_corta = re.search(patron_corto, direccion_texto)

    if coincidencia_corta:
        url_corta = coincidencia_corta.group(0)
        try:
            # Hacemos una petición ligera HEAD/GET para seguir la redirección HTTP 302
            with httpx.Client(follow_redirects=True, timeout=4.0) as client:
                res = client.get(url_corta)
                url_final = str(res.url)

                # Intentamos extraer latitud y longitud de la URL destino
                coords = re.search(r'@(-?\d+\.\d+),(-?\d+\.\d+)', url_final) or re.search(r'q=(-?\d+\.\d+),(-?\d+\.\d+)', url_final)
                if coords:
                    lat, lng = coords.groups()
                    url_navegable = f"https://www.google.com/maps?q={lat},{lng}"
                    return direccion_texto.replace(url_corta, url_navegable)

                return direccion_texto.replace(url_corta, url_final)
        except Exception as e:
            print(f"⚠️ [MAPS] No se pudo expandir el enlace corto: {e}")
            return direccion_texto

    # 2. Caso: El usuario escribió o pegó coordenadas directas (ej: 10.5124, -66.9036)
    patron_coords = r'(-?\d{1,2}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})'
    coincidencia_coords = re.search(patron_coords, direccion_texto)
    if coincidencia_coords and "google.com/maps" not in direccion_texto:
        lat, lng = coincidencia_coords.groups()
        url_maps = f"https://www.google.com/maps?q={lat},{lng}"
        return f"{direccion_texto} (📍 {url_maps})"

    return direccion_texto

def registrar_o_actualizar_sesion_bot(
    wa_id: str,
    cliente_nombre: Optional[str] = None,
    fase: str = "iniciado",
    bot_activo: bool = True,
    pedido_id: Optional[str] = None,
    sesion_id: Optional[str] = None
) -> str:
    """Registra y actualiza sesiones analíticas con cálculo automático del tiempo de conversión."""
    try:
        db = get_firestore_client()
        coleccion = db.collection("sesiones_bot")

        # 1. Recuperar o generar la referencia del documento
        doc_existente = None
        if not sesion_id:
            sesiones_activas = (
                coleccion.where("wa_id", "==", wa_id)
                .where("fase", "not-in", ["venta_cerrada", "venta_perdida"])
                .limit(1)
                .get()
            )
            if sesiones_activas:
                doc_existente = sesiones_activas[0]
                sesion_ref = doc_existente.reference
                sesion_id = doc_existente.id
            else:
                fecha_str = datetime.now(timezone.utc).strftime("%Y%m%d")
                sesion_id = f"SES-{fecha_str}-{uuid.uuid4().hex[:5].upper()}"
                sesion_ref = coleccion.document(sesion_id)
        else:
            sesion_ref = coleccion.document(sesion_id)
            doc_snap = sesion_ref.get()
            if doc_snap.exists:
                doc_existente = doc_snap

        datos: dict = {
            "sesion_id": sesion_id,
            "wa_id": wa_id,
            "bot_activo": bot_activo,
            "fase": fase,
            "ultima_actividad": firestore.SERVER_TIMESTAMP
        }

        # 2. Si la sesión es nueva, guardamos la marca de tiempo de inicio
        if not doc_existente:
            datos["fecha_inicio"] = firestore.SERVER_TIMESTAMP

        if cliente_nombre:
            datos["cliente_nombre"] = cliente_nombre

        # 3. Si se cierra la venta, calculamos la métrica de tiempo de conversión
        if fase == "venta_cerrada":
            ahora_utc = datetime.now(timezone.utc)
            datos["fecha_cierre"] = firestore.SERVER_TIMESTAMP
            
            if pedido_id:
                datos["pedido_id_asociado"] = pedido_id

            if doc_existente:
                data_previa = doc_existente.to_dict() or {}
                fecha_inicio_doc = data_previa.get("fecha_inicio")
                
                # Firestore devuelve timestamps como datetime consciente de zona horaria
                if fecha_inicio_doc:
                    if hasattr(fecha_inicio_doc, "to_datetime"):
                        dt_inicio = fecha_inicio_doc.to_datetime()
                    else:
                        dt_inicio = fecha_inicio_doc

                    # Asegurar comparación en UTC
                    if dt_inicio.tzinfo is None:
                        dt_inicio = dt_inicio.replace(tzinfo=timezone.utc)

                    segundos = max(0, int((ahora_utc - dt_inicio).total_seconds()))
                    datos["duracion_segundos"] = segundos
                    datos["duracion_minutos"] = round(segundos / 60.0, 2)

        sesion_ref.set(datos, merge=True)
        return sesion_id

    except Exception as e:
        logger.error(f"Error actualizando sesión bot para {wa_id}: {e}")
        return sesion_id or ""


def escalar_a_humano_ticket(
    ctx: RunContext[BotDeps],
    motivo_incidencia: str,
    resumen_caso: str
) -> str:
    """Escala la conversación a un operador humano creando un ticket en Firestore y pausando el bot.

    Args:
        motivo_incidencia: Clasificación breve del problema (ej. 'Falla en comprobante Zelle', 'Cambio de dirección').
        resumen_caso: Explicación concisa para el agente humano sobre qué intentaba hacer el cliente y por qué se transfirió.
    """
    wa_id = ctx.deps.wa_id
    db = get_firestore_client()
    ticket_id = f"TICK-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    try:
        # 1. Pausar la sesión del bot
        registrar_o_actualizar_sesion_bot(
            wa_id=wa_id,
            fase="escalado_humano",
            bot_activo=False
        )

        # 2. Crear documento formal en tickets_soporte
        hora_actual = datetime.now().strftime("%I:%M %p")
        ticket_data = {
            "ticket_id": ticket_id,
            "wa_id": wa_id,
            "cliente_nombre": getattr(ctx.deps, "nombre_cliente", None) or f"Cliente {wa_id[-4:]}",
            "telefono": wa_id,
            "incidencia": motivo_incidencia,
            "resumen_ia": resumen_caso,
            "estado": "escalado",
            "fecha_creacion": firestore.SERVER_TIMESTAMP,
            "mensajes": [
                {
                    "id": f"m-{uuid.uuid4().hex[:6]}",
                    "emisor": "bot",
                    "texto": f"Transferido a soporte humano: {motivo_incidencia}",
                    "hora": hora_actual
                }
            ]
        }

        db.collection("tickets_soporte").document(ticket_id).set(ticket_data)
        
        # 3. Notificación externa si está configurada
        notify_human(wa_id, f"{motivo_incidencia} - {resumen_caso}")

        logger.info(f"✔ [SOPORTE] Ticket {ticket_id} abierto para {wa_id}. Bot desactivado.")
        return (
            "He generado tu ticket de soporte y transferido el caso a un asesor humano de nuestro equipo. "
            "En breve te responderán directamente por aquí."
        )

    except Exception as e:
        logger.error(f"Error generando ticket de soporte para {wa_id}: {e}")
        return "Hubo un inconveniente conectando con el área de soporte, pero tu solicitud fue notificada al equipo."

def procesar_escalamiento_director(
    wa_id: str,
    motivo_incidencia: str,
    resumen_caso: str,
    cliente_nombre: Optional[str] = None
) -> str:
    """Ejecutada directamente por el orquestador cuando el Director decide transferir a humano."""
    db = get_firestore_client()
    ticket_id = f"TICK-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

    try:
        # 1. Desactivar el bot en la sesión analítica
        registrar_o_actualizar_sesion_bot(
            wa_id=wa_id,
            cliente_nombre=cliente_nombre,
            fase="escalado_humano",
            bot_activo=False
        )

        # 2. Generar el ticket en tickets_soporte
        hora_actual = datetime.now().strftime("%I:%M %p")
        ticket_data = {
            "ticket_id": ticket_id,
            "wa_id": wa_id,
            "cliente_nombre": cliente_nombre or f"Cliente {wa_id[-4:]}",
            "telefono": wa_id,
            "incidencia": motivo_incidencia or "Atención Humana Requerida",
            "resumen_ia": resumen_caso or "El cliente ha solicitado hablar con un operador.",
            "estado": "escalado",
            "fecha_creacion": firestore.SERVER_TIMESTAMP,
            "mensajes": [
                {
                    "id": f"m-{uuid.uuid4().hex[:6]}",
                    "emisor": "bot",
                    "texto": f"Transferido a soporte: {motivo_incidencia}",
                    "hora": hora_actual
                }
            ]
        }

        db.collection("tickets_soporte").document(ticket_id).set(ticket_data)
        logger.info(f"✔ [DIRECTOR] Ticket {ticket_id} creado en Firestore para {wa_id}. Bot apagado.")

        return (
            "He transferido tu caso a un asesor humano de nuestro equipo. "
            "En breve te responderán directamente por este chat."
        )

    except Exception as e:
        logger.error(f"Error procesando escalamiento desde el Director: {e}")
        return "Tu solicitud de atención humana ha sido registrada. Un asesor te atenderá pronto."

def marcar_persistencia_aplicada(wa_id: str, estrategia: str) -> str:
    """Marca en Firestore que una estrategia de retención ya fue enviada al cliente."""
    try:
        db = get_firestore_client()
        coleccion = db.collection("sesiones_bot")
        sesiones_activas = coleccion.where("wa_id", "==", wa_id).where("fase", "!=", "venta_cerrada").limit(1).get()
        
        if sesiones_activas:
            doc = sesiones_activas[0]
            doc.reference.update({
                "ultima_estrategia_retencion": estrategia,
                "retencion_enviada_el": firestore.SERVER_TIMESTAMP
            })
            return "Marca de persistencia registrada exitosamente en la base de datos."
        return "No hay sesión activa para aplicar persistencia."
    except Exception as e:
        logger.error(f"Error marcando persistencia para {wa_id}: {e}")
        return f"Error en registro: {e}"

def agregar_item_carrito_firestore(
    ctx: RunContext[BotDeps],
    sku: str,
    nombre_producto: str,
    precio_unitario: float,
    cantidad: int = 1,
    talla: Optional[str] = None,
    color: Optional[str] = None
) -> str:
    """Registra o actualiza un producto en el carrito activo del cliente dentro de Firestore.
    
    Args:
        sku: Código único del producto.
        nombre_producto: Nombre comercial del artículo.
        precio_unitario: Precio en USD por unidad.
        cantidad: Número de unidades elegidas.
        talla: Talla elegida (ej. 'M', 'L', '32') si aplica.
        color: Color elegido si aplica.
    """
    wa_id = ctx.deps.wa_id
    try:
        db = get_firestore_client()
        coleccion = db.collection("sesiones_bot")
        
        # Buscar la sesión abierta que no esté cerrada
        sesiones_activas = (
            coleccion.where("wa_id", "==", wa_id)
            .where("fase", "not-in", ["venta_cerrada", "venta_perdida"])
            .limit(1)
            .get()
        )
        
        if not sesiones_activas:
            # Si no existe sesión, creamos una de inmediato
            sesion_id = registrar_o_actualizar_sesion_bot(wa_id=wa_id, fase="servicio", bot_activo=True)
            doc_ref = coleccion.document(sesion_id)
            doc_data = {}
        else:
            doc_ref = sesiones_activas[0].reference
            doc_data = sesiones_activas[0].to_dict() or {}

        carrito_actual: list = doc_data.get("items_detalle", [])
        
        item_existente = next((item for item in carrito_actual if item.get("sku") == sku and item.get("talla") == talla), None)
        
        if item_existente:
            item_existente["cantidad"] += cantidad
            item_existente["subtotal"] = round(item_existente["cantidad"] * precio_unitario, 2)
        else:
            carrito_actual.append({
                "sku": sku,
                "nombre": nombre_producto,
                "precio": float(precio_unitario),
                "cantidad": int(cantidad),
                "talla": talla or "N/A",
                "color": color or "N/A",
                "subtotal": round(cantidad * precio_unitario, 2)
            })

        # Recalcular totales consolidados
        total_acumulado = round(sum(item.get("subtotal", 0.0) for item in carrito_actual), 2)
        total_unidades = sum(item.get("cantidad", 0) for item in carrito_actual)
        
        # Resumen legible para el banner de React y el cajero
        resumen_texto = ", ".join([f"{i['cantidad']}x {i['nombre']} ({i['talla']})" for i in carrito_actual])

        # Actualizar sesión en Firestore
        doc_ref.update({
            "items_detalle": carrito_actual,
            "carrito": resumen_texto,
            "items_carrito": total_unidades,
            "total_estimado": total_acumulado,
            "ultima_actividad": firestore.SERVER_TIMESTAMP
        })

        # Sincronizar memoria de dependencias local
        ctx.deps.carrito = resumen_texto
        ctx.deps.total = total_acumulado

        logger.info(f"🛒 [CARRITO FIRESTORE] Actualizado para {wa_id}: {resumen_texto} | Total: ${total_acumulado}")
        return f"Producto '{nombre_producto}' agregado al carrito. Total acumulado actual: ${total_acumulado:.2f} USD."

    except Exception as e:
        logger.error(f"Error actualizando carrito en Firestore para {wa_id}: {e}")
        return f"Error técnico al registrar en el carrito: {e}"