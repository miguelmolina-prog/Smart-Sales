from __future__ import annotations

import logging
from datetime import datetime
import uuid

from google.cloud import firestore
from app.graph.workflow import orquestador_app 
from app.store.redis_store import push_pending_message, pop_pending_messages, acquire_user_lock, release_user_lock
from app.whatsapp_client import send_whatsapp_message
from app.store.firestore_client import get_firestore_client
from app.agent.tools import registrar_o_actualizar_sesion_bot
from google.cloud.firestore_v1.base_query import FieldFilter

logger = logging.getLogger(__name__)

async def buffer_inbound(wa_id: str, message_id: str, text: str):
    push_pending_message(wa_id, text)

    if not acquire_user_lock(wa_id):
        return

    try:
        messages = pop_pending_messages(wa_id)
        if not messages:
            return

        combined_text = "\n".join(messages)

        # -------------------------------------------------------------
        # 1. VERIFICAR LA SESIÓN ACTIVA EN FIRESTORE (POR SESION_ID)
        # -------------------------------------------------------------
        db = get_firestore_client()
        coleccion_sesiones = db.collection("sesiones_bot")
        
        # Ignoramos tanto las compras cerradas exitosamente como las ventas perdidas/descartadas
        
        sesiones_abiertas = (
            coleccion_sesiones
            .where(filter=FieldFilter("wa_id", "==", wa_id))
            .where(filter=FieldFilter("fase", "not-in", ["despachado", "venta_perdida"]))
            .limit(1)
            .get()
        )

        bot_activo = True
        sesion_actual_id = None

        if sesiones_abiertas:
            doc_sesion = sesiones_abiertas[0]
            data_sesion = doc_sesion.to_dict()
            bot_activo = data_sesion.get("bot_activo", True)
            sesion_actual_id = doc_sesion.id
        else:
            # Si no tiene sesión activa (primera interacción, compra cerrada o venta perdida),
            # se crea un nuevo ciclo analítico desde cero con un ID fresco (SES-YYYYMMDD-XXXXX)
            sesion_actual_id = registrar_o_actualizar_sesion_bot(
                wa_id=wa_id, 
                fase="iniciado", 
                bot_activo=True
            )

        # -------------------------------------------------------------
        # 2. CASO BOT DESACTIVADO (Atención humana activa)
        # -------------------------------------------------------------
        if not bot_activo:
            logger.info(f"🛑 [BOT INACTIVO] Mensaje de {wa_id} canalizado al ticket de soporte.")
            
            # Buscar el ticket en estado escalado
            tickets_abiertos = (
                db.collection("tickets_soporte")
                .where("wa_id", "==", wa_id)
                .where("estado", "==", "escalado")
                .limit(1)
                .get()
            )

            hora_actual = datetime.now().strftime("%I:%M %p")
            nuevo_msj = {
                "id": f"m-cli-{uuid.uuid4().hex[:6]}",
                "emisor": "cliente",
                "texto": combined_text,
                "hora": hora_actual
            }

            for ticket in tickets_abiertos:
                ticket.reference.update({
                    "mensajes": firestore.ArrayUnion([nuevo_msj])
                })
                break

            # Cortamos: LangGraph no se ejecuta mientras el operador atiende
            return

        # -------------------------------------------------------------
        # 3. CASO BOT ACTIVO: Actualizar sesión y ejecutar LangGraph
        # -------------------------------------------------------------
        registrar_o_actualizar_sesion_bot(
            wa_id=wa_id, 
            fase="conversando", 
            bot_activo=True, 
            sesion_id=sesion_actual_id
        )

        estado_entrada = {
            "messages": [("user", combined_text)],
            "wa_id": wa_id,
            "sesion_id": sesion_actual_id
        }

        config = {"configurable": {"thread_id": wa_id}}
        
        resultado = await orquestador_app.ainvoke(estado_entrada, config=config)
        respuesta_ia = resultado["messages"][-1].content

        print(f"\n[ORQUESTADOR LANGGRAPH -> {wa_id}]: {respuesta_ia}\n")

        if respuesta_ia:
            send_whatsapp_message(to_phone=wa_id, text=respuesta_ia)

    except Exception as e:
        print(f"[ERROR al procesar respuesta del orquestador]: {e}")
    finally:
        release_user_lock(wa_id)