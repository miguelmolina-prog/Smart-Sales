import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../services/firebase";
import { ZapIcon, CloseIcon } from "../icons/Icons";

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
    <div
      style={{
        backgroundColor: "#fffdf5",
        borderBottom: "1px solid #fef08a",
        padding: "12px 28px",
        flexShrink: 0
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ width: "20px", height: "20px", color: "#b45309", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ZapIcon size={16} />
        </div>
        <h4 style={{ color: "#92400e", margin: 0, fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Recuperación de Carritos en Riesgo ({sesionesInactivas.length})
        </h4>
      </div>
      
      <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "4px" }}>
        {sesionesInactivas.map((sesion) => {
          const yaContactado = (sesion.intentos_persistencia || 0) > 0;

          return (
            <div
              key={sesion.id}
              style={{ 
                backgroundColor: "#ffffff", 
                border: yaContactado ? "1px solid #e2e8f0" : "1px solid #fde047", 
                borderRadius: "14px", 
                padding: "14px", 
                minWidth: "320px", 
                maxWidth: "340px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <strong style={{ color: "var(--text-main)", fontSize: "0.88rem" }}>
                    {sesion.cliente_nombre || `Cliente ${sesion.wa_id.slice(-4)}`}
                  </strong>
                  
                  {yaContactado ? (
                    <span style={{ fontSize: "0.7rem", backgroundColor: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                      Contactado ({sesion.ultima_estrategia_retencion})
                    </span>
                  ) : (
                    <span style={{ fontSize: "0.7rem", backgroundColor: "#edf4ff", color: "#005bff", padding: "2px 8px", borderRadius: "999px", fontWeight: 700 }}>
                      Pendiente
                    </span>
                  )}
                </div>
                
                <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", margin: "0 0 12px 0", lineHeight: "1.3" }}>
                  <strong>{sesion.carrito || "Sin artículos registrados"}</strong><br/>
                  Total Estimado: <strong style={{ color: "var(--text-main)" }}>${sesion.total_estimado || 0} USD</strong>
                </p>
              </div>

              {/* Botones de acción sin emojis */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "ofrecer_cashea")}
                  style={{ 
                    backgroundColor: yaContactado ? "#f1f5f9" : "#005bff", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "7px 10px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}
                >
                  Ofrecer Cuotas
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "alerta_stock")}
                  style={{ 
                    backgroundColor: yaContactado ? "#f1f5f9" : "#dc2626", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "7px 10px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}
                >
                  Alerta Reserva
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "otra_recomendacion")}
                  style={{ 
                    backgroundColor: yaContactado ? "#f1f5f9" : "#059669", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "7px 10px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}
                >
                  Alternativas
                </button>

                <button 
                  disabled={yaContactado}
                  onClick={() => ejecutarEstrategia(sesion.wa_id, "ofrecer_humano")}
                  style={{ 
                    backgroundColor: yaContactado ? "#f1f5f9" : "#111317", 
                    color: yaContactado ? "#94a3b8" : "#ffffff", 
                    border: "none", padding: "7px 10px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, 
                    cursor: yaContactado ? "not-allowed" : "pointer" 
                  }}
                >
                  Asignar Asesor
                </button>

                <button 
                  onClick={() => cerrarVentaPerdida(sesion)}
                  style={{ 
                    gridColumn: "span 2", 
                    backgroundColor: yaContactado ? "#fee2e2" : "#f8fafc", 
                    color: yaContactado ? "#b91c1c" : "#64748b", 
                    border: yaContactado ? "1px solid #fca5a5" : "1px solid #e2e8f0", 
                    padding: "7px 10px", borderRadius: "8px", fontSize: "0.74rem", fontWeight: 700, 
                    cursor: "pointer", marginTop: "2px",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
                  }}
                >
                  <CloseIcon size={12} />
                  <span>{yaContactado ? "Archivar Registro" : "Descartar sin Persistencia"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
