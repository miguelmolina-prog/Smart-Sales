import { useState, useEffect } from "react";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../../services/firebase";
import type { TicketChat, Mensaje } from "../../types";

const formatPhone = (phone?: string) => {
  if (!phone) return "N/A";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("58")) {
    return `+58 ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)}-${cleaned.slice(8)}`;
  }
  return `+${cleaned}`;
};

export default function ChatsView() {
  const [tickets, setTickets] = useState<TicketChat[]>([]);
  const [ticketSeleccionado, setTicketSeleccionado] = useState<TicketChat | null>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "tickets_soporte"),
      where("estado", "==", "escalado")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsCargados: TicketChat[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TicketChat, "id">),
      }));
      setTickets(ticketsCargados);

      if (ticketSeleccionado) {
        const actualizado = ticketsCargados.find((t) => t.id === ticketSeleccionado.id);
        if (actualizado) {
          setTicketSeleccionado(actualizado);
        }
      }
    });

    return () => unsubscribe();
  }, [ticketSeleccionado?.id]);

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !ticketSeleccionado || enviando) return;

    setEnviando(true);
    const textoAEnviar = nuevoMensaje;
    setNuevoMensaje("");

    try {
      const res = await fetch("http://localhost:8000/api/chat/enviar-mensaje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id: ticketSeleccionado.id,
          wa_id: ticketSeleccionado.telefono || ticketSeleccionado.id,
          texto: textoAEnviar,
        }),
      });

      if (!res.ok) {
        throw new Error("Error enviando mensaje al servidor");
      }
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setNuevoMensaje(textoAEnviar);
    } finally {
      setEnviando(false);
    }
  };

  const cerrarTicketYReactivarBot = async () => {
    if (!ticketSeleccionado) return;

    try {
      await updateDoc(doc(db, "tickets_soporte", ticketSeleccionado.id), {
        estado: "resuelto",
      });

      const tel = ticketSeleccionado.telefono || ticketSeleccionado.id;
      
      await fetch("http://localhost:8000/api/chat/reactivar-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wa_id: tel }),
      });

      setTicketSeleccionado(null);
    } catch (err) {
      console.error("Error cerrando ticket:", err);
    }
  };

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", backgroundColor: "#f0f2f5" }}>
      
      {/* Columna 1: Bandeja de Tickets */}
      <div style={{ width: "340px", borderRight: "1px solid #d1d5db", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
          <h2 style={{ color: "#000000", margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>Bandeja de Intervención</h2>
          <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 500 }}>
            {tickets.length} caso(s) esperando atención
          </span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
          {tickets.length === 0 ? (
            <div style={{ textAlign: "center", color: "#64748b", padding: "2rem 1rem", fontSize: "0.9rem", fontWeight: 500 }}>
              No hay chats escalados en este momento.
            </div>
          ) : (
            tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => setTicketSeleccionado(t)}
                style={{
                  padding: "1rem",
                  backgroundColor: ticketSeleccionado?.id === t.id ? "#eff6ff" : "#ffffff",
                  border: ticketSeleccionado?.id === t.id ? "1px solid #0055FF" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  borderRadius: "0.5rem",
                  marginBottom: "0.75rem",
                  boxShadow: ticketSeleccionado?.id === t.id ? "0 2px 4px rgba(0,85,255,0.05)" : "none",
                  transition: "all 0.2s"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#000000", fontSize: "1rem", fontWeight: 700 }}>{t.cliente_nombre}</strong>
                  <span style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 800, background: "#fee2e2", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                    ESCALADO
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "#475569", marginTop: "0.4rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500 }}>
                  {t.incidencia || "Sin incidencia registrada"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Columna 2: Conversación Activa */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", backgroundColor: "#f0f2f5" }}>
        {ticketSeleccionado ? (
          <>
            <div style={{ padding: "1rem 1.5rem", backgroundColor: "#ffffff", borderBottom: "1px solid #d1d5db", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, color: "#000000", fontSize: "1.2rem", fontWeight: 800 }}>{ticketSeleccionado.cliente_nombre}</h3>
                <span style={{ fontSize: "0.85rem", color: "#0055FF", fontWeight: 600 }}>📱 {formatPhone(ticketSeleccionado.telefono)}</span>
              </div>
            </div>

            <div style={{ flex: 1, padding: "1.5rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {ticketSeleccionado.mensajes?.map((m: Mensaje, i: number) => {
                const isCliente = m.emisor === "cliente";
                const isBot = m.emisor === "bot";
                return (
                  <div key={m.id || i} style={{ display: "flex", flexDirection: "column", alignItems: isCliente ? "flex-start" : "flex-end" }}>
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.3rem", fontWeight: 600 }}>
                      {isCliente ? "Cliente" : isBot ? "Bot🤖" : "Tú (Agente)"} • {m.hora || ""}
                    </span>
                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "0.75rem 1rem",
                        borderRadius: "0.6rem",
                        backgroundColor: isCliente ? "#ffffff" : isBot ? "#f8f9fa" : "#0055FF",
                        color: isCliente ? "#000000" : isBot ? "#475569" : "#ffffff",
                        border: isCliente ? "1px solid #e2e8f0" : isBot ? "1px dashed #cbd5e1" : "none",
                        fontSize: "0.95rem",
                        lineHeight: "1.5",
                        wordBreak: "break-word",
                        fontWeight: isBot ? 400 : 500,
                        boxShadow: isCliente ? "0 1px 2px rgba(0,0,0,0.05)" : "none"
                      }}
                    >
                      {m.texto}
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={enviarMensaje} style={{ padding: "1rem 1.25rem", backgroundColor: "#ffffff", borderTop: "1px solid #d1d5db", display: "flex", gap: "1rem" }}>
              <input
                type="text"
                value={nuevoMensaje}
                disabled={enviando}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe una respuesta para enviar a WhatsApp..."
                style={{ flex: 1, padding: "0.85rem 1rem", borderRadius: "0.5rem", backgroundColor: "#f8f9fa", border: "1px solid #cbd5e1", color: "#000000", outline: "none", fontSize: "0.95rem", fontWeight: 500 }}
              />
              <button
                type="submit"
                disabled={enviando || !nuevoMensaje.trim()}
                style={{ padding: "0 1.5rem", borderRadius: "0.5rem", backgroundColor: "#FF6B00", color: "#fff", border: "none", fontWeight: 700, fontSize: "0.95rem", cursor: enviando ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(255,107,0,0.2)" }}
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 600, fontSize: "1.1rem" }}>
            Selecciona un ticket de la bandeja para interactuar.
          </div>
        )}
      </div>

      {/* Columna 3: Diagnóstico de IA y Botón de Reactivación */}
      <div style={{ width: "320px", borderLeft: "1px solid #d1d5db", backgroundColor: "#ffffff", display: "flex", flexDirection: "column" }}>
        {ticketSeleccionado ? (
          <>
            <div style={{ padding: "1.25rem", borderBottom: "1px solid #e2e8f0" }}>
              <h3 style={{ color: "#000000", fontSize: "0.9rem", textTransform: "uppercase", margin: 0, fontWeight: 800 }}>Diagnóstico de IA</h3>
            </div>
            <div style={{ padding: "1.25rem", flex: 1, overflowY: "auto" }}>
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Incidencia:</span>
                <p style={{ margin: "0.4rem 0 0 0", color: "#000000", fontWeight: 800, fontSize: "1.05rem" }}>
                  {ticketSeleccionado.incidencia}
                </p>
              </div>

              <div style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "0.5rem", padding: "1.25rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#0055FF", fontWeight: 800, marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  📋 Resumen del Caso
                </div>
                <p style={{ color: "#1e293b", fontSize: "0.95rem", margin: 0, lineHeight: "1.6", fontWeight: 500 }}>
                  {ticketSeleccionado.resumen_ia}
                </p>
              </div>
            </div>

            <div style={{ padding: "1.5rem", backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
              <button
                onClick={cerrarTicketYReactivarBot}
                style={{
                  width: "100%",
                  padding: "1rem",
                  backgroundColor: "#059669",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.5rem",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(5,150,105,0.2)"
                }}
              >
                ✓ Cerrar Ticket y Reactivar Bot
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}