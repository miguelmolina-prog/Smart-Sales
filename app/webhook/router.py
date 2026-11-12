from fastapi import APIRouter, Request, Response, BackgroundTasks, Query
from app.queue.tasks import buffer_inbound
from app.config import get_settings
from app.webhook.normalize import formatear_cuerpo_mensaje
from app.services.stt import transcribir_audio_openrouter  # Importamos el servicio STT
from app.services.vision import interpretar_imagen_openrouter

router = APIRouter()
settings = get_settings()

@router.get("/webhook")
async def verify(
    mode: str = Query(None, alias="hub.mode"),
    token: str = Query(None, alias="hub.verify_token"),
    challenge: str = Query(None, alias="hub.challenge"),
):
    """Endpoint GET para que Meta verifique el Webhook."""
    if mode == "subscribe" and token == "prueba_agente_123":
        return Response(content=challenge, media_type="text/plain")
    return Response(content="Error, token inválido", status_code=403)


@router.post("/webhook")
async def receive(request: Request, background_tasks: BackgroundTasks):
    """Endpoint POST para recibir los mensajes de WhatsApp."""
    data = await request.json()
    
    # Log visible para inspeccionar cualquier payload entrante
    print(f"\n[WEBHOOK ENTRANTE] {data}\n")
    
    try:
        entries = data.get("entry", [])
        if not entries:
            return Response(content="ok", status_code=200)

        entry = entries[0]
        changes = entry.get("changes", [])
        if not changes:
            return Response(content="ok", status_code=200)

        value = changes[0].get("value", {})
        messages = value.get("messages", [])
        
        if messages:
            msg = messages[0]
            wa_id = msg.get("from")
            message_id = msg.get("id")
            tipo = msg.get("type")
            text = None

            # 1. Mensajes de texto y ubicaciones habituales
            if tipo in ["text", "location"]:
                text = formatear_cuerpo_mensaje(msg)

            # 2. Notas de voz o archivos de audio
            elif tipo in ["audio", "voice"]:
                audio_data = msg.get("audio", {}) or msg.get("voice", {})
                media_id = audio_data.get("id")
                audio_url = audio_data.get("url", "")
                
                print(f"🎙️ [AUDIO RECIBIDO] ID: {media_id}. Procesando STT...")
                if media_id or audio_url:
                    text = await transcribir_audio_openrouter(media_id=media_id, download_url=audio_url)

            # 3. Comprobantes o fotos
            elif tipo == "image":
                img_data = msg.get("image", {})
                media_id = img_data.get("id")
                img_url = img_data.get("url", "")
                caption = img_data.get("caption", "").strip()

                print(f"🖼️ [IMAGEN RECIBIDA] ID: {media_id}. Procesando visión...")
                descripcion_visual = await interpretar_imagen_openrouter(media_id=media_id, download_url=img_url)

                if descripcion_visual:
                    # Si el cliente escribió texto (ej. "¿Tienes de estos?"), lo combinamos
                    if caption:
                        text = f"{caption} [El usuario adjuntó una imagen. Descripción visual: {descripcion_visual}]"
                    else:
                        text = f"[El usuario envió una imagen. Descripción visual: {descripcion_visual}]"
                else:
                    text = caption if caption else "[El usuario envió una imagen no legible]"

            # Encolar si se obtuvo texto procesable
            if text:
                print(f"🚀 Encolando mensaje procesado: '{text}' para {wa_id}")
                background_tasks.add_task(buffer_inbound, wa_id, message_id, text)
            else:
                print(f"⚠️ Mensaje de tipo '{tipo}' no generó texto procesable.")

    except Exception as e:
        print(f"❌ Error procesando webhook: {e}")

    return Response(content="ok", status_code=200)