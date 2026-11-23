"""
Definición formal de Skills de Joule Studio para Smartsells Agent.
Corresponde a la arquitectura propuesta:
1. Recomendación (Skill - solo lectura hacia BigQuery)
2. Precios y pedido (Skill - solo lectura hacia SAP Build Actions)
3. Stock y crédito (Skill - solo lectura hacia Destination Service)
4. Aprobación (Cliente y vendedor)
5. Crear pedido (Escritura hacia Cloud Connector / S/4HANA OData)
"""
from typing import Dict, Any, List

JOULE_SKILLS_MANIFEST: Dict[str, Any] = {
    "version": "1.0",
    "namespace": "sap.smartsells.b2b",
    "skills": [
        {
            "id": "skill_recomendacion",
            "name": "Recomendación de Productos",
            "operation": "read",
            "endpoint": "/api/sap/skills/recommendations",
            "description": "Obtiene productos sugeridos basados en historial de compras en BigQuery",
            "parameters": {
                "bp_id": {"type": "string", "required": True},
                "categoria_interes": {"type": "string", "required": False}
            }
        },
        {
            "id": "skill_precios_pedido",
            "name": "Consulta Precios y Condiciones",
            "operation": "read",
            "endpoint": "/api/sap/skills/pricing",
            "description": "Consulta listas de precios, descuentos pactados y condiciones en S/4HANA",
            "parameters": {
                "bp_id": {"type": "string", "required": True},
                "skus": {"type": "array", "items": "string", "required": True}
            }
        },
        {
            "id": "skill_stock_credito",
            "name": "Validación Stock ATP y Crédito",
            "operation": "read",
            "endpoint": "/api/sap/skills/stock-credit",
            "description": "Verifica disponibilidad en almacén y límite de crédito disponible en FSCM",
            "parameters": {
                "bp_id": {"type": "string", "required": True},
                "items": {"type": "array", "required": True}
            }
        },
        {
            "id": "skill_crear_pedido",
            "name": "Crear Pedido S/4HANA",
            "operation": "write",
            "endpoint": "/api/sap/skills/create-order",
            "description": "Genera el documento de pedido de ventas en S/4HANA tras aprobación dual",
            "parameters": {
                "bp_id": {"type": "string", "required": True},
                "wa_id": {"type": "string", "required": True},
                "items": {"type": "array", "required": True},
                "aprobado_cliente": {"type": "boolean", "required": True},
                "aprobado_vendedor": {"type": "boolean", "required": True}
            }
        }
    ]
}
