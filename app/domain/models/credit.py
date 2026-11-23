from dataclasses import dataclass
from decimal import Decimal
from typing import Optional


@dataclass
class CreditExposure:
    """Evaluación de Exposición de Crédito en SAP FSCM (Financial Supply Chain Management)

    Manejo dual de divisas para Venezuela: USD y VED a tasa oficial BCV.
    """
    bp_id: str
    limite_credito_usd: Decimal
    credito_utilizado_usd: Decimal
    credito_disponible_usd: Decimal
    tasa_bcv: Decimal
    facturas_vencidas_count: int = 0
    dias_mora_maximo: int = 0
    bloqueado_por_credito: bool = False
    clase_riesgo: str = "B" # A (Excelente), B (Medio), C (Alto riesgo), D (Bloqueado)

    @property
    def credito_disponible_ved(self) -> Decimal:
        return self.credito_disponible_usd * self.tasa_bcv

    def permite_pedido(self, monto_pedido_usd: Decimal) -> bool:
        if self.bloqueado_por_credito:
            return False
        if self.facturas_vencidas_count > 0 and self.dias_mora_maximo > 15:
            return False
        return (self.credito_disponible_usd - monto_pedido_usd) >= Decimal("0.0")
