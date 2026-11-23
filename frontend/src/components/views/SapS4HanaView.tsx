import { useState, useEffect } from "react";
import type { SapStatusResponse } from "../../types";
import { ZapIcon, DocumentIcon, BoxIcon, TrendingIcon } from "../icons/Icons";

export default function SapS4HanaView() {
  const [statusData, setStatusData] = useState<SapStatusResponse | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [simulacionPayload, setSimulacionPayload] = useState({
    bp_id: "BP-VEN-100234",
    wa_id: "584121234567",
    sku: "MAT-ARROZ-01",
    cantidad: 25,
    precio: 21.00
  });
  const [resultadoSim, setResultadoSim] = useState<any | null>(null);
  const [ejecutando, setEjecutando] = useState<boolean>(false);

  useEffect(() => {
    fetch("http://localhost:8000/api/sap/status")
      .then((res) => res.json())
      .then((data) => {
        setStatusData(data);
        setCargando(false);
      })
      .catch(() => {
        setStatusData({
          status: "ONLINE",
          mode: "DEMO_SIMULATION",
          components: {
            channel_adapter: {
              name: "Google Cloud · Gemini Multimodal",
              status: "CONNECTED",
              features: ["WhatsApp Ingestion", "Whisper STT", "Vision OCR"]
            },
            sap_btp: {
              joule_orchestrator: "ACTIVE",
              generative_ai_hub: "ONLINE",
              destination_service: "CONFIGURED",
              cloud_connector_tunnel: "ESTABLISHED"
            },
            sap_s4hana: {
              system_id: "S4H_CARACAS_PRD",
              client: "100",
              odata_services: ["API_SALES_ORDER_SRV", "API_BUSINESS_PARTNER", "API_CREDITMANAGEMENT_SRV"],
              stock_atp_check: "AVAILABLE"
            },
            bigquery: {
              recommendation_engine: "READY",
              model_version: "v1.4-retail-ve"
            }
          },
          governance: {
            leanix_agent_card: "smartsells-joule-b2b-ve",
            cloud_alm_tracing: "ENABLED",
            risk_class: "LIMITED_RISK"
          }
        });
        setCargando(false);
      });
  }, []);

  const handleEjecutarSimulacion = async () => {
    setEjecutando(true);
    setResultadoSim(null);
    try {
      const res = await fetch("http://localhost:8000/api/sap/simulate-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bp_id: simulacionPayload.bp_id,
          wa_id: simulacionPayload.wa_id,
          items: [
            {
              sku: simulacionPayload.sku,
              descripcion: "Producto B2B para Empresa Venezolana",
              cantidad: simulacionPayload.cantidad,
              precio: simulacionPayload.precio
            }
          ]
        })
      });
      const data = await res.json();
      setResultadoSim(data);
    } catch (e: any) {
      setResultadoSim({
        error: "No se pudo conectar con el endpoint backend. Verifique que uvicorn esté corriendo.",
        detalle: String(e)
      });
    } finally {
      setEjecutando(false);
    }
  };

  return (
    <div className="view-container">
      {/* Title */}
      <div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, margin: "0 0 4px 0", letterSpacing: "-0.03em", color: "var(--text-main)" }}>
          SAP S/4HANA & Joule Studio Sync
        </h2>
        <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>
          Telemetría en tiempo real del túnel Cloud Connector, Joule Agent en BTP y adaptadores B2B para Venezuela.
          {cargando ? " (Verificando...)" : ` (Modo: ${statusData?.mode || "Activo"})`}
        </p>
      </div>

      {/* Grid de Componentes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "18px"
        }}
      >
        {/* Component 1: Canal Gemini */}
        <div className="bento-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f0fdf4", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ZapIcon size={18} />
            </div>
            <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 700 }}>
              CONNECTED
            </span>
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
            Adaptador de Canal
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Google Cloud · Gemini Multimodal
          </p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
            <li>WhatsApp Ingestion (Texto / Voz / Foto)</li>
            <li>Whisper STT (Audios de pedidos)</li>
            <li>OCR de Órdenes de Compra y Comprobantes</li>
          </ul>
        </div>

        {/* Component 2: SAP BTP */}
        <div className="bento-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eff6ff", color: "#005bff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingIcon size={18} />
            </div>
            <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 700 }}>
              JOULE ACTIVE
            </span>
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
            SAP BTP Business AI
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Joule Studio & SAP AI Core
          </p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
            <li>Enrutamiento de intenciones B2B</li>
            <li>Generative AI Hub (LLM Enterprise)</li>
            <li>Destination Service (OAuth2 mTLS)</li>
            <li>Cloud Connector Tunnel Activo</li>
          </ul>
        </div>

        {/* Component 3: SAP S/4HANA */}
        <div className="bento-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fef2f2", color: "#dc2626", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DocumentIcon size={18} />
            </div>
            <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 700 }}>
              S/4HANA ONLINE
            </span>
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
            SAP S/4HANA (SD/MM/FSCM)
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Instancia Caracas · Mandante 100
          </p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
            <li>API_SALES_ORDER_SRV (OData v2)</li>
            <li>API_BUSINESS_PARTNER (RIF / Clientes)</li>
            <li>ATP Stock & Límite de Crédito FSCM</li>
            <li>Condiciones PR00 y Moneda Dual USD/VED</li>
          </ul>
        </div>

        {/* Component 4: BigQuery */}
        <div className="bento-card" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fffbeb", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BoxIcon size={18} />
            </div>
            <span style={{ backgroundColor: "#fef3c7", color: "#92400e", padding: "3px 10px", borderRadius: "var(--radius-pill)", fontSize: "0.72rem", fontWeight: 700 }}>
              BIGQUERY READY
            </span>
          </div>
          <h4 style={{ margin: "0 0 4px 0", fontSize: "1rem", fontWeight: 700, color: "var(--text-main)" }}>
            Motor de Recomendación
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Google Cloud BigQuery
          </p>
          <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "0.78rem", color: "#475569", lineHeight: 1.6 }}>
            <li>Sugerencias de Cross-Selling</li>
            <li>Reabastecimiento predictivo de stock</li>
            <li>Historial de compras mayoristas</li>
          </ul>
        </div>
      </div>

      {/* Probador Interactivo de Simulación OData en S/4HANA */}
      <div className="bento-card" style={{ padding: "28px" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-main)" }}>
          Simulador de Pedido B2B en S/4HANA (OData Simulation)
        </h3>
        <p style={{ margin: "0 0 22px 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Pruebe cómo el agente valida stock ATP, crédito en FSCM, condición de precio PR00 y retenciones de IVA en Venezuela.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "20px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              Código BP SAP (Cliente)
            </label>
            <input
              type="text"
              value={simulacionPayload.bp_id}
              onChange={(e) => setSimulacionPayload({ ...simulacionPayload, bp_id: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.85rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              WhatsApp Comprador
            </label>
            <input
              type="text"
              value={simulacionPayload.wa_id}
              onChange={(e) => setSimulacionPayload({ ...simulacionPayload, wa_id: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.85rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              SKU Material
            </label>
            <input
              type="text"
              value={simulacionPayload.sku}
              onChange={(e) => setSimulacionPayload({ ...simulacionPayload, sku: e.target.value })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.85rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              Cantidad B2B
            </label>
            <input
              type="number"
              value={simulacionPayload.cantidad}
              onChange={(e) => setSimulacionPayload({ ...simulacionPayload, cantidad: Number(e.target.value) })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.85rem" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, color: "#475569", marginBottom: "6px" }}>
              Precio Base Unit. ($ USD)
            </label>
            <input
              type="number"
              value={simulacionPayload.precio}
              onChange={(e) => setSimulacionPayload({ ...simulacionPayload, precio: Number(e.target.value) })}
              style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-card)", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        <button
          onClick={handleEjecutarSimulacion}
          disabled={ejecutando}
          className="hero-cta-btn"
        >
          <span>{ejecutando ? "Simulando en S/4HANA..." : "Ejecutar Simulación OData"}</span>
        </button>

        {/* Respuesta de la Simulación */}
        {resultadoSim && (
          <div style={{ marginTop: "20px", backgroundColor: "#f8fafc", borderRadius: "14px", padding: "16px", border: "1px solid var(--border-card)" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "0.88rem", fontWeight: 700, color: "var(--text-main)" }}>
              Respuesta del Servicio OData:
            </h4>
            <pre style={{ margin: 0, fontSize: "0.78rem", color: "#334155", overflowX: "auto", fontFamily: "monospace" }}>
              {JSON.stringify(resultadoSim, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
