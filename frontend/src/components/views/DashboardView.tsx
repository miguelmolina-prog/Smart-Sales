import { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { useDemo, exportToCsv } from "../../context/DemoContext";
import { ExportIcon, PlayIcon, TrendingIcon, ArrowUpRightIcon, CheckIcon } from "../icons/Icons";

const TREND_DATA = {
  dia: [
    { label: "08:00", actual: 18, anterior: 14 },
    { label: "10:00", actual: 34, anterior: 28 },
    { label: "12:00", actual: 46, anterior: 39 },
    { label: "14:00", actual: 38, anterior: 35 },
    { label: "16:00", actual: 52, anterior: 41 },
    { label: "18:00", actual: 29, anterior: 24 },
  ],
  semana: [
    { label: "Lun", actual: 42, anterior: 36 },
    { label: "Mar", actual: 55, anterior: 44 },
    { label: "Mié", actual: 61, anterior: 50 },
    { label: "Jue", actual: 58, anterior: 49 },
    { label: "Vie", actual: 74, anterior: 62 },
    { label: "Sáb", actual: 39, anterior: 31 },
  ],
  mes: [
    { label: "Sem 1", actual: 210, anterior: 175 },
    { label: "Sem 2", actual: 248, anterior: 205 },
    { label: "Sem 3", actual: 285, anterior: 230 },
    { label: "Sem 4", actual: 318, anterior: 264 },
  ],
};

export default function DashboardView() {
  const { orders, escalations, currentTenant, role, filters, setActiveTab, aiAudit } = useDemo();
  const [granularidad, setGranularidad] = useState<"dia" | "semana" | "mes">("semana");
  const [rankingTab, setRankingTab] = useState<"productos" | "clientes" | "vendedores">("productos");
  const [reporteProgramado, setReporteProgramado] = useState(false);

  // Filter orders by tenant, role (RF-01.8), and global filters (RF-00.4)
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.tenantId !== currentTenant.id) return false;
      if (role === "supervisor" && o.sucursal !== currentTenant.sucursalPrincipal) return false;
      if (filters.vendedor !== "todos" && o.vendedor !== filters.vendedor) return false;
      if (filters.canal !== "todos" && o.canal !== filters.canal) return false;
      return true;
    });
  }, [orders, currentTenant, role, filters]);

  const montoVendido = useMemo(
    () => scopedOrders.reduce((acc, o) => acc + o.totalUsd, 0) + (role === "gerente" ? 142500 : 68400),
    [scopedOrders, role]
  );
  const totalPedidosPeriodo = scopedOrders.length + (role === "gerente" ? 136 : 64);
  const ticketPromedio = totalPedidosPeriodo > 0 ? Math.round(montoVendido / totalPedidosPeriodo) : 0;
  const clientesActivos = role === "gerente" ? 84 : 38;

  const escCount = escalations.filter((e) => e.tenantId === currentTenant.id).length;
  const tasaAutonoma = Math.max(72, Math.min(92, 88 - escCount)).toFixed(1);
  const tasaEscalada = (100 - Number(tasaAutonoma)).toFixed(1);

  const avgTokens = useMemo(() => {
    if (!aiAudit.length) return 1450;
    return Math.round(aiAudit.reduce((a, b) => a + b.tokens, 0) / aiAudit.length);
  }, [aiAudit]);
  const avgCost = (avgTokens * 0.000003).toFixed(4);

  const handleExportDashboard = () => {
    exportToCsv(
      `dashboard-resumen-${currentTenant.id}.csv`,
      scopedOrders.map((o) => ({
        Pedido: o.id,
        Cliente: o.clienteNombre,
        Sucursal: o.sucursal,
        Vendedor: o.vendedor,
        Total_USD: o.totalUsd,
        Estado: o.estado,
        SAP_Doc: o.sapDocNumber || "-",
      }))
    );
  };

  return (
    <div className="view-container">
      {/* Top Header & Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <h2 style={{ fontSize: "1.65rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
              Dashboard de Métricas
            </h2>
            <span
              style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "999px",
                backgroundColor: role === "gerente" ? "#ede9fe" : "#e0f2fe",
                color: role === "gerente" ? "#6d28d9" : "#0369a1",
              }}
            >
              {role === "gerente"
                ? "Vista Global (Todas las sucursales)"
                : role === "supervisor"
                ? `Vista Supervisor · ${currentTenant.sucursalPrincipal}`
                : "Vista Operador"}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
            Desempeño comercial del Agente IA y conversión hacia SAP S/4HANA · {currentTenant.nombre}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            className="action-btn-pill"
            onClick={() => setReporteProgramado(true)}
            title="RF-01.9: Reportes programados por correo"
          >
            <CheckIcon size={15} />
            <span>{reporteProgramado ? "Reporte Semanal Activo" : "Programar Reporte (Correo)"}</span>
          </button>
          <button className="action-btn-pill" onClick={handleExportDashboard} title="RF-00.5: Exportar a CSV">
            <ExportIcon size={15} />
            <span>Exportar CSV</span>
          </button>
          <button className="hero-cta-btn" onClick={() => setActiveTab("demo")}>
            <PlayIcon size={15} />
            <span>Abrir Demo Agente ↔ SAP</span>
          </button>
        </div>
      </div>

      {/* RF-01.1: 4 Primary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
        <div className="dark-hero-card" style={{ padding: "22px" }}>
          <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600 }}>Monto Vendido (Período)</span>
          <div style={{ fontSize: "1.95rem", fontWeight: 800, margin: "8px 0 6px", letterSpacing: "-0.03em" }}>
            ${montoVendido.toLocaleString("es-VE")} <span style={{ fontSize: "0.9rem", color: "#9ca3af" }}>{currentTenant.moneda}</span>
          </div>
          <span className="tag-badge-green">
            <TrendingIcon size={13} /> +18.4% vs período anterior
          </span>
        </div>

        <div className="bento-card" style={{ padding: "22px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Pedidos del Período</span>
          <div style={{ fontSize: "1.95rem", fontWeight: 800, margin: "8px 0 6px", color: "var(--text-main)" }}>
            {totalPedidosPeriodo}
          </div>
          <span style={{ fontSize: "0.76rem", color: "#15803d", fontWeight: 700 }}>
            +14.2% · 94% sincronizados en SAP
          </span>
        </div>

        <div className="bento-card" style={{ padding: "22px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Ticket Promedio</span>
          <div style={{ fontSize: "1.95rem", fontWeight: 800, margin: "8px 0 6px", color: "var(--text-main)" }}>
            ${ticketPromedio.toLocaleString("es-VE")}
          </div>
          <span style={{ fontSize: "0.76rem", color: "#005bff", fontWeight: 700 }}>
            +6.1% impulsado por upselling IA
          </span>
        </div>

        <div className="bento-card" style={{ padding: "22px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>Clientes Activos</span>
          <div style={{ fontSize: "1.95rem", fontWeight: 800, margin: "8px 0 6px", color: "var(--text-main)" }}>
            {clientesActivos}
          </div>
          <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontWeight: 600 }}>
            Business Partners activos en SAP
          </span>
        </div>
      </div>

      {/* RF-01.2, RF-01.3, RF-01.7: Autonomous Resolution, Response Times, AI Cost */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        <div className="bento-card" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>Resolución Autónoma vs. Escalada (RF-01.2)</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "10px" }}>
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "#005bff" }}>{tasaAutonoma}%</span>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Autónoma · {tasaEscalada}% Escalada a humano</span>
          </div>
          <div style={{ height: "10px", borderRadius: "999px", backgroundColor: "#fee2e2", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${tasaAutonoma}%`, backgroundColor: "#005bff" }} />
          </div>
        </div>

        <div className="bento-card" style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>Tiempos Promedio (RF-01.3)</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>1ra Respuesta IA</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>3.8 seg</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#f8fafc" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>Cierre de Pedido</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-main)" }}>2m 14s</div>
            </div>
          </div>
        </div>

        <div className="bento-card" style={{ padding: "20px 24px" }}>
          <span style={{ fontSize: "0.84rem", fontWeight: 700 }}>Costo de IA por Interacción (RF-01.7)</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#f0fdf4" }}>
              <div style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 600 }}>Promedio / Conv.</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#15803d" }}>${avgCost}</div>
            </div>
            <div style={{ padding: "10px", borderRadius: "12px", backgroundColor: "#eff6ff" }}>
              <div style={{ fontSize: "0.72rem", color: "#1e40af", fontWeight: 600 }}>Tokens / Pedido</div>
              <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "#005bff" }}>{avgTokens.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Trend Chart (RF-01.4) + Funnel (RF-01.6) */}
      <div className="bento-grid">
        {/* Trend Chart */}
        <div className="bento-card">
          <div className="card-header-row" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 className="card-title">Tendencia de Pedidos vs. Período Anterior (RF-01.4)</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Comparativo de pedidos cerrados por el agente
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "999px" }}>
              {(["dia", "semana", "mes"] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGranularidad(g)}
                  style={{
                    border: "none",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    backgroundColor: granularidad === g ? "#005bff" : "transparent",
                    color: granularidad === g ? "#fff" : "var(--text-muted)",
                    textTransform: "capitalize",
                  }}
                >
                  {g === "dia" ? "Día" : g === "semana" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ width: "100%", height: "250px", marginTop: "10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA[granularidad]}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#005bff" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#005bff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="actual" name="Período Actual" stroke="#005bff" strokeWidth={2.5} fill="url(#colorActual)" />
                <Area type="monotone" dataKey="anterior" name="Período Anterior" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Conversion Funnel (RF-01.6) */}
        <div className="bento-card">
          <div className="card-header-row">
            <h3 className="card-title">Embudo de Conversión → SAP (RF-01.6)</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "8px" }}>
            {[
              { step: "1. Conversaciones WhatsApp iniciadas", count: 420, pct: "100%", color: "#005bff" },
              { step: "2. Intención de compra + ATP verificado", count: 298, pct: "71%", color: "#2563eb" },
              { step: "3. Pedido generado (Agente / Aprobado)", count: 168, pct: "40%", color: "#0d9488" },
              { step: "4. Pedido contabilizado en SAP S/4HANA", count: 158, pct: "37.6% (94% de pedidos)", color: "#16a34a" },
            ].map((item) => (
              <div key={item.step}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "5px" }}>
                  <span>{item.step}</span>
                  <span style={{ fontWeight: 800 }}>
                    {item.count} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>({item.pct})</span>
                  </span>
                </div>
                <div style={{ height: "10px", backgroundColor: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                  <div style={{ width: item.pct.split(" ")[0], height: "100%", backgroundColor: item.color, borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>

          <button
            className="action-btn-pill"
            style={{ marginTop: "18px", width: "100%", justifyContent: "center" }}
            onClick={() => setActiveTab("sap")}
          >
            <span>Ver Monitor de Transacciones SAP</span>
            <ArrowUpRightIcon size={14} />
          </button>
        </div>
      </div>

      {/* RF-01.5: Rankings */}
      <div className="bento-card">
        <div className="card-header-row" style={{ flexWrap: "wrap", gap: "10px" }}>
          <h3 className="card-title">Rankings Comerciales (RF-01.5)</h3>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["productos", "clientes", "vendedores"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setRankingTab(t)}
                className="action-btn-pill"
                style={{
                  backgroundColor: rankingTab === t ? "#111317" : "#fff",
                  color: rankingTab === t ? "#fff" : "var(--text-main)",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginTop: "8px" }}>
          {rankingTab === "productos" &&
            [
              { name: "MAT-ARROZ-01 · Fardo Arroz 24x1kg", metric: "420 fardos", val: "$9,450" },
              { name: "MAT-ACEITE-02 · Caja Aceite 12x1L", metric: "290 cajas", val: "$9,860" },
              { name: "MAT-CAFE-05 · Bulto Café Molido", metric: "185 bultos", val: "$7,400" },
            ].map((r, i) => (
              <div key={r.name} style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#005bff" }}>#{i + 1} TOP PRODUCTO</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", margin: "4px 0" }}>{r.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>{r.metric}</span>
                  <strong style={{ color: "var(--text-main)" }}>{r.val}</strong>
                </div>
              </div>
            ))}

          {rankingTab === "clientes" &&
            [
              { name: "Automercados Plaza's (BP-100234)", metric: "18 pedidos IA", val: "$24,800" },
              { name: "Supermercados La Colina (BP-100512)", metric: "12 pedidos IA", val: "$19,420" },
              { name: "Distribuidora San Martín (BP-100644)", metric: "9 pedidos IA", val: "$11,950" },
            ].map((r, i) => (
              <div key={r.name} style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#0d9488" }}>#{i + 1} TOP CLIENTE</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", margin: "4px 0" }}>{r.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>{r.metric}</span>
                  <strong style={{ color: "var(--text-main)" }}>{r.val}</strong>
                </div>
              </div>
            ))}

          {rankingTab === "vendedores" &&
            [
              { name: "Carlos Mendoza · Ruta Centro", metric: "92% cierre SAP", val: "$32,100" },
              { name: "Ana Rodríguez · Ruta Chacao", metric: "88% cierre SAP", val: "$26,450" },
              { name: "Luis Herrera · Ruta Este", metric: "81% cierre SAP", val: "$15,200" },
            ].map((r, i) => (
              <div key={r.name} style={{ padding: "14px", borderRadius: "14px", backgroundColor: "#f8fafc", border: "1px solid var(--border-subtle)" }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 800, color: "#6d28d9" }}>#{i + 1} TOP RUTA</div>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", margin: "4px 0" }}>{r.name}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <span>{r.metric}</span>
                  <strong style={{ color: "var(--text-main)" }}>{r.val}</strong>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
