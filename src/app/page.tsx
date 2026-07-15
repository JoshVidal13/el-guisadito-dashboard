"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Lightbulb, 
  AlertTriangle,
  Users,
  Truck,
  Utensils,
  Target,
  PieChart as PieChartIcon,
  BarChart2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { useState, useEffect } from "react";
import { getRecords } from "@/actions/finance";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [records, setRecords] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [metaMensual, setMetaMensual] = useState<number>(0);

  useEffect(() => {
    async function load() {
      const data = await getRecords();
      setRecords(data);
      
      const savedMeta = localStorage.getItem("elguisadito_meta");
      if (savedMeta) setMetaMensual(Number(savedMeta));

      setIsLoaded(true);
    }
    load();
  }, []);

  const totalIngresos = records.filter(r => r.type === "ingreso").reduce((sum, r) => sum + r.amount, 0);
  const totalEgresos = records.filter(r => r.type === "egreso").reduce((sum, r) => sum + r.amount, 0);
  const balance = totalIngresos - totalEgresos;
  const margin = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;
  
  const metaProgress = metaMensual > 0 ? Math.min((totalIngresos / metaMensual) * 100, 100) : 0;

  // Datos para gráfico de área (Flujo 7 días)
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const chartData = days.map(day => ({ name: day, ingresos: 0, egresos: 0, neto: 0 }));

  // Datos para el PieChart de categorías de Egresos
  const egresosObj: Record<string, number> = {};
  const ingresosObj: Record<string, number> = {};

  records.forEach(r => {
    const [d, m, y] = r.date.split('/');
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const dayOfWeek = dateObj.getDay(); 
    const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    if (r.type === "ingreso") {
      chartData[index].ingresos += r.amount;
      ingresosObj[r.category] = (ingresosObj[r.category] || 0) + r.amount;
    } else {
      chartData[index].egresos += r.amount;
      egresosObj[r.category] = (egresosObj[r.category] || 0) + r.amount;
    }
    chartData[index].neto = chartData[index].ingresos - chartData[index].egresos;
  });

  const pieDataEgresos = Object.entries(egresosObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topIngresoCategory = Object.entries(ingresosObj).sort((a, b) => b[1] - a[1])[0];

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando Centro de Control...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            Dashboard Corporativo
          </h1>
          <p className="text-slate-400 mt-1">Visión integral 360° de tu negocio en tiempo real</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm flex items-center gap-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sistema Operativo
          </div>
        </div>
      </div>

      {/* Meta Mensual Global */}
      {metaMensual > 0 && (
        <div className="glass p-5 rounded-2xl border border-brand-border group hover:border-brand-primary/50 transition-colors">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Target size={16} className="text-brand-primary" /> Rendimiento Global vs Meta
              </h3>
              <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalIngresos)} <span className="text-sm font-normal text-slate-400">/ {formatCurrency(metaMensual)}</span></p>
            </div>
            <span className="text-brand-primary font-bold text-xl">{metaProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-500 via-emerald-500 to-brand-primary h-full transition-all duration-1000 ease-out" 
              style={{ width: `${metaProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* KPI Cards (Nivel Superior) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Balance General</p>
              <h3 className={`text-3xl font-black mt-1 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balance))}
              </h3>
            </div>
            <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Ingresos</p>
              <h3 className="text-3xl font-black text-blue-400 mt-1">{formatCurrency(totalIngresos)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Total Egresos</p>
              <h3 className="text-3xl font-black text-rose-400 mt-1">{formatCurrency(totalEgresos)}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border bg-gradient-to-br from-indigo-900/30 to-purple-900/30 group hover:-translate-y-1 transition-transform">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Margen Real</p>
              <h3 className={`text-3xl font-black mt-1 ${margin >= 20 ? "text-emerald-400" : margin >= 0 ? "text-yellow-400" : "text-rose-400"}`}>
                {margin.toFixed(1)}%
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
              <PieChartIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Análisis Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico 1: Área (Evolución Semanal de Flujo) */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="text-blue-400" size={20} /> Flujo de Efectivo
            </h3>
            <span className="text-xs text-slate-500 font-bold uppercase">Consolidado 7 días</span>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresosMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresosMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle"/>
                <Area name="Ingresos" type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresosMain)" />
                <Area name="Gastos" type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorEgresosMain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Pastel (Distribución de Gastos) */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PieChartIcon className="text-rose-400" size={20} /> Fugas de Capital (Egresos)
            </h3>
            <span className="text-xs text-slate-500 font-bold uppercase">Distribución Total</span>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            {pieDataEgresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                  <Pie
                    data={pieDataEgresos}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieDataEgresos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 italic">No hay suficientes datos de gastos</p>
            )}
          </div>
        </div>

      </div>

      {/* Operación Estratégica e Inteligencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Bloque de Insights y Optimización */}
        <div className="md:col-span-2 glass p-6 rounded-2xl border border-brand-border">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Centro de Optimización de Negocio</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-1"><TrendingUp size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-200">Producto Estrella</h4>
                  <p className="text-sm text-slate-400 mt-1">La categoría líder actualmente es <span className="text-emerald-400 font-bold">{topIngresoCategory ? topIngresoCategory[0] : "N/A"}</span>. ¡Aumenta el inventario ahí!</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-amber-500/50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 mt-1"><AlertTriangle size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-200">Alerta de Fuga</h4>
                  <p className="text-sm text-slate-400 mt-1">Tu mayor gasto se concentra en <span className="text-rose-400 font-bold">{pieDataEgresos[0] ? pieDataEgresos[0].name : "N/A"}</span>. Considera renegociar con proveedores.</p>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-brand-primary/50 transition-colors md:col-span-2">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary mt-1"><Target size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-200">Sugerencia Estratégica</h4>
                  <p className="text-sm text-slate-400 mt-1">
                    Con un margen neto de <strong>{margin.toFixed(1)}%</strong>, tu negocio está operando {margin >= 20 ? 'de manera altamente rentable.' : margin > 0 ? 'con ganancias, pero se puede optimizar los insumos.' : 'con pérdidas, necesitas reducir costos fijos de inmediato.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Empleados / Operativa Rápida */}
        <div className="glass p-6 rounded-2xl border border-brand-border flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Users size={20} className="text-blue-400"/> Equipo y Operativa
          </h3>
          
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">👨‍🍳</div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase">Cocinero Estrella</p>
              <h4 className="text-white font-bold">María Gómez</h4>
              <p className="text-emerald-400 text-xs mt-0.5">Tiempo récord en pedidos</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">🚚</div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase">Proveedor Clave</p>
              <h4 className="text-white font-bold">Carnicería La Fina</h4>
              <p className="text-blue-400 text-xs mt-0.5">Abastecimiento puntual</p>
            </div>
          </div>

          <button className="mt-auto w-full py-3 rounded-xl bg-slate-800 hover:bg-brand-primary hover:text-black text-white font-bold transition-all">
            Ver Configuración
          </button>
        </div>

      </div>
    </div>
  );
}
