import {
  LogoIcon,
  OverviewIcon,
  ChatIcon,
  BoxIcon,
  ServerIcon,
  ShieldIcon,
  SettingsIcon,
  PlayIcon,
  ArrowUpRightIcon,
} from "../icons/Icons";
import { useDemo } from "../../context/DemoContext";
import type { TabId } from "../../types";

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const {
    activeTab,
    setActiveTab,
    tenants,
    currentTenant,
    setTenantId,
    escalations,
    orders,
    agentPausedGlobal,
  } = useDemo();

  const handleNav = (tab: TabId) => {
    setActiveTab(tab);
    onCloseMobile();
  };

  const pendingEscalations = escalations.filter(
    (e) => e.tenantId === currentTenant.id && e.estado !== "resuelto"
  ).length;
  const pendingOrders = orders.filter(
    (o) => o.tenantId === currentTenant.id && (o.estado === "pendiente_revision" || o.estado === "error")
  ).length;

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`app-sidebar ${isOpen ? "open" : ""}`} aria-label="Menú principal">
        <div style={{ overflowY: "auto" }}>
          {/* Brand */}
          <div className="brand-section" style={{ marginBottom: "18px" }}>
            <LogoIcon size={32} />
            <h1 className="brand-title">Smart Sales</h1>
          </div>

          {/* Empresa */}
          <div style={{ marginBottom: "22px", padding: "0 4px" }}>
            <select
              aria-label="Seleccionar empresa"
              value={currentTenant.id}
              onChange={(e) => setTenantId(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "12px",
                border: "1px solid var(--border-card)",
                backgroundColor: "#f8fafc",
                fontSize: "0.84rem",
                fontWeight: 600,
                color: "var(--text-main)",
                cursor: "pointer",
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Menú principal */}
          <div className="nav-group">
            <div className="nav-group-title">Operación</div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <button
                className={`sidebar-nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => handleNav("dashboard")}
              >
                <OverviewIcon size={18} />
                <span style={{ flex: 1 }}>Inicio</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "escalamientos" ? "active" : ""}`}
                onClick={() => handleNav("escalamientos")}
              >
                <ChatIcon size={18} />
                <span style={{ flex: 1 }}>Escalamientos</span>
                {pendingEscalations > 0 && (
                  <span
                    style={{
                      backgroundColor: activeTab === "escalamientos" ? "#ef4444" : "#fee2e2",
                      color: activeTab === "escalamientos" ? "#fff" : "#b91c1c",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {pendingEscalations}
                  </span>
                )}
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "pedidos" ? "active" : ""}`}
                onClick={() => handleNav("pedidos")}
              >
                <BoxIcon size={18} />
                <span style={{ flex: 1 }}>Pedidos</span>
                {pendingOrders > 0 && (
                  <span
                    style={{
                      backgroundColor: activeTab === "pedidos" ? "#f59e0b" : "#fef3c7",
                      color: activeTab === "pedidos" ? "#111" : "#92400e",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                    }}
                  >
                    {pendingOrders}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="nav-group">
            <div className="nav-group-title">Sistema</div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <button
                className={`sidebar-nav-btn ${activeTab === "sap" ? "active" : ""}`}
                onClick={() => handleNav("sap")}
              >
                <ServerIcon size={18} />
                <span style={{ flex: 1 }}>Conexión SAP</span>
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "gobernanza" ? "active" : ""}`}
                onClick={() => handleNav("gobernanza")}
              >
                <ShieldIcon size={18} />
                <span style={{ flex: 1 }}>Control de IA</span>
                {agentPausedGlobal && (
                  <span
                    style={{
                      backgroundColor: "#ef4444",
                      color: "#fff",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    PAUSA
                  </span>
                )}
              </button>

              <button
                className={`sidebar-nav-btn ${activeTab === "configuracion" ? "active" : ""}`}
                onClick={() => handleNav("configuracion")}
              >
                <SettingsIcon size={18} />
                <span style={{ flex: 1 }}>Configuración</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Demo CTA */}
        <div className="sidebar-promo-card">
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <PlayIcon size={14} />
              <span style={{ fontSize: "0.72rem", fontWeight: 700 }}>Simulador en vivo</span>
            </div>
            <h4 className="promo-title">Probar Agente</h4>
            <p className="promo-sub">Simula una compra por WhatsApp y su envío a SAP</p>
            <button className="promo-btn" onClick={() => handleNav("demo")}>
              <span>Abrir Demo</span>
              <ArrowUpRightIcon size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
