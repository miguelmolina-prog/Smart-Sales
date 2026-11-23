from abc import ABC, abstractmethod
from typing import Optional
from decimal import Decimal
from app.domain.models.credit import CreditExposure
from app.domain.models.inventory import MaterialStock


class SAPCreditAndStockPort(ABC):
    """Puerto de dominio para verificación de Stock (ATP) y Exposición de Crédito (FSCM)"""

    @abstractmethod
    async def verificar_credito(self, bp_id: str) -> CreditExposure:
        """Consulta el límite y exposición de crédito del cliente en SAP FSCM."""
        pass

    @abstractmethod
    async def verificar_disponibilidad_stock(self, sku: str, centro: str = "1000") -> MaterialStock:
        """Verifica disponibilidad ATP de un material en un centro específico."""
        pass
