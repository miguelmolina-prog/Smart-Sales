export type TabId =
  | "dashboard"
  | "escalamientos"
  | "pedidos"
  | "sap"
  | "gobernanza"
  | "configuracion"
  | "demo";

export type UserRole = "gerente" | "supervisor" | "operador";

export type DateRangeFilter = "hoy" | "7d" | "30d" | "trimestre";
export type ChannelFilter = "todos" | "WhatsApp" | "Web Demo";

export interface GlobalFilters {
  dateRange: DateRangeFilter;
  cliente: string;
  vendedor: string;
  canal: ChannelFilter;
}

export interface Tenant {
  id: string;
  nombre: string;
  ruc: string;
  moneda: "USD" | "VED" | "EUR";
  zonaHoraria: string;
  sucursalPrincipal: string;
  colorPrimario: string;
  modulosActivos: TabId[];
}

export interface NotificationItem {
  id: string;
  titulo: string;
  detalle: string;
  tipo: "critica" | "alerta" | "info";
  hora: string;
  leida: boolean;
  targetTab?: TabId;
}

export type OrderStatus =
  | "borrador"
  | "pendiente_revision"
  | "aprobado"
  | "enviado_sap"
  | "error"
  | "rechazado";

export interface OrderItem {
  sku: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPct: number;
}

export interface OrderTraceEvent {
  fecha: string;
  usuario: string;
  accion: string;
}

export interface Order {
  id: string;
  tenantId: string;
  clienteId: string;
  clienteNombre: string;
  sucursal: string;
  vendedor: string;
  canal: "WhatsApp" | "Web Demo";
  origen: "Agente IA" | "Manual";
  estado: OrderStatus;
  fecha: string;
  totalUsd: number;
  condicionPago: string;
  reglaRevision?: string;
  sapDocNumber?: string;
  sapStatus?: string;
  sapErrorMsg?: string;
  conversacionId?: string;
  items: OrderItem[];
  trazabilidad: OrderTraceEvent[];
}

export type EscalationStatus = "nuevo" | "en_atencion" | "resuelto";
export type EscalationReason =
  | "baja_confianza"
  | "queja"
  | "solicitud_explicita"
  | "monto_alto"
  | "producto_no_encontrado";

export interface ChatMessage {
  id: string;
  emisor: "cliente" | "ia" | "humano";
  autorNombre?: string;
  texto: string;
  hora: string;
  sapToolCall?: string;
}

export interface Escalation {
  id: string;
  tenantId: string;
  clienteId: string;
  clienteNombre: string;
  telefono: string;
  sucursal: string;
  estado: EscalationStatus;
  motivo: EscalationReason;
  prioridad: "alta" | "media" | "baja";
  tiempoEsperaMin: number;
  slaLimiteMin: number;
  asignadoA: string | null;
  reglaAsignacion: string;
  controlHumano: boolean;
  intencionDetectada: string;
  confianzaIa: number;
  pedidoEnCursoId?: string;
  resumenContexto: string;
  etiquetas: string[];
  notasInternas: string[];
  calificacionIa?: "correcta" | "incorrecta" | null;
  mensajes: ChatMessage[];
  historialPrevio: { fecha: string; motivo: string; resultado: string }[];
}

export interface SapConnection {
  id: string;
  nombre: string;
  sistema: string;
  mandante: string;
  estado: "conectado" | "degradado" | "caido";
  latenciaMs: number;
  ultimaSincronizacion: string;
  tasaErrorPct: number;
}

export interface SapTransactionLog {
  id: string;
  tenantId: string;
  fecha: string;
  servicio: string;
  operacion: string;
  pedidoId?: string;
  estado: "200 OK" | "201 Created" | "400 Error" | "503 Timeout";
  duracionMs: number;
  peticionJson: string;
  respuestaJson: string;
}

export interface SapErrorItem {
  id: string;
  tenantId: string;
  pedidoId: string;
  clienteNombre: string;
  fecha: string;
  servicio: string;
  motivoLegible: string;
  codigoSap: string;
  reintentos: number;
  estado: "pendiente" | "reintentado_ok";
}

export interface SapMasterEntity {
  id: string;
  entidad: "Clientes (BP)" | "Materiales" | "Listas de Precios" | "Stock ATP" | "Créditos";
  registros: number;
  frecuencia: string;
  ultimaSync: string;
  estado: "sincronizado" | "sincronizando" | "alerta";
}

export interface SapFieldMapping {
  campoOrigen: string;
  campoSap: string;
  valorEjemplo: string;
  transformacion: string;
}

export interface AiAuditDecision {
  id: string;
  tenantId: string;
  fecha: string;
  conversacionId: string;
  clienteEnmascarado: string;
  entradaEnmascarada: string;
  respuestaAgente: string;
  herramientas: string[];
  modelo: string;
  versionPrompt: string;
  tokens: number;
  costoUsd: number;
  confianza: number;
  calificacion?: "correcta" | "incorrecta" | null;
}

export interface GuardrailConfig {
  montoMaxSinAprobacionUsd: number;
  descuentoMaxPct: number;
  temasPermitidos: string[];
  temasProhibidos: string[];
  enmascararPii: boolean;
  retencionDias: number;
  limiteCostoMensualUsd: number;
  consumoActualUsd: number;
}

export interface AutonomyRule {
  accion: string;
  descripcion: string;
  nivel: "solo_sugerir" | "ejecutar_con_aprobacion" | "ejecutar_autonomo";
}

export interface PromptVersion {
  version: string;
  fecha: string;
  autor: string;
  notas: string;
  activa: boolean;
  contenido: string;
}

export interface SystemUser {
  id: string;
  nombre: string;
  email: string;
  rol: UserRole;
  sucursal: string;
  estado: "activo" | "bloqueado";
  mfaActivo: boolean;
}

export interface ChannelConfig {
  id: string;
  tipo: "WhatsApp Business" | "Web Chat";
  numeroOEndpoint: string;
  horario: string;
  estado: "activo" | "pausado";
  plantillasAprobadas: number;
}

export interface ConfigAuditLog {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  cambio: string;
}

// Legacy types kept for compatibility with previous views
export interface Mensaje {
  id: string;
  emisor: "cliente" | "bot" | "agente";
  texto: string;
  hora: string;
}

export interface TicketChat {
  id: string;
  cliente_nombre: string;
  telefono: string;
  resumen_ia: string;
  incidencia: string;
  estado: "escalado" | "resuelto";
  mensajes: Mensaje[];
}

export interface SapStatusResponse {
  status: string;
  mode: string;
  components: {
    channel_adapter: { name: string; status: string; features: string[] };
    sap_btp: { joule_orchestrator: string; generative_ai_hub: string; destination_service: string; cloud_connector_tunnel: string };
    sap_s4hana: { system_id: string; client: string; odata_services: string[]; stock_atp_check: string };
    bigquery: { recommendation_engine: string; model_version: string };
  };
  governance: { leanix_agent_card: string; cloud_alm_tracing: string; risk_class: string };
}
