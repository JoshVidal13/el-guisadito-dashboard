"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, PieChart, Star, Target, BarChart2, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord, deleteRecord } from "@/actions/finance";

type FinanceRecord = {
  id: string;
  date: string; // DD/MM/YYYY
  type: "ingreso" | "egreso";
  amount: number;
  category: string;
};

const DEFAULT_INGRESO = ["Ventas Matutinas", "Ventas Vespertinas", "Ventas Nocturnas", "Eventos/Catering", "Otros"];
const DEFAULT_EGRESO = ["Insumos (Carne/Verdura)", "Gas", "Agua", "Pagas (Nómina)", "Inversión/Mobiliario", "Otros"];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [categoriasIngreso, setCategoriasIngreso] = useState(DEFAULT_INGRESO);
  const [categoriasEgreso, setCategoriasEgreso] = useState(DEFAULT_EGRESO);
  const [metaMensual, setMetaMensual] = useState<number>(0);
  
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateStr, setSelectedDateStr] = useState("");
  const [formType, setFormType] = useState<"ingreso" | "egreso">("ingreso");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("");

  useEffect(() => {
    async function load() {
      const data = await getRecords();
      setRecords(data);
      
      const savedIngresos = localStorage.getItem("elguisadito_ingresos");
      if (savedIngresos) setCategoriasIngreso(JSON.parse(savedIngresos));

      const savedEgresos = localStorage.getItem("elguisadito_egresos");
      if (savedEgresos) setCategoriasEgreso(JSON.parse(savedEgresos));

      const savedMeta = localStorage.getItem("elguisadito_meta");
      if (savedMeta) setMetaMensual(Number(savedMeta));
      
      setIsLoaded(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (formType === "ingreso" && categoriasIngreso.length > 0) setFormCategory(categoriasIngreso[0]);
    if (formType === "egreso" && categoriasEgreso.length > 0) setFormCategory(categoriasEgreso[0]);
  }, [formType, categoriasIngreso, categoriasEgreso]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  const monthRecords = records.filter(r => {
    const [d, m, y] = r.date.split("/");
    return parseInt(m, 10) === currentDate.getMonth() + 1 && parseInt(y, 10) === currentDate.getFullYear();
  });

  const totalIngresos = monthRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = monthRecords.filter(r => r.type === "egreso").reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIngresos - totalEgresos;
  const margin = totalIngresos > 0 ? (balance / totalIngresos) * 100 : 0;
  const metaProgress = metaMensual > 0 ? Math.min((totalIngresos / metaMensual) * 100, 100) : 0;

  const ingresosPorCategoria = categoriasIngreso.map(cat => ({
    name: cat,
    total: monthRecords.filter(r => r.type === "ingreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const egresosPorCategoria = categoriasEgreso.map(cat => ({
    name: cat,
    total: monthRecords.filter(r => r.type === "egreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  
  const dailyIncome = monthRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
  let bestDay = { date: "N/A", amount: 0 };
  Object.entries(dailyIncome).forEach(([date, amount]) => {
    if (amount > bestDay.amount) bestDay = { date, amount };
  });

  let biggestExpense = { category: "N/A", amount: 0 };
  if (egresosPorCategoria.length > 0) {
    biggestExpense = { category: egresosPorCategoria[0].name, amount: egresosPorCategoria[0].total };
  }

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount))) return;
    
    const newRec = {
      type: formType,
      amount: Number(formAmount),
      category: formCategory,
      dateStr: selectedDateStr
    };

    toast("Guardando registro...", "info");
    const res = await addRecord(newRec);

    if (res.success) {
      const data = await getRecords();
      setRecords(data);
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

  const openModal = (day: number) => {
    const dayStr = day.toString().padStart(2, "0");
    const monthStr = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const yearStr = currentDate.getFullYear();
    setSelectedDateStr(`${dayStr}/${monthStr}/${yearStr}`);
    setFormType("ingreso");
    setFormAmount("");
    setIsModalOpen(true);
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando plataforma corporativa...</div>;

  const selectedDayRecords = records.filter(r => r.date === selectedDateStr);
  const dayBalance = selectedDayRecords.reduce((acc, r) => acc + (r.type === 'ingreso' ? r.amount : -r.amount), 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Análisis Mensual Premium</h1>
          <p className="text-slate-400 mt-1">Control absoluto, rentabilidad y métricas avanzadas</p>
        </div>
      </div>

      {metaMensual > 0 && (
        <div className="glass p-5 rounded-2xl border border-brand-border group hover:border-brand-primary/50 transition-colors">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Target size={16} className="text-emerald-500" /> Progreso de Meta Mensual
              </h3>
              <p className="text-2xl font-bold text-white mt-1">${totalIngresos.toLocaleString()} <span className="text-sm font-normal text-slate-400">/ ${metaMensual.toLocaleString()}</span></p>
            </div>
            <span className="text-brand-primary font-bold">{metaProgress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-brand-primary h-full transition-all duration-1000 ease-out" 
              style={{ width: `${metaProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-blue-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Ingresos del Mes</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalIngresos.toLocaleString()}</p>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} className="text-rose-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Gastos del Mes</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalEgresos.toLocaleString()}</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group hover:-translate-y-1 transition-transform bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-emerald-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Balance Neto</h3>
          <p className={`text-3xl font-bold relative z-10 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            ${balance.toLocaleString()}
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
        
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-brand-border flex flex-col h-full shadow-lg shadow-black/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-800 hover:text-brand-primary rounded-lg transition-colors"><ChevronLeft size={24} /></button>
            <h2 className="text-2xl font-bold text-white uppercase tracking-wider">{currentMonthName} {currentYear}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-800 hover:text-brand-primary rounded-lg transition-colors"><ChevronRight size={24} /></button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-800/50 rounded-xl overflow-hidden border border-brand-border flex-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
              <div key={day} className="bg-brand-bg/90 py-3 text-center text-sm font-semibold text-slate-400 tracking-wider">
                {day}
              </div>
            ))}
            
            {emptyDays.map(empty => (
              <div key={`empty-${empty}`} className="bg-brand-bg/30 min-h-[110px] p-2" />
            ))}
            
            {daysArray.map(day => {
              const dayStr = `${day.toString().padStart(2, "0")}/${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`;
              const dayRecords = monthRecords.filter(r => r.date === dayStr);
              
              const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((sum, r) => sum + r.amount, 0);
              const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((sum, r) => sum + r.amount, 0);
              const netDay = dayIngresos - dayEgresos;
              
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              
              return (
                <div 
                  key={day} 
                  onClick={() => openModal(day)}
                  className={`bg-brand-bg min-h-[110px] p-2 transition-all hover:bg-slate-800/80 cursor-pointer flex flex-col group relative ${isToday ? 'ring-2 ring-inset ring-brand-primary bg-brand-primary/10' : ''}`}
                >
                  <div className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-1 transition-colors ${isToday ? 'bg-brand-primary text-brand-bg shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'text-slate-300 group-hover:bg-slate-700'}`}>
                    {day}
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-auto">
                    {dayIngresos > 0 && (
                      <div className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded truncate">
                        +${dayIngresos.toLocaleString()}
                      </div>
                    )}
                    {dayEgresos > 0 && (
                      <div className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded truncate">
                        -${dayEgresos.toLocaleString()}
                      </div>
                    )}
                    {(dayIngresos > 0 || dayEgresos > 0) && (
                      <div className={`text-[10px] text-right font-black mt-1 ${netDay >= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                        {netDay >= 0 ? '+' : '-'}${Math.abs(netDay).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="glass rounded-2xl p-6 border border-brand-border h-full overflow-y-auto max-h-[800px] shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChart size={24} className="text-brand-primary" /> Analíticas del Mes
          </h2>
          
          <div className="space-y-8">
            
            {/* Insights Rápidos */}
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
                <p className="font-semibold text-blue-400 text-right">{monthRecords.length} transacciones</p>
              </div>
            </div>

            {/* Categorias Ingreso */}
            {ingresosPorCategoria.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Target size={16}/> Origen de Ingresos</h3>
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

            {/* Categorias Egreso */}
            {egresosPorCategoria.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart2 size={16}/> Fugas y Gastos</h3>
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
               <p className="text-slate-500 text-sm text-center italic mt-4">Aún no hay movimientos este mes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal del Día */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Panel del Día: ${selectedDateStr}`}>
        
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
