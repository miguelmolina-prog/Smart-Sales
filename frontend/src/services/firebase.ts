// frontend/src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
};

const app = initializeApp(firebaseConfig);

// Conexión a la base de datos nombrada
export const db = getFirestore(app, "test-firebase-retail");

// Función de diagnóstico para ejecutar desde la consola del navegador
export async function probarConexionFirebase() {
  console.log("🔍 Iniciando prueba de conexión con Firebase...");
  console.log("📌 Project ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log("📌 API Key configurada:", import.meta.env.VITE_FIREBASE_API_KEY ? "Presente (OK)" : "Faltante ❌");

  try {
    const colRef = collection(db, "pedidos");
    const snapshot = await getDocs(colRef);
    
    console.log(`✅ ¡Conexión exitosa! Se encontraron ${snapshot.docs.length} pedidos:`);
    snapshot.docs.forEach((d) => {
      console.log(` 📄 [${d.id}]`, d.data());
    });
    return { ok: true, total: snapshot.docs.length };
  } catch (error: any) {
    console.error("❌ Error conectando a Firestore:", error.code, error.message);
    return { ok: false, error };
  }
}

// Expone la función en la ventana global del navegador
if (typeof window !== "undefined") {
  (window as any).probarConexion = probarConexionFirebase;
}