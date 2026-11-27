import { useState } from "react";
import { useDemo, exportToCsv } from "../../context/DemoContext";
import { SAP_FIELD_MAPPINGS } from "../../data/mockData";
import { RefreshIcon, AlertIcon, ExportIcon, PlayIcon } from "../icons/Icons";

export default function SapConnectionView() {
  const {
    sapConnections,
    sapLogs,
    sapErrors,
    sapMasterEntities,
    triggerMasterSync,
    retrySapError,
    setActiveTab,
  } = useDemo();

  const [subTab, setSubTab] = useState<"estado" | "logs" | "mapeos">("estado");
  const [mandante, setMandante] = useState<"S4H_PRD (100)" | "S4H_QAS (200)">("S4H_PRD (100)");
  const [logStatusFilter, setLogStatusFilter] = useState<string>("todos");
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [errorThreshold, setErrorThreshold] = useState<number>(3.5);

  const filteredLogs = sapLogs.filter((l) =>
    logStatusFilter === "todos" ? true : l.estado.includes(logStatusFilter)
  );
  const selectedLog = filteredLogs.find((l) => l.id === selectedLogId) || filteredLogs[0] || null;
  const maxErrorRate = Math.max(...sapConnections.map((c) => c.tasaErrorPct));

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Conexión con SAP S/4HANA (Módulo 4)
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Monitoreo de OData/BTP, datos maestros, cola de errores y mapeos (Modo Demo Simulado)
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {/* RF-04.9: Multi-system / mandante selector */}
          <select
            value={mandante}
            onChange={(e) => setMandante(e.target.value as "S4H_PRD (100)" | "S4H_QAS (200)")}
            aria-label="Sistema y mandante SAP"
            style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--border-card)", background: "#fff", fontSize: "0.8rem", fontWeight: 700 }}
          >
            <option value="S4H_PRD (100)">Sistema: S4H_PRD · Mandante 100</option>
            <option value="S4H_QAS (200)">Sistema: S4H_QAS · Mandante 200</option>
          </select>

          <button className="hero-cta-btn" onClick={() => setActiveTab("demo")} style={{ padding: "8px 16px" }}>
            <PlayIcon size={14} /> Probar Flujo Agente ↔ SAP
          </button>
        </div>
      </div>

      {/* RF-04.8: Threshold Alert Banner */}
      {maxErrorRate > errorThreshold && (
        <div
          style={{
            padding: "12px 18px",
            borderRadius: "16px",
            backgroundColor: "#fffbeb",
            border: "1px solid #fde047",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#92400e", fontSize: "0.84rem" }}>
            <AlertIcon size={18} />
            <span>
              <strong>Alerta de Umbral (RF-04.8):</strong> <code>API_CREDITMANAGEMENT_SRV</code> presenta tasa de error{" "}
              <strong>{maxErrorRate}%</strong> (umbral configurado: {errorThreshold}%).
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
            <span>Umbral (%):</span>
            <input
              type="number"
              step="0.5"
              value={errorThreshold}
              onChange={(e) => setErrorThreshold(Number(e.target.value))}
              style={{ width: "60px", padding: "4px 6px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>
      )}

      {/* Sub-navigation */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {[
          { id: "estado", label: "Estado y Datos Maestros" },
          { id: "logs", label: `Logs y Cola de Errores (${sapErrors.filter((e) => e.estado === "pendiente").length})` },
          { id: "mapeos", label: "Mapeos y Credenciales Seguras" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as "estado" | "logs" | "mapeos")}
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

      {/* SUBTAB 1: Connection Status & Master Data */}
      {subTab === "estado" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
            {sapConnections.map((c) => {
              const isOk = c.estado === "conectado";
              const isDeg = c.estado === "degradado";
              return (
                <div key={c.id} className="bento-card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "3px 9px",
                        borderRadius: "999px",
                        backgroundColor: isOk ? "#dcfce7" : isDeg ? "#fef3c7" : "#fee2e2",
                        color: isOk ? "#15803d" : isDeg ? "#92400e" : "#b91c1c",
                        textTransform: "uppercase",
                      }}
                    >
                      {c.estado}
                    </span>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                      {c.sistema} · {c.mandante}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", marginBottom: "6px" }}>{c.nombre}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    <span>Latencia: <strong>{c.latenciaMs} ms</strong></span>
                    <span>Error: <strong>{c.tasaErrorPct}%</strong></span>
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "var(--text-light)", marginTop: "6px" }}>
                    Última sync: {c.ultimaSincronizacion}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RF-04.4 & RF-04.5: Master Data Sync */}
          <div className="bento-card">
            <div className="card-header-row">
              <div>
                <h3 className="card-title">Sincronización de Datos Maestros SAP (RF-04.4 / RF-04.5)</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Frecuencia automática y disparo manual por entidad
                </span>
              </div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    <th style={{ padding: "12px" }}>Entidad</th>
                    <th style={{ padding: "12px" }}>Registros</th>
                    <th style={{ padding: "12px" }}>Frecuencia</th>
                    <th style={{ padding: "12px" }}>Última Sync</th>
                    <th style={{ padding: "12px" }}>Estado</th>
                    <th style={{ padding: "12px" }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sapMasterEntities.map((m) => (
                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "12px", fontWeight: 700 }}>{m.entidad}</td>
                      <td style={{ padding: "12px" }}>{m.registros.toLocaleString()}</td>
                      <td style={{ padding: "12px", color: "var(--text-muted)" }}>{m.frecuencia}</td>
                      <td style={{ padding: "12px" }}>{m.ultimaSync}</td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            padding: "3px 9px",
                            borderRadius: "999px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: m.estado === "sincronizado" ? "#dcfce7" : m.estado === "sincronizando" ? "#e0f2fe" : "#fef3c7",
                            color: m.estado === "sincronizado" ? "#15803d" : m.estado === "sincronizando" ? "#0369a1" : "#92400e",
                          }}
                        >
                          {m.estado}
                        </span>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <button className="action-btn-pill" style={{ padding: "5px 12px", fontSize: "0.75rem" }} onClick={() => triggerMasterSync(m.id)}>
                          <RefreshIcon size={12} /> Sincronizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUBTAB 2: Transaction Logs & Error Queue */}
      {subTab === "logs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* RF-04.3: Error Queue */}
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Cola de Errores de Integración (RF-04.3)</h3>
            {sapErrors.map((err) => (
              <div
                key={err.id}
                style={{
                  padding: "14px",
                  borderRadius: "14px",
                  backgroundColor: err.estado === "pendiente" ? "#fef2f2" : "#f0fdf4",
                  border: `1px solid ${err.estado === "pendiente" ? "#fecaca" : "#bbf7d0"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>
                    {err.pedidoId} · {err.clienteNombre}{" "}
                    <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>({err.codigoSap})</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: err.estado === "pendiente" ? "#b91c1c" : "#15803d", marginTop: "4px" }}>
                    {err.estado === "pendiente" ? err.motivoLegible : "Reintento exitoso · Contabilizado en SAP"}
                  </div>
                </div>
                {err.estado === "pendiente" && (
                  <button className="hero-cta-btn" style={{ padding: "7px 14px", fontSize: "0.8rem" }} onClick={() => retrySapError(err.id)}>
                    <RefreshIcon size={13} /> Reintentar Envío
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* RF-04.2: Transaction Logs */}
          <div className="bento-grid">
            <div className="bento-card">
              <div className="card-header-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                <h3 className="card-title">Log de Transacciones SAP (RF-04.2)</h3>
                <div style={{ display: "flex", gap: "6px" }}>
                  <select
                    value={logStatusFilter}
                    onChange={(e) => setLogStatusFilter(e.target.value)}
                    style={{ padding: "6px 10px", borderRadius: "999px", border: "1px solid var(--border-card)", fontSize: "0.76rem" }}
                  >
                    <option value="todos">Todos</option>
                    <option value="20">Exitosos (200/201)</option>
                    <option value="400">Errores (400)</option>
                  </select>
                  <button
                    className="action-btn-pill"
                    style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                    onClick={() =>
                      exportToCsv(
                        "sap-logs.csv",
                        filteredLogs.map((l) => ({
                          ID: l.id,
                          Fecha: l.fecha,
                          Servicio: l.servicio,
                          Operacion: l.operacion,
                          Estado: l.estado,
                          Duracion_ms: l.duracionMs,
                        }))
                      )
                    }
                  >
                    <ExportIcon size={13} /> CSV
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filteredLogs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLogId(log.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px",
                      borderRadius: "12px",
                      border: selectedLog?.id === log.id ? "2px solid #005bff" : "1px solid var(--border-subtle)",
                      backgroundColor: selectedLog?.id === log.id ? "#eff6ff" : "#fff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                      <span>{log.servicio}</span>
                      <span style={{ color: log.estado.startsWith("2") ? "#15803d" : "#dc2626" }}>{log.estado}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      <span>{log.operacion} · {log.pedidoId || "Consulta"}</span>
                      <span>{log.duracionMs} ms</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedLog && (
              <div className="dark-hero-card" style={{ padding: "22px" }}>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem" }}>Inspector Payload · {selectedLog.id}</h4>
                <div style={{ fontSize: "0.72rem", color: "#93c5fd", fontWeight: 700, marginBottom: "4px" }}>REQUEST JSON:</div>
                <pre style={{ margin: "0 0 12px", padding: "10px", borderRadius: "10px", backgroundColor: "#0b0d11", fontSize: "0.74rem", overflowX: "auto", color: "#e2e8f0" }}>
                  {selectedLog.peticionJson}
                </pre>
                <div style={{ fontSize: "0.72rem", color: "#86efac", fontWeight: 700, marginBottom: "4px" }}>RESPONSE JSON:</div>
                <pre style={{ margin: 0, padding: "10px", borderRadius: "10px", backgroundColor: "#0b0d11", fontSize: "0.74rem", overflowX: "auto", color: "#e2e8f0" }}>
                  {selectedLog.respuestaJson}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Field Mappings & Secure Credentials */}
      {subTab === "mapeos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "12px" }}>Mapeo de Campos y Valores SAP (RF-04.6)</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", fontSize: "0.74rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px" }}>Campo SmartSales</th>
                  <th style={{ padding: "10px" }}>Campo SAP S/4HANA</th>
                  <th style={{ padding: "10px" }}>Valor Ejemplo</th>
                  <th style={{ padding: "10px" }}>Regla de Transformación</th>
                </tr>
              </thead>
              <tbody>
                {SAP_FIELD_MAPPINGS.map((m) => (
                  <tr key={m.campoSap} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px", fontFamily: "monospace", color: "#005bff" }}>{m.campoOrigen}</td>
                    <td style={{ padding: "10px", fontFamily: "monospace", fontWeight: 700 }}>{m.campoSap}</td>
                    <td style={{ padding: "10px" }}>{m.valorEjemplo}</td>
                    <td style={{ padding: "10px", color: "var(--text-muted)" }}>{m.transformacion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* RF-04.7: Masked Credentials */}
          <div className="bento-card">
            <h3 className="card-title" style={{ marginBottom: "8px" }}>Credenciales y Endpoints Seguros (RF-04.7)</h3>
            <p style={{ margin: "0 0 14px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Almacenados en Secret Manager / BTP Destination Service. Nunca visibles en texto plano.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px" }}>
              {[
                { label: "SAP BTP Destination URL", value: "https://s4h-prd.••••••.corp:44300/sap/opu/odata" },
                { label: "OAuth2 Client ID", value: "sb-smartsales-••••-9f2a" },
                { label: "OAuth2 Client Secret", value: "••••••••••••••••••••••••••••" },
                { label: "Cloud Connector Location ID", value: "VE_CCS_••••" },
              ].map((cred) => (
                <div key={cred.label} style={{ padding: "12px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)" }}>{cred.label}</div>
                  <div style={{ fontFamily: "monospace", fontSize: "0.84rem", marginTop: "4px", fontWeight: 700 }}>{cred.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
