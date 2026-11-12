# app/services/stt.py

import os
import base64
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()


async def descargar_audio_whatsapp(download_url: str, media_id: str = "") -> bytes:
    """Descarga los bytes del archivo de audio (.ogg) desde Meta."""
    if not WHATSAPP_TOKEN:
        logger.error("❌ WHATSAPP_TOKEN no está definido en el entorno.")
        return b""

    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        # Si no viene URL directa en el payload, la consultamos a Graph API
        target_url = download_url
        if not target_url and media_id:
            meta_url = f"https://graph.facebook.com/v21.0/{media_id}"
            resp_meta = await client.get(meta_url, headers=headers)
            if resp_meta.status_code != 200:
                logger.error(f"Error consultando URL multimedia en Meta: {resp_meta.text}")
                return b""
            target_url = resp_meta.json().get("url")

        if not target_url:
            return b""

        # Descarga del archivo binario
        resp_audio = await client.get(target_url, headers=headers)
        if resp_audio.status_code != 200:
            logger.error(f"Error descargando binario de audio ({resp_audio.status_code}): {resp_audio.text}")
            return b""

        return resp_audio.content


async def transcribir_audio_openrouter(media_id: str, download_url: str = "") -> str:
    """Descarga la nota de voz y la transcribe a texto vía OpenRouter."""
    try:
        if not OPENROUTER_API_KEY:
            logger.error("❌ OPENROUTER_API_KEY no está definido en el entorno.")
            return ""

        audio_bytes = await descargar_audio_whatsapp(download_url, media_id)
        if not audio_bytes:
            logger.error("No se obtuvieron bytes del audio.")
            return ""

        audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Transcribe textualmente lo que dice este audio en español. Devuelve únicamente el texto transcrito sin explicaciones ni notas adicionales."
                        },
                        {
                            "type": "input_audio",
                            "input_audio": {
                                "data": audio_b64,
                                "format": "ogg"
                            }
                        }
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                transcripcion = data["choices"][0]["message"]["content"].strip()
                logger.info(f"🎙️ [TRANSCRIPCIÓN EXITOSA]: {transcripcion}")
                return transcripcion
            else:
                logger.error(f"Error OpenRouter STT ({resp.status_code}): {resp.text}")
                return ""

    except Exception as e:
        logger.error(f"Excepción en transcripción STT: {e}")
        return ""