# 🇻🇪 Especificación para Grandes Empresas en Venezuela (Smartsells B2B)

Este documento detalla las reglas de negocio, fiscales y operativas indispensables para implementar con éxito el agente **Smartsells** en grandes empresas y corporaciones que operan en Venezuela (alimentos, farmacias, consumo masivo, ferretería, autopartes, distribución mayorista).

---

## 1. Identificación y Maestro de Clientes (Business Partner en SAP)

En grandes empresas venezolanas, cada cliente corporativo se modela en SAP S/4HANA como un **Business Partner (BP)** con rol de Deudor (`FLCU01`).

- **RIF (Registro de Información Fiscal)**: Identificador tributario obligatorio ante el SENIAT.
  - Formato: `J-12345678-9` (Jurídico), `G-12345678-9` (Gubernamental), `V-12345678` (Natural/Firma Personal).
  - El agente valida que el número telefónico de WhatsApp esté enlazado al RIF registrado en SAP.
- **Contribuyente Especial (Sujeto Pasivo Especial)**:
  - Más del 90% de los clientes de grandes distribuidoras son Contribuyentes Especiales.
  - Esto implica que el cliente retendrá el **75%** o el **100% del IVA** generado en la factura, requiriendo un comprobante digital de retención emitido por el comprador.

---

## 2. Manejo de Moneda Dual y Tasa Oficial BCV

La fijación de precios y la emisión de documentos en Venezuela conviven entre el Dólar Estadounidense (**USD**) y los Bolívares (**VED**):

1. **Precios Base en SAP (`PR00`)**: Se configuran habitualmente en USD para proteger el valor del inventario contra la devaluación.
2. **Tasa Oficial del Banco Central de Venezuela (BCV)**:
   - Toda transacción y facturación fiscal debe liquidarse en Bolívares calculados a la **tasa oficial de la fecha valor de facturación**.
   - El agente consulta automáticamente la tasa oficial vigente y muestra al cliente en WhatsApp la cotización con el desglose exacto:
     $$\text{Total VED} = \text{Total USD} \times \text{Tasa BCV del Día}$$
3. **Desglose de Cotización en el Chat**:
   - Subtotal Neto USD
   - IVA (16%) USD
   - Retención IVA Estimada (75%)
   - Monto Neto a Pagar USD y equivalente en VED al tipo de cambio BCV oficial.

---

## 3. Límite de Crédito y Cobranzas (FSCM en S/4HANA)

Las ventas mayoristas en Venezuela dependen críticamente de los plazos de crédito (Contado, 7 días, 15 días, 30 días):

- **Verificación de Exposición Crediticia**:
  - Antes de confirmar un pedido, la herramienta `consulta_stock_credito` consulta SAP FSCM:
    $$\text{Crédito Disponible} = \text{Límite Aprobado} - (\text{Saldo Deudor} + \text{Pedidos Abiertos})$$
- **Reglas de Bloqueo Automático**:
  - Si el cliente tiene facturas con más de 15 días de mora, el agente no permite crear el pedido directamente y escala el caso al departamento de Cobranzas / Ventas.
  - Si el pedido excede el límite de crédito disponible, se dispara el flujo de **Aprobación del Supervisor de Ventas** en el panel web.

---

## 4. Aprobación Dual: Comprador y Vendedor de Zona

A diferencia del retail B2C, en el comercio B2B corporativo venezolano existe una relación comercial asignada (Vendedor de Zona / Preventista):

1. El cliente formula su pedido vía WhatsApp.
2. El agente genera el **Borrador de Pedido** validado contra el stock en el centro logístico asignado (ej. Centro Caracas `1000`, Almacén Valencia `2000`).
3. El cliente da el "OK" formal en el chat.
4. El vendedor asignado al cliente recibe una notificación en el Panel Ejecutivo de Smartsells para validar condiciones especiales o descuentos por volumen (`K007`).
5. Tras la aprobación dual, se dispara la creación del documento oficial `SalesOrder` en SAP S/4HANA.

---

## 5. Procesamiento de Órdenes no Estructuradas (Fotos, Audios y PDFs)

Los compradores y encargados de tienda en Venezuela suelen solicitar pedidos a través de:
- **Notas de voz extensas**: El adaptador procesa el audio con Whisper/Gemini STT y extrae los SKUs, cantidades y presentaciones (fardos, bultos, cajas, pallets).
- **Fotografías de pedidos escritos a mano**: Gemini Vision realiza OCR sobre hojas de pedido manuscritas y las mapea al catálogo de materiales de S/4HANA.
- **Comprobantes de Pago (Pago Móvil / Transferencias)**: El módulo de visión lee el número de referencia, banco emisor y monto para precargar la conciliación en tesorería.
