# app/services/ocr.py

import os
import base64
import json
import logging
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

WHATSAPP_TOKEN = os.getenv("WHATSAPP_TOKEN", "").strip()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "").strip()


async def descargar_imagen_whatsapp(download_url: str = "", media_id: str = "") -> tuple[bytes, str]:
    """Descarga los bytes y obtiene el content-type de la imagen desde Meta."""
    if not WHATSAPP_TOKEN:
        logger.error("❌ WHATSAPP_TOKEN no está definido en el entorno.")
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


async def procesar_comprobante_pago(media_id: str = "", download_url: str = "") -> dict:
    """Extrae datos bancarios y montos de un comprobante vía OpenRouter (Visión)."""
    try:
        if not OPENROUTER_API_KEY:
            logger.error("❌ OPENROUTER_API_KEY no configurado.")
            return {}

        img_bytes, mime_type = await descargar_imagen_whatsapp(download_url, media_id)
        if not img_bytes:
            return {}

        img_b64 = base64.b64encode(img_bytes).decode("utf-8")
        data_uri = f"data:{mime_type};base64,{img_b64}"

        prompt_ocr = (
            "Analiza este comprobante de pago bancario (Pago Móvil, Zelle o transferencia). "
            "Extrae con precisión los siguientes datos en un formato JSON estricto sin bloques markdown:\n"
            "{\n"
            '  "es_comprobante": true/false,\n'
            '  "metodo": "Pago Movil" | "Zelle" | "Transferencia" | "Otro",\n'
            '  "referencia": "número de referencia completo o últimos 4-6 dígitos",\n'
            '  "monto": 0.00,\n'
            '  "moneda": "USD" | "VES",\n'
            '  "banco_origen": "nombre del banco emisor o N/A",\n'
            '  "banco_destino": "nombre del banco receptor o N/A",\n'
            '  "fecha": "fecha si es visible o N/A"\n'
            "}"
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
                        {"type": "text", "text": prompt_ocr},
                        {"type": "image_url", "image_url": {"url": data_uri}}
                    ]
                }
            ],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
            if resp.status_code == 200:
                raw_content = resp.json()["choices"][0]["message"]["content"].strip()
                datos_pago = json.loads(raw_content)
                logger.info(f"🧾 [OCR RESULTADO]: {datos_pago}")
                return datos_pago
            else:
                logger.error(f"Error OpenRouter Vision ({resp.status_code}): {resp.text}")
                return {}

    except Exception as e:
        logger.error(f"Excepción analizando imagen con OCR: {e}")
        return {}