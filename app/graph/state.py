from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langchain_core.messages import AnyMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict, total=False):
    messages: Annotated[list[AnyMessage], add_messages]
    wa_id: str
    sesion_id: Optional[str]  # <-- ID analítico del ciclo
    fase_actual: str 
    escalado: bool
    carrito: str | List[str]
    total: float
    total_a_pagar: float
    datos_temporales_caja: Optional[Dict[str, Any]]
    listo_para_conciliar: bool
    pedido_id: Optional[str]
    datos_envio: Optional[Dict[str, str]]