import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";

export default function PersistenceBanner() {
  const [sesionesInactivas, setSesionesInactivas] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "sesiones_bot"),
      where("fase", "not-in", ["venta_cerrada", "venta_perdida"])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ahora = Date.now();
      const inactivos = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((data: any) => {
          if (!data.ultima_actividad) return false;
          const tiempo = data.ultima_actividad.toMillis 
            ? data.ultima_actividad.toMillis() 
            : new Date(data.ultima_actividad).getTime();
          return (ahora - tiempo) > 600000;
        });

      setSesionesInactivas(inactivos);
    });

    return () => unsubscribe();
  }, []);

  const ejecutarEstrategia = async (wa_id: string, accion: string) => {
    try {
      await fetch("http://localhost:8000/api/persistencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_id, accion })
      });
    } catch (error) {
      console.error("Error al disparar persistencia:", error);
    }
  };

  const cerrarVentaPerdida = async (sesion: any) => {
    try {
      const ref = doc(db, "sesiones_bot", sesion.id);
      await updateDoc(ref, {
        fase: "venta_perdida",
        fecha_cierre: serverTimestamp(),
        motivo_perdida: sesion.intentos_persistencia > 0 
          ? `Sin respuesta tras persistencia (${sesion.ultima_estrategia_retencion})`
          : "Descarte manual directo sin persistencia"
      });
    } catch (error) {
      console.error("Error cerrando venta perdida:", error);
    }
  };

  if (sesionesInactivas.length === 0) return null;

  return (
    <div style={{ backgroundColor: "#fffbeb", borderBottom: "1px solid #fde68a", padding: "0.75rem 2rem", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "1.2rem" }}>⏱️</span>
        <h3 style={{ color: "#d97706", margin: 0, fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase" }}>
          Persistencia de Clientes Inactivos ({sesionesInactivas.length})
        </h3>
      </div>
      
      <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {sesionesInactivas.map((sesion) => {
          const yaContactado = (sesion.intentos_persistencia || 0) > 0;

          return (
            <div key={sesion.id} style={{ 
              backgroundColor: "#ffffff", 
              border: yaContactado ? "1px solid #cbd5e1" : "1px solid #fcd34d", 
              borderRadius: "0.5rem", 
              padding: "0.85rem", 
              minWidth: "340px", 
              maxWidth: "360px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                  <strong style={{ color: "#000000", fontSize: "0.95rem" }}>
                    {sesion.cliente_nombre || `Cliente ${sesion.wa_id.slice(-4)}`}
                  </strong>
                  
                  {yaContactado ? (
                    <span style={{ fontSize: "0.72rem", backgroundColor: "#fef3c7", color: "#b45309", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>
                      ⚠️ Contactado ({sesion.ultima_estrategia_retencion})
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.72rem", backgroundColor: "#eff6ff", color: "#0055FF", padding: "0.15rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>
                      Sin contactar
                    </span>
                  )}
                </div>
                
                <p style={{ color: "#475569", fontSize: "0.85rem", margin: "0 0 0.75rem 0", lineHeight: "1.3" }}>
                  🛒 <strong>{sesion.carrito || "Sin artículos registrados"}</strong><br/>
                  💵 Total: <strong>${sesion.total_estimado || 0} USD</strong>
                </p>
              </div>

              {/* Botones de acción con bloqueo anti-spam */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "ofrecer_cashea")}
                  style={{ 
                    backgroundColor: yaContactado ? "#e2e8f0" : "#0055FF", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "0.45rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}>
                  💳 Ofrecer Cashea
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "alerta_stock")}
                  style={{ 
                    backgroundColor: yaContactado ? "#e2e8f0" : "#dc2626", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "0.45rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}>
                  ⚠️ Reserva Stock
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "otra_recomendacion")}
                  style={{ 
                    backgroundColor: yaContactado ? "#e2e8f0" : "#059669", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "0.45rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}>
                  🔄 Otra Opción
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "ofrecer_humano")}
                  style={{ 
                    backgroundColor: yaContactado ? "#e2e8f0" : "#FF6B00", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "0.45rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}>
                  👤 Pasar a Humano
                </button>

                {/* Botón principal cuando ya se aplicó persistencia */}
                <button 
                  onClick={() => cerrarVentaPerdida(sesion)}
                  style={{ 
                    gridColumn: "span 2", 
                    backgroundColor: yaContactado ? "#fee2e2" : "#f8fafc", 
                    color: yaContactado ? "#b91c1c" : "#64748b", 
                    border: yaContactado ? "1px solid #fca5a5" : "1px solid #cbd5e1", 
                    padding: "0.45rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 700, 
                    cursor: "pointer", marginTop: "0.2rem" 
                  }}>
                  {yaContactado ? "✕ Dar por Perdida y Archivar" : "✕ Descartar sin Persistencia"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}