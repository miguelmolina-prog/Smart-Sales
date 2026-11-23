import logging
from datetime import datetime, timezone
from typing import Optional
import uuid

from fastapi import FastAPI, HTTPException, BackgroundTasks # <-- Agrega BackgroundTasks aquí
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter

from app.health import router as health_router
from app.webhook.router import router as webhook_router
from app.api.routes.sap_routes import router as sap_router
from app.whatsapp_client import send_whatsapp_message
from app.store.firestore_client import get_firestore_client
from app.queue.tasks import buffer_inbound
from app.store.redis_store import limpiar_memoria_usuario

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Lana WhatsApp Agent API")

# Habilitar CORS para que React pueda enviar mensajes y peticiones
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers existentes
app.include_router(health_router)
app.include_router(webhook_router)
app.include_router(sap_router)


# =====================================================================
# 1. ENDPOINT: Enviar Mensaje desde el Panel Web a WhatsApp
# =====================================================================
class MensajeAgenteRequest(BaseModel):
    ticket_id: str
    wa_id: str
    texto: str

@app.post("/api/chat/enviar-mensaje")
async def enviar_mensaje_agente(payload: MensajeAgenteRequest):
    """Permite al operador humano responder al cliente desde la interfaz web."""
    try:
        # 1. Enviar mensaje a WhatsApp vía API de Meta
        send_whatsapp_message(to_phone=payload.wa_id, text=payload.texto)

        # 2. Registrar el mensaje en Firestore dentro del ticket de soporte
        db = get_firestore_client()
        ticket_ref = db.collection("tickets_soporte").document(payload.ticket_id)
        
        hora_actual = datetime.now().strftime("%I:%M %p")
        nuevo_msj = {
            "id": f"m-agente-{uuid.uuid4().hex[:6]}",
            "emisor": "agente",
            "texto": payload.texto,
            "hora": hora_actual
        }
        
        ticket_ref.update({
            "mensajes": firestore.ArrayUnion([nuevo_msj])
        })

        logger.info(f"✔ [SOPORTE WEB] Mensaje enviado a WhatsApp {payload.wa_id}")
        return {"status": "ok", "mensaje": "Mensaje enviado y registrado"}
    except Exception as e:
        logger.error(f"Error enviando mensaje manual a {payload.wa_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================================
# 2. ENDPOINT: Reactivar el Bot al Cerrar Ticket
# =====================================================================
class ReactivarBotRequest(BaseModel):
    wa_id: str

@app.post("/api/chat/reactivar-bot")
async def reactivar_bot(payload: ReactivarBotRequest):
    """Reactiva el bot encendiendo bot_activo en la sesión analítica abierta."""
    try:
        db = get_firestore_client()
        coleccion = db.collection("sesiones_bot")
        
        # Consultamos por wa_id evitando índices compuestos y filtramos en Python
        sesiones = coleccion.where(filter=FieldFilter("wa_id", "==", payload.wa_id)).stream()
        
        sesion_encontrada = False
        for s in sesiones:
            data = s.to_dict()
            if data.get("fase") != "venta_cerrada":
                s.reference.update({
                    "bot_activo": True,
                    "fase": "iniciado",
                    "ultima_actividad": firestore.SERVER_TIMESTAMP
                })
                sesion_encontrada = True
                break

        logger.info(f"✔ [BOT REACTIVADO] Sesión de {payload.wa_id} reactivada correctamente.")
        return {
            "status": "ok", 
            "mensaje": "Bot reactivado exitosamente",
            "sesion_actualizada": sesion_encontrada
        }
    except Exception as e:
        logger.error(f"Error reactivando bot para {payload.wa_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================================
# 3. ENDPOINT: Módulo de Persistencia (Inyección de Prompt)
# =====================================================================
class PersistenciaRequest(BaseModel):
    wa_id: str
    accion: str

@app.post("/api/persistencia")
async def ejecutar_estrategia(req: PersistenciaRequest, background_tasks: BackgroundTasks):
    """Inyecta un prompt con el carrito real del cliente y registra la trazabilidad."""
    db = get_firestore_client()
    coleccion = db.collection("sesiones_bot")
    
    # 1. Buscar sesión activa
    sesiones_activas = coleccion.where("wa_id", "==", req.wa_id).where("fase", "!=", "venta_cerrada").limit(1).get()
    
    if not sesiones_activas:
        raise HTTPException(status_code=404, detail="No se encontró una sesión activa para este cliente.")
    
    doc_sesion = sesiones_activas[0]
    data_sesion = doc_sesion.to_dict() or {}
    
    # 2. Extraer el carrito persistido
    carrito_texto = data_sesion.get("carrito") or "productos de su interés"
    total_usd = data_sesion.get("total_estimado", 0.0)
    info_carrito = f"{carrito_texto} (Total estimado: ${total_usd} USD)"

    # 3. Registrar trazabilidad en Firestore
    registro_intento = {
        "accion": req.accion,
        "fecha": datetime.now(timezone.utc).isoformat(),
        "disparado_por": "operador_panel",
        "carrito_en_riesgo": carrito_texto,
        "total_en_riesgo": total_usd
    }
    
    doc_sesion.reference.update({
        "ultima_estrategia_retencion": req.accion,
        "retencion_enviada_el": firestore.SERVER_TIMESTAMP,
        "intentos_persistencia": firestore.Increment(1),
        "historial_persistencia": firestore.ArrayUnion([registro_intento])
    })

    # 4. Instrucciones enriquecidas con el carrito real
    instrucciones = {
        "ofrecer_cashea": (
            f"El cliente tiene apartado en su carrito: {info_carrito}. "
            f"Lleva inactivo más de 10 minutos. Redacta un mensaje amable y persuasivo mencionando "
            f"específicamente esos artículos y proponiéndole pagarlos en cuotas sin interés con Cashea."
        ),
        "alerta_stock": (
            f"El cliente tiene apartado en su carrito: {info_carrito}. "
            f"Lleva inactivo más de 10 minutos. Redacta un mensaje de urgencia cordial avisándole que "
            f"quedan pocas unidades de {carrito_texto} y que el sistema liberará la reserva en breve si no concretamos."
        ),
        "otra_recomendacion": (
            f"El cliente mostró interés en: {info_carrito}, pero se detuvo. "
            f"Redacta un mensaje cordial consultándole si busca algo en un rango de precio distinto a esos ${total_usd} USD, "
            f"otra talla/color o si prefiere ver modelos similares de la tienda."
        ),
        "ofrecer_humano": (
            f"El cliente estaba revisando: {info_carrito} y quedó en silencio. "
            f"Redacta un mensaje ofreciéndole transferirlo con un asesor humano de nuestro equipo "
            f"para aclarar dudas sobre el pago o coordinar la entrega de su pedido."
        )
    }

    instruccion_prompt = instrucciones.get(
        req.accion, 
        f"El cliente tiene en su carrito {info_carrito} y lleva inactivo un tiempo. Redacta un mensaje consultando si desea concretar."
    )
    
    texto_inyectado = f"[INSTRUCCIÓN INTERNA DE PERSISTENCIA] Supervisor: {instruccion_prompt}"
    system_msg_id = f"internal-sys-{uuid.uuid4().hex[:8]}"
    
    background_tasks.add_task(buffer_inbound, req.wa_id, system_msg_id, texto_inyectado)
    
    logger.info(f"✔ [PERSISTENCIA CON CARRITO] Estrategia '{req.accion}' inyectada con productos: {carrito_texto}")
    return {"status": "ok", "message": "Persistencia con contexto de carrito encolada"}

class DespachoRequest(BaseModel):
    pedido_id: str
    wa_id: str

@app.post("/api/pedidos/marcar-despachado")
async def marcar_pedido_despachado(payload: DespachoRequest):
    """Actualiza el pedido a 'Despachado', cierra formalmente la sesión y limpia la memoria."""
    try:
        db = get_firestore_client()
        
        # 1. Actualizar el pedido en la colección 'pedidos'
        pedido_ref = db.collection("pedidos").document(payload.pedido_id)
        pedido_ref.update({
            "estado_despacho": "Despachado",
            "fecha_despacho": firestore.SERVER_TIMESTAMP
        })

        # 2. Cerrar la sesión analítica activa en 'sesiones_bot'
        sesiones = (
            db.collection("sesiones_bot")
            .where(filter=FieldFilter("wa_id", "==", payload.wa_id))
            .where(filter=FieldFilter("fase", "not-in", ["despachado", "venta_perdida"]))
            .limit(1)
            .get()
        )

        for s in sesiones:
            s.reference.update({
                "fase": "despachado",
                "fecha_cierre": firestore.SERVER_TIMESTAMP
            })

        # 3. Purgar la memoria para que el siguiente mensaje inicie desde cero
        limpiar_memoria_usuario(payload.wa_id)

        logger.info(f"✔ [LOGÍSTICA] Pedido {payload.pedido_id} despachado. Sesión cerrada y memoria purgada para {payload.wa_id}.")
        return {"status": "ok", "mensaje": "Pedido marcado como despachado y memoria reiniciada"}

    except Exception as e:
        logger.error(f"Error marcando despacho para {payload.pedido_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class VentaPerdidaRequest(BaseModel):
    sesion_id: str
    wa_id: str
    motivo: Optional[str] = "Descarte manual"

@app.post("/api/sesiones/marcar-perdida")
async def marcar_sesion_perdida(payload: VentaPerdidaRequest):
    """Marca la sesión como venta_perdida y purga la memoria de Redis."""
    try:
        db = get_firestore_client()
        sesion_ref = db.collection("sesiones_bot").document(payload.sesion_id)
        sesion_ref.update({
            "fase": "venta_perdida",
            "fecha_cierre": firestore.SERVER_TIMESTAMP,
            "motivo_perdida": payload.motivo
        })

        # Purgar memoria en Redis
        limpiar_memoria_usuario(payload.wa_id)

        logger.info(f"✔ [VENTA PERDIDA] Sesión {payload.sesion_id} archivada y memoria eliminada para {payload.wa_id}.")
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error archivando venta perdida: {e}")
        raise HTTPException(status_code=500, detail=str(e))