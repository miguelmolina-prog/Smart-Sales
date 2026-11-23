import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import Dict, Any, List
import logging

from app.domain.interfaces.sap_sales_port import SAPSalesPort
from app.domain.interfaces.sap_credit_port import SAPCreditAndStockPort
from app.domain.models.sales_order import SalesOrderVE, OrderStatus
from app.domain.models.credit import CreditExposure
from app.domain.models.inventory import MaterialStock

logger = logging.getLogger(__name__)


class SAPMockAdapter(SAPSalesPort, SAPCreditAndStockPort):
    """Adaptador Mock de alta fidelidad para SAP S/4HANA y BTP.

    Permite mostrar la demo comercial y técnica completa antes de conectar las
    credenciales reales de S/4HANA y Joule Studio.
    """

    def __init__(self, tasa_bcv_simulada: Decimal = Decimal("54.50")):
        self.tasa_bcv = tasa_bcv_simulada

    async def simular_pedido(self, orden: SalesOrderVE) -> Dict[str, Any]:
        """Simula la ejecución de BAPI_SALESORDER_SIMULATE o OData $batch."""
        subtotal = Decimal("0.0")
        items_simulados = []

        for idx, item in enumerate(orden.items, start=1):
            pos = idx * 10
            # Simular descuento B2B del 5% si el cliente es mayorista
            descuento = Decimal("0.05") if item.cantidad >= 10 else Decimal("0.0")
            precio_base = item.precio_condicion_pr00 or item.precio_unitario_usd
            neto_item = (precio_base * item.cantidad) * (Decimal("1.0") - descuento)
            subtotal += neto_item

            items_simulados.append({
                "posicion": pos,
                "material": item.material_sku,
                "descripcion": item.descripcion,
                "cantidad": float(item.cantidad),
                "unidad": item.unidad_medida,
                "precio_lista_pr00": float(precio_base),
                "descuento_k007_pct": float(descuento * 100),
                "neto_usd": float(neto_item),
                "status_atp": "CONFIRMADO",
                "fecha_entrega_estimada": datetime.now(timezone.utc).strftime("%Y-%m-%d")
            })

        iva = subtotal * Decimal("0.16")
        retencion_iva = iva * Decimal("0.75") # Agente de Retención 75%
        total_usd = subtotal + iva
        total_ved = total_usd * self.tasa_bcv

        logger.info(f"[SAP S/4HANA MOCK] Simulación completada para BP {orden.bp_id}. Total: ${total_usd:.2f} USD")

        return {
            "status": "SIMULATED_SUCCESS",
            "tipo_documento": "TA",
            "org_ventas": "1000",
            "canal_distribucion": "10",
            "sector": "00",
            "bp_id": orden.bp_id,
            "moneda": "USD",
            "tasa_bcv": float(self.tasa_bcv),
            "subtotal_usd": float(subtotal),
            "iva_16_usd": float(iva),
            "retencion_iva_75_usd": float(retencion_iva),
            "total_bruto_usd": float(total_usd),
            "total_neto_ved": float(total_ved),
            "items": items_simulados,
            "atp_confirmado": True,
            "credito_aprobado": True
        }

    async def crear_pedido(self, orden: SalesOrderVE) -> str:
        """Genera un número de pedido SAP ficticio pero válido (ej. 0000045210)."""
        numero_sap = f"000{uuid.uuid4().int % 900000 + 100000}"
        logger.info(f"[SAP S/4HANA MOCK] Pedido de venta creado exitosamente con número SAP: {numero_sap}")
        return numero_sap

    async def consultar_estado_pedido(self, sap_order_id: str) -> Dict[str, Any]:
        return {
            "sap_order_id": sap_order_id,
            "estado_global": "En Tratamiento",
            "estado_entrega": "Pendiente de Despacho",
            "bloqueo_entrega": None,
            "bloqueo_factura": None,
            "centro_suministro": "1000 (Caracas)",
            "almacen": "0001"
        }

    async def verificar_credito(self, bp_id: str) -> CreditExposure:
        """Devuelve exposición de crédito simulada para demostraciones B2B."""
        return CreditExposure(
            bp_id=bp_id,
            limite_credito_usd=Decimal("25000.00"),
            credito_utilizado_usd=Decimal("7430.50"),
            credito_disponible_usd=Decimal("17569.50"),
            tasa_bcv=self.tasa_bcv,
            facturas_vencidas_count=0,
            dias_mora_maximo=0,
            bloqueado_por_credito=False,
            clase_riesgo="A (Cliente Corporativo Confiable)"
        )

    async def verificar_disponibilidad_stock(self, sku: str, centro: str = "1000") -> MaterialStock:
        """Devuelve stock simulado con disponibilidad ATP."""
        return MaterialStock(
            sku=sku,
            nombre=f"Material SAP {sku}",
            descripcion="Producto de alta rotación en inventario",
            centro=centro,
            almacen="0001",
            stock_libre_utilizacion=Decimal("450"),
            stock_comprometido=Decimal("50"),
            stock_disponible_atp=Decimal("400"),
            precio_lista_usd=Decimal("35.00"),
            unidad_medida="PZA",
            activo=True
        )
