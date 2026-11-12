# app/agent/deps.py
from dataclasses import dataclass
from typing import Any

@dataclass
class BotDeps:
    wa_id: str
    db: Any = None
    fase: str = "servicio"
    carrito: str = ""
    total: float = 0.0
    escalado: bool = False