import { useState, useMemo } from "react";
import {
  BellIcon,
  MenuIcon,
  SearchIcon,
  PlayIcon,
  CloseIcon,
} from "../icons/Icons";
import { useDemo } from "../../context/DemoContext";
import type { TabId, UserRole } from "../../types";

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

const TAB_LABELS: { id: TabId; label: string }[] = [
  { id: "dashboard", label: "Inicio" },
  { id: "escalamientos", label: "Escalamientos" },
  { id: "pedidos", label: "Pedidos" },
  { id: "sap", label: "SAP" },
  { id: "demo", label: "Probar Agente" },
];

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const {
    activeTab,
    setActiveTab,
    globalSearch,
    setGlobalSearch,
    orders,
    escalations,
    currentTenant,
    notifications,
    unreadCount,
    markAllNotificationsRead,
    markNotificationRead,
    role,
    setRole,
    agentPausedGlobal,
    logout,
  } = useDemo();

  const [showNotif, setShowNotif] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return [];
    const matchedOrders = orders
      .filter(
        (o) =>
          o.tenantId === currentTenant.id &&
          (o.id.toLowerCase().includes(q) ||
            o.clienteNombre.toLowerCase().includes(q) ||
            (o.sapDocNumber && o.sapDocNumber.includes(q)))
      )
      .slice(0, 3)
      .map((o) => ({
        type: "Pedido",
        id: o.id,
        title: `${o.id} · ${o.clienteNombre}`,
        sub: `$${o.totalUsd.toLocaleString()}`,
        tab: "pedidos" as TabId,
      }));

    const matchedEsc = escalations
      .filter(
        (e) =>
          e.tenantId === currentTenant.id &&
          (e.id.toLowerCase().includes(q) || e.clienteNombre.toLowerCase().includes(q))
      )
      .slice(0, 3)
      .map((e) => ({
        type: "Chat",
        id: e.id,
        title: `${e.id} · ${e.clienteNombre}`,
        sub: e.intencionDetectada,
        tab: "escalamientos" as TabId,
      }));

    return [...matchedOrders, ...matchedEsc];
  }, [globalSearch, orders, escalations, currentTenant.id]);

  return (
    <header className="app-header">
      <div className="header-left" style={{ minWidth: 0, flex: 1 }}>
        <button
          className="icon-btn-round mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Menú"
          aria-label="Abrir menú"
        >
          <MenuIcon size={20} />
        </button>

        <nav className="nav-tabs-pill" aria-label="Navegación rápida">
          {TAB_LABELS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`nav-tab-btn ${isActive ? "active" : ""}`}
                style={
                  tab.id === "demo" && !isActive
                    ? { color: "#005bff", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }
                    : tab.id === "demo"
                    ? { display: "inline-flex", alignItems: "center", gap: "5px" }
                    : undefined
                }
              >
                {tab.id === "demo" && <PlayIcon size={13} />}
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Buscador */}
        <div style={{ position: "relative", flex: "0 1 240px", marginLeft: "6px" }} className="global-search-wrap">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border-card)",
              borderRadius: "9999px",
              padding: "7px 12px",
            }}
          >
            <SearchIcon size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              type="text"
              value={globalSearch}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setGlobalSearch(e.target.value);
                setShowSearchDropdown(true);
              }}
              placeholder="Buscar pedido o cliente..."
              aria-label="Buscar"
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "0.82rem",
                width: "100%",
                color: "var(--text-main)",
              }}
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch("")}
                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, color: "var(--text-muted)" }}
                aria-label="Limpiar"
              >
                <CloseIcon size={13} />
              </button>
            )}
          </div>

          {showSearchDropdown && searchResults.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                left: 0,
                right: 0,
                minWidth: "280px",
                backgroundColor: "#fff",
                borderRadius: "16px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.14)",
                border: "1px solid var(--border-card)",
                padding: "8px",
                zIndex: 60,
              }}
            >
              {searchResults.map((res) => (
                <button
                  key={res.id}
                  onClick={() => {
                    setActiveTab(res.tab);
                    setShowSearchDropdown(false);
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    border: "none",
                    background: "transparent",
                    padding: "8px 10px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 700 }}>
                    <span>{res.title}</span>
                    <span style={{ fontSize: "0.7rem", color: "#005bff" }}>{res.type}</span>
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{res.sub}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Controles derecha */}
      <div className="header-actions">
        {agentPausedGlobal && (
          <button
            onClick={() => setActiveTab("gobernanza")}
            style={{
              padding: "6px 12px",
              borderRadius: "9999px",
              border: "1px solid #fecaca",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Agente Pausado
          </button>
        )}

        {/* Notificaciones */}
        <div style={{ position: "relative" }}>
          <button
            className="icon-btn-round"
            title="Alertas"
            onClick={() => setShowNotif((prev) => !prev)}
            style={{ position: "relative" }}
            aria-label="Alertas"
          >
            <BellIcon size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  minWidth: "15px",
                  height: "15px",
                  padding: "0 4px",
                  backgroundColor: "#ef4444",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  borderRadius: "999px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              style={{
                position: "absolute",
                top: "115%",
                right: 0,
                width: "320px",
                backgroundColor: "#fff",
                borderRadius: "18px",
                boxShadow: "0 16px 40px rgba(15, 23, 42, 0.16)",
                border: "1px solid var(--border-card)",
                padding: "14px",
                zIndex: 60,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <strong style={{ fontSize: "0.9rem" }}>Alertas</strong>
                <button
                  onClick={markAllNotificationsRead}
                  style={{ border: "none", background: "none", color: "#005bff", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Marcar leídas
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "280px", overflowY: "auto" }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.targetTab) setActiveTab(n.targetTab);
                      setShowNotif(false);
                    }}
                    style={{
                      padding: "10px",
                      borderRadius: "12px",
                      backgroundColor: n.leida ? "#f8fafc" : "#eff6ff",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{n.titulo}</div>
                    <p style={{ margin: "3px 0 0", fontSize: "0.74rem", color: "var(--text-muted)" }}>{n.detalle}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Usuario */}
        <div className="user-profile-pill">
          <div className="user-avatar">MD</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111317" }}>Maretta Daniel</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              aria-label="Rol"
              style={{
                border: "none",
                background: "transparent",
                fontSize: "0.72rem",
                color: "#005bff",
                fontWeight: 700,
                padding: 0,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <option value="gerente">Gerente</option>
              <option value="supervisor">Supervisor</option>
              <option value="operador">Operador</option>
            </select>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            style={{
              border: "none",
              backgroundColor: "#f1f5f9",
              color: "#475569",
              borderRadius: "999px",
              padding: "4px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              cursor: "pointer",
              marginLeft: "4px",
            }}
          >
            Salir
          </button>
        </div>
      </div>
    </header>
  );
}
