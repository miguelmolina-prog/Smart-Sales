import React, { createContext, useContext, useState, useMemo } from "react";
import type {
  TabId,
  UserRole,
  GlobalFilters,
  Tenant,
  NotificationItem,
  Order,
  OrderStatus,
  Escalation,
  SapConnection,
  SapTransactionLog,
  SapErrorItem,
  SapMasterEntity,
  AiAuditDecision,
  GuardrailConfig,
  AutonomyRule,
  PromptVersion,
  SystemUser,
  ChannelConfig,
  ConfigAuditLog,
} from "../types";
import {
  TENANTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_ORDERS,
  INITIAL_ESCALATIONS,
  INITIAL_SAP_CONNECTIONS,
  INITIAL_SAP_LOGS,
  INITIAL_SAP_ERRORS,
  INITIAL_SAP_MASTER_ENTITIES,
  INITIAL_AI_AUDIT,
  INITIAL_GUARDRAILS,
  INITIAL_AUTONOMY_RULES,
  INITIAL_PROMPTS,
  INITIAL_USERS,
  INITIAL_CHANNELS,
  INITIAL_CONFIG_AUDIT,
} from "../data/mockData";

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? "";
          const escaped = String(val).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface DemoContextValue {
  isAuthenticated: boolean;
  login: (selectedRole: UserRole) => void;
  logout: () => void;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  tenants: Tenant[];
  currentTenant: Tenant;
  setTenantId: (id: string) => void;
  role: UserRole;
  setRole: (r: UserRole) => void;
  filters: GlobalFilters;
  setFilters: React.Dispatch<React.SetStateAction<GlobalFilters>>;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  notifications: NotificationItem[];
  unreadCount: number;
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;

  // Kill Switch (RF-05.9)
  agentPausedGlobal: boolean;
  setAgentPausedGlobal: (v: boolean) => void;
  pausedChannels: string[];
  toggleChannelPause: (channel: string) => void;

  // Orders (Module 3)
  orders: Order[];
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, actor?: string, note?: string) => void;
  bulkApproveOrders: (orderIds: string[]) => void;
  retryOrderSap: (orderId: string) => void;
  addSimulatedOrder: (order: Order, sapLog?: SapTransactionLog, aiAudit?: AiAuditDecision) => void;

  // Escalations (Module 2)
  escalations: Escalation[];
  takeHandoff: (escId: string) => void;
  returnToAi: (escId: string) => void;
  reassignEscalation: (escId: string, agente: string) => void;
  sendHumanMessage: (escId: string, texto: string) => void;
  addInternalNote: (escId: string, nota: string) => void;
  rateAiResponse: (escId: string, rating: "correcta" | "incorrecta") => void;
  addSimulatedEscalation: (esc: Escalation, aiAudit?: AiAuditDecision) => void;

  // SAP (Module 4)
  sapConnections: SapConnection[];
  sapLogs: SapTransactionLog[];
  sapErrors: SapErrorItem[];
  sapMasterEntities: SapMasterEntity[];
  triggerMasterSync: (entityId: string) => void;
  retrySapError: (errorId: string) => void;

  // AI Governance (Module 5)
  aiAudit: AiAuditDecision[];
  rateAuditSample: (auditId: string, rating: "correcta" | "incorrecta") => void;
  guardrails: GuardrailConfig;
  setGuardrails: React.Dispatch<React.SetStateAction<GuardrailConfig>>;
  autonomyRules: AutonomyRule[];
  updateAutonomyLevel: (accion: string, nivel: AutonomyRule["nivel"]) => void;
  prompts: PromptVersion[];
  activatePromptVersion: (version: string) => void;

  // Settings (Module 6)
  users: SystemUser[];
  toggleUserStatus: (userId: string) => void;
  channels: ChannelConfig[];
  toggleChannelStatus: (channelId: string) => void;
  configAudit: ConfigAuditLog[];
  addConfigAudit: (modulo: string, cambio: string) => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const login = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };
  const [tenantId, setTenantId] = useState<string>(TENANTS[0].id);
  const [role, setRole] = useState<UserRole>("gerente");
  const [globalSearch, setGlobalSearch] = useState<string>("");
  const [filters, setFilters] = useState<GlobalFilters>({
    dateRange: "30d",
    cliente: "todos",
    vendedor: "todos",
    canal: "todos",
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [agentPausedGlobal, setAgentPausedGlobalState] = useState<boolean>(false);
  const [pausedChannels, setPausedChannels] = useState<string[]>([]);

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [escalations, setEscalations] = useState<Escalation[]>(INITIAL_ESCALATIONS);

  const [sapConnections] = useState<SapConnection[]>(INITIAL_SAP_CONNECTIONS);
  const [sapLogs, setSapLogs] = useState<SapTransactionLog[]>(INITIAL_SAP_LOGS);
  const [sapErrors, setSapErrors] = useState<SapErrorItem[]>(INITIAL_SAP_ERRORS);
  const [sapMasterEntities, setSapMasterEntities] = useState<SapMasterEntity[]>(INITIAL_SAP_MASTER_ENTITIES);

  const [aiAudit, setAiAudit] = useState<AiAuditDecision[]>(INITIAL_AI_AUDIT);
  const [guardrails, setGuardrails] = useState<GuardrailConfig>(INITIAL_GUARDRAILS);
  const [autonomyRules, setAutonomyRules] = useState<AutonomyRule[]>(INITIAL_AUTONOMY_RULES);
  const [prompts, setPrompts] = useState<PromptVersion[]>(INITIAL_PROMPTS);

  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [channels, setChannels] = useState<ChannelConfig[]>(INITIAL_CHANNELS);
  const [configAudit, setConfigAudit] = useState<ConfigAuditLog[]>(INITIAL_CONFIG_AUDIT);

  const currentTenant = useMemo(
    () => TENANTS.find((t) => t.id === tenantId) || TENANTS[0],
    [tenantId]
  );

  const unreadCount = useMemo(() => notifications.filter((n) => !n.leida).length, [notifications]);

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  };

  const addConfigAudit = (modulo: string, cambio: string) => {
    const actor = role === "gerente" ? "Maretta Daniel" : role === "supervisor" ? "Ana Rodríguez" : "Carlos Mendoza";
    setConfigAudit((prev) => [
      {
        id: `ca-${Date.now()}`,
        fecha: new Date().toLocaleString("es-VE", { hour12: false }).slice(0, 16),
        usuario: actor,
        modulo,
        cambio,
      },
      ...prev,
    ]);
  };

  const setAgentPausedGlobal = (v: boolean) => {
    setAgentPausedGlobalState(v);
    addConfigAudit("Gobernanza IA (Kill Switch)", v ? "Agente IA pausado globalmente" : "Agente IA reactivado globalmente");
  };

  const toggleChannelPause = (channel: string) => {
    setPausedChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    );
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, actor = "Maretta Daniel", note?: string) => {
    const now = "2026-11-27 " + new Date().toTimeString().slice(0, 5);
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const sapDoc = newStatus === "enviado_sap" ? o.sapDocNumber || `45000${Math.floor(89420 + Math.random() * 500)}` : o.sapDocNumber;
        return {
          ...o,
          estado: newStatus,
          sapDocNumber: sapDoc,
          sapStatus: newStatus === "enviado_sap" ? "Confirmado en S/4HANA" : o.sapStatus,
          trazabilidad: [
            ...o.trazabilidad,
            {
              fecha: now,
              usuario: actor,
              accion: note || `Estado cambiado a ${newStatus}`,
            },
          ],
        };
      })
    );
  };

  const bulkApproveOrders = (orderIds: string[]) => {
    const now = "2026-11-27 " + new Date().toTimeString().slice(0, 5);
    setOrders((prev) =>
      prev.map((o) => {
        if (!orderIds.includes(o.id)) return o;
        const sapDoc = `45000${Math.floor(89500 + Math.random() * 400)}`;
        return {
          ...o,
          estado: "enviado_sap",
          sapDocNumber: sapDoc,
          sapStatus: "Confirmado en S/4HANA (Aprobación Masiva)",
          trazabilidad: [
            ...o.trazabilidad,
            { fecha: now, usuario: "Maretta Daniel", accion: `Aprobación masiva y envío a SAP (${sapDoc})` },
          ],
        };
      })
    );
  };

  const retryOrderSap = (orderId: string) => {
    const now = "2026-11-27 " + new Date().toTimeString().slice(0, 5);
    const sapDoc = `45000${Math.floor(89600 + Math.random() * 300)}`;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              estado: "enviado_sap",
              sapDocNumber: sapDoc,
              sapStatus: "Confirmado en S/4HANA (Reintento exitoso)",
              sapErrorMsg: undefined,
              trazabilidad: [
                ...o.trazabilidad,
                { fecha: now, usuario: "Conector SAP", accion: `Reintento exitoso · Documento ${sapDoc}` },
              ],
            }
          : o
      )
    );
    setSapLogs((prev) => [
      {
        id: `TX-${Math.floor(5100 + Math.random() * 900)}`,
        tenantId,
        fecha: now + ":00",
        servicio: "API_SALES_ORDER_SRV",
        operacion: "POST /A_SalesOrder (Retry)",
        pedidoId: orderId,
        estado: "201 Created",
        duracionMs: 310,
        peticionJson: JSON.stringify({ PurchaseOrderByCustomer: orderId, Retry: true }, null, 2),
        respuestaJson: JSON.stringify({ SalesOrder: sapDoc, Status: "CONFIRMED" }, null, 2),
      },
      ...prev,
    ]);
  };

  const addSimulatedOrder = (order: Order, sapLog?: SapTransactionLog, audit?: AiAuditDecision) => {
    setOrders((prev) => [order, ...prev]);
    if (sapLog) setSapLogs((prev) => [sapLog, ...prev]);
    if (audit) setAiAudit((prev) => [audit, ...prev]);
  };

  const takeHandoff = (escId: string) => {
    setEscalations((prev) =>
      prev.map((e) =>
        e.id === escId
          ? { ...e, estado: "en_atencion", controlHumano: true, asignadoA: e.asignadoA || "Maretta Daniel" }
          : e
      )
    );
  };

  const returnToAi = (escId: string) => {
    const hora = new Date().toTimeString().slice(0, 5);
    setEscalations((prev) =>
      prev.map((e) =>
        e.id === escId
          ? {
              ...e,
              estado: "resuelto",
              controlHumano: false,
              mensajes: [
                ...e.mensajes,
                {
                  id: `m-${Date.now()}`,
                  emisor: "ia",
                  texto: "Conversación devuelta al Agente IA SmartSales para seguimiento automático.",
                  hora,
                },
              ],
            }
          : e
      )
    );
  };

  const reassignEscalation = (escId: string, agente: string) => {
    setEscalations((prev) => prev.map((e) => (e.id === escId ? { ...e, asignadoA: agente } : e)));
  };

  const sendHumanMessage = (escId: string, texto: string) => {
    const hora = new Date().toTimeString().slice(0, 5);
    setEscalations((prev) =>
      prev.map((e) =>
        e.id === escId
          ? {
              ...e,
              estado: "en_atencion",
              controlHumano: true,
              mensajes: [
                ...e.mensajes,
                { id: `m-${Date.now()}`, emisor: "humano", autorNombre: "Maretta Daniel", texto, hora },
              ],
            }
          : e
      )
    );
  };

  const addInternalNote = (escId: string, nota: string) => {
    setEscalations((prev) =>
      prev.map((e) => (e.id === escId ? { ...e, notasInternas: [...e.notasInternas, nota] } : e))
    );
  };

  const rateAiResponse = (escId: string, rating: "correcta" | "incorrecta") => {
    setEscalations((prev) => prev.map((e) => (e.id === escId ? { ...e, calificacionIa: rating } : e)));
  };

  const addSimulatedEscalation = (esc: Escalation, audit?: AiAuditDecision) => {
    setEscalations((prev) => [esc, ...prev]);
    if (audit) setAiAudit((prev) => [audit, ...prev]);
  };

  const triggerMasterSync = (entityId: string) => {
    setSapMasterEntities((prev) =>
      prev.map((m) => (m.id === entityId ? { ...m, estado: "sincronizando" } : m))
    );
    setTimeout(() => {
      setSapMasterEntities((prev) =>
        prev.map((m) =>
          m.id === entityId ? { ...m, estado: "sincronizado", ultimaSync: "Ahora mismo" } : m
        )
      );
    }, 800);
  };

  const retrySapError = (errorId: string) => {
    const err = sapErrors.find((e) => e.id === errorId);
    if (err) {
      retryOrderSap(err.pedidoId);
    }
    setSapErrors((prev) =>
      prev.map((e) => (e.id === errorId ? { ...e, estado: "reintentado_ok", reintentos: e.reintentos + 1 } : e))
    );
  };

  const rateAuditSample = (auditId: string, rating: "correcta" | "incorrecta") => {
    setAiAudit((prev) => prev.map((a) => (a.id === auditId ? { ...a, calificacion: rating } : a)));
  };

  const updateAutonomyLevel = (accion: string, nivel: AutonomyRule["nivel"]) => {
    setAutonomyRules((prev) => prev.map((r) => (r.accion === accion ? { ...r, nivel } : r)));
    addConfigAudit("Gobernanza IA", `Autonomía de "${accion}" cambiada a ${nivel}`);
  };

  const activatePromptVersion = (version: string) => {
    setPrompts((prev) => prev.map((p) => ({ ...p, activa: p.version === version })));
    addConfigAudit("Gobernanza IA", `Rollback / activación de prompt ${version}`);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, estado: u.estado === "activo" ? "bloqueado" : "activo" } : u
      )
    );
    addConfigAudit("Usuarios y Roles", `Cambio de estado de usuario ${userId}`);
  };

  const toggleChannelStatus = (channelId: string) => {
    setChannels((prev) =>
      prev.map((c) =>
        c.id === channelId ? { ...c, estado: c.estado === "activo" ? "pausado" : "activo" } : c
      )
    );
    addConfigAudit("Canales", `Estado de canal ${channelId} actualizado`);
  };

  return (
    <DemoContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        activeTab,
        setActiveTab,
        tenants: TENANTS,
        currentTenant,
        setTenantId,
        role,
        setRole,
        filters,
        setFilters,
        globalSearch,
        setGlobalSearch,
        notifications,
        unreadCount,
        markAllNotificationsRead,
        markNotificationRead,
        agentPausedGlobal,
        setAgentPausedGlobal,
        pausedChannels,
        toggleChannelPause,
        orders,
        updateOrderStatus,
        bulkApproveOrders,
        retryOrderSap,
        addSimulatedOrder,
        escalations,
        takeHandoff,
        returnToAi,
        reassignEscalation,
        sendHumanMessage,
        addInternalNote,
        rateAiResponse,
        addSimulatedEscalation,
        sapConnections,
        sapLogs,
        sapErrors,
        sapMasterEntities,
        triggerMasterSync,
        retrySapError,
        aiAudit,
        rateAuditSample,
        guardrails,
        setGuardrails,
        autonomyRules,
        updateAutonomyLevel,
        prompts,
        activatePromptVersion,
        users,
        toggleUserStatus,
        channels,
        toggleChannelStatus,
        configAudit,
        addConfigAudit,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
