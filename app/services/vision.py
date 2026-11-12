# app/services/vision.py

import os
import base64
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.getenv("WHATSAPP_ACCESS_TOKEN", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()


async def descargar_imagen_whatsapp(download_url: str = "", media_id: str = "") -> tuple[bytes, str]:
    """Descarga los bytes y el mime-type de la imagen desde los servidores de Meta."""
    if not WHATSAPP_TOKEN:
        logger.error("❌ WHATSAPP_TOKEN no configurado.")
        return b"", ""

    headers = {"Authorization": f"Bearer {WHATSAPP_TOKEN}"}

    async with httpx.AsyncClient(timeout=20.0) as client:
        target_url = download_url
        if not target_url and media_id:
            meta_url = f"https://graph.facebook.com/v21.0/{media_id}"
            resp_meta = await client.get(meta_url, headers=headers)
            if resp_meta.status_code != 200:
                logger.error(f"Error consultando imagen en Meta: {resp_meta.text}")
                return b"", ""
            target_url = resp_meta.json().get("url")

        if not target_url:
            return b"", ""

        resp_img = await client.get(target_url, headers=headers)
        if resp_img.status_code != 200:
            logger.error(f"Error descargando binario de imagen ({resp_img.status_code}): {resp_img.text}")
            return b"", ""

        mime_type = resp_img.headers.get("content-type", "image/jpeg")
        return resp_img.content, mime_type


async def interpretar_imagen_openrouter(media_id: str = "", download_url: str = "") -> str:
    """
    Analiza cualquier imagen enviada por el cliente (producto, ropa, repuesto o comprobante)
    y genera una descripción técnica precisa en español para el agente de ventas.
    """
    try:
        if not OPENROUTER_API_KEY:
            logger.error("❌ OPENROUTER_API_KEY no configurado.")
            return ""

        img_bytes, mime_type = await descargar_imagen_whatsapp(download_url, media_id)
        if not img_bytes:
            return ""

        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{img_b64}"

        prompt_analisis = (
            "Eres el asistente visual de una tienda comercial. Tu tarea es describir de forma concisa y "
            "técnica lo que se ve en la imagen para que el agente de ventas pueda responder al cliente.\n\n"
            "Reglas según el contenido:\n"
            "1. Si es ROPA, CALZADO o PRODUCTOS: Describe prenda/artículo exacto, color primario y secundario, "
            "tipo de corte (ej. cuello redondo, manga corta, oversize), estampado o logo visible y material aparente.\n"
            "2. Si es un COMPROBANTE DE PAGO: Especifica que es un comprobante bancario e indica método (Pago Móvil/Zelle/etc), "
            "referencia visible y monto si se leen con claridad.\n"
            "3. Si es otro objeto o entorno: Describe brevemente el objeto principal en primer plano.\n\n"
            "Sé directo, objetivo y no agregues saludos ni suposiciones innecesarias."
        )

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
                        {"type": "text", "text": prompt_analisis},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ]
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                descripcion = resp.json()["choices"][0]["message"]["content"].strip()
                logger.info(f"👁️ [VISIÓN EXITOSA]: {descripcion}")
                return descripcion
            else:
                logger.error(f"Error OpenRouter Vision ({resp.status_code}): {resp.text}")
                return ""

    except Exception as e:
        logger.error(f"Excepción analizando imagen: {e}")
        return ""