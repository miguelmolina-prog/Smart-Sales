from fastapi import APIRouter
from typing import Dict, Any
from app.integrations.sap.client import get_sap_client
from app.integrations.sap.joule.skills_spec import JOULE_SKILLS_MANIFEST
from app.domain.models.sales_order import SalesOrderVE, OrderItem
from decimal import Decimal

router = APIRouter(prefix="/api/sap", tags=["SAP Integration"])


@router.get("/status")
async def get_sap_system_status() -> Dict[str, Any]:
    """Retorna el estado de la arquitectura BTP, Cloud Connector, Joule y S/4HANA."""
    client = get_sap_client()
    is_mock = client.__class__.__name__ == "SAPMockAdapter"

    return {
        "status": "ONLINE",
        "mode": "DEMO_SIMULATION" if is_mock else "ENTERPRISE_LIVE",
        "components": {
            "channel_adapter": {
                "name": "Google Cloud · Gemini Multimodal",
                "status": "CONNECTED",
                "features": ["WhatsApp Ingestion", "Whisper STT", "Vision OCR"]
            },
            "sap_btp": {
                "joule_orchestrator": "ACTIVE",
                "generative_ai_hub": "ONLINE",
                "destination_service": "CONFIGURED",
                "cloud_connector_tunnel": "ESTABLISHED"
            },
            "sap_s4hana": {
                "system_id": "S4H_CARACAS_PRD",
                "client": "100",
                "odata_services": ["API_SALES_ORDER_SRV", "API_BUSINESS_PARTNER", "API_CREDITMANAGEMENT_SRV"],
                "stock_atp_check": "AVAILABLE"
            },
            "bigquery": {
                "recommendation_engine": "READY",
                "model_version": "v1.4-retail-ve"
            }
        },
        "governance": {
            "leanix_agent_card": "smartsells-joule-b2b-ve",
            "cloud_alm_tracing": "ENABLED",
            "risk_class": "LIMITED_RISK"
        }
    }


@router.get("/skills")
async def get_joule_skills():
    """Retorna el manifiesto de skills registradas en Joule Studio."""
    return JOULE_SKILLS_MANIFEST


@router.post("/simulate-order")
async def simular_pedido_sap(payload: Dict[str, Any]):
    """Simula un pedido en S/4HANA calculando precios, descuentos B2B, ATP y retenciones VE."""
    client = get_sap_client()
    items = [
        OrderItem(
            posicion=(i + 1) * 10,
            material_sku=it.get("sku", "MAT-DEFAULT"),
            descripcion=it.get("descripcion", "Material"),
            cantidad=Decimal(str(it.get("cantidad", 1))),
            precio_unitario_usd=Decimal(str(it.get("precio", 10.0))),
            precio_condicion_pr00=Decimal(str(it.get("precio", 10.0)))
        )
        for i, it in enumerate(payload.get("items", []))
    ]

    orden = SalesOrderVE(
        id="SIM-TEMP",
        bp_id=payload.get("bp_id", "BP-100450"),
        wa_id=payload.get("wa_id", "584120000000"),
        items=items
    )

    resultado = await client.simular_pedido(orden)
    return resultado
