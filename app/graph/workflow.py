# app/graph/workflow.py

from langgraph.graph import StateGraph, END, START
from langgraph.checkpoint.memory import MemorySaver
from app.graph.state import AgentState
from app.graph.nodes import (
    nodo_director,
    nodo_servicio,
    nodo_cajero,
    nodo_conciliador_checkout,
    nodo_logistico
)

# 1. Definición del Grafo de Estado
workflow = StateGraph(AgentState)

# 2. Registro de Nodos
workflow.add_node("director", nodo_director)
workflow.add_node("servicio", nodo_servicio)
workflow.add_node("cajero", nodo_cajero)
workflow.add_node("conciliador", nodo_conciliador_checkout)
workflow.add_node("logistico", nodo_logistico)

# 3. Funciones de Enrutamiento Condicional
def enrutador_principal(state: AgentState) -> str:
    """Distribuye el tráfico según la decisión del nodo_director."""
    if state.get("escalado"):
        return "fin"
    
    destino = state.get("fase_actual", "servicio")
    if destino == "caja":
        return "cajero"
    elif destino == "logistica":
        return "logistico"
    return "servicio"

def enrutador_post_servicio(state: AgentState) -> str:
    """Permite el salto en caliente al cajero si el cliente confirmó comprar."""
    if state.get("fase_actual") == "caja":
        return "cajero"
    return "fin"

def enrutador_post_cajero(state: AgentState) -> str:
    """Si se reunieron comprobante y dirección, salta al conciliador."""
    if state.get("listo_para_conciliar"):
        return "conciliador"
    return "fin"

def enrutador_post_conciliador(state: AgentState) -> str:
    """Finaliza el turno para entregar al cliente el mensaje con su ID de orden."""
    return "fin"

# 4. Conexión de Aristas (Edges) — Sin duplicados
# Entrada principal al supervisor
workflow.add_edge(START, "director")

# Bifurcación desde el Director
workflow.add_conditional_edges(
    "director",
    enrutador_principal,
    {
        "servicio": "servicio",
        "cajero": "cajero",
        "logistico": "logistico",
        "fin": END
    }
)

# Salida de Servicio
workflow.add_conditional_edges(
    "servicio",
    enrutador_post_servicio,
    {
        "cajero": "cajero",
        "fin": END
    }
)

# Salida de Cajero
workflow.add_conditional_edges(
    "cajero",
    enrutador_post_cajero,
    {
        "conciliador": "conciliador",
        "fin": END
    }
)

# Salida de Conciliador
workflow.add_conditional_edges(
    "conciliador",
    enrutador_post_conciliador,
    {
        "fin": END
    }
)

# Salida de Logística
workflow.add_edge("logistico", END)

# 5. Compilación con Checkpointer
memoria = MemorySaver()
orquestador_app = workflow.compile(checkpointer=memoria)