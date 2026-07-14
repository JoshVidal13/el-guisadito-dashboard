"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Truck, PartyPopper } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function CalendarPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentMonth, setCurrentMonth] = useState("Julio 2026");

  const events = [
    { id: 1, date: 15, title: "Visita Coca-Cola", type: "supplier", time: "10:00 AM" },
    { id: 2, date: 18, title: "Evento Local", type: "event", time: "08:00 PM" },
    { id: 3, date: 22, title: "Entrega de Carne", type: "supplier", time: "09:00 AM" },
  ];

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: 3 }, (_, i) => i); // Starts on Wed

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Calendario Operativo</h1>
          <p className="text-slate-400 mt-1">Agenda de proveedores, eventos y notas importantes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-surface hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors border border-brand-border"
        >
          <CalendarIcon size={20} />
          Agendar Evento
        </button>
      </div>

      <div className="glass rounded-2xl p-6 border border-brand-border">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronLeft size={24} className="text-slate-400" /></button>
          <h2 className="text-xl font-bold text-white">{currentMonth}</h2>
          <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors"><ChevronRight size={24} className="text-slate-400" /></button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-brand-border rounded-xl overflow-hidden border border-brand-border">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map(day => (
            <div key={day} className="bg-brand-bg py-3 text-center text-sm font-semibold text-slate-400">
              {day}
            </div>
          ))}
          
          {emptyDays.map(empty => (
            <div key={`empty-${empty}`} className="bg-brand-bg/50 min-h-[100px] p-2" />
          ))}
          
          {daysInMonth.map(day => {
            const dayEvents = events.filter(e => e.date === day);
            const isToday = day === 13;
            
            return (
              <div 
                key={day} 
                className={`bg-brand-bg min-h-[120px] p-2 transition-colors hover:bg-slate-800/50 ${isToday ? 'ring-2 ring-inset ring-brand-primary bg-brand-primary/5' : ''}`}
              >
                <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2 ${isToday ? 'bg-brand-primary text-brand-bg' : 'text-slate-300'}`}>
                  {day}
                </div>
                
                <div className="space-y-1.5">
                  {dayEvents.map(evt => (
                    <div 
                      key={evt.id} 
                      className={`text-xs p-1.5 rounded-md flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                        evt.type === 'supplier' 
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}
                      title={evt.time}
                    >
                      {evt.type === 'supplier' ? <Truck size={12} /> : <PartyPopper size={12} />}
                      <span className="truncate">{evt.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agendar Nuevo Evento">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Título del Evento</label>
            <input type="text" placeholder="Ej. Visita Coca-Cola" className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:border-brand-primary focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Tipo</label>
            <select className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:border-brand-primary focus:outline-none">
              <option>Proveedor</option>
              <option>Evento Local</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Fecha y Hora</label>
            <input type="datetime-local" className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:border-brand-primary focus:outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold mt-4">
            Agendar
          </button>
        </form>
      </Modal>
    </div>
  );
}
