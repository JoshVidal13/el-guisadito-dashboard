"use client";

import { useState, useEffect } from "react";
import { Edit2, Trash2, Filter, Download, ArrowUpCircle, ArrowDownCircle, Calendar } from "lucide-react";
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

// Remove default records

export default function RecordsPage() {
  const [filter, setFilter] = useState<"all" | "ingreso" | "egreso">("all");
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FinanceRecord | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newRecordForm, setNewRecordForm] = useState({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    type: "ingreso" as "ingreso" | "egreso",
    amount: "",
    category: ""
  });
  const toast = useToast();

  // Cargar desde Base de Datos
  useEffect(() => {
    async function loadData() {
      const data = await getRecords();
      setRecords(data);
      setIsLoaded(true);
    }
    loadData();
  }, []);

  if (!isLoaded) return null; // Evitar hidratación incorrecta

  const filteredRecords = records.filter(r => filter === "all" ? true : r.type === filter);

  // Agrupar por fecha
  const groupedRecords = filteredRecords.reduce((acc, record) => {
    if (!acc[record.date]) acc[record.date] = [];
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, FinanceRecord[]>);

  // Ordenar fechas (asumiendo formato DD/MM/YYYY)
  const sortedDates = Object.keys(groupedRecords).sort((a, b) => {
    const [d1, m1, y1] = a.split('/');
    const [d2, m2, y2] = b.split('/');
    return new Date(`${y1}-${m1}-${d1}`).getTime() - new Date(`${y2}-${m2}-${d2}`).getTime();
  });

  const handleDelete = async (id: string) => {
    if(confirm("¿Estás seguro de eliminar este registro?")) {
      // Optimistic update
      setRecords(records.filter(r => r.id !== id));
      toast("Registro eliminado exitosamente", "info");
      
      const res = await deleteRecord(id);
      if (!res.success) toast("Error al eliminar en DB", "error");
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    // Optimistic update
    setRecords(records.map(r => r.id === editingRecord.id ? editingRecord : r));
    const recordToSave = { ...editingRecord };
    setEditingRecord(null);
    toast("Registro actualizado localmente, guardando...");

    const res = await updateRecord(recordToSave.id, {
      amount: recordToSave.amount,
      category: recordToSave.category,
      dateStr: recordToSave.date
    });
    
    if (res.success) {
      toast("¡Guardado en la Base de Datos!");
    } else {
      toast("Error al guardar en BD", "error");
    }
  };

  const handleNewRecordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordForm.amount || !newRecordForm.category || !newRecordForm.date) return;

    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [y, m, d] = newRecordForm.date.split('-');
    const dateStr = `${d}/${m}/${y}`;

    // Optimistic Update
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
    setNewRecordForm({
      date: new Date().toISOString().split('T')[0],
      type: "ingreso",
      amount: "",
      category: ""
    });
    toast("Guardando nuevo registro...", "info");

    const res = await addRecord({
      amount: optimisticRecord.amount,
      type: optimisticRecord.type,
      category: optimisticRecord.category,
      dateStr: optimisticRecord.date
    });

    if (res.success) {
      toast("Registro agregado a la base de datos");
    } else {
      toast("Error al agregar a la base de datos", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Registro Histórico</h1>
          <p className="text-slate-400 mt-1">Tus movimientos financieros, agrupados por día.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-brand-bg px-4 py-2 rounded-lg font-bold transition-colors"
          >
            <ArrowUpCircle size={20} />
            Nuevo
          </button>
          <button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors border border-brand-border">
            <Download size={20} />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-brand-border overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-brand-border">
          <div className="flex items-center gap-2 bg-slate-900 border border-brand-border rounded-lg p-1">
            <Filter size={18} className="text-slate-400 ml-2" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as "all" | "ingreso" | "egreso")}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer py-1.5 px-2 rounded"
            >
              <option value="all" className="bg-slate-900">Todos los Movimientos</option>
              <option value="ingreso" className="bg-slate-900">Solo Ingresos</option>
              <option value="egreso" className="bg-slate-900">Solo Egresos</option>
            </select>
          </div>
          <div className="text-sm font-semibold text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-full border border-brand-primary/20">
            {filteredRecords.length} registros totales
          </div>
        </div>

        {sortedDates.length === 0 ? (
          <div className="text-center py-10 text-slate-500">No hay movimientos registrados.</div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map(date => {
              const dayRecords = groupedRecords[date];
              const dayTotal = dayRecords.reduce((acc, r) => r.type === "ingreso" ? acc + r.amount : acc - r.amount, 0);
              
              return (
                <div key={date} className="bg-slate-900/40 rounded-xl border border-brand-border/50 overflow-hidden">
                  <div className="bg-slate-800/80 p-3 px-5 border-b border-brand-border/50 flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-white">
                      <Calendar size={18} className="text-brand-primary" />
                      {date}
                    </div>
                    <div className={`font-bold text-sm px-2.5 py-0.5 rounded-full ${dayTotal >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      Balance del día: {dayTotal >= 0 ? '+' : '-'}${Math.abs(dayTotal).toLocaleString('es-MX')}
                    </div>
                  </div>
                  
                  <div className="divide-y divide-brand-border/30">
                    {dayRecords.map(rec => (
                      <div key={rec.id} className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${rec.type === 'ingreso' ? 'bg-blue-500/10 text-blue-400' : 'bg-rose-500/10 text-rose-500'}`}>
                            {rec.type === 'ingreso' ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
                          </div>
                          <div>
                            <p className="text-slate-200 font-semibold">{rec.category}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider">{rec.type}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <span className={`text-lg font-bold ${rec.type === 'ingreso' ? 'text-blue-400' : 'text-rose-500'}`}>
                            {rec.type === 'ingreso' ? '+' : '-'}${rec.amount.toLocaleString('es-MX')}
                          </span>
                          
                          <div className="flex items-center gap-2 border-l border-brand-border/50 pl-6">
                            <button 
                              onClick={() => setEditingRecord(rec)}
                              className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-colors" title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button 
                              onClick={() => handleDelete(rec.id)}
                              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Eliminar"
                            >
                              <Trash2 size={18} />
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

      <Modal isOpen={!!editingRecord} onClose={() => setEditingRecord(null)} title="Editar Registro">
        {editingRecord && (
          <form onSubmit={handleEditSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Fecha (DD/MM/YYYY)</label>
              <input 
                type="text"
                value={editingRecord.date}
                onChange={e => setEditingRecord({...editingRecord, date: e.target.value})}
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Monto ($)</label>
              <input 
                type="number"
                value={editingRecord.amount}
                onChange={e => setEditingRecord({...editingRecord, amount: Number(e.target.value)})}
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Categoría</label>
              <input 
                type="text"
                list={editingRecord.type === 'ingreso' ? "categorias-ingreso" : "categorias-egreso"}
                value={editingRecord.category}
                onChange={e => setEditingRecord({...editingRecord, category: e.target.value})}
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold mt-4">
              Guardar Cambios
            </button>
          </form>
        )}
      </Modal>

      <Modal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} title="Agregar Registro Manual">
        <form onSubmit={handleNewRecordSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fecha</label>
            <input 
              type="date"
              value={newRecordForm.date}
              onChange={e => setNewRecordForm({...newRecordForm, date: e.target.value})}
              required
              className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tipo</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setNewRecordForm({...newRecordForm, type: "ingreso"})}
                className={`flex-1 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all ${
                  newRecordForm.type === "ingreso" 
                    ? "bg-brand-primary text-brand-bg" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Ingreso
              </button>
              <button
                type="button"
                onClick={() => setNewRecordForm({...newRecordForm, type: "egreso"})}
                className={`flex-1 py-2 rounded-lg font-semibold flex justify-center items-center gap-2 transition-all ${
                  newRecordForm.type === "egreso" 
                    ? "bg-rose-500 text-white" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                Egreso
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Monto ($)</label>
            <input 
              type="number"
              value={newRecordForm.amount}
              onChange={e => setNewRecordForm({...newRecordForm, amount: e.target.value})}
              required
              min="0"
              step="0.01"
              placeholder="Ej. 1500"
              className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Categoría/Concepto</label>
            <input 
              type="text"
              list={newRecordForm.type === 'ingreso' ? "categorias-ingreso" : "categorias-egreso"}
              value={newRecordForm.category}
              onChange={e => setNewRecordForm({...newRecordForm, category: e.target.value})}
              required
              placeholder="Ej. Ventas Matutinas"
              className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:outline-none focus:border-brand-primary"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold mt-4">
            Añadir a la Base de Datos
          </button>
        </form>
      </Modal>

      <datalist id="categorias-ingreso">
        <option value="Ventas Matutinas" />
        <option value="Ventas Vespertinas" />
        <option value="Ventas Nocturnas" />
        <option value="Eventos" />
        <option value="Otro" />
      </datalist>

      <datalist id="categorias-egreso">
        <option value="Insumos (Carne/Verdura)" />
        <option value="Gas" />
        <option value="Agua" />
        <option value="Nómina" />
        <option value="Mantenimiento" />
        <option value="Proveedores" />
        <option value="Otro" />
      </datalist>
    </div>
  );
}
