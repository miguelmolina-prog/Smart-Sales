import { useState, useEffect } from "react";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../../services/firebase";

interface Pedido {
  id: string;
  pedido_id: string;
  wa_id: string;
  cliente_nombre: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  direccion?: string;
  referencia_direccion?: string;
  region?: string;
  items?: string;
  total_usd?: number;
  metodo_pago?: string;
  referencia_pago?: string;
  estado_despacho?: string;
  fecha_creacion?: any;
}

const formatPhone = (phone?: string) => {
  if (!phone) return "N/A";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("58")) {
    return `+58 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  return `+${cleaned}`;
};

export default function OrdersView() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  useEffect(() => {
    const q = query(collection(db, "pedidos"), orderBy("fecha_creacion", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pedidosCargados: Pedido[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Pedido, "id">),
      }));
      setPedidos(pedidosCargados);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", backgroundColor: "#f0f2f5" }}>
      {/* Columna Izquierda: Lista de Pedidos */}
      <div style={{ width: "380px", borderRight: "1px solid #d1d5db", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o N° orden..."
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#f8f9fa",
              border: "1px solid #cbd5e1",
              color: "#000000",
              outline: "none",
              fontSize: "0.95rem",
              transition: "border 0.2s"
            }}
            onFocus={(e) => e.target.style.borderColor = "#0055FF"}
            onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {pedidos.map((p) => (
            <div
              key={p.id}
              onClick={() => setPedidoSeleccionado(p)}
              style={{
                padding: "1rem",
                backgroundColor: pedidoSeleccionado?.id === p.id ? "#eff6ff" : "#ffffff",
                border: pedidoSeleccionado?.id === p.id ? "1px solid #0055FF" : "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                marginBottom: "0.75rem",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s",
                boxShadow: pedidoSeleccionado?.id === p.id ? "0 2px 4px rgba(0,85,255,0.05)" : "none"
              }}
            >
              <div>
                <div style={{ color: "#0055FF", fontWeight: 800, fontSize: "0.9rem", marginBottom: "0.25rem" }}>
                  {p.pedido_id}
                </div>
                <div style={{ color: "#000000", fontSize: "1rem", fontWeight: 700 }}>
                  {p.cliente_nombre}
                </div>
              </div>
              <button
                style={{
                  backgroundColor: "#FF6B00",
                  color: "#fff",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.4rem",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(255,107,0,0.2)"
                }}
              >
                Despachar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Detalles del Pedido */}
      <div style={{ flex: 1, padding: "2.5rem", overflowY: "auto", backgroundColor: "#f0f2f5" }}>
        {pedidoSeleccionado ? (
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            
            {/* Cabecera del Cliente */}
            <div style={{ borderBottom: "2px solid #d1d5db", paddingBottom: "1.5rem", marginBottom: "2rem" }}>
              <h2 style={{ color: "#000000", fontSize: "2rem", margin: "0 0 0.5rem 0", fontWeight: 800 }}>
                {pedidoSeleccionado.cliente_nombre}
              </h2>
              <div style={{ display: "flex", gap: "1.5rem", color: "#000000", fontSize: "1rem", fontWeight: 600 }}>
                <span>📱 {formatPhone(pedidoSeleccionado.cliente_telefono || pedidoSeleccionado.wa_id)}</span>
                <span>🏷️ Orden: <strong>{pedidoSeleccionado.pedido_id}</strong></span>
              </div>
            </div>

            {/* Grid de Tarjetas de Información */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              
              {/* Tarjeta 1: Datos Personales (Naranja) */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #FF6B00", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <h3 style={{ color: "#000000", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 1rem 0", fontWeight: 800 }}>
                  Datos del Destinatario
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", color: "#000000", fontSize: "1.05rem" }}>
                  <div>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Cédula de Identidad</strong>
                    V-{pedidoSeleccionado.cliente_cedula || "No registrada"}
                  </div>
                  <div>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Contacto Alterno</strong>
                    {formatPhone(pedidoSeleccionado.cliente_telefono)}
                  </div>
                </div>
              </div>

              {/* Tarjeta 2: Dirección (Azul) */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #0055FF", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <h3 style={{ color: "#000000", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 1rem 0", fontWeight: 800 }}>
                  Datos de Entrega
                </h3>
                <div style={{ color: "#000000", fontSize: "1.05rem", lineHeight: "1.6" }}>
                  <div style={{ marginBottom: "1rem" }}>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Dirección Exacta</strong>
                    {pedidoSeleccionado.direccion || "Retiro en tienda"}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                    <div>
                      <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Punto de Referencia</strong>
                      {pedidoSeleccionado.referencia_direccion || "N/A"}
                    </div>
                    <div>
                      <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Región</strong>
                      {pedidoSeleccionado.region || "Capital"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta 3: Resumen Financiero (Verde) */}
              <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #059669", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
                <h3 style={{ color: "#000000", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 1rem 0", fontWeight: 800 }}>
                  Resumen de Compra
                </h3>
                <div style={{ color: "#000000", fontSize: "1.05rem", lineHeight: "1.5", marginBottom: "1.5rem" }}>
                  <strong style={{ color: "#000000", fontWeight: 700 }}>Artículo Seleccionado:</strong> <br/>
                  <span style={{ fontSize: "1.15rem", fontWeight: 600 }}>{pedidoSeleccionado.items}</span>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", borderTop: "2px solid #e2e8f0", paddingTop: "1.5rem" }}>
                  <div>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Método de Pago</strong>
                    {pedidoSeleccionado.metodo_pago}
                  </div>
                  <div>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Referencia</strong>
                    {pedidoSeleccionado.referencia_pago}
                  </div>
                  <div>
                    <strong style={{ color: "#000000", display: "block", marginBottom: "0.25rem", fontWeight: 700 }}>Monto Total</strong>
                    <span style={{ color: "#059669", fontWeight: 800, fontSize: "1.3rem" }}>
                      ${pedidoSeleccionado.total_usd?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#000000", fontWeight: 600, fontSize: "1.1rem" }}>
            Selecciona un pedido de la lista para ver los detalles.
          </div>
        )}
      </div>
    </div>
  );
}