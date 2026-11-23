export interface Pedido {
  id: string;
  pedido_id?: string;
  cliente_nombre?: string;
  cliente_cedula?: string;
  cliente_telefono?: string;
  region?: string;
  items?: string;
  total_usd?: number;
  metodo_pago?: string;
  referencia_pago?: string;
  estado_pago?: string;
  estado_despacho?: string;
  direccion?: string;
  conciliado?: boolean;
  wa_id?: string;
  sap_order_id?: string;
  fecha_creacion?: { seconds: number; nanoseconds: number };
}

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
    channel_adapter: {
      name: string;
      status: string;
      features: string[];
    };
    sap_btp: {
      joule_orchestrator: string;
      generative_ai_hub: string;
      destination_service: string;
      cloud_connector_tunnel: string;
    };
    sap_s4hana: {
      system_id: string;
      client: string;
      odata_services: string[];
      stock_atp_check: string;
    };
    bigquery: {
      recommendation_engine: string;
      model_version: string;
    };
  };
  governance: {
    leanix_agent_card: string;
    cloud_alm_tracing: string;
    risk_class: string;
  };
}
