import {
  SettingsIcon,
  BellIcon,
  MenuIcon
} from "../icons/Icons";

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  tabs: string[];
  onToggleMobileMenu: () => void;
}

export default function Header({
  currentTab,
  onSelectTab,
  tabs,
  onToggleMobileMenu
}: HeaderProps) {
  return (
    <header className="app-header">
      {/* Mobile Toggle & Tabs Navigation */}
      <div className="header-left">
        <button
          className="icon-btn-round mobile-menu-btn"
          onClick={onToggleMobileMenu}
          title="Menú"
        >
          <MenuIcon size={20} />
        </button>

        {/* Navigation Pills */}
        <nav className="nav-tabs-pill">
          {tabs.map((tab) => {
            const isActive = currentTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`nav-tab-btn ${isActive ? "active" : ""}`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right Controls: Settings, Bell, User Profile */}
      <div className="header-actions">
        <button className="icon-btn-round" title="Configuración">
          <SettingsIcon size={18} />
        </button>

        <button className="icon-btn-round" title="Notificaciones" style={{ position: "relative" }}>
          <BellIcon size={18} />
          {/* Subtle notification dot */}
          <span
            style={{
              position: "absolute",
              top: "9px",
              right: "9px",
              width: "6px",
              height: "6px",
              backgroundColor: "#ef4444",
              borderRadius: "50%"
            }}
          />
        </button>

        {/* User Profile Pill */}
        <div className="user-profile-pill">
          <div className="user-avatar">
            MD
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#111317" }}>
              Maretta Daniel
            </span>
            <span style={{ fontSize: "0.74rem", color: "#7e8b9b" }}>
              danielmaretta@mail.com
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
