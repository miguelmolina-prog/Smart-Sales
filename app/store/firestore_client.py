import os
from google.cloud import firestore

_db: firestore.Client | None = None

def get_firestore_client() -> firestore.Client:
    """Retorna la instancia singleton conectada a la base de datos de GCP."""
    global _db
    if _db is None:
        project_id = os.getenv("GCP_PROJECT_ID", "calcium-aria-507215-j6")
        database_id = os.getenv("FIRESTORE_DATABASE_ID", "test-firebase-retail")
        _db = firestore.Client(project=project_id, database=database_id)
    return _db