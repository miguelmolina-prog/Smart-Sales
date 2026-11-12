from pywa import WhatsApp
from app.config import get_settings
import httpx
_settings = get_settings()

wa = WhatsApp(
    phone_id=_settings.whatsapp_phone_number_id,
    token=_settings.whatsapp_access_token,
)

def send_whatsapp_message(to_phone: str, text: str):
    """Envía un mensaje de texto plano a WhatsApp usando PyWa."""
    try:
        wa.send_message(
            to=to_phone,
            text=text
        )
    except Exception as e:
        print(f"[ERROR enviando mensaje por PyWa]: {e}")

def send_whatsapp_image(to_phone: str, image_url: str, caption: str | None = None) -> dict:
    """Envía una imagen a WhatsApp intentando enlace directo; si el servidor
    bloquea a Meta, descarga los bytes y los sube vía Media API de WhatsApp.
    """
    base_url = f"https://graph.facebook.com/v19.0/{_settings.whatsapp_phone_number_id}"
    headers = {
        "Authorization": f"Bearer {_settings.whatsapp_access_token}"
    }

    # 1. Intentar enlace directo primero
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "image",
        "image": {"link": image_url}
    }
    if caption:
        payload["image"]["caption"] = caption

    try:
        with httpx.Client(timeout=15.0) as client:
            res = client.post(f"{base_url}/messages", headers={**headers, "Content-Type": "application/json"}, json=payload)
            if res.status_code == 200:
                return res.json()
    except Exception:
        pass

    # 2. Respaldo: Descargar la imagen y subirla como archivo binario si la URL directa fue rechazada
    with httpx.Client(headers={"User-Agent": "Mozilla/5.0"}, follow_redirects=True, timeout=15.0) as client:
        img_resp = client.get(image_url)
        img_resp.raise_for_status()
        content_type = img_resp.headers.get("content-type", "image/jpeg").split(";")[0]

        upload_res = client.post(
            f"{base_url}/media",
            headers=headers,
            data={"messaging_product": "whatsapp", "type": content_type},
            files={"file": ("image.jpg", img_resp.content, content_type)}
        )
        upload_res.raise_for_status()
        media_id = upload_res.json()["id"]

    # 3. Enviar mensaje referenciando el media_id subido
    send_payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to_phone,
        "type": "image",
        "image": {"id": media_id}
    }
    if caption:
        send_payload["image"]["caption"] = caption

    with httpx.Client(timeout=15.0) as client:
        final_res = client.post(f"{base_url}/messages", headers={**headers, "Content-Type": "application/json"}, json=send_payload)
        final_res.raise_for_status()
        return final_res.json()