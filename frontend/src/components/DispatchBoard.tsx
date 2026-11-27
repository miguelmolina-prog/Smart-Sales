import { useState } from "react";
import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";
import DashboardView from "./views/DashboardView";
import EscalationsView from "./views/EscalationsView";
import OrdersView from "./views/OrdersView";
import SapConnectionView from "./views/SapConnectionView";
import GovernanceView from "./views/GovernanceView";
import SettingsView from "./views/SettingsView";
import AgentSapDemoView from "./views/AgentSapDemoView";
import LoginView from "./views/LoginView";
import { DemoProvider, useDemo } from "../context/DemoContext";

function DispatchBoardContent() {
  const { isAuthenticated, login, activeTab } = useDemo();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  if (!isAuthenticated) {
    return <LoginView onLogin={login} />;
  }

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.scrollTop !== undefined) {
      setIsScrolled(target.scrollTop > 4);
    }
  };

  return (
    <div className={`app-shell ${isScrolled ? "is-scrolled" : ""}`}>
      <Sidebar isOpen={mobileMenuOpen} onCloseMobile={() => setMobileMenuOpen(false)} />

      <div className="app-main-area">
        <Header onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

        <main className="content-canvas" onScrollCapture={handleScroll}>
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "escalamientos" && <EscalationsView />}
          {activeTab === "pedidos" && <OrdersView />}
          {activeTab === "sap" && <SapConnectionView />}
          {activeTab === "gobernanza" && <GovernanceView />}
          {activeTab === "configuracion" && <SettingsView />}
          {activeTab === "demo" && <AgentSapDemoView />}
        </main>
      </div>
    </div>
  );
}

export default function DispatchBoard() {
  return (
    <DemoProvider>
      <DispatchBoardContent />
    </DemoProvider>
  );
}
