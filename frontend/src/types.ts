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