import { useState, useMemo } from "react";
import { useDemo, exportToCsv } from "../../context/DemoContext";
import type { Order, OrderStatus } from "../../types";
import { ExportIcon, CheckIcon, RefreshIcon, CloseIcon, SearchIcon } from "../icons/Icons";

const STATUS_STYLE: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  borrador: { label: "Borrador", bg: "#f1f5f9", color: "#475569" },
  pendiente_revision: { label: "Pendiente revisión", bg: "#fef3c7", color: "#92400e" },
  aprobado: { label: "Aprobado", bg: "#e0f2fe", color: "#0369a1" },
  enviado_sap: { label: "Enviado a SAP", bg: "#dcfce7", color: "#15803d" },
  error: { label: "Error SAP", bg: "#fee2e2", color: "#b91c1c" },
  rechazado: { label: "Rechazado", bg: "#f3e8ff", color: "#7e22ce" },
};

export default function OrdersView() {
  const {
    orders,
    currentTenant,
    role,
    filters,
    updateOrderStatus,
    bulkApproveOrders,
    retryOrderSap,
    setActiveTab,
  } = useDemo();

  const [estadoFilter, setEstadoFilter] = useState<string>("todos");
  const [origenFilter, setOrigenFilter] = useState<string>("todos");
  const [search, setSearch] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.tenantId !== currentTenant.id) return false;
      if (role === "supervisor" && o.sucursal !== currentTenant.sucursalPrincipal) return false;
      if (filters.vendedor !== "todos" && o.vendedor !== filters.vendedor) return false;
      if (filters.canal !== "todos" && o.canal !== filters.canal) return false;
      if (estadoFilter !== "todos" && o.estado !== estadoFilter) return false;
      if (origenFilter !== "todos" && o.origen !== origenFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          o.id.toLowerCase().includes(q) ||
          o.clienteNombre.toLowerCase().includes(q) ||
          (o.sapDocNumber && o.sapDocNumber.includes(q))
        );
      }
      return true;
    });
  }, [orders, currentTenant, role, filters, estadoFilter, origenFilter, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkApprove = () => {
    if (!selectedIds.length) return;
    bulkApproveOrders(selectedIds);
    setSelectedIds([]);
  };

  const handleExportCsv = () => {
    exportToCsv(
      `pedidos-${currentTenant.id}.csv`,
      filteredOrders.map((o) => ({
        ID: o.id,
        Fecha: o.fecha,
        Cliente: o.clienteNombre,
        Origen: o.origen,
        Canal: o.canal,
        Total_USD: o.totalUsd,
        Estado: o.estado,
        Doc_SAP: o.sapDocNumber || "",
      }))
    );
  };

  // Keep detail modal synced with live orders state
  const activeDetail = useMemo(
    () => (detailOrder ? orders.find((o) => o.id === detailOrder.id) || null : null),
    [detailOrder, orders]
  );

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Gestión de Pedidos (Módulo 3)
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Validación humana, trazabilidad completa, aprobación masiva y contabilización en SAP S/4HANA
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {selectedIds.length > 0 && role !== "operador" && (
            <button className="hero-cta-btn" onClick={handleBulkApprove} style={{ padding: "8px 16px" }}>
              <CheckIcon size={15} />
              <span>Aprobar y Enviar a SAP ({selectedIds.length})</span>
            </button>
          )}
          <button className="action-btn-pill" onClick={handleExportCsv}>
            <ExportIcon size={15} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar (RF-03.1) */}
      <div className="bento-card" style={{ padding: "14px 20px", display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#f8fafc", border: "1px solid var(--border-card)", borderRadius: "999px", padding: "6px 14px", flex: "1 1 220px" }}>
          <SearchIcon size={15} style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por # pedido, cliente o doc SAP..."
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.83rem" }}
          />
        </div>

        <select
          value={estadoFilter}
          onChange={(e) => setEstadoFilter(e.target.value)}
          aria-label="Filtrar por estado"
          style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--border-card)", background: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
        >
          <option value="todos">Todos los estados</option>
          {Object.entries(STATUS_STYLE).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>

        <select
          value={origenFilter}
          onChange={(e) => setOrigenFilter(e.target.value)}
          aria-label="Filtrar por origen"
          style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid var(--border-card)", background: "#fff", fontSize: "0.82rem", fontWeight: 600 }}
        >
          <option value="todos">Origen: Todos</option>
          <option value="Agente IA">Agente IA</option>
          <option value="Manual">Manual</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bento-card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid var(--border-subtle)", textAlign: "left", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                <th style={{ padding: "14px 16px" }}>Sel.</th>
                <th style={{ padding: "14px 12px" }}>Pedido</th>
                <th style={{ padding: "14px 12px" }}>Cliente</th>
                <th style={{ padding: "14px 12px" }}>Origen / Canal</th>
                <th style={{ padding: "14px 12px" }}>Total ({currentTenant.moneda})</th>
                <th style={{ padding: "14px 12px" }}>Estado</th>
                <th style={{ padding: "14px 12px" }}>Doc. SAP (RF-03.7)</th>
                <th style={{ padding: "14px 16px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => {
                const st = STATUS_STYLE[o.estado];
                const canSelect = o.estado === "pendiente_revision" || o.estado === "borrador";
                return (
                  <tr key={o.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <input
                        type="checkbox"
                        disabled={!canSelect}
                        checked={selectedIds.includes(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        aria-label={`Seleccionar pedido ${o.id}`}
                      />
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <strong style={{ color: "#005bff", cursor: "pointer" }} onClick={() => setDetailOrder(o)}>
                        {o.id}
                      </strong>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{o.fecha}</div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ fontWeight: 700 }}>{o.clienteNombre}</div>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>
                        {o.clienteId} · {o.vendedor}
                      </div>
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ fontWeight: 600 }}>{o.origen}</span>
                      <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{o.canal}</div>
                    </td>
                    <td style={{ padding: "14px 12px", fontWeight: 800 }}>${o.totalUsd.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ padding: "4px 10px", borderRadius: "999px", fontSize: "0.74rem", fontWeight: 700, backgroundColor: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      {o.reglaRevision && (
                        <div style={{ fontSize: "0.7rem", color: "#b45309", marginTop: "4px", maxWidth: "200px" }}>
                          {o.reglaRevision}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 12px" }}>
                      {o.sapDocNumber ? (
                        <div>
                          <strong style={{ fontFamily: "monospace", color: "#15803d" }}>{o.sapDocNumber}</strong>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{o.sapStatus}</div>
                        </div>
                      ) : o.sapErrorMsg ? (
                        <span style={{ fontSize: "0.74rem", color: "#b91c1c" }}>Error: ver detalle</span>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>Pendiente</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <button className="action-btn-pill" style={{ padding: "5px 10px", fontSize: "0.75rem" }} onClick={() => setDetailOrder(o)}>
                          Ver detalle
                        </button>
                        {o.estado === "error" && (
                          <button
                            className="action-btn-pill"
                            style={{ padding: "5px 10px", fontSize: "0.75rem", backgroundColor: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" }}
                            onClick={() => retryOrderSap(o.id)}
                          >
                            <RefreshIcon size={12} /> Reintentar SAP
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal (RF-03.2, RF-03.4, RF-03.5, RF-03.8) */}
      {activeDetail && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 80,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "24px",
              width: "100%",
              maxWidth: "740px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800 }}>
                  Pedido {activeDetail.id} · {activeDetail.clienteNombre}
                </h3>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {activeDetail.condicionPago} · Origen: {activeDetail.origen} ({activeDetail.canal})
                </span>
              </div>
              <button className="icon-btn-round" onClick={() => setDetailOrder(null)} aria-label="Cerrar detalle">
                <CloseIcon size={18} />
              </button>
            </div>

            {activeDetail.sapErrorMsg && (
              <div style={{ padding: "12px 14px", borderRadius: "12px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", fontSize: "0.82rem", marginBottom: "14px" }}>
                <strong>Error devuelto por SAP S/4HANA:</strong> {activeDetail.sapErrorMsg}
              </div>
            )}

            {/* Items */}
            <h4 style={{ margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 800 }}>Ítems del Pedido (RF-03.2)</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem", marginBottom: "16px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left" }}>
                  <th style={{ padding: "8px" }}>SKU</th>
                  <th style={{ padding: "8px" }}>Descripción</th>
                  <th style={{ padding: "8px" }}>Cant.</th>
                  <th style={{ padding: "8px" }}>Precio</th>
                  <th style={{ padding: "8px" }}>Desc.</th>
                  <th style={{ padding: "8px" }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {activeDetail.items.map((it) => (
                  <tr key={it.sku} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px", fontFamily: "monospace" }}>{it.sku}</td>
                    <td style={{ padding: "8px" }}>{it.descripcion}</td>
                    <td style={{ padding: "8px", fontWeight: 700 }}>{it.cantidad}</td>
                    <td style={{ padding: "8px" }}>${it.precioUnitario.toFixed(2)}</td>
                    <td style={{ padding: "8px" }}>{it.descuentoPct}%</td>
                    <td style={{ padding: "8px", fontWeight: 700 }}>
                      ${(it.cantidad * it.precioUnitario * (1 - it.descuentoPct / 100)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Traceability (RF-03.8) */}
            <h4 style={{ margin: "0 0 8px", fontSize: "0.88rem", fontWeight: 800 }}>Trazabilidad del Pedido (RF-03.8)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "18px" }}>
              {activeDetail.trazabilidad.map((t, i) => (
                <div key={i} style={{ fontSize: "0.78rem", padding: "8px 12px", borderRadius: "10px", backgroundColor: "#f8fafc" }}>
                  <strong>{t.fecha}</strong> · <span style={{ color: "#005bff", fontWeight: 700 }}>{t.usuario}</span>: {t.accion}
                </div>
              ))}
            </div>

            {/* Actions (RF-03.4, RF-03.6) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid var(--border-subtle)", paddingTop: "14px" }}>
              {activeDetail.conversacionId ? (
                <button
                  className="action-btn-pill"
                  onClick={() => {
                    setDetailOrder(null);
                    setActiveTab("escalamientos");
                  }}
                >
                  Ver Conversación ({activeDetail.conversacionId})
                </button>
              ) : (
                <span />
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                {(activeDetail.estado === "pendiente_revision" || activeDetail.estado === "borrador") && role !== "operador" && (
                  <>
                    <button
                      className="action-btn-pill"
                      style={{ color: "#b91c1c", borderColor: "#fecaca" }}
                      onClick={() => updateOrderStatus(activeDetail.id, "rechazado", "Maretta Daniel", "Rechazado en revisión comercial")}
                    >
                      Rechazar
                    </button>
                    <button
                      className="hero-cta-btn"
                      onClick={() => updateOrderStatus(activeDetail.id, "enviado_sap", "Maretta Daniel", "Aprobado manualmente y enviado a SAP S/4HANA")}
                    >
                      <CheckIcon size={15} /> Aprobar y Enviar a SAP
                    </button>
                  </>
                )}

                {activeDetail.estado === "error" && (
                  <button className="hero-cta-btn" onClick={() => retryOrderSap(activeDetail.id)}>
                    <RefreshIcon size={15} /> Reintentar Envío a SAP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
