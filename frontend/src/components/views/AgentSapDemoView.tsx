import { useState } from "react";
import { useDemo } from "../../context/DemoContext";
import { PlayIcon, ZapIcon, ArrowUpRightIcon, CheckIcon, AlertIcon } from "../icons/Icons";

interface DemoChatMsg {
  id: string;
  sender: "client" | "agent" | "system";
  text: string;
  time: string;
}

interface SapStepTrace {
  step: string;
  service: string;
  status: "OK" | "ALERTA" | "ESCALADO";
  durationMs: number;
  request: string;
  response: string;
}

export default function AgentSapDemoView() {
  const {
    currentTenant,
    agentPausedGlobal,
    guardrails,
    addSimulatedOrder,
    addSimulatedEscalation,
    setActiveTab,
  } = useDemo();

  const [messages, setMessages] = useState<DemoChatMsg[]>([
    {
      id: "init-1",
      sender: "agent",
      text: `¡Hola! Soy el Agente Comercial IA de ${currentTenant.nombre}. Estoy conectado en modo demo con SAP S/4HANA. Selecciona un escenario arriba o escríbeme un pedido.`,
      time: "11:00",
    },
  ]);
  const [traces, setTraces] = useState<SapStepTrace[]>([]);
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [lastCreatedTarget, setLastCreatedTarget] = useState<{ label: string; tab: "pedidos" | "escalamientos" } | null>(null);

  const runScenario = (promptText: string, mode: "auto_ok" | "high_amount" | "atp_fail" | "complaint" | "custom") => {
    if (processing) return;
    const nowTime = new Date().toTimeString().slice(0, 5);
    const fullDate = "2026-11-27 " + nowTime;

    setMessages((prev) => [...prev, { id: `c-${Date.now()}`, sender: "client", text: promptText, time: nowTime }]);
    setLastCreatedTarget(null);

    if (agentPausedGlobal) {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: "system",
          text: "⛔ Kill Switch Global Activo (RF-05.9): El agente IA está pausado. El mensaje fue encolado para atención humana.",
          time: nowTime,
        },
      ]);
      return;
    }

    setProcessing(true);

    setTimeout(() => {
      const lower = promptText.toLowerCase();
      const detectedMode =
        mode !== "custom"
          ? mode
          : lower.includes("queja") || lower.includes("reclamo") || lower.includes("asesor") || lower.includes("humano")
          ? "complaint"
          : lower.includes("60") || lower.includes("descuento") || lower.includes("3000")
          ? "high_amount"
          : lower.includes("sin stock") || lower.includes("500")
          ? "atp_fail"
          : "auto_ok";

      const orderId = `PED-${Math.floor(9050 + Math.random() * 400)}`;
      const sapDoc = `45000${Math.floor(89700 + Math.random() * 250)}`;

      if (detectedMode === "auto_ok") {
        const newTraces: SapStepTrace[] = [
          {
            step: "1. Identificación Business Partner",
            service: "API_BUSINESS_PARTNER",
            status: "OK",
            durationMs: 112,
            request: JSON.stringify({ WhatsAppID: "584121234567" }, null, 2),
            response: JSON.stringify({ BusinessPartner: "BP-100234", Name: "Automercados Plaza's", PaymentTerms: "Z015" }, null, 2),
          },
          {
            step: "2. Verificación Stock ATP",
            service: "API_MATERIAL_STOCK_SRV",
            status: "OK",
            durationMs: 148,
            request: JSON.stringify({ Plant: "C001", Items: ["MAT-ARROZ-01 (20)", "MAT-HARINA-03 (15)"] }, null, 2),
            response: JSON.stringify({ ATPStatus: "CONFIRMED", Available: { "MAT-ARROZ-01": 450, "MAT-HARINA-03": 310 } }, null, 2),
          },
          {
            step: "3. Validación Crédito & Guardrail",
            service: "API_CREDITMANAGEMENT_SRV",
            status: "OK",
            durationMs: 185,
            request: JSON.stringify({ BusinessPartner: "BP-100234", OrderAmountUSD: 753.0 }, null, 2),
            response: JSON.stringify({ CreditLimitUSD: 12000, ExposureUSD: 4100, Approved: true, GuardrailMax: guardrails.montoMaxSinAprobacionUsd }, null, 2),
          },
          {
            step: "4. Creación Orden de Venta SAP",
            service: "API_SALES_ORDER_SRV",
            status: "OK",
            durationMs: 390,
            request: JSON.stringify({ SalesOrderType: "OR", SoldToParty: "BP-100234", PurchaseOrderByCustomer: orderId }, null, 2),
            response: JSON.stringify({ SalesOrder: sapDoc, OverallSDProcessStatus: "A", TotalNetAmount: "753.00" }, null, 2),
          },
        ];
        setTraces(newTraces);

        addSimulatedOrder(
          {
            id: orderId,
            tenantId: currentTenant.id,
            clienteId: "BP-100234",
            clienteNombre: "Automercados Plaza's (Demo)",
            sucursal: currentTenant.sucursalPrincipal,
            vendedor: "Carlos Mendoza",
            canal: "Web Demo",
            origen: "Agente IA",
            estado: "enviado_sap",
            fecha: fullDate,
            totalUsd: 753.0,
            condicionPago: "Crédito 15 días (Z015)",
            sapDocNumber: sapDoc,
            sapStatus: "Confirmado en S/4HANA (Demo)",
            items: [
              { sku: "MAT-ARROZ-01", descripcion: "Fardo Arroz Blanco 24x1kg", cantidad: 20, precioUnitario: 22.5, descuentoPct: 0 },
              { sku: "MAT-HARINA-03", descripcion: "Bulto Harina Precocida 20x1kg", cantidad: 15, precioUnitario: 20.2, descuentoPct: 0 },
            ],
            trazabilidad: [
              { fecha: fullDate, usuario: "Agente IA (Demo)", accion: "Stock ATP y Crédito validados en SAP" },
              { fecha: fullDate, usuario: "Conector SAP", accion: `Orden ${sapDoc} creada automáticamente` },
            ],
          },
          {
            id: `TX-${Math.floor(5200 + Math.random() * 500)}`,
            tenantId: currentTenant.id,
            fecha: fullDate + ":00",
            servicio: "API_SALES_ORDER_SRV",
            operacion: "POST /A_SalesOrder (Demo)",
            pedidoId: orderId,
            estado: "201 Created",
            duracionMs: 390,
            peticionJson: newTraces[3].request,
            respuestaJson: newTraces[3].response,
          },
          {
            id: `AUD-${Math.floor(720 + Math.random() * 200)}`,
            tenantId: currentTenant.id,
            fecha: fullDate,
            conversacionId: "DEMO-LIVE",
            clienteEnmascarado: "Auto*** Plaza's (***-4567)",
            entradaEnmascarada: promptText,
            respuestaAgente: `Pedido ${orderId} creado en SAP bajo documento ${sapDoc} por $753.00 USD.`,
            herramientas: ["API_BUSINESS_PARTNER", "API_MATERIAL_STOCK_SRV", "API_CREDITMANAGEMENT_SRV", "API_SALES_ORDER_SRV"],
            modelo: "gpt-4.1-mini",
            versionPrompt: "v2.4",
            tokens: 1380,
            costoUsd: 0.0041,
            confianza: 0.97,
            calificacion: null,
          }
        );

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: "agent",
            text: `✅ ¡Listo! Validé tu crédito y disponibilidad ATP en SAP S/4HANA. Tu pedido ${orderId} por $753.00 USD fue contabilizado con el N° de Documento SAP ${sapDoc}.`,
            time: nowTime,
          },
        ]);
        setLastCreatedTarget({ label: `Ver Pedido ${orderId} en Módulo 3`, tab: "pedidos" });
      } else if (detectedMode === "high_amount") {
        const total = 2040.0;
        const newTraces: SapStepTrace[] = [
          {
            step: "1. Verificación Stock ATP",
            service: "API_MATERIAL_STOCK_SRV",
            status: "OK",
            durationMs: 140,
            request: JSON.stringify({ Material: "MAT-ACEITE-02", Qty: 60, Plant: "C001" }, null, 2),
            response: JSON.stringify({ ATPStatus: "CONFIRMED", AvailableStock: 340 }, null, 2),
          },
          {
            step: "2. Evaluación Guardrail Comercial (RF-05.2)",
            service: "GUARDRAIL_ENGINE",
            status: "ALERTA",
            durationMs: 18,
            request: JSON.stringify({ TotalUSD: total, LimitAutonomousUSD: guardrails.montoMaxSinAprobacionUsd }, null, 2),
            response: JSON.stringify({ Action: "REQUIRE_HUMAN_APPROVAL", Reason: `Supera límite autónomo ($${guardrails.montoMaxSinAprobacionUsd})` }, null, 2),
          },
        ];
        setTraces(newTraces);

        const escId = `ESC-${Math.floor(210 + Math.random() * 90)}`;
        addSimulatedOrder({
          id: orderId,
          tenantId: currentTenant.id,
          clienteId: "BP-100512",
          clienteNombre: "Supermercados La Colina (Demo)",
          sucursal: currentTenant.sucursalPrincipal,
          vendedor: "Ana Rodríguez",
          canal: "Web Demo",
          origen: "Agente IA",
          estado: "pendiente_revision",
          fecha: fullDate,
          totalUsd: total,
          condicionPago: "Crédito 30 días (Z030)",
          reglaRevision: `Supera monto máximo autónomo ($${guardrails.montoMaxSinAprobacionUsd})`,
          conversacionId: escId,
          items: [{ sku: "MAT-ACEITE-02", descripcion: "Caja Aceite Vegetal 12x1L", cantidad: 60, precioUnitario: 34.0, descuentoPct: 0 }],
          trazabilidad: [
            { fecha: fullDate, usuario: "Agente IA (Demo)", accion: "Borrador creado · Stock ATP OK en SAP" },
            { fecha: fullDate, usuario: "Guardrail Monto", accion: "Escalado a Supervisor para aprobación" },
          ],
        });

        addSimulatedEscalation({
          id: escId,
          tenantId: currentTenant.id,
          clienteId: "BP-100512",
          clienteNombre: "Supermercados La Colina (Demo)",
          telefono: "+58 412-555-0192",
          sucursal: currentTenant.sucursalPrincipal,
          estado: "nuevo",
          motivo: "monto_alto",
          prioridad: "alta",
          tiempoEsperaMin: 1,
          slaLimiteMin: 15,
          asignadoA: null,
          reglaAsignacion: "Regla #1: Monto > Límite Autónomo",
          controlHumano: false,
          intencionDetectada: "Pedido mayorista de 60 cajas de aceite",
          confianzaIa: 0.93,
          pedidoEnCursoId: orderId,
          resumenContexto: `Cliente solicita 60 cajas de aceite ($${total}). Stock ATP OK en SAP, pero requiere aprobación humana.`,
          etiquetas: ["Demo", "Monto Alto"],
          notasInternas: [],
          calificacionIa: null,
          mensajes: [
            { id: "dm-1", emisor: "cliente", texto: promptText, hora: nowTime },
            { id: "dm-2", emisor: "ia", texto: `Borrador ${orderId} creado. Escalado para aprobación comercial.`, hora: nowTime, sapToolCall: "Guardrail: monto_alto" },
          ],
          historialPrevio: [],
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: "agent",
            text: `⚠️ Confirmé stock en SAP para las 60 cajas de aceite ($2,040.00 USD). Como supera nuestro límite autónomo de $${guardrails.montoMaxSinAprobacionUsd}, creé el borrador ${orderId} y escalé tu caso (${escId}) a un supervisor para aprobación inmediata.`,
            time: nowTime,
          },
        ]);
        setLastCreatedTarget({ label: `Ver Escalamiento ${escId} / Pedido ${orderId}`, tab: "escalamientos" });
      } else if (detectedMode === "atp_fail") {
        setTraces([
          {
            step: "1. Verificación Stock ATP en Centro C001",
            service: "API_MATERIAL_STOCK_SRV",
            status: "ALERTA",
            durationMs: 175,
            request: JSON.stringify({ Material: "MAT-ACEITE-02", Plant: "C001", RequestedQty: 500 }, null, 2),
            response: JSON.stringify({ ATPStatus: "PARTIAL", AvailableC001: 120, AvailableC002: 450 }, null, 2),
          },
        ]);
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: "agent",
            text: "📦 Consulté SAP S/4HANA: en el centro Caracas (C001) solo tenemos 120 cajas disponibles ahora mismo, pero en el centro Valencia (C002) hay 450 cajas. ¿Deseas que despachemos 120 hoy y el resto mañana desde C002?",
            time: nowTime,
          },
        ]);
      } else {
        const escId = `ESC-${Math.floor(210 + Math.random() * 90)}`;
        setTraces([
          {
            step: "1. Análisis de Intención y Sentimiento",
            service: "GUARDRAIL_ENGINE",
            status: "ESCALADO",
            durationMs: 42,
            request: JSON.stringify({ Message: promptText }, null, 2),
            response: JSON.stringify({ Intent: "queja_o_asesor", Confidence: 0.94, Action: "HANDOFF_IMMEDIATE" }, null, 2),
          },
        ]);
        addSimulatedEscalation({
          id: escId,
          tenantId: currentTenant.id,
          clienteId: "BP-100644",
          clienteNombre: "Cliente Demo WhatsApp",
          telefono: "+58 414-000-1122",
          sucursal: currentTenant.sucursalPrincipal,
          estado: "nuevo",
          motivo: "queja",
          prioridad: "alta",
          tiempoEsperaMin: 1,
          slaLimiteMin: 15,
          asignadoA: "Ana Rodríguez",
          reglaAsignacion: "Regla #2: Queja / Solicitud Humana",
          controlHumano: false,
          intencionDetectada: "Atención por reclamo o solicitud directa de asesor",
          confianzaIa: 0.94,
          resumenContexto: `Mensaje recibido en demo: "${promptText}". Escalado automáticamente sin consultar SAP.`,
          etiquetas: ["Demo", "Handoff"],
          notasInternas: [],
          calificacionIa: null,
          mensajes: [
            { id: "dm-1", emisor: "cliente", texto: promptText, hora: nowTime },
            { id: "dm-2", emisor: "ia", texto: "Transfiriendo conversación a un asesor humano.", hora: nowTime },
          ],
          historialPrevio: [],
        });
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            sender: "agent",
            text: `🤝 Entendido. He creado el ticket ${escId} con prioridad alta y transferido tu conversación a nuestro equipo humano para atenderte de inmediato.`,
            time: nowTime,
          },
        ]);
        setLastCreatedTarget({ label: `Atender ${escId} en Escalamientos`, tab: "escalamientos" });
      }

      setProcessing(false);
    }, 650);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    runScenario(input.trim(), "custom");
    setInput("");
  };

  return (
    <div className="view-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 800, margin: 0, letterSpacing: "-0.03em" }}>
            Simulador Demo: Agente WhatsApp ↔ SAP S/4HANA
          </h2>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.86rem" }}>
            Prueba cómo el agente consulta SAP en tiempo real (data mock) y genera pedidos o escalamientos en la plataforma
          </p>
        </div>

        {lastCreatedTarget && (
          <button className="hero-cta-btn" onClick={() => setActiveTab(lastCreatedTarget.tab)}>
            <span>{lastCreatedTarget.label}</span>
            <ArrowUpRightIcon size={15} />
          </button>
        )}
      </div>

      {/* Preset Scenarios */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          className="action-btn-pill"
          onClick={() => runScenario("Hola, envíame 20 fardos de arroz y 15 bultos de harina", "auto_ok")}
        >
          <PlayIcon size={13} /> 1. Pedido Autónomo OK ($753)
        </button>
        <button
          className="action-btn-pill"
          onClick={() => runScenario("Necesito 60 cajas de aceite vegetal para mañana", "high_amount")}
        >
          <AlertIcon size={13} /> 2. Monto Alto → Aprobación ($2,040)
        </button>
        <button
          className="action-btn-pill"
          onClick={() => runScenario("Quiero 500 cajas de aceite para hoy en Caracas", "atp_fail")}
        >
          <ZapIcon size={13} /> 3. Stock Parcial ATP en SAP
        </button>
        <button
          className="action-btn-pill"
          onClick={() => runScenario("Tengo un reclamo con mi entrega anterior, quiero hablar con un asesor", "complaint")}
        >
          4. Queja → Handoff Humano
        </button>
      </div>

      {/* Split View: WhatsApp Simulator + SAP Inspector */}
      <div className="bento-grid">
        {/* Left: WhatsApp Chat */}
        <div className="bento-card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", height: "540px" }}>
          <div style={{ backgroundColor: "#075e54", color: "#fff", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>SmartSales Bot · WhatsApp Business</div>
              <div style={{ fontSize: "0.74rem", opacity: 0.85 }}>
                {agentPausedGlobal ? "Pausado (Kill Switch)" : "En línea · Conectado a SAP Mock"}
              </div>
            </div>
            <span style={{ fontSize: "0.7rem", backgroundColor: "rgba(255,255,255,0.2)", padding: "3px 9px", borderRadius: "999px" }}>
              DEMO LIVE
            </span>
          </div>

          <div style={{ flex: 1, padding: "16px", overflowY: "auto", backgroundColor: "#efeae2", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === "client" ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  backgroundColor: m.sender === "client" ? "#d9fdd3" : m.sender === "system" ? "#fee2e2" : "#ffffff",
                  color: m.sender === "system" ? "#991b1b" : "#111b21",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                  fontSize: "0.86rem",
                  lineHeight: 1.4,
                }}
              >
                <div>{m.text}</div>
                <div style={{ fontSize: "0.68rem", color: "#667781", textAlign: "right", marginTop: "4px" }}>{m.time}</div>
              </div>
            ))}
            {processing && (
              <div style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: "14px", backgroundColor: "#fff", fontSize: "0.82rem", color: "#64748b" }}>
                Consultando SAP S/4HANA y guardrails...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} style={{ display: "flex", gap: "8px", padding: "12px", backgroundColor: "#f0f2f5" }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe un mensaje como cliente..."
              style={{ flex: 1, padding: "10px 14px", borderRadius: "999px", border: "none", outline: "none", fontSize: "0.85rem" }}
            />
            <button type="submit" className="hero-cta-btn" style={{ padding: "9px 18px" }} disabled={processing}>
              Enviar
            </button>
          </form>
        </div>

        {/* Right: Real-time SAP & Guardrails Trace */}
        <div className="dark-hero-card" style={{ padding: "22px", height: "540px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>Traza Agente ↔ SAP S/4HANA</h3>
              <span style={{ fontSize: "0.76rem", color: "#9ca3af" }}>
                Llamadas OData/BTP y evaluación de Guardrails en tiempo real
              </span>
            </div>
            <CheckIcon size={18} style={{ color: "#4ade80" }} />
          </div>

          {traces.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "#9ca3af", fontSize: "0.85rem", border: "1px dashed #374151", borderRadius: "16px" }}>
              Haz clic en cualquiera de los 4 escenarios arriba o envía un mensaje para observar la interacción paso a paso con SAP.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {traces.map((tr) => (
                <div key={tr.step} style={{ padding: "12px", borderRadius: "14px", backgroundColor: "#1e2028", border: "1px solid #2e323d" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <strong style={{ fontSize: "0.84rem", color: "#fff" }}>{tr.step}</strong>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "999px",
                        backgroundColor: tr.status === "OK" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)",
                        color: tr.status === "OK" ? "#4ade80" : "#fbbf24",
                      }}
                    >
                      {tr.status} · {tr.durationMs}ms
                    </span>
                  </div>
                  <div style={{ fontSize: "0.73rem", color: "#93c5fd", fontFamily: "monospace", marginBottom: "6px" }}>
                    {tr.service}
                  </div>
                  <details style={{ fontSize: "0.72rem", color: "#cbd5e1" }}>
                    <summary style={{ cursor: "pointer", color: "#9ca3af" }}>Ver Request / Response JSON</summary>
                    <pre style={{ margin: "6px 0", padding: "8px", backgroundColor: "#0b0d11", borderRadius: "8px", overflowX: "auto" }}>
                      {`// REQUEST\n${tr.request}\n\n// RESPONSE\n${tr.response}`}
                    </pre>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
