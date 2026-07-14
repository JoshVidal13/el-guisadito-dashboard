"use client";

import { useState } from "react";
import { Users, UserPlus, Clock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

export default function SchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const staff = [
    { id: 1, name: "María Gómez", role: "Cocinera", shift: "08:00 AM - 04:00 PM" },
    { id: 2, name: "Carlos Ruiz", role: "Mesero", shift: "08:00 AM - 04:00 PM" },
    { id: 3, name: "Ana Martínez", role: "Cajera", shift: "04:00 PM - 11:00 PM" },
    { id: 4, name: "Juan Pérez", role: "Parrillero", shift: "04:00 PM - 11:00 PM" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Roles y Horarios</h1>
          <p className="text-slate-400 mt-1">Gestión del personal y turnos de trabajo</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-primary-hover text-brand-bg px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <UserPlus size={20} />
          Asignar Turno
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass rounded-2xl border border-brand-border overflow-hidden">
          <div className="p-6 border-b border-brand-border flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users size={20} className="text-brand-primary" />
              Personal Activo
            </h2>
            <div className="text-sm text-slate-400">Semana 13/07 - 19/07</div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface border-b border-brand-border text-slate-300 text-sm">
                  <th className="p-4 font-medium">Empleado</th>
                  <th className="p-4 font-medium">Rol</th>
                  <th className="p-4 font-medium">Horario Asignado</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((person) => (
                  <tr key={person.id} className="border-b border-brand-border/50 hover:bg-brand-surface/50 transition-colors">
                    <td className="p-4 font-medium text-slate-200">{person.name}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                        {person.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 flex items-center gap-2">
                      <Clock size={16} />
                      {person.shift}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-brand-border flex flex-col gap-6">
          <h2 className="text-xl font-bold text-white border-b border-brand-border pb-4">Crear Nuevo Rol</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nombre del Rol</label>
              <input 
                type="text" 
                placeholder="Ej. Ayudante General"
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Descripción</label>
              <textarea 
                placeholder="Funciones principales..."
                rows={3}
                className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all resize-none"
              />
            </div>
            
            <button className="w-full py-2.5 rounded-lg bg-brand-surface hover:bg-slate-700 text-white border border-brand-border font-semibold transition-colors mt-2">
              Guardar Rol
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Asignar Nuevo Turno">
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Empleado</label>
            <select className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:border-brand-primary focus:outline-none">
              <option>Seleccionar...</option>
              {staff.map(s => <option key={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Horario</label>
            <input type="text" placeholder="Ej. 08:00 AM - 04:00 PM" className="w-full bg-slate-900 border border-brand-border rounded-lg p-2.5 text-white focus:border-brand-primary focus:outline-none" />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-brand-primary hover:bg-brand-primary-hover text-brand-bg font-semibold mt-4">
            Guardar Asignación
          </button>
        </form>
      </Modal>
    </div>
  );
}
