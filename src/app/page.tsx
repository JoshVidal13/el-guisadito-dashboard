"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Lightbulb, 
  AlertTriangle,
  Users,
  Target,
  PieChart as PieChartIcon,
  BarChart2,
  Activity,
  Award
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

const COLORS_EGRESOS = ['#f43f5e', '#fb923c', '#eab308', '#ec4899', '#a855f7', '#6366f1'];
const COLORS_INGRESOS = ['#3b82f6', '#10b981', '#14b8a6', '#0ea5e9', '#6366f1', '#8b5cf6'];

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

  // Ratio de Salud Financiera (Gastos sobre Ingresos)
  const healthRatio = totalIngresos > 0 ? (totalEgresos / totalIngresos) * 100 : 0;
  let healthStatus = "Crítico";
  let healthColor = "text-rose-500 bg-rose-500/10 border-rose-500/30";
  let healthBar = "bg-rose-500";
  let healthMessage = "Tus gastos están superando los límites operativos seguros.";
  if (healthRatio < 40) {
    healthStatus = "Excelente";
    healthColor = "text-emerald-400 bg-emerald-400/10 border-emerald-400/30";
    healthBar = "bg-emerald-400";
    healthMessage = "Gran rentabilidad. Los costos operativos están bajo control.";
  } else if (healthRatio < 70) {
    healthStatus = "Estable";
    healthColor = "text-amber-400 bg-amber-400/10 border-amber-400/30";
    healthBar = "bg-amber-400";
    healthMessage = "Costos normales, pero se recomienda vigilar rubros variables.";
  }

  // Datos para gráfico de área (Flujo 7 días)
  const days = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  const chartData = days.map(day => ({ name: day, ingresos: 0, egresos: 0, neto: 0 }));

  // Datos para el PieChart de categorías y BarChart Comparativo
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

  const pieDataIngresos = Object.entries(ingresosObj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top 5 comparativo
  const allCategories = [...pieDataIngresos, ...pieDataEgresos].sort((a, b) => b.value - a.value).slice(0, 7);

  const topIngresoCategory = pieDataIngresos[0];

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando Centro de Control Analítico...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto pb-10">
      
      {/* Header Corporativo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass p-6 rounded-2xl border border-brand-border">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-emerald-400 to-blue-500 flex items-center gap-3">
            <Activity className="text-brand-primary" size={32} /> Inteligencia de Negocio
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Análisis profundo en tiempo real de tu rentabilidad y operaciones.</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
            Sincronizado
          </div>
        </div>
      </div>

      {/* Salud Financiera y Meta Mensual (Sección Analítica Principal) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Meta Mensual Global */}
        <div className="glass p-6 rounded-2xl border border-brand-border group hover:border-brand-primary/50 transition-colors relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Target size={120} />
          </div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Target size={18} className="text-brand-primary" /> Objetivo Comercial Mensual
              </h3>
              <p className="text-3xl font-black text-white mt-2">{formatCurrency(totalIngresos)} <span className="text-lg font-bold text-slate-500">/ {metaMensual > 0 ? formatCurrency(metaMensual) : 'Sin Meta'}</span></p>
            </div>
            <span className="text-brand-primary font-black text-3xl drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">{metaProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-4 overflow-hidden border border-slate-800 relative z-10 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-emerald-500 to-brand-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
              style={{ width: `${metaProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Termómetro de Salud Financiera */}
        <div className={`p-6 rounded-2xl border ${healthColor} relative overflow-hidden transition-colors backdrop-blur-md`}>
           <div className="absolute -right-4 -top-4 opacity-10">
            <Activity size={120} />
          </div>
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Lightbulb size={18} /> Salud Financiera Operativa
              </h3>
              <p className="text-3xl font-black mt-2">{healthStatus}</p>
              <p className="text-xs font-semibold mt-1 opacity-80 max-w-[250px]">{healthMessage}</p>
            </div>
            <div className="text-right">
              <span className="font-black text-3xl">{healthRatio.toFixed(1)}%</span>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Ratio de Gasto</p>
            </div>
          </div>
          <div className="w-full bg-black/20 rounded-full h-4 overflow-hidden border border-white/10 relative z-10 shadow-inner">
            <div 
              className={`${healthBar} h-full transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} 
              style={{ width: `${Math.min(healthRatio, 100)}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* KPI Cards (Métricas Generales) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border hover:border-emerald-500/30 transition-all shadow-lg shadow-black/20 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Balance Neto</p>
              <h3 className={`text-2xl lg:text-3xl font-black mt-1 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {balance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(balance))}
              </h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border hover:border-blue-500/30 transition-all shadow-lg shadow-black/20 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Ingresos Totales</p>
              <h3 className="text-2xl lg:text-3xl font-black text-blue-400 mt-1">{formatCurrency(totalIngresos)}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border hover:border-rose-500/30 transition-all shadow-lg shadow-black/20 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Egresos Totales</p>
              <h3 className="text-2xl lg:text-3xl font-black text-rose-400 mt-1">{formatCurrency(totalEgresos)}</h3>
            </div>
            <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400 group-hover:scale-110 transition-transform">
              <TrendingDown size={24} />
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4 border border-brand-border bg-gradient-to-br from-indigo-900/30 to-purple-900/30 hover:border-indigo-400/50 transition-all shadow-lg shadow-indigo-900/20 group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-indigo-200/70 text-xs font-bold uppercase tracking-widest">Margen de Ganancia</p>
              <h3 className={`text-2xl lg:text-3xl font-black mt-1 ${margin >= 20 ? "text-emerald-400" : margin >= 0 ? "text-yellow-400" : "text-rose-400"}`}>
                {margin.toFixed(1)}%
              </h3>
            </div>
            <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-300 group-hover:scale-110 transition-transform">
              <PieChartIcon size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos Multidimensionales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico 1: Área (Evolución de Flujo - Principal) */}
        <div className="lg:col-span-3 glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="text-brand-primary" size={20} /> Rendimiento Dinámico del Efectivo
            </h3>
            <span className="text-xs text-brand-primary/80 bg-brand-primary/10 px-3 py-1 rounded-full font-bold uppercase tracking-widest">Vista 7 días</span>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresosMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresosMain" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Area name="Ingresos Reales" type="monotone" dataKey="ingresos" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorIngresosMain)" />
                <Area name="Gastos Operativos" type="monotone" dataKey="egresos" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorEgresosMain)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico 2: Pastel (Composición de Ingresos) */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="text-blue-400" size={20} /> Motores de Ingreso
            </h3>
          </div>
          <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
            {pieDataIngresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Pie
                    data={pieDataIngresos}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieDataIngresos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_INGRESOS[index % COLORS_INGRESOS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 italic font-semibold">Esperando primeras ventas...</p>
            )}
          </div>
        </div>

        {/* Gráfico 3: Pastel (Distribución de Egresos) */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-400" size={20} /> Fugas de Capital
            </h3>
          </div>
          <div className="flex-1 min-h-[280px] w-full flex items-center justify-center">
            {pieDataEgresos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ fontWeight: 'bold' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Pie
                    data={pieDataEgresos}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieDataEgresos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_EGRESOS[index % COLORS_EGRESOS.length]} />
                    ))}
                  </Pie>
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500 italic font-semibold">Costos no registrados...</p>
            )}
          </div>
        </div>

        {/* Gráfico 4: Top Categorías Global (Barras) */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart2 className="text-brand-primary" size={20} /> Impacto por Categoría
            </h3>
          </div>
          <div className="flex-1 min-h-[280px] w-full">
            {allCategories.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allCategories} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any) => `$${Number(value).toLocaleString()}`}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {allCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieDataIngresos.find(i => i.name === entry.name) ? '#3b82f6' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500 italic font-semibold">Sin datos suficientes</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Operación Estratégica Rápida */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        
        {/* Bloque de Insights de IA */}
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Lightbulb size={120} />
          </div>
          <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4 relative z-10">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Sugerencias Estratégicas Automáticas</h3>
          </div>
          
          <div className="space-y-4 relative z-10">
            {topIngresoCategory && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-blue-500/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 shrink-0"><Award size={18}/></div>
                  <div>
                    <h4 className="font-bold text-blue-400 text-sm">Escala tu Ganador</h4>
                    <p className="text-sm text-slate-300 mt-1">
                      <span className="font-bold text-white">{topIngresoCategory.name}</span> es tu principal fuente de ingresos. Diseña promociones específicas para este rubro.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {pieDataEgresos[0] && (
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-rose-500/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400 shrink-0"><AlertTriangle size={18}/></div>
                  <div>
                    <h4 className="font-bold text-rose-400 text-sm">Optimización de Costos</h4>
                    <p className="text-sm text-slate-300 mt-1">
                      Audita mensualmente los gastos en <span className="font-bold text-white">{pieDataEgresos[0].name}</span>, representa tu fuga principal de capital operativo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recursos Humanos y Proveedores */}
        <div className="glass p-6 rounded-2xl border border-brand-border flex flex-col gap-4">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2 border-b border-slate-800 pb-4">
            <Users size={20} className="text-emerald-400"/> Top Desempeño y Operativa
          </h3>
          
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-4 hover:bg-slate-800/60 transition-colors">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-black">1</div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sucursal / Equipo Líder</p>
              <h4 className="text-white font-bold text-lg leading-tight mt-0.5">Operativa Diurna</h4>
              <p className="text-emerald-400 text-xs mt-1 font-semibold">Mayor retención de margen</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-4 hover:bg-slate-800/60 transition-colors">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-black">★</div>
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Socio Estratégico</p>
              <h4 className="text-white font-bold text-lg leading-tight mt-0.5">Carnicería Principal</h4>
              <p className="text-blue-400 text-xs mt-1 font-semibold">Estabilidad de precios validada</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
