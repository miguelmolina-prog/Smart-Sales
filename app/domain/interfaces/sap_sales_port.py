from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from app.domain.models.sales_order import SalesOrderVE


class SAPSalesPort(ABC):
    """Puerto de dominio para operaciones de Pedidos de Venta en SAP S/4HANA (SD)"""

    @abstractmethod
    async def simular_pedido(self, orden: SalesOrderVE) -> Dict[str, Any]:
        """Ejecuta una simulación de pedido en S/4HANA (BAPI_SALESORDER_SIMULATE o OData $batch).

        Calcula condiciones de precio (PR00, descuentos), verifica ATP y crédito sin persistir.
        """
        pass

    @abstractmethod
    async def crear_pedido(self, orden: SalesOrderVE) -> str:
        """Crea formalmente el pedido de venta en S/4HANA (POST /A_SalesOrder).

        Devuelve el número de pedido SAP generado (ej. '0000045210').
        """
        pass

    @abstractmethod
    async def consultar_estado_pedido(self, sap_order_id: str) -> Dict[str, Any]:
        """Consulta el estado de entrega y facturación del pedido en SAP."""
        pass
