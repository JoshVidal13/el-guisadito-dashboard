"use client";

import { useState, useEffect } from "react";
import { Plus, DollarSign, ArrowDownCircle, ArrowUpCircle, PieChart, Calendar as CalendarIcon } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord } from "@/actions/finance";

type FinanceRecord = {
  id: string;
  date: number; // Day of month extracted from server response
  type: "ingreso" | "egreso";
  amount: number;
  category: string;
};

const CATEGORIAS_INGRESO = ["Ventas Matutinas", "Ventas Vespertinas", "Ventas Nocturnas", "Eventos/Catering", "Otros"];
const CATEGORIAS_EGRESO = ["Insumos (Carne/Verdura)", "Gas", "Agua", "Pagas (Nómina)", "Inversión/Mobiliario", "Otros"];

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

  // Datos Reales
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await getRecords();
      // Map "DD/MM/YYYY" to day number for the calendar
      const mapped = data.map((r: any) => ({
        id: r.id,
        date: parseInt(r.date.split('/')[0], 10),
        type: r.type,
        amount: r.amount,
        category: r.category
      }));
      setRecords(mapped);
      setIsLoaded(true);
    }
    load();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<number>(13);
  
  // Form state
  const [formType, setFormType] = useState<"ingreso" | "egreso">("ingreso");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState(CATEGORIAS_INGRESO[0]);

  // Filtrar registros SOLO para la semana activa
  const weekRecords = records.filter(r => r.date >= activeWeek.start && r.date <= activeWeek.end);

  const totalIngresos = weekRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = weekRecords.filter(r => r.type === "egreso").reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIngresos - totalEgresos;

  // Agrupar por categoría en base a los registros de la semana activa
  const ingresosPorCategoria = CATEGORIAS_INGRESO.map(cat => ({
    name: cat,
    total: weekRecords.filter(r => r.type === "ingreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const egresosPorCategoria = CATEGORIAS_EGRESO.map(cat => ({
    name: cat,
    total: weekRecords.filter(r => r.type === "egreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || !formCategory) return;
    
    const dayStr = selectedDate.toString().padStart(2, '0');
    const dateStr = `${dayStr}/07/2026`; 

    // Optimistic update
    const tempId = Date.now().toString();
    setRecords([...records, {
      id: tempId,
      date: selectedDate,
      type: formType,
      amount: parseFloat(formAmount),
      category: formCategory
    }]);
    
    setIsModalOpen(false);
    setFormAmount("");
    toast(`Guardando en el servidor...`, "info");

    const res = await addRecord({
      amount: parseFloat(formAmount),
      type: formType,
      category: formCategory,
      dateStr
    });

    if (res.success) {
      toast(`Registro guardado en BD con éxito`);
    } else {
      toast(`Error al guardar en BD`, "error");
    }
  };

  const openModalForDate = (day: number) => {
    setSelectedDate(day);
    setIsModalOpen(true);
    setFormCategory(formType === "ingreso" ? CATEGORIAS_INGRESO[0] : CATEGORIAS_EGRESO[0]);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Ciclos Financieros</h1>
          <p className="text-slate-400 mt-1">Control visual dividido por semanas operativas de trabajo y descanso.</p>
        </div>
        <div className="flex items-center gap-3 glass p-2 rounded-xl border border-brand-border">
          <CalendarIcon size={20} className="text-brand-primary ml-2" />
          <select 
            value={selectedWeekId}
            onChange={(e) => setSelectedWeekId(Number(e.target.value))}
            className="bg-transparent text-white font-bold p-2 focus:outline-none cursor-pointer appearance-none"
          >
            {WEEKS.map(w => (
              <option key={w.id} value={w.id} className="bg-slate-900">
                {w.title}: {w.start} al {w.end} de {w.month}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resumen Financiero Top (Semana Activa) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-5 rounded-2xl flex items-center justify-between border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <div>
            <p className="text-sm font-medium text-blue-200/70 mb-1">Total Ingresos de la Semana</p>
            <h3 className="text-3xl font-extrabold text-blue-400">${totalIngresos.toLocaleString('es-MX')}</h3>
          </div>
          <ArrowUpCircle className="text-blue-400/80" size={36} />
        </div>
        <div className="glass p-5 rounded-2xl flex items-center justify-between border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
          <div>
            <p className="text-sm font-medium text-rose-200/70 mb-1">Total Egresos de la Semana</p>
            <h3 className="text-3xl font-extrabold text-rose-500">${totalEgresos.toLocaleString('es-MX')}</h3>
          </div>
          <ArrowDownCircle className="text-rose-500/80" size={36} />
        </div>
        <div className="glass p-5 rounded-2xl flex items-center justify-between border border-brand-border bg-gradient-to-br from-slate-900 to-slate-800">
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">Balance Semanal</p>
            <h3 className={`text-3xl font-extrabold ${balance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ${balance.toLocaleString('es-MX')}
            </h3>
          </div>
          <DollarSign className={balance >= 0 ? 'text-emerald-400/80' : 'text-rose-500/80'} size={36} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendario Semanal */}
        <div className="xl:col-span-3 glass rounded-2xl p-6 border border-brand-border shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Vista Semanal</h2>
            <div className="text-brand-primary font-bold bg-brand-primary/10 px-4 py-2 rounded-lg border border-brand-primary/20">
              {activeWeek.title}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-brand-border rounded-xl overflow-hidden border border-brand-border">
            {weekDayNames.map(dayName => (
              <div key={dayName} className="bg-slate-900 py-3 text-center text-sm font-bold text-slate-400 uppercase tracking-wider">
                {dayName}
              </div>
            ))}
            
            {weekDays.map(day => {
              const dayRecords = weekRecords.filter(r => r.date === day);
              
              const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((a, b) => a + b.amount, 0);
              const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((a, b) => a + b.amount, 0);
              const dayTotal = dayIngresos - dayEgresos;
              
              // Color de fondo dinámico
              const bgClass = selectedWeekId === 1 ? "bg-blue-900/10" : "bg-rose-900/10";

              return (
                <div 
                  key={day} 
                  onClick={() => openModalForDate(day)}
                  className={`${bgClass} min-h-[200px] p-2 cursor-pointer transition-all hover:bg-slate-700/60 group relative flex flex-col`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full text-slate-300">
                      {day}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 p-1 rounded-md">
                      <Plus size={16} className="text-slate-300" />
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-2 pt-1">
                    {dayRecords.map(rec => (
                      <div 
                        key={rec.id} 
                        className={`px-2 py-2 rounded font-semibold flex flex-col shadow-sm ${
                          rec.type === 'ingreso' ? 'bg-blue-500/20 text-blue-300 border-l-2 border-blue-500' : 'bg-rose-500/20 text-rose-300 border-l-2 border-rose-500'
                        }`}
                      >
                        <span className="truncate opacity-80 mb-1 text-[10px] uppercase tracking-wider">{rec.category}</span>
                        <span className="text-sm font-bold">${rec.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Suma Diaria al fondo de la celda */}
                  {(dayIngresos > 0 || dayEgresos > 0) && (
                    <div className={`mt-3 pt-2 border-t border-brand-border/50 text-right text-base font-bold ${dayTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Análisis Lateral */}
        <div className="glass p-6 rounded-2xl border border-brand-border flex flex-col gap-6">
          <div className="flex items-center gap-2 pb-4 border-b border-brand-border">
            <PieChart className="text-brand-primary" size={24} />
            <h2 className="text-xl font-bold text-white">Análisis de la Semana</h2>
          </div>

          {ingresosPorCategoria.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4">Ingresos</h3>
              <div className="space-y-4">
                {ingresosPorCategoria.map(cat => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="font-semibold text-blue-300">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(cat.total / totalIngresos) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {egresosPorCategoria.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4">Gastos</h3>
              <div className="space-y-4">
                {egresosPorCategoria.map(cat => (
                  <div key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="font-semibold text-rose-300">${cat.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: `${(cat.total / totalEgresos) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {ingresosPorCategoria.length === 0 && egresosPorCategoria.length === 0 && (
             <p className="text-slate-500 text-sm text-center italic mt-4">No hay datos en esta semana.</p>
          )}
        </div>
      </div>

      {/* Modal para Agregar Registro */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registro: ${selectedDate} de ${activeWeek.month}`}>
        <form onSubmit={handleAddRecord} className="space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setFormType("ingreso"); setFormCategory(CATEGORIAS_INGRESO[0]); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${formType === "ingreso" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700"}`}
            >
              + Ingreso
            </button>
            <button
              type="button"
              onClick={() => { setFormType("egreso"); setFormCategory(CATEGORIAS_EGRESO[0]); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${formType === "egreso" ? "bg-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]" : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700"}`}
            >
              - Egreso
            </button>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Categoría</label>
            <select 
              required
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full bg-slate-900 border border-brand-border rounded-lg p-3 text-white focus:outline-none focus:border-brand-primary transition-colors appearance-none cursor-pointer"
            >
              {(formType === "ingreso" ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Monto ($)</label>
            <input 
              type="number"
              required
              min="1"
              step="0.01"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
              className="w-full bg-slate-900 border border-brand-border rounded-lg p-4 text-2xl font-bold text-white placeholder-slate-600 focus:outline-none focus:border-brand-primary transition-colors"
              placeholder="0.00"
            />
          </div>
          
          <button type="submit" className="w-full py-3.5 mt-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-bold transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)]">
            Guardar en el Calendario Semanal
          </button>
        </form>
      </Modal>
    </div>
  );
}
