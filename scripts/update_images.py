import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.store.firestore_client import get_firestore_client

# URLs directas de prueba compatibles con WhatsApp Cloud API (sin bloqueos de bot)
URLS_LIMPIAS = {
    "ROPA-001": "https://images.pexels.com/photos/428338/pexels-photo-428338.jpeg",
    "ROPA-002": "https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg",
    "ROPA-003": "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg",
    "ROPA-004": "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg",
    "ROPA-005": "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg",
    "ROPA-006": "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg",
    "ROPA-007": "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg",
    "ROPA-008": "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg",
    "ROPA-009": "https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg",
    "ROPA-010": "https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg"
}

def actualizar_imagenes():
    db = get_firestore_client()
    batch = db.batch()
    col = db.collection("productos")

    for sku, url in URLS_LIMPIAS.items():
        doc_ref = col.document(sku)
        batch.update(doc_ref, {"imagen_url": url})
        print(f"✔ SKU {sku} actualizado con nueva URL compatible")

    batch.commit()
    print("¡Imágenes actualizadas en Firestore!")

if __name__ == "__main__":
    actualizar_imagenes()