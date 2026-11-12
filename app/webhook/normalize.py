# app/webhook/normalize.py

from collections.abc import Iterator
from typing import Any, TypedDict


class InboundText(TypedDict):
    wa_id: str
    message_id: str
    text: str


def formatear_cuerpo_mensaje(message: dict[str, Any]) -> str:
    """Extrae el contenido legible según el tipo de mensaje recibido de Meta."""
    tipo = message.get("type")

    # 1. Mensaje de texto plano estándar
    if tipo == "text":
        return message.get("text", {}).get("body", "").strip()

    # 2. Mensaje de ubicación nativa (GPS)
    if tipo == "location":
        loc = message.get("location", {})
        lat = loc.get("latitude")
        lng = loc.get("longitude")
        nombre = loc.get("name") or ""
        direccion = loc.get("address") or ""

        # Construir enlace directo a Google Maps con coordenadas
        url_maps = f"https://www.google.com/maps?q={lat},{lng}"

        partes = []
        if nombre:
            partes.append(f"Lugar: {nombre}")
        if direccion:
            partes.append(f"Dirección: {direccion}")
        partes.append(f"Ubicación GPS: {url_maps}")

        return " | ".join(partes)

    # 3. Otros formatos no procesados como texto
    return ""


def extract_text_messages(payload: dict[str, Any]) -> Iterator[InboundText]:
    """Extrae mensajes entrantes soportados (texto y ubicaciones GPS)."""
    for entry in payload.get("entry", []):
        for change in entry.get("changes", []):
            value = change.get("value", {})
            for message in value.get("messages", []):
                contenido = formatear_cuerpo_mensaje(message)
                if not contenido:
                    continue

                yield InboundText(
                    wa_id=message["from"],
                    message_id=message["id"],
                    text=contenido,
                )