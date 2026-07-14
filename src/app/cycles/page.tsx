"use client";

import { useState, useEffect } from "react";
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle, PieChart, Calendar as CalendarIcon, Star, Target, BarChart2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord, deleteRecord } from "@/actions/finance";

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
      // Map "DD/MM/YYYY" to day number for the calendar
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
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
            <PieChart size={64} className="text-indigo-400"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Margen Neta</h3>
          <p className={`text-3xl font-bold relative z-10 ${margin >= 20 ? "text-emerald-400" : margin >= 0 ? "text-yellow-400" : "text-rose-400"}`}>
            {margin.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Grilla de Días */}
        <div className="lg:col-span-2 glass p-6 rounded-2xl border border-brand-border shadow-lg shadow-black/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Detalle Semanal</h2>
            <span className="bg-brand-primary/20 text-brand-primary px-3 py-1 rounded-full text-sm font-bold">
              {activeWeek.start} al {activeWeek.end} de {activeWeek.month}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-800/50 rounded-xl overflow-hidden border border-brand-border">
            {/* Headers de la semana */}
            {weekDayNames.map((name, idx) => (
              <div key={idx} className="bg-brand-bg/90 py-3 text-center text-sm font-semibold text-slate-400 tracking-wider">
                {name}
              </div>
            ))}

            {/* Celdas de días */}
            {weekDays.map(day => {
              const dayRecords = weekRecords.filter(r => r.date === day);
              
              const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((a, b) => a + b.amount, 0);
              const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((a, b) => a + b.amount, 0);
              const dayTotal = dayIngresos - dayEgresos;
              
              const bgClass = selectedWeekId === 1 ? "bg-blue-900/10 hover:bg-blue-900/30" : "bg-rose-900/10 hover:bg-rose-900/30";

              return (
                <div 
                  key={day} 
                  onClick={() => openModalForDate(day)}
                  className={`${bgClass} min-h-[200px] p-2 cursor-pointer transition-all group relative flex flex-col`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full text-slate-300 group-hover:bg-brand-primary group-hover:text-brand-bg transition-colors">
                      {day}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 pt-1 overflow-y-auto max-h-[120px] pr-1">
                    {dayRecords.map(rec => (
                      <div 
                        key={rec.id} 
                        className={`px-2 py-1.5 rounded flex flex-col shadow-sm ${
                          rec.type === 'ingreso' ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500' : 'bg-rose-500/20 text-rose-300 border-l-2 border-rose-500'
                        }`}
                      >
                        <span className="truncate opacity-80 mb-0.5 text-[9px] uppercase tracking-wider font-bold">{rec.category}</span>
                        <span className="text-xs font-bold">${rec.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Suma Diaria al fondo de la celda */}
                  {(dayIngresos > 0 || dayEgresos > 0) && (
                    <div className={`mt-2 pt-2 border-t border-brand-border/50 text-right text-sm font-black ${dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Análisis Lateral */}
        <div className="glass p-6 rounded-2xl border border-brand-border flex flex-col gap-6 shadow-lg shadow-black/20 overflow-y-auto max-h-[800px]">
          <div className="flex items-center gap-2 pb-4 border-b border-brand-border">
            <PieChart className="text-brand-primary" size={24} />
            <h2 className="text-xl font-bold text-white">Análisis de la Semana</h2>
          </div>
          
          <div className="bg-slate-900/80 p-5 rounded-xl border border-brand-border space-y-4 shadow-inner">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><Star size={16} className="text-yellow-500"/> Insights Premium</h3>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <p className="text-xs text-slate-400">Mejor Día de Ventas</p>
              <p className="font-semibold text-emerald-400 text-right">{bestDay.date !== "N/A" ? `${bestDay.date}\n($${bestDay.amount.toLocaleString()})` : "Sin datos"}</p>
            </div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <p className="text-xs text-slate-400">Mayor Fuga (Gasto)</p>
              <p className="font-semibold text-rose-400 text-right">{biggestExpense.category !== "N/A" ? `${biggestExpense.category}\n($${biggestExpense.amount.toLocaleString()})` : "Sin datos"}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-slate-400">Volumen Operativo</p>
              <p className="font-semibold text-blue-400 text-right">{weekRecords.length} transacciones</p>
            </div>
          </div>

          {ingresosPorCategoria.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Target size={16}/> Distribución de Ingresos</h3>
              <div className="space-y-4">
                {ingresosPorCategoria.map(cat => (
                  <div key={cat.name} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 group-hover:text-white transition-colors">{cat.name}</span>
                      <span className="font-bold text-blue-300 group-hover:text-blue-200 transition-colors">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-1.5 rounded-full group-hover:bg-blue-400 transition-colors" style={{ width: `${(cat.total / totalIngresos) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {egresosPorCategoria.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart2 size={16}/> Distribución de Gastos</h3>
              <div className="space-y-4">
                {egresosPorCategoria.map(cat => (
                  <div key={cat.name} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300 group-hover:text-white transition-colors">{cat.name}</span>
                      <span className="font-bold text-rose-300 group-hover:text-rose-200 transition-colors">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-1.5 rounded-full group-hover:bg-rose-400 transition-colors" style={{ width: `${(cat.total / totalEgresos) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {ingresosPorCategoria.length === 0 && egresosPorCategoria.length === 0 && (
             <p className="text-slate-500 text-sm text-center italic mt-4">Sin datos esta semana.</p>
          )}
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
          
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
                  className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
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
                  className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary transition-colors"
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
