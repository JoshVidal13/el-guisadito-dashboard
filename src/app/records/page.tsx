"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Filter, Download, ArrowUpCircle, ArrowDownCircle, Calendar, Activity, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { getRecords, addRecord, updateRecord, deleteRecord } from "@/actions/finance";

type FinanceRecord = {
  id: string;
  date: string;
  type: "ingreso" | "egreso";
  amount: number;
  category: string;
};

export default function RecordsPage() {
  const [filter, setFilter] = useState<"all" | "ingreso" | "egreso">("all");
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [categoriasIngreso, setCategoriasIngreso] = useState(["Ventas Matutinas", "Ventas Vespertinas", "Ventas Nocturnas", "Eventos", "Otro"]);
  const [categoriasEgreso, setCategoriasEgreso] = useState(["Insumos (Carne/Verdura)", "Gas", "Agua", "Nómina", "Mantenimiento", "Proveedores", "Otro"]);
  const [newRecordForm, setNewRecordForm] = useState({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    type: "ingreso" as "ingreso" | "egreso",
    amount: "",
    category: ""
  });
  const toast = useToast();

  useEffect(() => {
    async function loadData() {
      const data = await getRecords();
      setRecords(data);
      
      const savedIngresos = localStorage.getItem("elguisadito_ingresos");
      if (savedIngresos) setCategoriasIngreso(JSON.parse(savedIngresos));

      const savedEgresos = localStorage.getItem("elguisadito_egresos");
      if (savedEgresos) setCategoriasEgreso(JSON.parse(savedEgresos));

      setIsLoaded(true);
    }
    loadData();
  }, []);

  if (!isLoaded) return <div className="p-8 text-center text-slate-400 animate-pulse">Cargando bitácora de operaciones...</div>;

  const filteredRecords = records.filter(r => filter === "all" ? true : r.type === filter);
  
  const absoluteBalance = records.reduce((acc, r) => r.type === "ingreso" ? acc + r.amount : acc - r.amount, 0);
  const totalIngresos = records.filter(r => r.type === "ingreso").reduce((acc, r) => acc + r.amount, 0);
  const totalEgresos = records.filter(r => r.type === "egreso").reduce((acc, r) => acc + r.amount, 0);

  // Agrupar por fecha
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, FinanceRecord[]>);

  // Ordenar fechas (asumiendo formato DD/MM/YYYY) descendente
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    const [d1, m1, y1] = a.split('/');
    const [d2, m2, y2] = b.split('/');
    return new Date(`${y2}-${m2}-${d2}`).getTime() - new Date(`${y1}-${m1}-${d1}`).getTime();
  });

  const handleDelete = async (id: string) => {
    if(confirm("¿Estás seguro de eliminar este registro permanentemente?")) {
      setRecords(records.filter(r => r.id !== id));
      toast("Registro eliminado exitosamente", "info");
      
      const res = await deleteRecord(id);
      if (!res.success) toast("Error al eliminar en DB", "error");
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    setRecords(records.map(r => r.id === editingRecord.id ? editingRecord : r));
    const recordToSave = { ...editingRecord };
    setEditingRecord(null);
    toast("Registro actualizado localmente, guardando...");

    const res = await updateRecord(recordToSave.id, {
      amount: recordToSave.amount,
      category: recordToSave.category,
      dateStr: recordToSave.date
    });
    
    if (res.success) toast("¡Guardado en la Base de Datos!");
    else toast("Error al guardar en BD", "error");
  };

  const handleNewRecordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordForm.amount || !newRecordForm.category || !newRecordForm.date) return;

    const [y, m, d] = newRecordForm.date.split('-');
    const dateStr = `${d}/${m}/${y}`;

    const tempId = Date.now().toString();
    const optimisticRecord = {
      id: tempId,
      date: dateStr,
      type: newRecordForm.type,
      amount: parseFloat(newRecordForm.amount),
      category: newRecordForm.category
    };
    
    setRecords([...records, optimisticRecord]);
    setIsNewModalOpen(false);
    setNewRecordForm({ date: new Date().toISOString().split('T')[0], type: "ingreso", amount: "", category: "" });
    toast("Guardando nuevo registro...", "info");

    const res = await addRecord({
      amount: optimisticRecord.amount,
      type: optimisticRecord.type,
      category: optimisticRecord.category,
      dateStr: optimisticRecord.date
    });

    if (res.success) toast("Registro agregado a la base de datos");
    else toast("Error al agregar a la base de datos", "error");
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Clock className="text-brand-primary" size={32} /> Bitácora Histórica
          </h1>
          <p className="text-slate-400 mt-1 font-medium">Timeline detallado de todas tus operaciones financieras.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-brand-bg px-5 py-2.5 rounded-xl font-black transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:-translate-y-0.5"
          >
            <ArrowUpCircle size={20} /> Añadir Movimiento
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-colors border border-slate-700">
            <Download size={20} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Resumen Rápido (Stats Bar) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-brand-primary/10 rounded-lg text-brand-primary"><Activity size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Absoluto</p>
            <p className={`text-xl font-black ${absoluteBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {absoluteBalance >= 0 ? '+' : '-'}${Math.abs(absoluteBalance).toLocaleString('es-MX')}
            </p>
          </div>
        </div>
        <div className="glass p-4 rounded-xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><ArrowUpCircle size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Ingresos</p>
            <p className="text-xl font-black text-blue-400">${totalIngresos.toLocaleString('es-MX')}</p>
          </div>
        </div>
        <div className="glass p-4 rounded-xl border border-brand-border flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 rounded-lg text-rose-500"><ArrowDownCircle size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Egresos</p>
            <p className="text-xl font-black text-rose-400">${totalEgresos.toLocaleString('es-MX')}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl border border-brand-border p-6 shadow-2xl">
        
        {/* Filtros Píldora (Pills) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-300 mr-2">Filtrar:</span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
              <button 
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filter === "all" ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilter("ingreso")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filter === "ingreso" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                Ingresos
              </button>
              <button 
                onClick={() => setFilter("egreso")}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${filter === "egreso" ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
              >
                Egresos
              </button>
            </div>
          </div>
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {filteredRecords.length} transacciones
          </div>
        </div>

        {/* Timeline (Línea de Tiempo) */}
        <div className="pt-8">
          {sortedDates.length === 0 ? (
            <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-4">
              <Calendar size={48} className="opacity-20" />
              <p className="font-semibold text-lg">No hay operaciones que coincidan con tu búsqueda.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 space-y-12 pb-8">
              {sortedDates.map(date => {
                const dayRecords = groupedRecords[date];
                const dayTotal = dayRecords.reduce((acc, r) => r.type === "ingreso" ? acc + r.amount : acc - r.amount, 0);
                
                return (
                  <div key={date} className="relative pl-8 md:pl-12">
                    {/* Indicador de Día en la línea de tiempo */}
                    <div className="absolute -left-[17px] top-0 bg-slate-900 p-1 rounded-full border-2 border-slate-700">
                      <div className="w-6 h-6 rounded-full bg-brand-primary flex items-center justify-center text-brand-bg shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                        <Calendar size={12} strokeWidth={3} />
                      </div>
                    </div>

                    {/* Cabecera del Día */}
                    <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                      <h3 className="text-xl font-black text-white">{date}</h3>
                      <div className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit ${dayTotal >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        Cierre: {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toLocaleString('es-MX')}
                      </div>
                    </div>
                    
                    {/* Tarjetas de Transacción */}
                    <div className="space-y-3">
                      {dayRecords.map(rec => (
                        <div key={rec.id} className="group bg-slate-900/80 border border-slate-800 hover:border-slate-600 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-800/50">
                          
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${rec.type === 'ingreso' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-500'}`}>
                              {rec.type === 'ingreso' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                            </div>
                            <div>
                              <p className="text-slate-200 font-bold text-lg">{rec.category}</p>
                              <p className={`text-[10px] font-black uppercase tracking-widest ${rec.type === 'ingreso' ? 'text-blue-500' : 'text-rose-500'}`}>{rec.type}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                            <span className={`text-2xl font-black tracking-tight ${rec.type === 'ingreso' ? 'text-blue-400' : 'text-rose-500'}`}>
                              {rec.type === 'ingreso' ? '+' : '-'}${rec.amount.toLocaleString('es-MX')}
                            </span>
                            
                            {/* Acciones Rápidas (aparecen en hover en Desktop, fijas en mobile) */}
                            <div className="flex items-center gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => setEditingRecord(rec)}
                                className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-blue-600 rounded-lg transition-colors" title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                onClick={() => handleDelete(rec.id)}
                                className="p-2.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600 rounded-lg transition-colors" title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modales sin cambios mayores de estructura, solo estilizado */}
      <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title="Editar Operación">
        {editingRecord && (
          <form onSubmit={handleEditSave} className="space-y-5 mt-2">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Fecha Operativa</label>
              <input 
                type="date"
                value={editingRecord.date.split('/').reverse().join('-')}
                onChange={e => {
                  const [y, m, d] = e.target.value.split('-');
                  if (y && m && d) setEditingRecord({...editingRecord, date: `${d}/${m}/${y}`});
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Monto ($)</label>
              <input 
                type="number"
                value={editingRecord.amount}
                onChange={e => setEditingRecord({...editingRecord, amount: Number(e.target.value)})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-xl focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Categoría / Concepto</label>
              <input 
                type="text"
                list={editingRecord.type === 'ingreso' ? "categorias-ingreso" : "categorias-egreso"}
                value={editingRecord.category}
                onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
              />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-black mt-6 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              Actualizar Sistema
            </button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Agregar Movimiento Manual">
        <form onSubmit={handleNewRecordSave} className="space-y-5 mt-2">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Fecha Operativa</label>
            <input 
              type="date"
              value={newRecordForm.date}
              onChange={e => setNewRecordForm({...newRecordForm, date: e.target.value})}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Naturaleza de Operación</label>
            <div className="flex gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setNewRecordForm({...newRecordForm, type: "ingreso"})}
                className={`flex-1 py-2.5 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                  newRecordForm.type === "ingreso" 
                    ? "bg-blue-600 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Ingreso (+)
              </button>
              <button
                type="button"
                onClick={() => setNewRecordForm({...newRecordForm, type: "egreso"})}
                className={`flex-1 py-2.5 rounded-lg font-black uppercase tracking-widest text-xs transition-all ${
                  newRecordForm.type === "egreso" 
                    ? "bg-rose-600 text-white shadow-md" 
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                Egreso (-)
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Importe ($)</label>
            <input 
              type="number"
              value={newRecordForm.amount}
              onChange={e => setNewRecordForm({...newRecordForm, amount: e.target.value})}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-black text-xl focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-1.5">Concepto Contable</label>
            <input 
              type="text"
              list={newRecordForm.type === 'ingreso' ? "categorias-ingreso" : "categorias-egreso"}
              value={newRecordForm.category}
              onChange={e => setNewRecordForm({...newRecordForm, category: e.target.value})}
              required
              placeholder="Ej. Ventas Mostrador"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:outline-none focus:border-brand-primary transition-colors"
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-black mt-6 transition-all shadow-lg hover:shadow-[0_0_15px_rgba(245,158,11,0.4)]">
            Registrar en Base de Datos
          </button>
        </form>
      </Modal>

      <datalist id="categorias-ingreso">
        {categoriasIngreso.map(cat => <option key={cat} value={cat} />)}
      </datalist>
      <datalist id="categorias-egreso">
        {categoriasEgreso.map(cat => <option key={cat} value={cat} />)}
      </datalist>
    </div>
  );
}
