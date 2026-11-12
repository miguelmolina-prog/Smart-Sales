import os
import sys
import time
from google.cloud import firestore

def probar_conexion_firestore():
    print("=" * 50)
    print("🔍 Iniciando prueba de conectividad con Firestore...")
    print("=" * 50)

    try:
        inicio = time.time()
        
        # 1. Definición explícita de Proyecto y Base de Datos (Database ID)
        PROYECTO_ID = "calcium-aria-507215-j6"
        DATABASE_ID = "test-firebase-retail"

        db = firestore.Client(project=PROYECTO_ID, database=DATABASE_ID)
        print(f"✔ Cliente conectado al proyecto: [{db.project}]")
        print(f"✔ Base de datos seleccionada: [{db._database}]")

        # 2. Referencia a una colección de prueba temporal
        test_col = db.collection("_test_connectivity")
        test_doc = test_col.document("ping")

        # 3. Escribir un documento
        print("\n⏳ Intentando escribir documento de prueba...")
        t0 = time.time()
        test_doc.set({
            "status": "ok",
            "timestamp": firestore.SERVER_TIMESTAMP,
            "entorno": "desarrollo-local"
        })
        print(f"✔ Escritura exitosa en {((time.time() - t0) * 1000):.2f} ms")

        # 4. Leer el documento recién creado
        print("\n⏳ Intentando leer el documento...")
        t1 = time.time()
        doc_snapshot = test_doc.get()
        if doc_snapshot.exists:
            datos = doc_snapshot.to_dict()
            print(f"✔ Lectura exitosa en {((time.time() - t1) * 1000):.2f} ms")
            print(f"  Datos recibidos: {datos}")
        else:
            print("❌ El documento no fue encontrado tras la escritura.")
            return False

        # 5. Limpieza (borrar el documento de prueba)
        print("\n⏳ Limpiando documento de prueba...")
        test_doc.delete()
        print("✔ Documento de prueba eliminado correctamente.")

        tiempo_total = time.time() - inicio
        print("\n" + "=" * 50)
        print(f"🎉 CONEXIÓN EXITOSA CON GCP FIRESTORE (Total: {tiempo_total:.2f}s)")
        print("=" * 50)
        return True

    except Exception as e:
        print("\n" + "!" * 50)
        print("❌ ERROR DE CONEXIÓN O PERMISOS:")
        print(f"Detalle del error: {str(e)}")
        print("!" * 50)
        return False

if __name__ == "__main__":
    exito = probar_conexion_firestore()
    sys.exit(0 if exito else 1)