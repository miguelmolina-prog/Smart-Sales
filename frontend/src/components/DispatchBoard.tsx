import { useState } from "react";
import OrdersView from "./views/OrdersView";
import ChatsView from "./views/ChatsView";
import AnalyticsView from "./views/AnalyticsView";
import PersistenceBanner from "./views/PersistenceBanner.tsx"; // <-- Asegúrate de ajustar la ruta si lo guardaste en otra carpeta

const PESTANAS = ["Chats", "Pedidos", "Analíticas"];

export default function DispatchBoard() {
  const [vistaPrincipal, setVistaPrincipal] = useState<string>("Chats");

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100vh", 
      width: "100vw", 
      margin: 0, 
      backgroundColor: "#f0f2f5", /* Gris claro relajante para la vista */
      fontFamily: "system-ui, sans-serif", 
      overflow: "hidden" 
    }}>
      
      {/* BANNER SUPERIOR - Gris Tiza / Anti-Reflejo */}
      <header style={{ 
        height: "75px", /* Un poco más alto para respirar */
        backgroundColor: "#f8f9fa", /* Blanco roto / tiza, no satura */
        borderBottom: "1px solid #d1d5db", 
        display: "flex", 
        alignItems: "center", 
        padding: "0 2rem", 
        justifyContent: "space-between",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        flexShrink: 0
      }}>
        
        {/* Identidad de Marca Ampliada */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            backgroundColor: "#FF6B00", 
            color: "#fff", 
            fontWeight: 900, 
            fontSize: "1.4rem", /* Letra M más grande */
            width: "45px", 
            height: "45px", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            borderRadius: "0.5rem",
            boxShadow: "0 2px 4px rgba(255,107,0,0.3)"
          }}>
            M
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, margin: 0, color: "#000000" }}>
            MegaStore <span style={{ color: "#0055FF", fontWeight: 500 }}>Panel</span>
          </h1>
        </div>
        
        {/* Navegación de Pestañas con Texto Más Grande */}
        <nav style={{ display: "flex", gap: "0.5rem", height: "100%" }}>
          {PESTANAS.map(pestana => (
            <button
              key={pestana}
              onClick={() => setVistaPrincipal(pestana)}
              style={{
                background: "transparent",
                color: vistaPrincipal === pestana ? "#FF6B00" : "#4b5563",
                border: "none",
                borderBottom: vistaPrincipal === pestana ? "4px solid #FF6B00" : "4px solid transparent",
                padding: "0 1.5rem",
                height: "100%",
                fontSize: "1.1rem", /* Texto notablemente más grande */
                fontWeight: vistaPrincipal === pestana ? 800 : 600, /* Mayor peso en la fuente */
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              {pestana === "Chats" && "💬"}
              {pestana === "Pedidos" && "📦"}
              {pestana === "Analíticas" && "📊"}
              {pestana}
            </button>
          ))}
        </nav>
      </header>

      {/* MÓDULO DE PERSISTENCIA GLOBAL (Aparece solo si hay inactivos) */}
      <PersistenceBanner />

      {/* Renderizado Condicional de Módulos */}
      <main style={{ flex: 1, overflow: "hidden", display: "flex" }}>
        {vistaPrincipal === "Chats" && <ChatsView />}
        {vistaPrincipal === "Pedidos" && <OrdersView />}
        {vistaPrincipal === "Analíticas" && <AnalyticsView />}
      </main>
    </div>
  );
}