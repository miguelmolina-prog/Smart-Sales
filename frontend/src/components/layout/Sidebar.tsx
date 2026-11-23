import {
  LogoIcon,
  OverviewIcon,
  DocumentIcon,
  TrendingIcon,
  UserIcon,
  ChatIcon,
  BoxIcon,
  BarChartIcon,
  ChevronDownIcon,
  ArrowUpRightIcon,
  PlusIcon
} from "../icons/Icons";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ currentTab, onSelectTab, isOpen, onCloseMobile }: SidebarProps) {
  const handleNav = (tab: string) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`app-sidebar ${isOpen ? "open" : ""}`}>
        <div>
          {/* Brand Row */}
          <div className="brand-section">
            <LogoIcon size={34} />
            <h1 className="brand-title">Smartsells</h1>
          </div>

          {/* Welcome User Block (Directly in Sidebar as seen in Image 2) */}
          <div className="welcome-block">
            <h2 className="welcome-heading">Welcome<br />Back, Daniel!</h2>
            <p className="welcome-sub">Current summary financial report</p>
          </div>

          {/* Group 1: HOME */}
          <div className="nav-group">
            <div className="nav-group-title">HOME</div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <button
                className={`sidebar-nav-btn ${currentTab === "Dashboard" ? "active" : ""}`}
                onClick={() => handleNav("Dashboard")}
              >
                <OverviewIcon size={18} />
                <span style={{ flex: 1 }}>Overview</span>
                {currentTab === "Dashboard" && <ChevronDownIcon size={14} />}
              </button>

              <button
                className={`sidebar-nav-btn ${currentTab === "SAP S/4HANA" ? "active" : ""}`}
                onClick={() => handleNav("SAP S/4HANA")}
              >
                <DocumentIcon size={18} />
                <span style={{ flex: 1 }}>Legality Statement</span>
              </button>

              <button
                className={`sidebar-nav-btn ${currentTab === "Analytics" ? "active" : ""}`}
                onClick={() => handleNav("Analytics")}
              >
                <TrendingIcon size={18} />
                <span style={{ flex: 1 }}>Financial Projection</span>
              </button>

              <button
                className="sidebar-nav-btn"
                onClick={() => handleNav("SAP S/4HANA")}
              >
                <UserIcon size={18} />
                <span style={{ flex: 1 }}>Account</span>
              </button>
            </nav>
          </div>

          {/* Group 2: POCKET / OPERATIONS */}
          <div className="nav-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "8px", marginBottom: "8px" }}>
              <div className="nav-group-title" style={{ margin: 0 }}>POCKET</div>
              <button
                style={{
                  border: "none",
                  backgroundColor: "#edf4ff",
                  color: "#005bff",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
                title="Nuevo canal"
              >
                <PlusIcon size={13} />
              </button>
            </div>
            <nav style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <button
                className={`sidebar-nav-btn ${currentTab === "Chats" ? "active" : ""}`}
                onClick={() => handleNav("Chats")}
              >
                <ChatIcon size={18} />
                <span style={{ flex: 1 }}>WhatsApp Chats</span>
              </button>

              <button
                className={`sidebar-nav-btn ${currentTab === "Orders" ? "active" : ""}`}
                onClick={() => handleNav("Orders")}
              >
                <BoxIcon size={18} />
                <span style={{ flex: 1 }}>Orders Dispatch</span>
              </button>

              <button
                className={`sidebar-nav-btn ${currentTab === "Analytics" ? "active" : ""}`}
                onClick={() => handleNav("Analytics")}
              >
                <BarChartIcon size={18} />
                <span style={{ flex: 1 }}>Analytics</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Status Card (Matching Image 2 Promo Card) */}
        <div className="sidebar-promo-card">
          <div style={{ position: "relative", zIndex: 2 }}>
            <h4 className="promo-title">Unlock full version</h4>
            <p className="promo-sub">20+ SAP & WhatsApp metrics</p>
            <button
              className="promo-btn"
              onClick={() => handleNav("SAP S/4HANA")}
            >
              <span>14 day free-trial</span>
              <ArrowUpRightIcon size={14} />
            </button>
          </div>
          {/* Subtle light bubble background effect */}
          <div
            style={{
              position: "absolute",
              right: "-20px",
              bottom: "-20px",
              width: "110px",
              height: "110px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
              zIndex: 1
            }}
          />
        </div>
      </aside>
    </>
  );
}
