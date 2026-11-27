import { useState } from "react";
import loginBg from "../../assets/login-bg.jpg";
import { LogoIcon } from "../icons/Icons";
import type { UserRole } from "../../types";

interface LoginViewProps {
  onLogin: (selectedRole: UserRole) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("isabella.pereira@abside.com");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);

  const handleEnter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin("gerente"), 250);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Scrim suave para contraste legible */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background:
            "linear-gradient(115deg, rgba(4, 12, 42, 0.72) 0%, rgba(4, 14, 48, 0.35) 50%, rgba(4, 12, 42, 0.72) 100%)",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "920px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "48px",
          alignItems: "center",
        }}
      >
        {/* Marca limpia */}
        <div style={{ color: "#ffffff" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                backgroundColor: "#f4ebd9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogoIcon size={26} />
            </div>
            <span style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Smart Sales
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.9rem, 3.2vw, 2.5rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.03em",
              margin: "0 0 12px 0",
              textShadow: "0 4px 20px rgba(0, 8, 32, 0.6)",
            }}
          >
            Tu agente de ventas, conectado a SAP.
          </h1>
          <p style={{ margin: 0, fontSize: "0.98rem", color: "#e2e8f0", maxWidth: "380px", lineHeight: 1.5 }}>
            Gestiona pedidos, conversaciones y aprobaciones en un solo lugar.
          </p>
        </div>

        {/* Tarjeta minimalista */}
        <div
          style={{
            backgroundColor: "rgba(7, 15, 42, 0.86)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(244, 235, 217, 0.22)",
            borderRadius: "24px",
            padding: "32px",
            boxShadow: "0 24px 60px rgba(0, 6, 24, 0.55)",
            color: "#ffffff",
          }}
        >
          <h2 style={{ margin: "0 0 6px 0", fontSize: "1.4rem", fontWeight: 800 }}>Bienvenido</h2>
          <p style={{ margin: "0 0 22px 0", fontSize: "0.86rem", color: "#cbd5e1" }}>
            Ingresa a tu cuenta para continuar
          </p>

          <form onSubmit={handleEnter} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label htmlFor="login-email" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <label htmlFor="login-password" style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#e2e8f0", marginBottom: "6px" }}>
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255, 255, 255, 0.22)",
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "6px",
                width: "100%",
                padding: "12px",
                borderRadius: "9999px",
                border: "none",
                backgroundColor: "#f4ebd9",
                color: "#071133",
                fontSize: "0.94rem",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {loading ? "Entrando..." : "Ingresar"}
            </button>
          </form>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "18px 0", color: "#94a3b8", fontSize: "0.75rem" }}>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.16)" }} />
            <span>o ingresa con</span>
            <div style={{ flex: 1, height: "1px", backgroundColor: "rgba(255,255,255,0.16)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <button
              type="button"
              onClick={() => handleEnter()}
              style={{
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Google
            </button>
            <button
              type="button"
              onClick={() => handleEnter()}
              style={{
                padding: "10px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Microsoft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
