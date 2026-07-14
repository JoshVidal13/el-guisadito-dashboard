"use client";

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Lightbulb, 
  AlertTriangle,
  Users,
  Truck,
  Utensils
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const mockData = [
  { name: 'Lun', ingresos: 4000, egresos: 2400 },
  { name: 'Mar', ingresos: 3000, egresos: 1398 },
  { name: 'Mie', ingresos: 2000, egresos: 9800 },
  { name: 'Jue', ingresos: 2780, egresos: 3908 },
  { name: 'Vie', ingresos: 1890, egresos: 4800 },
  { name: 'Sab', ingresos: 2390, egresos: 3800 },
  { name: 'Dom', ingresos: 3490, egresos: 4300 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard Financiero</h1>
          <p className="text-slate-400 mt-1">Resumen de la semana actual (13/07 - 19/07)</p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary font-medium text-sm flex items-center gap-2 w-fit">
          <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
          Semana Activa (Ingresos)
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Balance Total</p>
              <h3 className="text-3xl font-bold text-white mt-1">$24,500.00</h3>
            </div>
            <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
              <DollarSign size={24} />
            </div>
          </div>
          <div className="text-sm flex items-center gap-1 text-emerald-400">
            <TrendingUp size={16} />
            <span>+12.5% vs semana anterior</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Ingresos (Semana Activa)</p>
              <h3 className="text-3xl font-bold text-emerald-400 mt-1">$19,550.00</h3>
            </div>
            <div className="p-3 bg-emerald-400/10 rounded-xl text-emerald-400">
              <TrendingUp size={24} />
            </div>
          </div>
          <div className="text-sm flex items-center gap-1 text-slate-400">
            <span>Proyección de cierre: $22,000</span>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-sm font-medium">Egresos (Semana Descanso)</p>
              <h3 className="text-3xl font-bold text-rose-400 mt-1">$8,200.00</h3>
            </div>
            <div className="p-3 bg-rose-400/10 rounded-xl text-rose-400">
              <TrendingDown size={24} />
            </div>
          </div>
          <div className="text-sm flex items-center gap-1 text-slate-400">
            <span>Insumos y Pagas pendientes</span>
          </div>
        </div>
      </div>

      {/* Operación y Eficiencia */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-brand-border/50">
          <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
            <Users size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Empleado del Mes</p>
            <h4 className="text-white font-bold mt-0.5">Carlos Ruiz</h4>
            <p className="text-emerald-400 text-xs font-medium mt-1">Mayor eficiencia en mesas</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-brand-border/50">
          <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Top Proveedor</p>
            <h4 className="text-white font-bold mt-0.5">Carnicería La Fina</h4>
            <p className="text-slate-400 text-xs font-medium mt-1">Representa el 45% del gasto</p>
          </div>
        </div>

        <div className="glass p-5 rounded-2xl flex items-center gap-4 border border-brand-border/50">
          <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Estrella del Menú</p>
            <h4 className="text-white font-bold mt-0.5">Tacos al Pastor</h4>
            <p className="text-emerald-400 text-xs font-medium mt-1">+20% pedidos vs sem. pasada</p>
          </div>
        </div>
      </div>

      {/* Gráfica y Optimización */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6 rounded-2xl">
          <h3 className="text-lg font-semibold text-white mb-6">Flujo de Efectivo</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Area type="monotone" dataKey="ingresos" stroke="#10b981" fillOpacity={1} fill="url(#colorIngresos)" />
                <Area type="monotone" dataKey="egresos" stroke="#f43f5e" fillOpacity={1} fill="url(#colorEgresos)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Módulo de Optimización de Recursos */}
        <div className="glass p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-lg font-semibold text-white">Análisis de IA por Ciclo</h3>
          </div>
          
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            <div className="p-4 rounded-xl bg-slate-800/50 border border-brand-border/50 hover:border-brand-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Egreso: Gas Inusual</h4>
                  <p className="text-xs text-slate-400 mt-1">El gasto en la categoría &quot;Gas&quot; durante el ciclo de descanso (Semana 20-26) es alto. Sugerimos cotizar alternativas.</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-brand-border/50 hover:border-emerald-500/30 transition-colors">
              <div className="flex items-start gap-3">
                <TrendingUp size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Ingreso: Ventas Nocturnas</h4>
                  <p className="text-xs text-slate-400 mt-1">La categoría &quot;Ventas Nocturnas&quot; generó el 60% de tus ingresos del último ciclo de trabajo. ¡Día fuerte detectado!</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-slate-800/50 border border-brand-border/50 hover:border-brand-primary/30 transition-colors">
              <div className="flex items-start gap-3">
                <DollarSign size={18} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-slate-200">Inversión Sugerida</h4>
                  <p className="text-xs text-slate-400 mt-1">Tienes un balance general positivo. Destinar una parte a la categoría &quot;Inversión/Mobiliario&quot; deducirá impuestos.</p>
                </div>
              </div>
            </div>
          </div>
          
          <button className="mt-4 w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold transition-colors">
            Actualizar Análisis
          </button>
        </div>
      </div>
    </div>
  );
}
