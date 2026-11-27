import { useState, useMemo } from "react";
import { useDemo } from "../../context/DemoContext";
import type { EscalationStatus, EscalationReason } from "../../types";
import { AlertIcon, CheckIcon, UserIcon, ChatIcon } from "../icons/Icons";

const REASON_LABELS: Record<EscalationReason, string> = {
  baja_confianza: "Baja confianza IA",
  queja: "Queja / Reclamo",
  solicitud_explicita: "Solicitud explícita",
  monto_alto: "Monto alto",
  producto_no_encontrado: "Producto no encontrado",
};

const STATUS_BADGE: Record<EscalationStatus, { label: string; bg: string; color: string }> = {
  nuevo: { label: "Nuevo", bg: "#fee2e2", color: "#b91c1c" },
  en_atencion: { label: "En atención", bg: "#fef3c7", color: "#92400e" },
  resuelto: { label: "Resuelto", bg: "#dcfce7", color: "#15803d" },
};

export default function EscalationsView() {
  const {
    escalations,
    currentTenant,
    role,
    takeHandoff,
    returnToAi,
    reassignEscalation,
    sendHumanMessage,
    addInternalNote,
    rateAiResponse,
    setActiveTab,
  } = useDemo();

  const [estadoFiltro, setEstadoFiltro] = useState<string>("todos");
  const [motivoFiltro, setMotivoFiltro] = useState<string>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");

  const filtered = useMemo(() => {
    return escalations.filter((e) => {
      if (e.tenantId !== currentTenant.id) return false;
      if (role === "supervisor" && e.sucursal !== currentTenant.sucursalPrincipal) return false;
      if (estadoFiltro !== "todos" && e.estado !== estadoFiltro) return false;
      if (motivoFiltro !== "todos" && e.motivo !== motivoFiltro) return false;
      return true;
    });
  }, [escalations, currentTenant, role, estadoFiltro, motivoFiltro]);

  const selected = useMemo(
    () => filtered.find((e) => e.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  );

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyText.trim()) return;
    sendHumanMessage(selected.id, replyText.trim());
    setReplyText("");
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !noteText.trim()) return;
    addInternalNote(selected.id, noteText.trim());
    setNoteText("");
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Bandeja de Escalamientos (Módulo 2)
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Handoff humano, alertas SLA, contexto reunido por la IA y retroalimentación continua
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            aria-label="Filtrar por estado"
            style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--border-card)", background: "#fff", fontWeight: 600, fontSize: "0.82rem" }}
          >
            <option value="todos">Estado: Todos</option>
            <option value="nuevo">Nuevo</option>
            <option value="en_atencion">En atención</option>
            <option value="resuelto">Resuelto</option>
          </select>

          <select
            value={motivoFiltro}
            onChange={(e) => setMotivoFiltro(e.target.value)}
            aria-label="Filtrar por motivo"
            style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--border-card)", background: "#fff", fontWeight: 600, fontSize: "0.82rem" }}
          >
            <option value="todos">Motivo: Todos</option>
            {Object.entries(REASON_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Split Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(290px, 0.95fr) minmax(360px, 1.45fr) minmax(260px, 0.9fr)",
          gap: "16px",
          alignItems: "start",
        }}
        className="escalations-grid"
      >
        {/* Column 1: Queue List (RF-02.1 & RF-02.7) */}
        <div className="bento-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
            Cola Activa ({filtered.length})
          </div>

          {filtered.length === 0 && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No hay escalamientos con estos filtros.</p>
          )}

          {filtered.map((esc) => {
            const isSelected = selected?.id === esc.id;
            const slaWarning = esc.estado === "nuevo" && esc.tiempoEsperaMin >= esc.slaLimiteMin - 3;
            const badge = STATUS_BADGE[esc.estado];
            return (
              <button
                key={esc.id}
                onClick={() => setSelectedId(esc.id)}
                style={{
                  textAlign: "left",
                  padding: "14px",
                  borderRadius: "16px",
                  border: isSelected ? "2px solid #005bff" : slaWarning ? "1.5px solid #ef4444" : "1px solid var(--border-subtle)",
                  backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "0.9rem", color: "var(--text-main)" }}>{esc.clienteNombre}</strong>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", backgroundColor: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  <span>{esc.id} · {REASON_LABELS[esc.motivo]}</span>
                  <span style={{ fontWeight: 700, color: esc.prioridad === "alta" ? "#dc2626" : "#64748b", textTransform: "uppercase" }}>
                    {esc.prioridad}
                  </span>
                </div>

                {/* RF-02.7: SLA visual alert */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.73rem", marginTop: "2px" }}>
                  <span style={{ color: slaWarning ? "#dc2626" : "var(--text-muted)", fontWeight: slaWarning ? 700 : 500, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                    {slaWarning && <AlertIcon size={13} />}
                    Espera: {esc.tiempoEsperaMin}m / SLA {esc.slaLimiteMin}m
                  </span>
                  <span style={{ color: "#005bff", fontWeight: 600 }}>
                    {esc.asignadoA || "Sin asignar"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Column 2: Conversation + Handoff + Reply (RF-02.2, RF-02.3, RF-02.5) */}
        {selected ? (
          <div className="bento-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>{selected.clienteNombre}</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  {selected.telefono} · {selected.sucursal} · {selected.reglaAsignacion}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {!selected.controlHumano && selected.estado !== "resuelto" && (
                  <button className="hero-cta-btn" style={{ padding: "7px 14px", fontSize: "0.8rem" }} onClick={() => takeHandoff(selected.id)}>
                    <UserIcon size={14} />
                    <span>Tomar Control (Handoff)</span>
                  </button>
                )}
                {selected.estado !== "resuelto" && (
                  <button
                    className="action-btn-pill"
                    style={{ backgroundColor: "#ecfdf5", color: "#047857", borderColor: "#a7f3d0" }}
                    onClick={() => returnToAi(selected.id)}
                  >
                    <ChatIcon size={14} />
                    <span>Devolver al Agente IA</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "360px", overflowY: "auto", padding: "4px" }}>
              {selected.mensajes.map((m) => {
                const isClient = m.emisor === "cliente";
                const isHuman = m.emisor === "humano";
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isClient ? "flex-start" : "flex-end",
                      maxWidth: "82%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      backgroundColor: isClient ? "#f1f5f9" : isHuman ? "#111317" : "#eff6ff",
                      color: isHuman ? "#ffffff" : "var(--text-main)",
                      border: isClient ? "1px solid #e2e8f0" : isHuman ? "none" : "1px solid #bfdbfe",
                    }}
                  >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, marginBottom: "4px", opacity: 0.8 }}>
                      {isClient ? selected.clienteNombre : isHuman ? `Asesor: ${m.autorNombre}` : "Agente IA SmartSales"} · {m.hora}
                    </div>
                    <div style={{ fontSize: "0.86rem", lineHeight: 1.4 }}>{m.texto}</div>
                    {m.sapToolCall && (
                      <div style={{ marginTop: "6px", fontSize: "0.72rem", fontFamily: "monospace", color: "#005bff", fontWeight: 700 }}>
                        ⚡ {m.sapToolCall}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={
                  selected.controlHumano
                    ? "Escribe tu respuesta como asesor humano por WhatsApp..."
                    : "Haz clic en 'Tomar Control' o escribe para responder..."
                }
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "999px",
                  border: "1px solid var(--border-card)",
                  fontSize: "0.85rem",
                  outline: "none",
                }}
              />
              <button type="submit" className="hero-cta-btn" style={{ padding: "10px 18px" }}>
                Enviar
              </button>
            </form>
          </div>
        ) : null}

        {/* Column 3: AI Context, Reassign, Feedback & History (RF-02.2, RF-02.4, RF-02.8, RF-02.9) */}
        {selected && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Context Card */}
            <div className="bento-card" style={{ padding: "18px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 800 }}>Contexto Reunido por IA (RF-02.2)</h4>
              <p style={{ margin: "0 0 10px", fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.45 }}>
                {selected.resumenContexto}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.78rem" }}>
                <div><strong>Intención:</strong> {selected.intencionDetectada}</div>
                <div><strong>Confianza IA:</strong> {Math.round(selected.confianzaIa * 100)}%</div>
                <div><strong>ID Cliente SAP:</strong> {selected.clienteId}</div>
                {selected.pedidoEnCursoId && (
                  <div>
                    <strong>Pedido en curso:</strong>{" "}
                    <button
                      onClick={() => setActiveTab("pedidos")}
                      style={{ border: "none", background: "none", color: "#005bff", fontWeight: 700, cursor: "pointer", padding: 0 }}
                    >
                      {selected.pedidoEnCursoId} →
                    </button>
                  </div>
                )}
              </div>

              {/* RF-02.4: Reassign */}
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)" }}>
                <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
                  Asignado a (RF-02.4):
                </label>
                <select
                  value={selected.asignadoA || ""}
                  onChange={(e) => reassignEscalation(selected.id, e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.8rem" }}
                >
                  <option value="">-- Sin asignar --</option>
                  <option value="Maretta Daniel">Maretta Daniel (Gerente)</option>
                  <option value="Ana Rodríguez">Ana Rodríguez (Supervisor)</option>
                  <option value="Carlos Mendoza">Carlos Mendoza (Asesor)</option>
                </select>
              </div>
            </div>

            {/* RF-02.8: Internal Notes & AI Feedback */}
            <div className="bento-card" style={{ padding: "18px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 800 }}>Notas y Retroalimentación IA (RF-02.8)</h4>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                {selected.etiquetas.map((tag) => (
                  <span key={tag} style={{ fontSize: "0.7rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#f1f5f9" }}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
                <button
                  onClick={() => rateAiResponse(selected.id, "correcta")}
                  className="action-btn-pill"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    backgroundColor: selected.calificacionIa === "correcta" ? "#dcfce7" : "#fff",
                    color: selected.calificacionIa === "correcta" ? "#15803d" : "var(--text-main)",
                  }}
                >
                  <CheckIcon size={13} /> Respuesta OK
                </button>
                <button
                  onClick={() => rateAiResponse(selected.id, "incorrecta")}
                  className="action-btn-pill"
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    fontSize: "0.75rem",
                    backgroundColor: selected.calificacionIa === "incorrecta" ? "#fee2e2" : "#fff",
                    color: selected.calificacionIa === "incorrecta" ? "#b91c1c" : "var(--text-main)",
                  }}
                >
                  Corregir IA
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                {selected.notasInternas.map((n, i) => (
                  <div key={i} style={{ fontSize: "0.76rem", padding: "8px", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fef08a" }}>
                    {n}
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNote} style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Agregar nota interna..."
                  style={{ flex: 1, padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border-card)", fontSize: "0.78rem" }}
                />
                <button type="submit" className="action-btn-pill" style={{ padding: "6px 12px", fontSize: "0.76rem" }}>
                  Guardar
                </button>
              </form>
            </div>

            {/* RF-02.9: Client History */}
            <div className="bento-card" style={{ padding: "18px" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: "0.9rem", fontWeight: 800 }}>Historial del Cliente (RF-02.9)</h4>
              {selected.historialPrevio.length === 0 ? (
                <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>Sin escalamientos previos registrados.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {selected.historialPrevio.map((h, idx) => (
                    <div key={idx} style={{ fontSize: "0.76rem", padding: "8px", borderRadius: "8px", backgroundColor: "#f8fafc" }}>
                      <strong>{h.fecha}</strong> · {h.motivo}
                      <div style={{ color: "var(--text-muted)" }}>{h.resultado}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
