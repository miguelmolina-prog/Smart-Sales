from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class JouleAgentPort(ABC):
    """Puerto de dominio para interactuar con SAP Joule Studio y SAP AI Core (Generative AI Hub)"""

    @abstractmethod
    async def enrutar_intencion(self, mensaje_usuario: str, contexto_sesion: Dict[str, Any]) -> Dict[str, Any]:
        """Enruta la intención detectada por Joule a la skill correspondiente."""
        pass

    @abstractmethod
    async def invocar_skill(self, nombre_skill: str, parametros: Dict[str, Any]) -> Dict[str, Any]:
        """Ejecuta una skill del agente (Recomendación, Precios, Stock/Crédito, Crear Pedido)."""
        pass
