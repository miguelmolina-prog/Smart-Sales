from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import List, Optional


class OrderStatus(str, Enum):
    BORRADOR = "borrador"                 # Iniciado por WhatsApp
    SIMULADO = "simulado"                 # Validado en S/4HANA (ATP + Precios + Crédito)
    PENDIENTE_APROBACION = "pendiente_aprobacion" # Esperando OK de cliente o vendedor
    APROBADO = "aprobado"                 # Confirmado por ambas partes
    CREADO_EN_SAP = "creado_en_sap"       # Pedido registrado formalmente en S/4HANA
    RECHAZADO = "rechazado"
    DESPACHADO = "despachado"


@dataclass
class OrderItem:
    posicion: int                         # 10, 20, 30 en SAP
    material_sku: str                     # Código SAP Material (ej. MAT-0012)
    descripcion: str
    cantidad: Decimal
    unidad_medida: str = "PZA"            # PZA, CJ (Caja), FAR (Fardo), KG
    precio_unitario_usd: Decimal = Decimal("0.0")
    precio_condicion_pr00: Decimal = Decimal("0.0") # Precio base lista
    descuento_k007: Decimal = Decimal("0.0")        # Descuento cliente en %
    total_neto_usd: Decimal = Decimal("0.0")
    stock_disponible_atp: Decimal = Decimal("0.0")  # Available-to-promise
    centro_suministro: str = "1000"                 # Centro logístico Caracas


@dataclass
class SalesOrderVE:
    """Pedido de Venta Enterprise integrado con SAP S/4HANA (SD) y adaptado a Venezuela."""
    id: str                               # ID local / Firestore
    bp_id: str                            # Business Partner SAP
    wa_id: str                            # WhatsApp ID del comprador
    items: List[OrderItem] = field(default_factory=list)
    estado: OrderStatus = OrderStatus.BORRADOR
    
    # Moneda y Fiscalidad Venezuela
    moneda_documento: str = "USD"
    tasa_bcv: Decimal = Decimal("1.0")
    subtotal_usd: Decimal = Decimal("0.0")
    alicuota_iva: Decimal = Decimal("0.16") # 16% IVA general en Venezuela
    monto_iva_usd: Decimal = Decimal("0.0")
    retencion_iva_estimada_usd: Decimal = Decimal("0.0") # 75% del IVA si es Agente de Retención
    total_bruto_usd: Decimal = Decimal("0.0")
    total_neto_a_pagar_usd: Decimal = Decimal("0.0")
    
    # Equivalente en Bolívares Oficiales (VED)
    total_ved: Decimal = Decimal("0.0")
    
    # Metadatos SAP S/4HANA
    sap_sales_order_number: Optional[str] = None # Número de documento generado en S/4HANA (ej. '0000045210')
    tipo_documento_sap: str = "TA"               # Pedido estándar (Terminauftrag)
    canal_distribucion: str = "10"
    sector: str = "00"
    vendedor_asignado: Optional[str] = None
    
    # Aprobaciones (Cliente y Vendedor como indica la arquitectura)
    aprobado_cliente: bool = False
    aprobado_vendedor: bool = False
    fecha_creacion: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    notas_entrega: str = ""
