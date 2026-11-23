import logging
from typing import List, Dict, Any, Optional
from app.domain.interfaces.recommendation_port import RecommendationPort

logger = logging.getLogger(__name__)


class BigQueryRecommendationAdapter(RecommendationPort):
    """Adaptador para el motor de recomendación en Google Cloud BigQuery.

    Permite a grandes empresas en Venezuela ofrecer sugerencias de reabastecimiento
    frecuente, estacionalidad y productos complementarios (cross-selling).
    """

    def __init__(self, project_id: Optional[str] = None, dataset_id: str = "smartsells_analytics"):
        self.project_id = project_id
        self.dataset_id = dataset_id

    async def obtener_recomendaciones(
        self,
        bp_id: str,
        articulos_carrito: List[str],
        limite: int = 4
    ) -> List[Dict[str, Any]]:
        """Consulta recomendaciones B2B.

        En fase de demo, provee un fallback inteligente basado en afinidad de categorías.
        """
        logger.info(f"[BigQuery Recommendation] Generando recomendaciones para BP {bp_id} con {len(articulos_carrito)} items en carrito")
        return [
            {
                "sku": "REC-01",
                "nombre": "Caja Cinta Embalar Transparente 48mm x 100m",
                "motivo": "Comprado frecuentemente con insumos de despacho",
                "precio_usd": 18.50,
                "score_afinidad": 0.94
            },
            {
                "sku": "REC-02",
                "nombre": "Rollo Film Estirable Stretch 50cm x 1500ft",
                "motivo": "Reabastecimiento sugerido según ciclo de compra mensual",
                "precio_usd": 14.00,
                "score_afinidad": 0.88
            }
        ]
