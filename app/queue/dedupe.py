from app.store.redis_store import get_redis

PROCESSED_MESSAGES = set()

def already_processed(message_id: str) -> bool:
    """Modo local simple: Usa una lista en memoria en lugar de Redis."""
    if message_id in PROCESSED_MESSAGES:
        return True
    PROCESSED_MESSAGES.add(message_id)
    return False
