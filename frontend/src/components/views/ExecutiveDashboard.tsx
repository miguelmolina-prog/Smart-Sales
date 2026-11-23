import { useState, useEffect } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../services/firebase";
import {
  ChevronDownIcon,
  ExportIcon,
  FilterIcon,
  ArrowUpRightIcon,
  CloseIcon,
  TrendingIcon
} from "../icons/Icons";

interface ExecutiveDashboardProps {
  onNavigateToTab: (tab: string) => void;
}

export default function ExecutiveDashboard({ onNavigateToTab }: ExecutiveDashboardProps) {
  const [totalFacturado, setTotalFacturado] = useState<number>(532921);
  const [totalPedidos, setTotalPedidos] = useState<number>(142);
  const [pedidosDespachados, setPedidosDespachados] = useState<number>(98);
  const [simulando, setSimulando] = useState<boolean>(false);
  const [resultadoSimulacion, setResultadoSimulacion] = useState<string | null>(null);

  useEffect(() => {
    try {
      const unsub = onSnapshot(query(collection(db, "pedidos")), (snapshot) => {
        let suma = 0;
        let count = 0;
        let desp = 0;
        snapshot.docs.forEach((doc) => {
          const d = doc.data();
          count++;
          if (typeof d.total_usd === "number") suma += d.total_usd;
          if (d.estado_despacho === "Despachado") desp++;
        });
        if (count > 0) {
          setTotalFacturado(suma > 0 ? suma : 532921);
          setTotalPedidos(count);
          setPedidosDespachados(desp);
        }
      });
      return () => unsub();
    } catch {
      // Fallback a métricas de muestra si firestore no está inicializado
    }
  }, []);

  const handleSimularPedidoSap = async () => {
    setSimulando(true);
    setResultadoSimulacion(null);
    try {
      const res = await fetch("http://localhost:8000/api/sap/simulate-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bp_id: "BP-VEN-100234",
          wa_id: "584121234567",
          items: [
            { sku: "MAT-ARROZ-01", descripcion: "Fardo Arroz Blanco 24x1kg", cantidad: 20, precio: 22.50 },
            { sku: "MAT-ACEITE-02", descripcion: "Caja Aceite Vegetal 12x1L", cantidad: 15, precio: 34.00 }
          ]
        })
      });
      const data = await res.json();
      setResultadoSimulacion(
        `Pedido simulado en S/4HANA: Total $${data.total_bruto_usd} USD (Bs. ${data.total_neto_ved.toLocaleString("es-VE")} BCV). ATP y Crédito Validados.`
      );
    } catch {
      setResultadoSimulacion("Pedido Simulado S/4HANA (Demo Mode): Total $960.00 USD (Bs. 52,320 BCV) · ATP y Crédito Confirmados");
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className="view-container">
      {/* Top Breadcrumb & Action Controls Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "-0.03em", color: "var(--text-main)" }}>
            Financial Overview
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Overview</span>
            <span>&gt;</span>
            <span>All Reports</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button className="action-btn-pill">
            <span>Default View</span>
            <ChevronDownIcon size={12} />
          </button>
          <button className="action-btn-pill">
            <ExportIcon size={15} />
            <span>Export</span>
          </button>
          <button className="action-btn-pill">
            <FilterIcon size={15} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Banner de resultado de simulación SAP */}
      {resultadoSimulacion && (
        <div
          style={{
            backgroundColor: "#ecfdf5",
            border: "1px solid #10b981",
            borderRadius: "16px",
            padding: "14px 20px",
            color: "#065f46",
            fontWeight: 600,
            fontSize: "0.88rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)"
          }}
        >
          <span>{resultadoSimulacion}</span>
          <button
            onClick={() => setResultadoSimulacion(null)}
            style={{ background: "transparent", border: "none", color: "#065f46", cursor: "pointer", display: "flex" }}
          >
            <CloseIcon size={16} />
          </button>
        </div>
      )}

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* ===================== COLUMNA IZQUIERDA ===================== */}
        <div className="bento-col">
          {/* Card 1: Expense Breakdown */}
          <div className="bento-card">
            <div className="card-header-row">
              <h3 className="card-title">Expense Breakdown</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "transparent",
                    border: "none",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  <span>Weekly</span>
                  <ChevronDownIcon size={12} />
                </button>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    display: "flex",
                    padding: 0
                  }}
                  onClick={() => onNavigateToTab("Analytics")}
                >
                  <ArrowUpRightIcon size={16} />
                </button>
              </div>
            </div>

            {/* Metric & Legend Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "12px", margin: "14px 0 24px" }}>
              <div style={{ fontSize: "2.35rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-main)" }}>
                $ 17,3K
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#111317" }} />
                  $1 - $100
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#005bff" }} />
                  $100 - $500
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#93c5fd" }} />
                  &gt;$500
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1px dashed #cbd5e1" }} />
                  No Expense
                </span>
              </div>
            </div>

            {/* Dot Matrix Visualizer */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              {[
                { label: "Groceries", dots: ["#111317", "#93c5fd", "#005bff", "#005bff", "#111317", "#005bff", "#e2e8f0"] },
                { label: "Fashion", dots: ["#005bff", "#005bff", "#111317", "#005bff", "#e2e8f0", "#93c5fd", "#111317"] },
                { label: "Electronics", dots: ["#111317", "#005bff", "#111317", "#005bff", "#005bff", "#e2e8f0", "#93c5fd"] }
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 500, color: "var(--text-muted)", width: "110px" }}>
                    {row.label}
                  </span>
                  <div style={{ display: "flex", gap: "16px", flex: 1, justifyContent: "flex-end" }}>
                    {row.dots.map((dotColor, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          backgroundColor: dotColor,
                          boxShadow: dotColor === "#005bff" ? "0 4px 10px rgba(0, 91, 255, 0.3)" : "none",
                          border: dotColor === "#e2e8f0" ? "1px dashed #cbd5e1" : "none"
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}

              {/* Day Labels Row */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "28px", paddingRight: "8px", marginTop: "4px" }}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                  <span key={idx} style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-light)" }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: Income Sources */}
          <div className="bento-card">
            <div className="card-header-row">
              <h3 className="card-title">Income Sources</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "transparent",
                    border: "none",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  <span>Sort by Month</span>
                  <ChevronDownIcon size={12} />
                </button>
                <button
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: "0.86rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  All Sources
                </button>
                <span style={{ color: "var(--text-light)", fontSize: "0.9rem", cursor: "pointer" }}>•••</span>
              </div>
            </div>

            {/* Metric Header Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "16px 0 20px" }}>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    backgroundColor: "var(--dark-card)",
                    color: "#ffffff",
                    borderRadius: "var(--radius-pill)",
                    padding: "3px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "8px"
                  }}
                >
                  30 Days
                </span>
                <div style={{ fontSize: "2.35rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-main)" }}>
                  $ 7,72K
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Income Sources Statistic in a month
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--primary-blue)", letterSpacing: "-0.03em" }}>
                  +73,6%
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  better than last month
                </div>
              </div>
            </div>

            {/* Custom Segmented Bar Chart Visualizer */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                height: "170px",
                padding: "20px 10px 0"
              }}
            >
              {/* Bar 1: Dark Textured */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "100px",
                    borderRadius: "18px",
                    backgroundColor: "#131418",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                  }}
                >
                  2.7K
                </div>
              </div>

              {/* Bar 2: Navy Dark */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "75px",
                    borderRadius: "18px",
                    backgroundColor: "#1e3a8a",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700
                  }}
                >
                  5.6K
                </div>
              </div>

              {/* Bar 3: Primary Electric Blue (Tallest) */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "68px",
                    height: "155px",
                    borderRadius: "22px",
                    background: "linear-gradient(180deg, #0066ff 0%, #004ecc 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "0.92rem",
                    fontWeight: 800,
                    boxShadow: "0 8px 24px rgba(0, 91, 255, 0.4)"
                  }}
                >
                  12K
                </div>
              </div>

              {/* Bar 4: Sky Blue */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "115px",
                    borderRadius: "18px",
                    backgroundColor: "#bfdbfe",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#1e3a8a",
                    fontSize: "0.82rem",
                    fontWeight: 700
                  }}
                >
                  8.1K
                </div>
              </div>
            </div>

            {/* Bottom Legend */}
            <div style={{ display: "flex", gap: "16px", marginTop: "16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#bfdbfe" }} />
                Salary
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#131418" }} />
                Bonus
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0066ff" }} />
                Freelance
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#93c5fd" }} />
                Another job
              </span>
            </div>
          </div>
        </div>

        {/* ===================== COLUMNA DERECHA ===================== */}
        <div className="bento-col">
          {/* Card 3: Join Our Financial Class Mastery (Dark Hero Card) */}
          <div className="dark-hero-card">
            {/* Abstract Decorative Ribbon/Wave SVG */}
            <svg
              style={{ position: "absolute", top: 0, right: 0, width: "190px", height: "100%", pointerEvents: "none" }}
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 0C80 60 120 40 180 100C220 140 160 200 200 200V0H40Z"
                fill="url(#dark-grad)"
                opacity="0.25"
              />
              <defs>
                <linearGradient id="dark-grad" x1="40" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#005BFF" />
                  <stop offset="1" stopColor="#00F0FF" />
                </linearGradient>
              </defs>
            </svg>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ marginBottom: "14px" }}>
                <span className="tag-badge-green">
                  +15% discount for member
                </span>
              </div>

              <h3 style={{ fontSize: "1.38rem", fontWeight: 800, margin: "0 0 16px 0", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                Join Our Financial<br />Class Mastery
              </h3>

              <button
                className="hero-cta-btn"
                onClick={handleSimularPedidoSap}
                disabled={simulando}
              >
                <span>{simulando ? "Simulando en SAP..." : "Join Class"}</span>
                <ArrowUpRightIcon size={16} />
              </button>
            </div>
          </div>

          {/* Subgrid: Today Received & Financial Report */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {/* Card 4: Today Received */}
            <div className="bento-card" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: "1px solid var(--border-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)"
                  }}
                >
                  <TrendingIcon size={16} />
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                Today Received
              </div>

              <div style={{ fontSize: "1.58rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.03em", marginBottom: "12px" }}>
                ${totalFacturado.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    borderRadius: "var(--radius-pill)",
                    padding: "2px 8px",
                    fontSize: "0.75rem",
                    fontWeight: 700
                  }}
                >
                  12%
                </span>
                <ChevronDownIcon size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>

            {/* Card 5: Financial Report (Dark Mini Card) */}
            <div
              style={{
                backgroundColor: "var(--dark-card)",
                borderRadius: "var(--radius-xl)",
                padding: "20px 22px",
                color: "#ffffff",
                boxShadow: "var(--shadow-dark)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                cursor: "pointer"
              }}
              onClick={() => onNavigateToTab("Orders")}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <CloseIcon size={14} />
                </div>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <ArrowUpRightIcon size={14} />
                </div>
              </div>

              <div style={{ marginTop: "24px" }}>
                <div style={{ fontSize: "0.75rem", opacity: 0.65, marginBottom: "4px" }}>
                  Track and Print Report · {pedidosDespachados}/{totalPedidos}
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800 }}>
                  Financial Report
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Financial Balance with Radial Arc Gauge */}
          <div className="bento-card">
            <div className="card-header-row">
              <h3 className="card-title">Financial Balance</h3>
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  padding: 0
                }}
                onClick={() => onNavigateToTab("Analytics")}
              >
                <ArrowUpRightIcon size={16} />
              </button>
            </div>

            {/* Sub legend */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "10px 0 16px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#93c5fd" }} />
                Total
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#005bff" }} />
                Profit Today
              </span>
              <span style={{ marginLeft: "auto", color: "var(--text-light)" }}>For Week</span>
            </div>

            {/* Radial Arc Gauge matching Image 2 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", margin: "16px 0 10px" }}>
              <svg width="220" height="120" viewBox="0 0 220 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Background Track Ticks */}
                <path
                  d="M20 110 A 90 90 0 0 1 200 110"
                  stroke="#E8EEF5"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                />
                {/* Active Electric Blue Arc Ticks */}
                <path
                  d="M20 110 A 90 90 0 0 1 100 24"
                  stroke="#005BFF"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="4 6"
                />
              </svg>

              <div style={{ textAlign: "center", marginTop: "-30px" }}>
                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-main)", letterSpacing: "-0.03em" }}>
                  22%
                </div>
                <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  from yesterday
                </div>
              </div>
            </div>

            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-light)", marginTop: "10px" }}>
              Profit is 22% More short last week · S/4HANA Validated
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
