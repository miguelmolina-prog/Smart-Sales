import { useState } from "react";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import ExecutiveDashboard from "./views/ExecutiveDashboard";
import OrdersView from "./views/OrdersView";
import ChatsView from "./views/ChatsView";
import AnalyticsView from "./views/AnalyticsView";
import SapS4HanaView from "./views/SapS4HanaView";
import PersistenceBanner from "./views/PersistenceBanner";

const TABS = ["Dashboard", "Analytics", "Orders", "Chats", "SAP S/4HANA"];

export default function DispatchBoard() {
  const [vistaPrincipal, setVistaPrincipal] = useState<string>("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <div className="app-shell">
      {/* 1. Left Sidebar (Fixed on Desktop, Off-Canvas Drawer on Mobile) */}
      <Sidebar
        currentTab={vistaPrincipal}
        onSelectTab={setVistaPrincipal}
        isOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* 2. Main Area (Header + Scrollable View Container) */}
      <div className="app-main-area">
        <Header
          currentTab={vistaPrincipal}
          onSelectTab={setVistaPrincipal}
          tabs={TABS}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        {/* Global Persistence Notification Bar */}
        <PersistenceBanner />

        {/* Content Views */}
        <main className="content-canvas">
          {vistaPrincipal === "Dashboard" && (
            <ExecutiveDashboard onNavigateToTab={setVistaPrincipal} />
          )}
          {vistaPrincipal === "Analytics" && <AnalyticsView />}
          {vistaPrincipal === "Orders" && <OrdersView />}
          {vistaPrincipal === "Chats" && <ChatsView />}
          {vistaPrincipal === "SAP S/4HANA" && <SapS4HanaView />}
        </main>
      </div>
    </div>
  );
}
