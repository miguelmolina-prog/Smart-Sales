from dataclasses import dataclass
from decimal import Decimal
from typing import Optional


@dataclass
class MaterialStock:
    """Inventario y Disponibilidad ATP (Available to Promise) en SAP S/4HANA (MM/SD)"""
    sku: str
    nombre: str
    descripcion: str
    centro: str                     # ej. '1000' (Almacén Central Caracas)
    almacen: str                    # ej. '0001' (Depósito Principal)
    stock_libre_utilizacion: Decimal # Unidades físicas disponibles
    stock_comprometido: Decimal     # Reservado para otros pedidos
    stock_disponible_atp: Decimal   # Disponible neto para venta inmediata
    precio_lista_usd: Decimal
    unidad_medida: str = "PZA"
    activo: bool = True
