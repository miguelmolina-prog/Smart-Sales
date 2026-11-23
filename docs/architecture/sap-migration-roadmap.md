# 🗺️ Roadmap de Migración: De Demo a SAP S/4HANA & Joule Studio

Este plan de trabajo garantiza que la solución actual funcione de inmediato para demostraciones comerciales, al tiempo que establece los pasos exactos para habilitar la conexión real con **SAP S/4HANA** y **Joule Studio**.

---

## Fase 0: Demo Lista (Estado Actual)
- **Modo Backend**: `SAP_ENVIRONMENT=mock` (por defecto).
- **Frontend**: Dashboard ejecutivo Bento Grid estilo **Fingoals** con navegación a Chats en vivo, Despacho de Pedidos, Analíticas de Retención y Probador de Simulación S/4HANA.
- **Canal WhatsApp**: Funciona con Meta WhatsApp Cloud API y Firebase Firestore para registro en tiempo real.
- **Acción requerida**: Ninguna; está listo para presentar a inversionistas o directivos.

---

## Fase 1: Configuración de SAP BTP y Joule Studio
1. **Crear Subcuenta en SAP BTP**:
   - Activar servicio **SAP AI Core** (Generative AI Hub).
   - Habilitar instancia de **Joule Studio**.
2. **Importar Manifiesto de Skills**:
   - Cargar `app/integrations/sap/joule/skills_spec.py` y `agent_card.json` en Joule Studio.
   - Definir los disparadores (intents) de WhatsApp: "Hacer pedido", "Consultar precio", "Verificar disponibilidad", "Hablar con vendedor".
3. **Configurar SAP Build Actions**:
   - Crear acciones REST apuntando a los endpoints de simulación de precios y validación de inventario.

---

## Fase 2: Conexión con SAP S/4HANA (On-Premise o Cloud)
1. **Instalación de SAP Cloud Connector**:
   - Instalar el agente Cloud Connector en la red interna o DMZ donde reside S/4HANA.
   - Establecer el túnel cifrado hacia la subcuenta de SAP BTP.
2. **Mapeo de Recursos en Cloud Connector**:
   - Protocolo: `HTTPS`
   - Path URL accesible: `/sap/opu/odata/sap/API_SALES_ORDER_SRV/`
   - Path URL accesible: `/sap/opu/odata/sap/API_BUSINESS_PARTNER/`
3. **Creación del Destination en BTP**:
   - Nombre: `S4HANA_ONPREMISE`
   - Tipo de Proxy: `OnPremise`
   - Autenticación: `PrincipalPropagation` o `BasicAuthentication` (Usuario técnico RFC).

---

## Fase 3: Conexión de BigQuery para Recomendaciones
1. **Exportar Historial de Ventas**:
   - Conectar la tabla `VBAP` y `VBAK` (Cabecera y posiciones de pedido en SAP) hacia Google Cloud BigQuery.
2. **Configurar Service Account**:
   - Asignar roles `BigQuery Data Viewer` y `BigQuery Job User`.
   - Colocar `GOOGLE_APPLICATION_CREDENTIALS` en el entorno.

---

## Fase 4: Activación de Modo Producción en Smartsells
En el archivo `.env.production`:
```env
SAP_ENVIRONMENT=live
SAP_S4HANA_BASE_URL=https://s4hana.empresa.com.ve:44300
SAP_CLIENT_ID=sb-smartsells-joule!b12345
SAP_CLIENT_SECRET=tu-secret-de-btp
SAP_TOKEN_URL=https://empresa.authentication.eu10.hana.ondemand.com/oauth/token
BIGQUERY_PROJECT_ID=empresa-b2b-analytics
```

Al cambiar `SAP_ENVIRONMENT=live`, el factory `get_sap_client()` automáticamente conmuta las llamadas de simulación y creación hacia el cliente OData real `SAPS4HanaODataClient`.
