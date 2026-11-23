from dataclasses import dataclass, field
from typing import Optional, List
from enum import Enum


class TaxClassificationVE(str, Enum):
    CONTRIBUYENTE_ORDINARIO = "ordinario"
    CONTRIBUYENTE_ESPECIAL = "especial"  # Agente de retención IVA (75% o 100%)
    PERSONA_NATURAL = "natural"


@dataclass
class BusinessPartnerVE:
    """Representación de Socio de Negocio (Business Partner en SAP S/4HANA)

    Adaptado para grandes empresas en Venezuela.
    """
    bp_id: str                      # Código SAP BP (ej. 'BP-100234')
    razon_social: str               # Nombre fiscal / comercial de la empresa
    rif: str                        # Registro de Información Fiscal (ej. 'J-12345678-9')
    telefono_whatsapp: str          # Número de WhatsApp asociado (formato E.164)
    email: Optional[str] = None
    direccion_fiscal: str = ""
    canal_distribucion: str = "10"  # Mayorista / Distribuidor / Gran Cuenta en SAP
    organizacion_ventas: str = "1000" # Org de Ventas S/4HANA
    clasificacion_fiscal: TaxClassificationVE = TaxClassificationVE.CONTRIBUYENTE_ESPECIAL
    vendedor_asignado: Optional[str] = None # Código o nombre del ejecutivo de cuentas / preventa
    condicion_pago: str = "NT30"    # Net 30 días, Contado, etc.
    activo: bool = True
