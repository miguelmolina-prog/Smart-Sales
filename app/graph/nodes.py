from app.graph.state import AgentState
from app.agent.deps import BotDeps
from app.agent.agent import agente_director, agente_servicio, agente_cajero, agente_logistico
from app.agent.tools import (
    ExtraccionCajero,
    conciliar_pago_simulado,
    insertar_pedido_firestore,
    procesar_escalamiento_director,
    registrar_o_actualizar_sesion_bot
)

def extraer_texto(respuesta) -> str:
    """Extrae el texto de la respuesta de PydanticAI de forma compatible."""
    if hasattr(respuesta, 'data'):
        return str(respuesta.data)
    elif hasattr(respuesta, 'output'):
        return str(respuesta.output)
    return str(respuesta)

def obtener_ultimo_mensaje_cliente(state: AgentState) -> str:
    """Obtiene el texto del último mensaje enviado por el cliente."""
    mensajes = state.get("messages", [])
    if not mensajes:
        return ""
    ultimo = mensajes[-1]
    return getattr(ultimo, "content", str(ultimo))

def armar_contexto(state: AgentState) -> str:
    """Toma los últimos 6 mensajes del historial para que la IA tenga memoria."""
    mensajes = state.get("messages", [])
    if not mensajes:
        return ""
        
    mensajes_previos = mensajes[:-1][-6:]
    ultimo_mensaje = obtener_ultimo_mensaje_cliente(state)

    if not mensajes_previos:
        return ultimo_mensaje

    historial = []
    for m in mensajes_previos:
        rol_attr = getattr(m, "type", None) or getattr(m, "role", "user")
        rol = "Cliente" if rol_attr in ["human", "user"] else "Asistente"
        contenido = getattr(m, "content", str(m))
        historial.append(f"{rol}: {contenido}")

    texto_historial = "\n".join(historial)
    return f"[LO QUE HAN HABLADO HASTA AHORA]\n{texto_historial}\n\n[NUEVO MENSAJE DEL CLIENTE]\nCliente: {ultimo_mensaje}"


# ==========================================
# 1. NODO DIRECTOR (Enrutador Dinámico Inteligente)
# ==========================================
async def nodo_director(state: AgentState):
    prompt_con_memoria = armar_contexto(state)
    
    # El director usa el LLM para decidir a dónde va el mensaje
    resultado = await agente_director.run(prompt_con_memoria)
    
    # Extraemos la decisión estructurada (Pydantic BaseModel)
    decision = getattr(resultado, "output", getattr(resultado, "data", None))
    destino = decision.destino if decision else "servicio"

    # Si la decisión es humano, generamos el ticket en Firestore y pausamos el bot
    if destino == "humano":
        wa_id = state.get("wa_id", "")
        motivo = getattr(decision, "motivo_incidencia", None) or "Solicitud directa de operador"
        resumen = getattr(decision, "resumen_caso", None) or getattr(decision, "razonamiento_breve", "El cliente solicitó hablar con un asesor.")

        # Escribe en Firestore: apaga sesiones_bot/{wa_id} y crea tickets_soporte/{ticket_id}
        mensaje_salida = procesar_escalamiento_director(
            wa_id=wa_id,
            motivo_incidencia=motivo,
            resumen_caso=resumen
        )

        return {
            "fase_actual": "humano", 
            "escalado": True, 
            "messages": [("assistant", mensaje_salida)]
        }

    # Sobrescribimos la fase actual del grafo con la decisión del Director
    return {"fase_actual": destino}


# ==========================================
# 2. NODO SERVICIO AL CLIENTE (Ventas)
# ==========================================
async def nodo_servicio(state: AgentState):
    prompt_con_memoria = armar_contexto(state)
    
    # Inicializar deps preservando lo que traiga el estado
    deps = BotDeps(
        wa_id=state["wa_id"],
        db=None,
        fase=state.get("fase_actual", "servicio"),
        carrito=state.get("carrito", ""),
        total=state.get("total", 0.0)
    )

    respuesta = await agente_servicio.run(prompt_con_memoria, deps=deps)
    texto = extraer_texto(respuesta)

    # 1. Leer primero si la tool transferir_a_caja mutó el estado
    fase_final = getattr(deps, "fase", "servicio")

    # 2. Respaldo por texto si el LLM prometió transferir sin invocar la tool
    if fase_final == "servicio":
        texto_lower = texto.lower()
        if "área de caja" in texto_lower or "equipo de caja" in texto_lower or "transferir con nuestro equipo de caja" in texto_lower:
            fase_final = "caja"

    return {
        "messages": [("assistant", texto)],
        "fase_actual": "caja" if fase_final in ("caja", "cajero") else "servicio",
        "carrito": getattr(deps, "carrito", state.get("carrito", "")),
        "total": getattr(deps, "total", state.get("total", 0.0))
    }


# ==========================================
# 3. NODO CAJERO (Conversacional Ligero)
# ==========================================
async def nodo_cajero(state: AgentState):
    prompt_con_memoria = armar_contexto(state)
    resultado = await agente_cajero.run(prompt_con_memoria)
    
    # 1. Extraer datos estructurados de forma segura
    datos = getattr(resultado, "output", getattr(resultado, "data", None))
    
    if isinstance(datos, dict):
        try:
            datos = ExtraccionCajero(**datos)
        except Exception:
            datos = None

    # 2. Si no es ExtraccionCajero o viene nulo, responder con solicitud de datos de cobro
    if not isinstance(datos, ExtraccionCajero) or not getattr(datos, "mensaje_cliente", None):
        return {
            "messages": [("assistant", "¡Seguro! Para procesar tu compra, por favor confírmame tu nombre, cédula, dirección de entrega y la referencia o comprobante de tu pago.")],
            "fase_actual": "caja",
            "listo_para_conciliar": False
        }

    # 3. Flujo normal con esquema Pydantic validado
    items_actuales = datos.items or state.get("carrito") or "Pantalón Jogger Urbano Deportivo"
    total_actual = float(datos.monto_total or state.get("total") or 26.0)

    print(f"\n[📦 DATOS CAJERO EXTRAÍDOS]")
    print(f"   Cliente: {datos.nombre_completo} | Cédula: {datos.cedula_id}")
    print(f"   Producto: {items_actuales} | Total: ${total_actual:.2f}")
    print(f"   Referencia: {datos.referencia_pago} | Región: {datos.region}")
    print(f"   Dirección: {datos.direccion_exacta}")
    print(f"   ¿Listo para conciliar?: {datos.listo_para_conciliar}\n")

    return {
        "messages": [("assistant", datos.mensaje_cliente)],
        "datos_temporales_caja": datos.model_dump(),
        "listo_para_conciliar": datos.listo_para_conciliar,
        "fase_actual": "caja",
        "carrito": items_actuales,
        "total": total_actual
    }

# ==========================================
# 4. NODO TÉCNICO INTERMEDIO: CONCILIADOR & CHECKOUT
# ==========================================
async def nodo_conciliador_checkout(state: AgentState):
    datos_dict = state.get("datos_temporales_caja", {})
    datos = ExtraccionCajero(**datos_dict)
    
    # Tomar el total y carrito validados con prioridad en lo extraído
    total = float(datos.monto_total or state.get("total") or 26.0)
    carrito = datos.items or state.get("carrito") or "Pantalón Jogger Urbano Deportivo"
    ref = datos.referencia_pago or ""
    
    # 1. Conciliación contra banco simulado
    aprobado, detalle = conciliar_pago_simulado(ref, total)
    
    if not aprobado:
        mensaje_error = (
            f"El sistema bancario no pudo validar la referencia *{ref}* ({detalle}). "
            "¿Podrías revisar tu comprobante y suministrarme nuevamente el número de referencia correcto?"
        )
        return {
            "messages": [("assistant", mensaje_error)],
            "fase_actual": "caja",
            "listo_para_conciliar": False
        }
    
    # 2. Registrar orden en Firestore con datos reales
    wa_id = state.get("wa_id", "desconocido")
    pedido_id = insertar_pedido_firestore(
        wa_id=wa_id,
        carrito=carrito,
        total=total,
        datos=datos
    )

    registrar_o_actualizar_sesion_bot(
        wa_id=wa_id,
        cliente_nombre=datos.nombre_completo,
        fase="venta_cerrada",
        bot_activo=True,
        pedido_id=pedido_id,
        sesion_id=state.get("sesion_id")
    )
    
    mensaje_exito = (
        f"¡Pago de ${total:.2f} verificado exitosamente con la referencia *{ref}*! 🏦✨\n"
        f"Tu pedido de *{carrito}* quedó registrado bajo la orden *{pedido_id}* y ha sido transferido a Despacho para su entrega."
    )
    
    return {
        "messages": [("assistant", mensaje_exito)],
        "fase_actual": "logistica",
        "pedido_id": pedido_id,
        "carrito": carrito,
        "total": total,
        "listo_para_conciliar": False
    }

# ==========================================
# 5. NODO LOGÍSTICO (Envíos y Despacho)
# ==========================================
async def nodo_logistico(state: AgentState):
    prompt_con_memoria = armar_contexto(state)
    deps = BotDeps(wa_id=state["wa_id"], db=None, fase="logistica")

    respuesta = await agente_logistico.run(prompt_con_memoria, deps=deps)
    return {
        "messages": [("assistant", extraer_texto(respuesta))],
        "fase_actual": "logistica"
    }