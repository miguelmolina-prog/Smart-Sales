import { useState } from "react";
import { useDemo } from "../../context/DemoContext";
import { CheckIcon } from "../icons/Icons";

export default function SettingsView() {
  const {
    users,
    toggleUserStatus,
    channels,
    toggleChannelStatus,
    currentTenant,
    configAudit,
    addConfigAudit,
  } = useDemo();

  const [subTab, setSubTab] = useState<"usuarios" | "canales" | "negocio" | "marca">("usuarios");
  const [tasaCambio, setTasaCambio] = useState("54.50");
  const [ivaPct, setIvaPct] = useState("16");
  const [catalogoActivo, setCatalogoActivo] = useState(true);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  const handleSaveParams = () => {
    addConfigAudit("Parámetros de Negocio", `Tasa BCV=${tasaCambio}, IVA=${ivaPct}%, Catálogo=${catalogoActivo ? "Activo" : "Pausado"}`);
    setSavedMsg("Parámetros guardados y registrados en bitácora.");
    setTimeout(() => setSavedMsg(null), 2500);
  };

  return (
    <div className="view-container">
      <div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
          Configuración del Sistema (Módulo 6)
        </h2>
        <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
          Usuarios, roles, canales WhatsApp, parámetros comerciales, plantillas, marca y bitácora de auditoría
        </p>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "usuarios", label: "Usuarios y Roles (RF-06.1)" },
          { id: "canales", label: "Canales y Plantillas (RF-06.2 / 6.5)" },
          { id: "negocio", label: "Parámetros y Enrutamiento (RF-06.3 / 6.4)" },
          { id: "marca", label: "Marca, API/Webhooks y Bitácora (RF-06.6–6.8)" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as "usuarios" | "canales" | "negocio" | "marca")}
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

      {/* SUBTAB 1: Users & Roles */}
      {subTab === "usuarios" && (
        <div className="bento-card">
          <h3 className="card-title" style={{ marginBottom: "12px" }}>Gestión de Usuarios, Roles y Permisos (RF-06.1 / RF-00.2)</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px" }}>Usuario</th>
                  <th style={{ padding: "12px" }}>Rol</th>
                  <th style={{ padding: "12px" }}>Sucursal</th>
                  <th style={{ padding: "12px" }}>SSO / MFA</th>
                  <th style={{ padding: "12px" }}>Estado</th>
                  <th style={{ padding: "12px" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "12px" }}>
                      <strong>{u.nombre}</strong>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px", textTransform: "capitalize", fontWeight: 700 }}>{u.rol}</td>
                    <td style={{ padding: "12px" }}>{u.sucursal}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ fontSize: "0.74rem", fontWeight: 700, color: u.mfaActivo ? "#15803d" : "#b91c1c" }}>
                        {u.mfaActivo ? "MFA Activo" : "Sin MFA"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span
                        style={{
                          padding: "3px 9px",
                          borderRadius: "999px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          backgroundColor: u.estado === "activo" ? "#dcfce7" : "#fee2e2",
                          color: u.estado === "activo" ? "#15803d" : "#b91c1c",
                        }}
                      >
                        {u.estado}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button className="action-btn-pill" style={{ padding: "4px 10px", fontSize: "0.75rem" }} onClick={() => toggleUserStatus(u.id)}>
                        {u.estado === "activo" ? "Bloquear" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Channels & Templates */}
      {subTab === "canales" && (
        <div className="bento-grid">
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Canales Conectados (RF-06.2)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {channels.map((ch) => (
                <div key={ch.id} style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.92rem" }}>{ch.tipo}</strong>
                    <button
                      className="action-btn-pill"
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.74rem",
                        backgroundColor: ch.estado === "activo" ? "#dcfce7" : "#fee2e2",
                        color: ch.estado === "activo" ? "#15803d" : "#b91c1c",
                      }}
                      onClick={() => toggleChannelStatus(ch.id)}
                    >
                      {ch.estado === "activo" ? "Activo" : "Pausado"}
                    </button>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>{ch.numeroOEndpoint}</div>
                  <div style={{ fontSize: "0.76rem", marginTop: "6px" }}>
                    Horario: <strong>{ch.horario}</strong> · {ch.plantillasAprobadas} plantillas aprobadas
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Plantillas Meta / Respuestas Predefinidas (RF-06.5)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem" }}>
              {[
                { name: "confirmacion_pedido_sap", status: "Aprobada (Meta)", text: "Tu pedido #{{1}} ha sido registrado en SAP bajo el documento {{2}}." },
                { name: "recordatorio_carrito", status: "Aprobada (Meta)", text: "Hola {{1}}, tienes un borrador pendiente por ${{2}}. ¿Deseas confirmarlo?" },
                { name: "handoff_asesor", status: "Interna", text: "Te estoy transfiriendo con {{1}}, quien continuará atendiéndote." },
              ].map((tpl) => (
                <div key={tpl.name} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <code>{tpl.name}</code>
                    <span style={{ color: "#15803d", fontSize: "0.72rem" }}>{tpl.status}</span>
                  </div>
                  <p style={{ margin: "6px 0 0", color: "var(--text-muted)" }}>{tpl.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Business Parameters & Routing */}
      {subTab === "negocio" && (
        <div className="bento-grid">
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "14px" }}>Parámetros de Negocio (RF-06.3)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.84rem" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Catálogo B2B habilitado para el Agente</span>
                <input type="checkbox" checked={catalogoActivo} onChange={(e) => setCatalogoActivo(e.target.checked)} />
              </label>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "4px" }}>Tasa de Cambio Referencial (VED / USD)</label>
                <input
                  type="text"
                  value={tasaCambio}
                  onChange={(e) => setTasaCambio(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-card)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontWeight: 700, marginBottom: "4px" }}>Impuesto / IVA (%)</label>
                <input
                  type="text"
                  value={ivaPct}
                  onChange={(e) => setIvaPct(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-card)" }}
                />
              </div>
              <button className="hero-cta-btn" onClick={handleSaveParams} style={{ alignSelf: "flex-start" }}>
                <CheckIcon size={15} /> Guardar Parámetros
              </button>
              {savedMsg && <span style={{ color: "#15803d", fontSize: "0.78rem", fontWeight: 700 }}>{savedMsg}</span>}
            </div>
          </div>

          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "14px" }}>Reglas de Enrutamiento y Horarios (RF-06.4)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.8rem" }}>
              {[
                { regla: "Monto > $1,500 o Descuento > 3%", destino: "Supervisor de Sucursal", sla: "15 min" },
                { regla: "Sentimiento negativo / Queja", destino: "Equipo Retención (Prioridad Alta)", sla: "10 min" },
                { regla: "Fuera de horario humano (20:00–07:00)", destino: "Cola Prioritaria 07:00 AM + Acuse automático", sla: "60 min" },
              ].map((r) => (
                <div key={r.regla} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
                  <div style={{ fontWeight: 700 }}>{r.regla}</div>
                  <div style={{ color: "var(--text-muted)", marginTop: "3px" }}>
                    Destino: <strong>{r.destino}</strong> · SLA: <strong>{r.sla}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Branding, API/Webhooks & Config Audit */}
      {subTab === "marca" && (
        <div className="bento-grid">
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Marca por Cliente &amp; API/Webhooks (RF-06.6 / RF-06.7)</h3>
            <div style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f8fafc", marginBottom: "12px", fontSize: "0.82rem" }}>
              <div><strong>Empresa Activa:</strong> {currentTenant.nombre} ({currentTenant.ruc})</div>
              <div><strong>Moneda / Zona:</strong> {currentTenant.moneda} · {currentTenant.zonaHoraria}</div>
              <div><strong>Módulos Habilitados:</strong> 6 módulos activos + Demo Agente</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "0.8rem" }}>
              <div style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700 }}>Webhook Escalamiento (n8n / Chatwoot)</div>
                <code style={{ color: "#005bff" }}>https://hooks.smartsales.app/v1/esc-••••91a</code>
              </div>
              <div style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontWeight: 700 }}>OpenAI / Gemini Hub API Key</div>
                <code>sk-proj-••••••••••••••••••••••••••••8f2d</code>
              </div>
            </div>
          </div>

          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Bitácora de Auditoría de Configuración (RF-06.8)</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {configAudit.map((log) => (
                <div key={log.id} style={{ padding: "10px", borderRadius: "10px", backgroundColor: "#f8fafc", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                    <span>{log.modulo}</span>
                    <span style={{ color: "var(--text-muted)" }}>{log.fecha}</span>
                  </div>
                  <div style={{ marginTop: "2px" }}>{log.cambio}</div>
                  <div style={{ fontSize: "0.72rem", color: "#005bff" }}>Usuario: {log.usuario}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
