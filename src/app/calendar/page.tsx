"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, DollarSign, PieChart, Star, Target, BarChart2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord } from "@/actions/finance";

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
      
      setIsLoaded(true);
    }
    load();
  }, []);

  // Update initial form category when categories load or type changes
  useEffect(() => {
    if (formType === "ingreso" && categoriasIngreso.length > 0) setFormCategory(categoriasIngreso[0]);
    if (formType === "egreso" && categoriasEgreso.length > 0) setFormCategory(categoriasEgreso[0]);
  }, [formType, categoriasIngreso, categoriasEgreso]);

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const currentMonthName = monthNames[currentDate.getMonth()];
  const currentYear = currentDate.getFullYear();

  // Filter records for this month
  const monthRecords = records.filter(r => {
    const [d, m, y] = r.date.split("/");
    return parseInt(m, 10) === currentDate.getMonth() + 1 && parseInt(y, 10) === currentDate.getFullYear();
  });

  const totalIngresos = monthRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => acc + curr.amount, 0);
  const totalEgresos = monthRecords.filter(r => r.type === "egreso").reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIngresos - totalEgresos;

  // Analisis
  const ingresosPorCategoria = categoriasIngreso.map(cat => ({
    name: cat,
    total: monthRecords.filter(r => r.type === "ingreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const egresosPorCategoria = categoriasEgreso.map(cat => ({
    name: cat,
    total: monthRecords.filter(r => r.type === "egreso" && r.category === cat).reduce((acc, curr) => acc + curr.amount, 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);
  
  // Calculate best day
  const dailyIncome = monthRecords.filter(r => r.type === "ingreso").reduce((acc, curr) => {
    acc[curr.date] = (acc[curr.date] || 0) + curr.amount;
    return acc;
  }, {} as Record<string, number>);
  let bestDay = { date: "N/A", amount: 0 };
  Object.entries(dailyIncome).forEach(([date, amount]) => {
    if (amount > bestDay.amount) bestDay = { date, amount };
  });

  // Calculate biggest expense
  let biggestExpense = { category: "N/A", amount: 0 };
  if (egresosPorCategoria.length > 0) {
    biggestExpense = { category: egresosPorCategoria[0].name, amount: egresosPorCategoria[0].total };
  }

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 is Sunday
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || isNaN(Number(formAmount))) return;
    
    // selectedDateStr is "DD/MM/YYYY"
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
      setIsModalOpen(false);
      setFormAmount("");
      toast("Registro añadido exitosamente");
    } else {
      toast("Error al guardar", "error");
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

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando análisis mensual...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Análisis Mensual</h1>
          <p className="text-slate-400 mt-1">Rentabilidad, calendario visual y métricas avanzadas</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-blue-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Ingresos del Mes</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalIngresos.toLocaleString()}</p>
        </div>
        
        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={64} className="text-rose-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Gastos del Mes</h3>
          <p className="text-3xl font-bold text-white relative z-10">${totalEgresos.toLocaleString()}</p>
        </div>

        <div className="glass p-6 rounded-2xl border border-brand-border relative overflow-hidden group bg-gradient-to-br from-slate-900 to-slate-800">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-emerald-500"/>
          </div>
          <h3 className="text-slate-400 font-medium mb-1 relative z-10">Balance Neto</h3>
          <p className={`text-3xl font-bold relative z-10 ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            ${balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Grid */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 border border-brand-border flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={24} className="text-slate-400" /></button>
            <h2 className="text-xl font-bold text-white uppercase tracking-wider">{currentMonthName} {currentYear}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={24} className="text-slate-400" /></button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-brand-border rounded-xl overflow-hidden border border-brand-border flex-1">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
              <div key={day} className="bg-brand-bg/80 py-3 text-center text-sm font-semibold text-slate-400">
                {day}
              </div>
            ))}
            
            {emptyDays.map(empty => (
              <div key={`empty-${empty}`} className="bg-brand-bg/30 min-h-[100px] p-2" />
            ))}
            
            {daysArray.map(day => {
              const dayStr = `${day.toString().padStart(2, "0")}/${(currentDate.getMonth() + 1).toString().padStart(2, "0")}/${currentDate.getFullYear()}`;
              const dayRecords = monthRecords.filter(r => r.date === dayStr);
              
              const dayIngresos = dayRecords.filter(r => r.type === "ingreso").reduce((sum, r) => sum + r.amount, 0);
              const dayEgresos = dayRecords.filter(r => r.type === "egreso").reduce((sum, r) => sum + r.amount, 0);
              
              const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
              
              return (
                <div 
                  key={day} 
                  onClick={() => openModal(day)}
                  className={`bg-brand-bg min-h-[100px] p-2 transition-colors hover:bg-slate-800/50 cursor-pointer flex flex-col group ${isToday ? 'ring-1 ring-inset ring-brand-primary bg-brand-primary/5' : ''}`}
                >
                  <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-brand-primary text-brand-bg' : 'text-slate-300 group-hover:text-white'}`}>
                    {day}
                  </div>
                  
                  <div className="flex flex-col gap-1 mt-auto">
                    {dayIngresos > 0 && (
                      <div className="text-[10px] sm:text-xs font-bold text-blue-400 bg-blue-500/10 px-1 rounded truncate">
                        +${dayIngresos.toLocaleString()}
                      </div>
                    )}
                    {dayEgresos > 0 && (
                      <div className="text-[10px] sm:text-xs font-bold text-rose-400 bg-rose-500/10 px-1 rounded truncate">
                        -${dayEgresos.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="glass rounded-2xl p-6 border border-brand-border h-full overflow-y-auto max-h-[800px]">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <PieChart size={24} className="text-brand-primary" /> Analíticas del Mes
          </h2>
          
          <div className="space-y-8">
            
            {/* Insights Rápidos */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-brand-border space-y-4">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2"><Star size={16} className="text-yellow-500"/> Insights</h3>
              <div>
                <p className="text-xs text-slate-400">Mejor Día de Ventas</p>
                <p className="font-semibold text-emerald-400">{bestDay.date !== "N/A" ? `${bestDay.date} ($${bestDay.amount.toLocaleString()})` : "Sin datos"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Mayor Gasto (Categoría)</p>
                <p className="font-semibold text-rose-400">{biggestExpense.category !== "N/A" ? `${biggestExpense.category} ($${biggestExpense.amount.toLocaleString()})` : "Sin datos"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Transacciones Totales</p>
                <p className="font-semibold text-blue-400">{monthRecords.length} movimientos</p>
              </div>
            </div>

            {/* Categorias Ingreso */}
            {ingresosPorCategoria.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Target size={16}/> Distribución de Ingresos</h3>
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

            {/* Categorias Egreso */}
            {egresosPorCategoria.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BarChart2 size={16}/> Distribución de Gastos</h3>
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
               <p className="text-slate-500 text-sm text-center italic mt-4">No hay datos en este mes.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal para Agregar Registro en día específico */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registro: ${selectedDateStr}`}>
        <form onSubmit={handleAddRecord} className="space-y-5">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setFormType("ingreso"); setFormCategory(categoriasIngreso[0]); }}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${formType === "ingreso" ? "bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:bg-slate-700"}`}
            >
              + Ingreso
            </button>
            <button
              type="button"
              onClick={() => { setFormType("egreso"); setFormCategory(categoriasEgreso[0]); }}
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
              {(formType === "ingreso" ? categoriasIngreso : categoriasEgreso).map(cat => (
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
            Guardar
          </button>
        </form>
      </Modal>
    </div>
  );
}
