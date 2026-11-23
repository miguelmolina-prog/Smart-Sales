from abc import ABC, abstractmethod
from typing import List, Dict, Any


class RecommendationPort(ABC):
    """Puerto de dominio para el motor de recomendación sobre Google Cloud BigQuery."""

    @abstractmethod
    async def obtener_recomendaciones(
        self, 
        bp_id: str, 
        articulos_carrito: List[str], 
        limite: int = 4
    ) -> List[Dict[str, Any]]:
        """Devuelve productos recomendados basados en historial B2B, estacionalidad y cross-selling."""
        pass
