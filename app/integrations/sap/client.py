import os
from functools import lru_cache
from typing import Union

from app.integrations.sap.s4hana.mock_adapter import SAPMockAdapter
from app.integrations.sap.s4hana.odata_client import SAPS4HanaODataClient


@lru_cache()
def get_sap_client() -> Union[SAPMockAdapter, SAPS4HanaODataClient]:
    """Retorna el cliente de SAP configurado según el entorno.

    - Por defecto ('mock'): Retorna el adaptador de simulación de alta fidelidad,
      permitiendo mostrar la demo técnica sin depender de un sandbox activo de S/4HANA.
    - 'live': Conecta al S/4HANA real mediante OData y Cloud Connector.
    """
    sap_env = os.getenv("SAP_ENVIRONMENT", "mock").lower()

    if sap_env == "live":
        base_url = os.getenv("SAP_S4HANA_BASE_URL", "https://s4hana.my-company.com:44300")
        client_id = os.getenv("SAP_CLIENT_ID")
        client_secret = os.getenv("SAP_CLIENT_SECRET")
        token_url = os.getenv("SAP_TOKEN_URL")
        return SAPS4HanaODataClient(
            base_url=base_url,
            client_id=client_id,
            client_secret=client_secret,
            token_url=token_url
        )

    # Modo Mock / Demo (Comportamiento actual para asegurar funcionamiento inmediato)
    return SAPMockAdapter()
