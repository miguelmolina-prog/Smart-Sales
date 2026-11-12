import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.store.firestore_client import get_firestore_client

INVENTARIO_ROPA_10 = [
    {
        "sku": "ROPA-001",
        "nombre": "Franela Básica de Cuello Redondo",
        "categoria": "Ropa",
        "subcategoria": "Franelas",
        "descripcion": "Franela de algodón peinado premium, corte regular. Disponible en blanco, negro y gris.",
        "precio": 15.00,
        "stock": 25,
        "imagen_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-002",
        "nombre": "Pantalón Jean Clásico Denim Azul",
        "categoria": "Ropa",
        "subcategoria": "Pantalones",
        "descripcion": "Jean de corte recto tradicional, mezclilla resistente de 12 oz con costuras reforzadas.",
        "precio": 35.00,
        "stock": 18,
        "imagen_url": "https://images.unsplash.com/photo-1542272604-780c96856592?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-003",
        "nombre": "Chaqueta Cortavientos Impermeable",
        "categoria": "Ropa",
        "subcategoria": "Abrigos",
        "descripcion": "Chaqueta ligera con capucha ajustable, cremalleras selladas y forro térmico transpirable.",
        "precio": 55.00,
        "stock": 10,
        "imagen_url": "https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-004",
        "nombre": "Suéter Hoodie Clásico con Capucha",
        "categoria": "Ropa",
        "subcategoria": "Abrigos",
        "descripcion": "Buzo con capucha y bolsillo tipo canguro, confeccionado en felpa de algodón suave.",
        "precio": 40.00,
        "stock": 14,
        "imagen_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-005",
        "nombre": "Camisa Casual Manga Larga a Cuadros",
        "categoria": "Ropa",
        "subcategoria": "Camisas",
        "descripcion": "Camisa estilo leñador en franela de algodón suave, botones reforzados y bolsillo frontal.",
        "precio": 28.00,
        "stock": 12,
        "imagen_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-006",
        "nombre": "Pantalón Jogger Urbano Deportivo",
        "categoria": "Ropa",
        "subcategoria": "Pantalones",
        "descripcion": "Pantalón jogger con pretina elástica, cordón ajustable y puños en los tobillos.",
        "precio": 26.00,
        "stock": 20,
        "imagen_url": "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-007",
        "nombre": "Camisa Polo Clásica Piqué",
        "categoria": "Ropa",
        "subcategoria": "Camisas",
        "descripcion": "Polo clásica de corte entallado en tejido piqué transpirable con cuello y puños acanalados.",
        "precio": 22.00,
        "stock": 16,
        "imagen_url": "https://images.unsplash.com/photo-1625910513413-5b82098650a2?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-008",
        "nombre": "Bermuda Cargo Resistente",
        "categoria": "Ropa",
        "subcategoria": "Shorts",
        "descripcion": "Bermuda de dril de algodón con múltiples bolsillos laterales utilitarios y cierre de cremallera.",
        "precio": 24.00,
        "stock": 15,
        "imagen_url": "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-009",
        "nombre": "Chaqueta Denim Clásica Vintage",
        "categoria": "Ropa",
        "subcategoria": "Abrigos",
        "descripcion": "Chaqueta de jean estilo vintage, botones metálicos de presión y bolsillos frontales solapados.",
        "precio": 48.00,
        "stock": 9,
        "imagen_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800",
        "activo": True
    },
    {
        "sku": "ROPA-010",
        "nombre": "Short Deportivo Dry-Fit",
        "categoria": "Ropa",
        "subcategoria": "Shorts",
        "descripcion": "Short para entrenamiento de tela ligera de secado rápido con forro interior de malla.",
        "precio": 18.00,
        "stock": 22,
        "imagen_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800",
        "activo": True
    }
]

def cargar_inventario_ropa():
    print("=" * 50)
    print("📦 Cargando 10 productos de ropa a Firestore...")
    print("=" * 50)
    
    db = get_firestore_client()
    batch = db.batch()
    col = db.collection("productos")
    
    for prod in INVENTARIO_ROPA_10:
        doc_ref = col.document(prod["sku"])
        batch.set(doc_ref, prod)
        print(f"✔ SKU: {prod['sku']} | {prod['nombre']} | ${prod['precio']}")
        
    batch.commit()
    print("\n🎉 Catálogo de 10 productos guardado exitosamente en Firestore.")

if __name__ == "__main__":
    cargar_inventario_ropa()