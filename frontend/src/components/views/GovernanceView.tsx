import { useState } from "react";
import { useDemo, exportToCsv } from "../../context/DemoContext";
import type { AutonomyRule } from "../../types";
import { ShieldIcon, CheckIcon, ExportIcon } from "../icons/Icons";

export default function GovernanceView() {
  const {
    agentPausedGlobal,
    setAgentPausedGlobal,
    pausedChannels,
    toggleChannelPause,
    aiAudit,
    rateAuditSample,
    guardrails,
    setGuardrails,
    autonomyRules,
    updateAutonomyLevel,
    prompts,
    activatePromptVersion,
    configAudit,
    addConfigAudit,
    role,
  } = useDemo();

  const [subTab, setSubTab] = useState<"auditoria" | "guardrails" | "prompts">("auditoria");

  const correctCount = aiAudit.filter((a) => a.calificacion === "correcta").length;
  const ratedCount = aiAudit.filter((a) => a.calificacion).length || 1;
  const precisionPct = Math.round((correctCount / ratedCount) * 100);

  return (
    <div className="view-container">
      {/* Header + RF-05.9 Kill Switch */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Gobernanza de IA (Módulo 5)
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Guardrails, niveles de autonomía, auditoría de decisiones, versionado de prompts y Kill Switch
          </p>
        </div>

        {/* RF-05.9: Kill Switch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "10px 16px",
            borderRadius: "16px",
            backgroundColor: agentPausedGlobal ? "#fef2f2" : "#f0fdf4",
            border: `1px solid ${agentPausedGlobal ? "#fecaca" : "#bbf7d0"}`,
          }}
        >
          <ShieldIcon size={18} style={{ color: agentPausedGlobal ? "#dc2626" : "#16a34a" }} />
          <div>
            <div style={{ fontSize: "0.78rem", fontWeight: 800, color: agentPausedGlobal ? "#991b1b" : "#166534" }}>
              Kill Switch Global (RF-05.9)
            </div>
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              {agentPausedGlobal ? "Agente IA pausado en todos los canales" : "Agente IA operando normalmente"}
            </div>
          </div>
          <button
            disabled={role === "operador"}
            onClick={() => setAgentPausedGlobal(!agentPausedGlobal)}
            style={{
              border: "none",
              borderRadius: "999px",
              padding: "7px 14px",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: role === "operador" ? "not-allowed" : "pointer",
              backgroundColor: agentPausedGlobal ? "#16a34a" : "#dc2626",
              color: "#fff",
              opacity: role === "operador" ? 0.5 : 1,
            }}
          >
            {agentPausedGlobal ? "Reactivar Agente" : "Pausar Agente"}
          </button>
        </div>
      </div>

      {/* RF-05.6 & RF-05.10: Quality & Cost Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "14px" }}>
        <div className="bento-card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Precisión Auditada (RF-05.6)</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#005bff", marginTop: "6px" }}>{precisionPct}%</div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Basado en muestras revisadas</div>
        </div>
        <div className="bento-card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Alucinaciones Reportadas</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d", marginTop: "6px" }}>0.8%</div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Validación estricta con SAP ATP</div>
        </div>
        <div className="bento-card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Tasa Corrección Humana</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>6.4%</div>
          <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Feedback enviado a prompts</div>
        </div>
        <div className="bento-card" style={{ padding: "18px 20px" }}>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>Control de Costos IA (RF-05.10)</div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", marginTop: "6px" }}>
            ${guardrails.consumoActualUsd} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>/ ${guardrails.limiteCostoMensualUsd}</span>
          </div>
          <div style={{ fontSize: "0.74rem", color: "#15803d", fontWeight: 600 }}>Dentro de presupuesto mensual</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "auditoria", label: "Auditoría y Revisión de Muestras" },
          { id: "guardrails", label: "Guardrails, Autonomía y Privacidad" },
          { id: "prompts", label: "Versiones de Prompt y Bitácora" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as "auditoria" | "guardrails" | "prompts")}
            className="action-btn-pill"
            style={{
              backgroundColor: subTab === t.id ? "#111317" : "#fff",
              color: subTab === t.id ? "#fff" : "var(--text-main)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* SUBTAB 1: Audit Decisions & Sample Review (RF-05.1, RF-05.5, RF-05.7) */}
      {subTab === "auditoria" && (
        <div className="bento-card">
          <div className="card-header-row" style={{ flexWrap: "wrap", gap: "8px" }}>
            <div>
              <h3 className="card-title">Auditoría de Decisiones del Agente (RF-05.1 / RF-05.5 / RF-05.7)</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Datos personales (PII) enmascarados automáticamente antes de enviar al modelo y en logs
              </span>
            </div>
            <button
              className="action-btn-pill"
              onClick={() =>
                exportToCsv(
                  "auditoria-ia.csv",
                  aiAudit.map((a) => ({
                    ID: a.id,
                    Fecha: a.fecha,
                    Cliente: a.clienteEnmascarado,
                    Modelo: a.modelo,
                    Prompt: a.versionPrompt,
                    Herramientas: a.herramientas.join(" | "),
                    Tokens: a.tokens,
                    Calificacion: a.calificacion || "Pendiente",
                  }))
                )
              }
            >
              <ExportIcon size={14} /> Exportar CSV
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
            {aiAudit.map((aud) => (
              <div
                key={aud.id}
                style={{
                  padding: "16px",
                  borderRadius: "16px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "#f8fafc",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800 }}>
                    {aud.id} · {aud.clienteEnmascarado}{" "}
                    <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({aud.fecha})</span>
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "0.74rem" }}>
                    <span style={{ padding: "2px 8px", borderRadius: "999px", backgroundColor: "#e0f2fe", color: "#0369a1", fontWeight: 700 }}>
                      {aud.modelo} · {aud.versionPrompt}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>{aud.tokens} tok (${aud.costoUsd})</span>
                  </div>
                </div>

                <div style={{ fontSize: "0.82rem", marginBottom: "6px" }}>
                  <strong>Entrada (PII Enmascarada):</strong> {aud.entradaEnmascarada}
                </div>
                <div style={{ fontSize: "0.82rem", marginBottom: "8px", color: "#1e3a8a" }}>
                  <strong>Respuesta Agente:</strong> {aud.respuestaAgente}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {aud.herramientas.map((h) => (
                      <span key={h} style={{ fontFamily: "monospace", fontSize: "0.72rem", padding: "3px 8px", borderRadius: "8px", backgroundColor: "#fff", border: "1px solid #cbd5e1" }}>
                        ⚡ {h}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => rateAuditSample(aud.id, "correcta")}
                      className="action-btn-pill"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.74rem",
                        backgroundColor: aud.calificacion === "correcta" ? "#dcfce7" : "#fff",
                        color: aud.calificacion === "correcta" ? "#15803d" : "var(--text-main)",
                      }}
                    >
                      <CheckIcon size={12} /> Correcta
                    </button>
                    <button
                      onClick={() => rateAuditSample(aud.id, "incorrecta")}
                      className="action-btn-pill"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.74rem",
                        backgroundColor: aud.calificacion === "incorrecta" ? "#fee2e2" : "#fff",
                        color: aud.calificacion === "incorrecta" ? "#b91c1c" : "var(--text-main)",
                      }}
                    >
                      Incorrecta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Guardrails, Autonomy & Privacy (RF-05.2, RF-05.3, RF-05.7, RF-05.8, RF-05.9) */}
      {subTab === "guardrails" && (
        <div className="bento-grid">
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "14px" }}>Guardrails Comerciales y Privacidad (RF-05.2 / RF-05.7 / RF-05.8)</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  <span>Monto máximo autónomo sin aprobación humana (USD)</span>
                  <span style={{ color: "#005bff" }}>${guardrails.montoMaxSinAprobacionUsd}</span>
                </label>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={guardrails.montoMaxSinAprobacionUsd}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setGuardrails((g) => ({ ...g, montoMaxSinAprobacionUsd: val }));
                    addConfigAudit("Guardrails", `Monto máximo autónomo cambiado a $${val}`);
                  }}
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "4px" }}>
                  <span>Descuento máximo permitido al agente (%)</span>
                  <span style={{ color: "#005bff" }}>{guardrails.descuentoMaxPct}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={15}
                  step={1}
                  value={guardrails.descuentoMaxPct}
                  onChange={(e) => setGuardrails((g) => ({ ...g, descuentoMaxPct: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Enmascaramiento PII en logs y LLM (RF-05.7)</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Oculta teléfonos, cédulas y direcciones</div>
                </div>
                <input
                  type="checkbox"
                  checked={guardrails.enmascararPii}
                  onChange={(e) => setGuardrails((g) => ({ ...g, enmascararPii: e.target.checked }))}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                <div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700 }}>Retención de conversaciones (RF-05.8)</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>Eliminación automática tras expirar</div>
                </div>
                <select
                  value={guardrails.retencionDias}
                  onChange={(e) => setGuardrails((g) => ({ ...g, retencionDias: Number(e.target.value) }))}
                  style={{ padding: "5px 10px", borderRadius: "8px", border: "1px solid var(--border-card)" }}
                >
                  <option value={30}>30 días</option>
                  <option value={90}>90 días</option>
                  <option value={180}>180 días</option>
                  <option value={365}>365 días</option>
                </select>
              </div>

              {/* Per-channel Kill Switch */}
              <div style={{ paddingTop: "8px", borderTop: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, marginBottom: "8px" }}>Pausa selectiva por canal (RF-05.9):</div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {["WhatsApp", "Web Demo"].map((ch) => {
                    const isPaused = pausedChannels.includes(ch);
                    return (
                      <button
                        key={ch}
                        onClick={() => toggleChannelPause(ch)}
                        className="action-btn-pill"
                        style={{
                          backgroundColor: isPaused ? "#fef2f2" : "#f0fdf4",
                          color: isPaused ? "#b91c1c" : "#15803d",
                          borderColor: isPaused ? "#fecaca" : "#bbf7d0",
                        }}
                      >
                        {ch}: {isPaused ? "Pausado" : "Activo"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RF-05.3: Autonomy Matrix */}
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "14px" }}>Nivel de Autonomía por Acción (RF-05.3)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {autonomyRules.map((rule) => (
                <div key={rule.accion} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.84rem" }}>{rule.accion}</div>
                  <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginBottom: "8px" }}>{rule.descripcion}</div>
                  <select
                    value={rule.nivel}
                    onChange={(e) => updateAutonomyLevel(rule.accion, e.target.value as AutonomyRule["nivel"])}
                    style={{ width: "100%", padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border-card)", fontSize: "0.8rem", fontWeight: 600 }}
                  >
                    <option value="ejecutar_autonomo">Ejecutar autónomo</option>
                    <option value="ejecutar_con_aprobacion">Ejecutar con aprobación humana</option>
                    <option value="solo_sugerir">Solo sugerir</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Prompt Versioning & Immutable Admin Log (RF-05.4, RF-05.11) */}
      {subTab === "prompts" && (
        <div className="bento-grid">
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Versionado de Prompts y Rollback (RF-05.4)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {prompts.map((p) => (
                <div
                  key={p.version}
                  style={{
                    padding: "14px",
                    borderRadius: "14px",
                    border: p.activa ? "2px solid #005bff" : "1px solid var(--border-subtle)",
                    backgroundColor: p.activa ? "#eff6ff" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div>
                      <strong style={{ fontSize: "0.95rem" }}>{p.version}</strong>{" "}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>· {p.fecha} por {p.autor}</span>
                    </div>
                    {p.activa ? (
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 9px", borderRadius: "999px", backgroundColor: "#005bff", color: "#fff" }}>
                        ACTIVA
                      </span>
                    ) : (
                      <button className="action-btn-pill" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => activatePromptVersion(p.version)}>
                        Hacer Rollback
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "8px" }}>{p.notas}</div>
                  <pre style={{ margin: 0, padding: "10px", borderRadius: "10px", backgroundColor: "#f8fafc", fontSize: "0.75rem", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                    {p.contenido}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* RF-05.11: Immutable Admin Log */}
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Registro Inmutable de Cambios (RF-05.11)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {configAudit.map((log) => (
                <div key={log.id} style={{ padding: "10px 12px", borderRadius: "10px", backgroundColor: "#f8fafc", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{log.modulo}</span>
                    <span style={{ color: "var(--text-muted)" }}>{log.fecha}</span>
                  </div>
                  <div style={{ marginTop: "3px" }}>{log.cambio}</div>
                  <div style={{ fontSize: "0.72rem", color: "#005bff", marginTop: "2px" }}>Por: {log.usuario}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
