from collections import defaultdict
from typing import Dict, List

# Almacén temporal en memoria RAM (Sustituye a Redis en local)
_PENDING_MESSAGES: Dict[str, List[str]] = defaultdict(list)
_PROCESSING_LOCKS: set = set()


def push_pending_message(wa_id: str, text: str) -> None:
    _PENDING_MESSAGES[wa_id].append(text)


def pop_pending_messages(wa_id: str) -> List[str]:
    messages = list(_PENDING_MESSAGES[wa_id])
    _PENDING_MESSAGES[wa_id].clear()
    return messages


def acquire_user_lock(wa_id: str) -> bool:
    if wa_id in _PROCESSING_LOCKS:
        return False
    _PROCESSING_LOCKS.add(wa_id)
    return True


def release_user_lock(wa_id: str) -> None:
    _PROCESSING_LOCKS.discard(wa_id)


# Fake client para que app/queue/client.py no explote
def get_redis():
    return None

def limpiar_memoria_usuario(wa_id: str) -> None:
    """Elimina buffers de mensajes pendientes y locks asociados al usuario en memoria."""
    # 1. Purgar la cola de mensajes acumulados del usuario
    _PENDING_MESSAGES.pop(wa_id, None)

    # 2. Liberar cualquier lock activo
    _PROCESSING_LOCKS.discard(wa_id)