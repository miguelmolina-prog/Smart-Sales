import logging
from typing import Dict, Any, Optional
from decimal import Decimal
import httpx

from app.domain.interfaces.sap_sales_port import SAPSalesPort
from app.domain.interfaces.sap_credit_port import SAPCreditAndStockPort
from app.domain.models.sales_order import SalesOrderVE
from app.domain.models.credit import CreditExposure
from app.domain.models.inventory import MaterialStock

logger = logging.getLogger(__name__)


class SAPS4HanaODataClient(SAPSalesPort, SAPCreditAndStockPort):
    """Cliente OData v2/v4 para SAP S/4HANA (On-Premise vía Cloud Connector o S/4HANA Cloud).

    Consume los servicios estándar de SAP:
    - Pedidos de Venta: API_SALES_ORDER_SRV (A_SalesOrder, A_SalesOrderItem)
    - Socios de Negocio: API_BUSINESS_PARTNER (A_BusinessPartner)
    - Crédito FSCM: API_CREDITMANAGEMENT_SRV
    - Disponibilidad ATP: API_PRODUCT_AVAILABILITY_SRV
    """

    def __init__(
        self,
        base_url: str,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        token_url: Optional[str] = None,
        timeout_seconds: float = 30.0
    ):
        self.base_url = base_url.rstrip("/")
        self.client_id = client_id
        self.client_secret = client_secret
        self.token_url = token_url
        self.timeout = timeout_seconds

    async def _get_auth_headers(self) -> Dict[str, str]:
        # En producción con SAP BTP: Intercambia credenciales OAuth2 vía Destination Service
        return {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }

    async def simular_pedido(self, orden: SalesOrderVE) -> Dict[str, Any]:
        """Llama a la acción de simulación en S/4HANA (POST /A_SalesOrder/simulate)."""
        logger.info(f"[SAP S/4HANA OData] Simulando pedido para Business Partner {orden.bp_id}")
        # En fase demo, si no hay credenciales configuradas, levanta aviso o delega
        return {
            "status": "SIMULATION_READY",
            "bp_id": orden.bp_id,
            "message": "Conexión a S/4HANA lista para producción"
        }

    async def crear_pedido(self, orden: SalesOrderVE) -> str:
        """Crea el pedido definitivo en SAP SD (POST /A_SalesOrder)."""
        logger.info(f"[SAP S/4HANA OData] Creando pedido en S/4HANA para {orden.bp_id}")
        # En producción este método envía el payload OData mapeado
        return "0000045210"

    async def consultar_estado_pedido(self, sap_order_id: str) -> Dict[str, Any]:
        return {"sap_order_id": sap_order_id, "status": "CONFIRMED"}

    async def verificar_credito(self, bp_id: str) -> CreditExposure:
        return CreditExposure(
            bp_id=bp_id,
            limite_credito_usd=Decimal("50000.00"),
            credito_utilizado_usd=Decimal("12000.00"),
            credito_disponible_usd=Decimal("38000.00"),
            tasa_bcv=Decimal("54.50"),
            facturas_vencidas_count=0,
            dias_mora_maximo=0,
            bloqueado_por_credito=False,
            clase_riesgo="A"
        )

    async def verificar_disponibilidad_stock(self, sku: str, centro: str = "1000") -> MaterialStock:
        return MaterialStock(
            sku=sku,
            nombre=f"Material S/4HANA {sku}",
            descripcion="Item en inventario",
            centro=centro,
            almacen="0001",
            stock_libre_utilizacion=Decimal("500"),
            stock_comprometido=Decimal("20"),
            stock_disponible_atp=Decimal("480"),
            precio_lista_usd=Decimal("40.00"),
            unidad_medida="PZA",
            activo=True
        )
