"use client";

import { useState, useEffect } from "react";
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle, PieChart as PieChartIcon, Calendar as CalendarIcon, Star, Target, BarChart2, Trash2, TrendingUp } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord, deleteRecord } from "@/actions/finance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts";

type FinanceRecord = {
  id: string;
  date: number; // Day of month extracted from server response
  type: "ingreso" | "egreso";
  amount: number;
  category: string;
};

const DEFAULT_INGRESO = ["Ventas Matutinas", "Ventas Vespertinas", "Ventas Nocturnas", "Eventos/Catering", "Otros"];
const DEFAULT_EGRESO = ["Insumos (Carne/Verdura)", "Gas", "Agua", "Pagas (Nómina)", "Inversión/Mobiliario", "Otros"];

const WEEKS = [
  { id: 1, title: "Semana 1 (Trabajo)", start: 13, end: 19, month: "Julio" },
  { id: 2, title: "Semana 2 (Descanso)", start: 20, end: 26, month: "Julio" },
];

export default function CyclesPage() {
  const [selectedWeekId, setSelectedWeekId] = useState<number>(1);
  const activeWeek = WEEKS.find(w => w.id === selectedWeekId) || WEEKS[0];
  const toast = useToast();
  
  // Generar los 7 días de la semana activa
  const weekDays = Array.from({ length: 7 }, (_, i) => activeWeek.start + i);
  const weekDayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [categoriasIngreso, setCategoriasIngreso] = useState(DEFAULT_INGRESO);
  const [categoriasEgreso, setCategoriasEgreso] = useState(DEFAULT_EGRESO);

  useEffect(() => {
    async function load() {
      const data = await getRecords();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = data.map((r: any) => ({
        id: r.id,
        date: parseInt(r.date.split('/')[0], 10),
        type: r.type,
        amount: r.amount,
        category: r.category
      }));
      setRecords(mapped);

      const savedIngresos = localStorage.getItem("elguisadito_ingresos");
      if (savedIngresos) setCategoriasIngreso(JSON.parse(savedIngresos));

      const savedEgresos = localStorage.getItem("elguisadito_egresos");
      if (savedEgresos) setCategoriasEgreso(JSON.parse(savedEgresos));
      
      setIsLoaded(true);
    }
    load();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(13);
  
  // Form state
  const [formType, setFormType] = useState<"ingreso" | "egreso">("ingreso");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");

  useEffect(() => {
    if (formType === "ingreso" && categoriasIngreso.length > 0) setFormCategory(categoriasIngreso[0]);
    if (formType === "egreso" && categoriasEgreso.length > 0) setFormCategory(categoriasEgreso[0]);
  }, [formType, categoriasIngreso, categoriasEgreso]);

  // Filtrar registros SOLO para la semana activa
  const weekRecords = records.filter(r => r.date >= activeWeek.start && r.date <= activeWeek.end);

  const totalIngresos = weekRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = weekRecords.filter(r => r.type === "egreso").reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIngresos - totalEgresos;
  const margin = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;

  // Agrupar por categoría en base a los registros de la semana activa
  const ingresosPorCategoria = categoriasIngreso.map(cat => ({
    name: cat,
    total: weekRecords.filter(r => r.type === "ingreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const egresosPorCategoria = categoriasEgreso.map(cat => ({
    name: cat,
    total: weekRecords.filter(r => r.type === "egreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  // Insights Rápidos
  const dailyIncome = weekRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
    return acc;
  }, {} as Record<number, number>);
  
  let bestDay = { date: "N/A", amount: 0 };
  Object.entries(dailyIncome).forEach(([date, amount]) => {
    if (amount > bestDay.amount) bestDay = { date: `${date} ${activeWeek.month}`, amount };
  });

  let biggestExpense = { category: "N/A", amount: 0 };
  if (egresosPorCategoria.length > 0) {
    biggestExpense = { category: egresosPorCategoria[0].name, amount: egresosPorCategoria[0].total };
  }

  // Prepara datos para las gráficas Recharts
  const chartData = weekDays.map((day, idx) => {
    const dayRecords = weekRecords.filter(r => r.date === day);
    const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((a, b) => a + b.amount, 0);
    const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((a, b) => a + b.amount, 0);
    const netDay = dayIngresos - dayEgresos;
    return {
      name: weekDayNames[idx],
      day: day,
      Ingresos: dayIngresos,
      Gastos: dayEgresos,
      Neto: netDay
    };
  });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formCategory) return;
    
    const dayStr = selectedDate.toString().padStart(2, '0');
    const dateStr = `${dayStr}/07/2026`; 

    toast(`Guardando en el servidor...`, "info");
    const res = await addRecord({
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
      dateStr
    });

    if (res.success) {
      const data = await getRecords();
      const mapped = data.map((r: any) => ({
        id: r.id,
        date: parseInt(r.date.split('/')[0], 10),
        type: r.type,
        amount: r.amount,
        category: r.category
      }));
      setRecords(mapped);
      setFormAmount("");
      toast("Registro añadido exitosamente");
    } else {
      toast("Error al guardar", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Eliminar este registro permanentemente?")) {
      toast("Eliminando...", "info");
      const res = await deleteRecord(id);
      if (res.success) {
        setRecords(records.filter(r => r.id !== id));
        toast("Registro eliminado");
      } else {
        toast("Error al eliminar", "error");
      }
    }
  };

  const openModalForDate = (date: number) => {
    setSelectedDate(date);
    setFormType("ingreso");
    setFormAmount("");
    setIsModalOpen(true);
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando plataforma corporativa...</div>;

  const selectedDayRecords = records.filter(r => r.date === selectedDate);
  const dayBalance = selectedDayRecords.reduce((acc, r) => acc + (r.type === 'ingreso' ? r.amount : -r.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <CalendarIcon className="text-brand-primary" size={32} />
            Ciclos de Operación
          </h1>
          <p className="text-slate-400 mt-1">Supervisa ingresos y egresos detallados por semana.</p>
        </div>

        {/* Selector de Semanas */}
        <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-brand-border/50">
          {WEEKS.map(week => (
            <button
              key={week.id}
              onClick={() => setSelectedWeekId(week.id)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                selectedWeekId === week.id 
                  ? "bg-brand-primary text-brand-bg shadow-md" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {week.title}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowUpCircle size={64} className="text-blue-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Ingresos (Semana)</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalIngresos.toLocaleString()}</p>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ArrowDownCircle size={64} className="text-rose-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Gastos (Semana)</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalEgresos.toLocaleString()}</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-emerald-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Balance Neto</h3>
          <p className={`text-3xl font-bold relative z-10 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {balance >= 0 ? '+' : '-'}${Math.abs(balance).toLocaleString()}
          </p>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform bg-gradient-to-br from-indigo-900/30 to-purple-900/30">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <PieChartIcon size={64} className="text-indigo-400"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Margen Neta</h3>
          <p className={`text-3xl font-bold relative z-10 ${margin >= 20 ? "text-emerald-400" : margin >= 0 ? "text-yellow-400" : "text-rose-400"}`}>
            {margin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Grilla Semanal Expandida */}
      <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg shadow-black/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Detalle Operativo Diario</h2>
          <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-sm font-bold">
            {activeWeek.start} al {activeWeek.end} de {activeWeek.month}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Celdas de días en formato lista vertical */}
          {weekDays.map((day, idx) => {
            const dayRecords = weekRecords.filter(r => r.date === day);
            
            const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((a, b) => a + b.amount, 0);
            const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((a, b) => a + b.amount, 0);
            const dayTotal = dayIngresos - dayEgresos;
            
            const bgClass = selectedWeekId === 1 ? "bg-blue-900/10 hover:bg-blue-900/30 border-blue-900/30" : "bg-rose-900/10 hover:bg-rose-900/30 border-rose-900/30";

            return (
              <div 
                key={day} 
                onClick={() => openModalForDate(day)}
                className={`${bgClass} rounded-xl border p-4 cursor-pointer transition-all group relative flex flex-col md:flex-row md:items-center gap-4`}
              >
                {/* Cabecera del Día */}
                <div className="flex items-center gap-4 md:w-48 shrink-0">
                  <div className="text-lg font-bold w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 group-hover:bg-brand-primary group-hover:text-brand-bg group-hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-colors">
                    {day}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-300 font-bold uppercase tracking-wider">{weekDayNames[idx]}</span>
                    <span className="text-xs text-slate-500">{dayRecords.length} movimientos</span>
                  </div>
                </div>
                
                {/* Lista de Transacciones (Wrap en lugar de Scroll) */}
                <div className="flex-1 flex flex-wrap gap-3 pb-2 md:pb-0">
                  {dayRecords.length === 0 && <p className="text-sm text-slate-500 italic flex items-center h-full">Haz clic para añadir un registro...</p>}
                  {dayRecords.map(rec => (
                    <div 
                      key={rec.id} 
                      className={`min-w-[120px] max-w-[180px] px-3 py-2 rounded-lg flex flex-col shadow-sm ${
                        rec.type === 'ingreso' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                      }`}
                    >
                      <span className="truncate opacity-80 mb-1 text-[11px] uppercase tracking-wider font-bold">{rec.category}</span>
                      <span className="text-sm font-black">${rec.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                {/* Resumen Total a la derecha */}
                <div className="md:w-32 shrink-0 md:text-right flex justify-between md:block items-center border-t md:border-t-0 border-brand-border/50 pt-3 md:pt-0">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest md:hidden">Balance Neto:</span>
                  {(dayIngresos > 0 || dayEgresos > 0) ? (
                    <div className={`text-xl font-black ${dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-xl font-black text-slate-600">$0</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Visuals (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico Comparativo: Ingresos vs Gastos */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg shadow-black/20">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart2 className="text-blue-400" size={20} /> Flujo Diario (Ingresos vs Gastos)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar dataKey="Ingresos" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Tendencia Neta */}
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg shadow-black/20">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={20} /> Tendencia de Rentabilidad (Neto)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNeto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="Neto" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNeto)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribuciones en Barras/Pie y Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Star size={16} className="text-yellow-500"/> Desempeño Clave
          </h3>
          <div className="space-y-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Mejor Día de Ventas</p>
              <p className="font-bold text-xl text-emerald-400">{bestDay.date !== "N/A" ? `${bestDay.date}` : "Sin datos"}</p>
              {bestDay.date !== "N/A" && <p className="text-sm font-semibold text-emerald-500 mt-1">${bestDay.amount.toLocaleString()}</p>}
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Mayor Gasto Registrado</p>
              <p className="font-bold text-xl text-rose-400">{biggestExpense.category !== "N/A" ? `${biggestExpense.category}` : "Sin datos"}</p>
              {biggestExpense.category !== "N/A" && <p className="text-sm font-semibold text-rose-500 mt-1">${biggestExpense.amount.toLocaleString()}</p>}
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 mb-1">Volumen Transaccional</p>
              <p className="font-bold text-xl text-blue-400">{weekRecords.length} movimientos</p>
            </div>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Target size={16}/> Composición de Ingresos
          </h3>
          <div className="space-y-5">
            {ingresosPorCategoria.length === 0 && <p className="text-slate-500 text-sm italic">Sin datos</p>}
            {ingresosPorCategoria.map(cat => (
              <div key={cat.name} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-semibold">{cat.name}</span>
                  <span className="font-bold text-blue-400">${cat.total.toLocaleString()} ({(cat.total / totalIngresos * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(cat.total / totalIngresos) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border shadow-lg">
          <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <BarChart2 size={16}/> Distribución de Gastos
          </h3>
          <div className="space-y-5">
            {egresosPorCategoria.length === 0 && <p className="text-slate-500 text-sm italic">Sin datos</p>}
            {egresosPorCategoria.map(cat => (
              <div key={cat.name} className="group">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-semibold">{cat.name}</span>
                  <span className="font-bold text-rose-400">${cat.total.toLocaleString()} ({(cat.total / totalEgresos * 100).toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(cat.total / totalEgresos) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal del Día */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Panel del Día: ${selectedDate} de ${activeWeek.month}`}>
        
        {/* Resumen de transacciones existentes */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider">Movimientos del Día</h3>
            <span className={`font-black ${dayBalance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>Neto: {dayBalance >= 0 ? '+' : '-'}${Math.abs(dayBalance).toLocaleString()}</span>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {selectedDayRecords.length === 0 ? (
              <p className="text-slate-500 text-sm italic text-center py-4 bg-slate-900/50 rounded-lg">Sin movimientos registrados este día.</p>
            ) : (
              selectedDayRecords.map(rec => (
                <div key={rec.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-900 border border-brand-border hover:border-slate-500 transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 font-semibold uppercase">{rec.category}</span>
                    <span className={`font-bold ${rec.type === 'ingreso' ? 'text-blue-400' : 'text-rose-400'}`}>
                      {rec.type === 'ingreso' ? '+' : '-'}${rec.amount.toLocaleString()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDelete(rec.id)}
                    className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Eliminar registro"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border-t border-brand-border pt-6">
          <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider mb-4">Añadir Nuevo Movimiento</h3>
          <form onSubmit={handleAddRecord} className="space-y-5">
            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => { setFormType("ingreso"); setFormCategory(categoriasIngreso[0]); }}
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${formType === "ingreso" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                + Ingreso
              </button>
              <button
                type="button"
                onClick={() => { setFormType("egreso"); setFormCategory(categoriasEgreso[0]); }}
                className={`flex-1 py-2 rounded-lg font-bold transition-all text-sm ${formType === "egreso" ? "bg-rose-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
              >
                - Gasto
              </button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Categoría</label>
                <select 
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-brand-border rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
                >
                  {(formType === "ingreso" ? categoriasIngreso : categoriasEgreso).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="w-1/2">
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">Monto ($)</label>
                <input 
                  type="number"
                  required
                  min="1"
                  step="0.01"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-brand-border rounded-lg p-3 font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <button type="submit" className="w-full py-3 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-bold transition-all shadow-lg hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              Guardar Movimiento
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
