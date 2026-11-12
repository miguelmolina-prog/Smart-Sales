import { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firebase";
import { 
  PieChart, Pie, 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";

export default function AnalyticsView() {
  const [metricas, setMetricas] = useState({
    totalSesiones: 0,
    ventasCerradas: 0,
    tiempoPromedio: 0,
    ingresosTotales: 0,
    itemsVendidos: 0
  });
  
  const [graficoIngresos, setGraficoIngresos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // 1. Escuchar Sesiones
    const unsubSesiones = onSnapshot(query(collection(db, "sesiones_bot")), (snapshot) => {
      let totales = 0;
      let cerradas = 0;
      let sumaMinutos = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        totales++;
        if (data.fase === "venta_cerrada") {
          cerradas++;
          if (typeof data.duracion_minutos === "number") {
            sumaMinutos += data.duracion_minutos;
          }
        }
      });

      const promedio = cerradas > 0 ? (sumaMinutos / cerradas) : 0;

      setMetricas(prev => ({
        ...prev,
        totalSesiones: totales,
        ventasCerradas: cerradas,
        tiempoPromedio: Number(promedio.toFixed(1)),
      }));
      setCargando(false);
    });

    // 2. Escuchar Pedidos y agrupar por día para la Serie de Tiempo
    const unsubPedidos = onSnapshot(query(collection(db, "pedidos")), (snapshot) => {
      let ingresos = 0;
      let items = 0;
      const ingresosPorDia = new Map<number, number>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let montoPedido = 0;
        
        if (typeof data.total_usd === "number") {
          montoPedido = data.total_usd;
        } else if (typeof data.total_usd === "string") {
          montoPedido = parseFloat(data.total_usd) || 0;
        }
        
        ingresos += montoPedido;
        items++;

        // Agrupar por fecha
        if (data.fecha_creacion) {
          const dateObj = data.fecha_creacion.toDate ? data.fecha_creacion.toDate() : new Date(data.fecha_creacion);
          if (!isNaN(dateObj.getTime())) {
            // Normalizar a la medianoche para agrupar por día exacto
            const dayStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();
            ingresosPorDia.set(dayStart, (ingresosPorDia.get(dayStart) || 0) + montoPedido);
          }
        }
      });

      // Convertir Map a Array ordenado cronológicamente para el gráfico
      const datosGrafico = Array.from(ingresosPorDia.entries())
        .sort(([a], [b]) => a - b)
        .map(([ts, total]) => ({
          fecha: new Date(ts).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }),
          ingresos: Number(total.toFixed(2))
        }));

      setGraficoIngresos(datosGrafico);
      setMetricas(prev => ({
        ...prev,
        ingresosTotales: ingresos,
        itemsVendidos: items
      }));
    });

    return () => {
      unsubSesiones();
      unsubPedidos();
    };
  }, []);

  // Datos para la Dona de Conversión (Colores integrados)
  const sesionesPendientes = metricas.totalSesiones - metricas.ventasCerradas;
  const datosDona = [
    { name: "Cerradas", value: metricas.ventasCerradas, fill: "#059669" },
    { name: "Abandonadas", value: sesionesPendientes > 0 ? sesionesPendientes : 0, fill: "#e2e8f0" }
  ];
  const tasaConversion = metricas.totalSesiones > 0 
    ? ((metricas.ventasCerradas / metricas.totalSesiones) * 100).toFixed(1) 
    : "0.0";

  return (
    <div style={{ flex: 1, padding: "2.5rem", overflowY: "auto", backgroundColor: "#f0f2f5" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Cabecera */}
        <div style={{ borderBottom: "2px solid #d1d5db", paddingBottom: "1.5rem", marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h2 style={{ color: "#000000", fontSize: "2rem", margin: "0 0 0.5rem 0", fontWeight: 800 }}>
              Rendimiento del Bot
            </h2>
            <p style={{ color: "#475569", fontSize: "1.05rem", margin: 0, fontWeight: 500 }}>
              Métricas financieras y operativas sincronizadas en vivo.
            </p>
          </div>
          {cargando && (
            <span style={{ color: "#0055FF", fontWeight: 700, fontSize: "0.9rem", backgroundColor: "#eff6ff", padding: "0.5rem 1rem", borderRadius: "2rem" }}>
              Actualizando...
            </span>
          )}
        </div>

        {/* KPIs Superiores */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #0055FF" }}>
            <h3 style={{ color: "#475569", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0", fontWeight: 800 }}>Sesiones</h3>
            <div style={{ color: "#000000", fontSize: "2.2rem", fontWeight: 800 }}>{metricas.totalSesiones}</div>
          </div>
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #eab308" }}>
            <h3 style={{ color: "#475569", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0", fontWeight: 800 }}>Ingresos Totales</h3>
            <div style={{ color: "#000000", fontSize: "2.2rem", fontWeight: 800 }}>
              <span style={{ fontSize: "1.5rem", color: "#64748b" }}>$</span>{metricas.ingresosTotales.toFixed(2)}
            </div>
          </div>
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #ec4899" }}>
            <h3 style={{ color: "#475569", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0", fontWeight: 800 }}>Ítems Vendidos</h3>
            <div style={{ color: "#000000", fontSize: "2.2rem", fontWeight: 800 }}>{metricas.itemsVendidos}</div>
          </div>
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", borderLeft: "5px solid #8b5cf6" }}>
            <h3 style={{ color: "#475569", fontSize: "0.85rem", textTransform: "uppercase", margin: "0 0 0.5rem 0", fontWeight: 800 }}>Tiempo Promedio</h3>
            <div style={{ color: "#000000", fontSize: "2.2rem", fontWeight: 800 }}>
              {metricas.tiempoPromedio} <span style={{ fontSize: "1rem", color: "#64748b" }}>min</span>
            </div>
          </div>
        </div>

        {/* Zona de Gráficos */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Gráfico de Dona: Tasa de Conversión */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <h3 style={{ color: "#000000", fontSize: "1.1rem", margin: "0 0 1rem 0", fontWeight: 800, width: "100%" }}>
              Tasa de Conversión
            </h3>
            <div style={{ position: "relative", width: "100%", height: "250px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={datosDona}
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} Sesiones`, ""]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#000000" }}>{tasaConversion}%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "1rem", fontSize: "0.9rem", fontWeight: 600 }}>
              <span style={{ color: "#059669" }}>● Cerradas: {metricas.ventasCerradas}</span>
              <span style={{ color: "#94a3b8" }}>● Pendientes: {sesionesPendientes}</span>
            </div>
          </div>

          {/* Gráfico de Línea: Serie de Tiempo de Ingresos */}
          <div style={{ backgroundColor: "#ffffff", padding: "1.5rem", borderRadius: "0.75rem", border: "1px solid #d1d5db" }}>
            <h3 style={{ color: "#000000", fontSize: "1.1rem", margin: "0 0 1rem 0", fontWeight: 800 }}>
              Ingresos por Día (USD)
            </h3>
            <div style={{ width: "100%", height: "280px" }}>
              {graficoIngresos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={graficoIngresos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      formatter={(value) => [`$${value}`, "Ingresos"]}
                      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", fontWeight: 700 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      stroke="#FF6B00" 
                      strokeWidth={4} 
                      dot={{ r: 5, fill: "#FF6B00", strokeWidth: 0 }} 
                      activeDot={{ r: 8, stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center", color: "#64748b", fontWeight: 500 }}>
                  Aún no hay datos de ventas para graficar.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}