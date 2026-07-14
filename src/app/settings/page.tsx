"use client";

import { useState, useEffect } from "react";
import { Settings, Tag, Palette, Users, Truck, Calendar, Trash2, Plus, CheckCircle2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

type TabType = "temas" | "finanzas" | "personal" | "operacion";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("temas");
  const [isLoaded, setIsLoaded] = useState(false);
  const toast = useToast();

  const [theme, setTheme] = useState("nocturno");
  
  // Estados de datos
  const [ingresos, setIngresos] = useState(["Ventas Matutinas", "Ventas Vespertinas", "Ventas Nocturnas", "Eventos"]);
  const [egresos, setEgresos] = useState(["Insumos (Carne/Verdura)", "Gas", "Agua", "Nómina"]);
  const [empleados, setEmpleados] = useState(["María Gómez (Cocinera)", "Carlos Ruiz (Mesero)", "Juan Pérez (Repartidor)"]);
  const [proveedores, setProveedores] = useState(["Coca-Cola", "Carnicería La Fina", "Bimbo"]);
  const [eventos, setEventos] = useState(["Visita Proveedor", "Mantenimiento", "Evento Privado"]);

  // Estados para inputs temporales
  const [newIngreso, setNewIngreso] = useState("");
  const [newEgreso, setNewEgreso] = useState("");
  const [newEmpleado, setNewEmpleado] = useState("");
  const [newProveedor, setNewProveedor] = useState("");
  const [newEvento, setNewEvento] = useState("");

  useEffect(() => {
    const savedTheme = localStorage.getItem("elguisadito_theme") || "nocturno";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme);

    const savedIngresos = localStorage.getItem("elguisadito_ingresos");
    if (savedIngresos) setIngresos(JSON.parse(savedIngresos));

    const savedEgresos = localStorage.getItem("elguisadito_egresos");
    if (savedEgresos) setEgresos(JSON.parse(savedEgresos));

    setIsLoaded(true);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem("elguisadito_theme", newTheme);
    toast("Tema actualizado correctamente");
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const addItem = (e: React.FormEvent, setter: any, current: string[], value: string, resetValue: any, itemType: string, storageKey?: string) => {
    e.preventDefault();
    if(value.trim()) {
      const newList = [...current, value.trim()];
      setter(newList);
      if (storageKey) localStorage.setItem(storageKey, JSON.stringify(newList));
      resetValue("");
      toast(`${itemType} agregado exitosamente`);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const removeItem = (setter: any, current: string[], index: number, itemType: string, storageKey?: string) => {
    const newList = current.filter((_, i) => i !== index);
    setter(newList);
    if (storageKey) localStorage.setItem(storageKey, JSON.stringify(newList));
    toast(`${itemType} eliminado`, "error");
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="text-brand-primary" size={32} />
            Configuración del Sistema
          </h1>
          <p className="opacity-70 mt-1">Administra la personalización y datos operativos de tu taquería.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Tabs */}
        <div className="lg:w-64 flex flex-col gap-2">
          <button onClick={() => setActiveTab("temas")} className={`flex items-center gap-3 p-4 rounded-xl text-left font-semibold transition-all ${activeTab === "temas" ? "bg-brand-primary text-brand-bg shadow-md" : "glass hover:bg-slate-800/50"}`}>
            <Palette size={20} /> Apariencia
          </button>
          <button onClick={() => setActiveTab("finanzas")} className={`flex items-center gap-3 p-4 rounded-xl text-left font-semibold transition-all ${activeTab === "finanzas" ? "bg-brand-primary text-brand-bg shadow-md" : "glass hover:bg-slate-800/50"}`}>
            <Tag size={20} /> Finanzas (Categorías)
          </button>
          <button onClick={() => setActiveTab("personal")} className={`flex items-center gap-3 p-4 rounded-xl text-left font-semibold transition-all ${activeTab === "personal" ? "bg-brand-primary text-brand-bg shadow-md" : "glass hover:bg-slate-800/50"}`}>
            <Users size={20} /> Personal
          </button>
          <button onClick={() => setActiveTab("operacion")} className={`flex items-center gap-3 p-4 rounded-xl text-left font-semibold transition-all ${activeTab === "operacion" ? "bg-brand-primary text-brand-bg shadow-md" : "glass hover:bg-slate-800/50"}`}>
            <Truck size={20} /> Operación Externa
          </button>
        </div>

        {/* Área de Contenido */}
        <div className="flex-1 glass rounded-2xl p-6 md:p-8 min-h-[500px]">
          
          {/* TAB: TEMAS */}
          {activeTab === "temas" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold border-b border-brand-border pb-4">Personalización Visual</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div onClick={() => handleThemeChange("nocturno")} className={`cursor-pointer p-5 rounded-xl border-2 transition-all ${theme === 'nocturno' ? 'border-brand-primary bg-slate-900/50 shadow-lg' : 'border-brand-border hover:border-slate-500'}`}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-lg">Guisadito Nocturno</h3>
                    {theme === 'nocturno' && <CheckCircle2 className="text-brand-primary" size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#0f172a] border border-slate-600"></div>
                    <div className="w-8 h-8 rounded-full bg-[#f59e0b] border border-slate-600"></div>
                  </div>
                  <p className="text-sm opacity-70 mt-3">Modo oscuro profundo con acentos en color ámbar. Elegante e ideal para uso nocturno.</p>
                </div>

                <div onClick={() => handleThemeChange("clasico")} className={`cursor-pointer p-5 rounded-xl border-2 transition-all bg-slate-50 ${theme === 'clasico' ? 'border-orange-600 shadow-lg' : 'border-slate-300 hover:border-slate-400'}`}>
                  <div className="flex justify-between items-center mb-3 text-slate-900">
                    <h3 className="font-bold text-lg">Clásico Tradicional</h3>
                    {theme === 'clasico' && <CheckCircle2 className="text-orange-600" size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#f8fafc] border border-slate-300"></div>
                    <div className="w-8 h-8 rounded-full bg-[#ea580c] border border-slate-300"></div>
                  </div>
                  <p className="text-sm text-slate-600 mt-3">Modo claro luminoso con toques terracota y verde. El clásico estilo de taquería mexicana.</p>
                </div>

                <div onClick={() => handleThemeChange("cyberpunk")} className={`cursor-pointer p-5 rounded-xl border-2 transition-all bg-[#170f2e] ${theme === 'cyberpunk' ? 'border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.3)]' : 'border-purple-900 hover:border-purple-500'}`}>
                  <div className="flex justify-between items-center mb-3 text-fuchsia-50">
                    <h3 className="font-bold text-lg">Neón Cyberpunk</h3>
                    {theme === 'cyberpunk' && <CheckCircle2 className="text-fuchsia-500" size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#2e1065] border border-purple-700"></div>
                    <div className="w-8 h-8 rounded-full bg-[#d946ef] border border-purple-700"></div>
                  </div>
                  <p className="text-sm text-purple-200 mt-3">Altos contrastes en morado oscuro y cian/fuchsia. Muy llamativo y moderno.</p>
                </div>

                <div onClick={() => handleThemeChange("minimalista")} className={`cursor-pointer p-5 rounded-xl border-2 transition-all bg-white ${theme === 'minimalista' ? 'border-slate-900 shadow-lg' : 'border-slate-200 hover:border-slate-400'}`}>
                  <div className="flex justify-between items-center mb-3 text-slate-900">
                    <h3 className="font-bold text-lg">Minimalista</h3>
                    {theme === 'minimalista' && <CheckCircle2 className="text-slate-900" size={24} />}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#ffffff] border border-slate-300"></div>
                    <div className="w-8 h-8 rounded-full bg-[#0f172a] border border-slate-300"></div>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Limpio, blanco y negro. Perfecto para concentración y máxima legibilidad de datos.</p>
                </div>

              </div>
            </div>
          )}

          {/* TAB: FINANZAS */}
          {activeTab === "finanzas" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold border-b border-brand-border pb-4">Categorías Financieras</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Ingresos */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowUpCircle size={20} className="text-blue-500"/> Ingresos</h3>
                  <form onSubmit={(e) => addItem(e, setIngresos, ingresos, newIngreso, setNewIngreso, "Categoría", "elguisadito_ingresos")} className="flex gap-2 mb-4">
                    <input type="text" value={newIngreso} onChange={(e) => setNewIngreso(e.target.value)} placeholder="Nueva categoría..." className="flex-1 bg-transparent border border-brand-border rounded-lg p-2 focus:border-brand-primary outline-none" />
                    <button type="submit" className="p-2 bg-brand-primary text-brand-bg rounded-lg"><Plus size={20} /></button>
                  </form>
                  <div className="space-y-2">
                    {ingresos.map((item, i) => (
                      <div key={i} className="flex justify-between p-3 rounded-lg border border-brand-border/50 hover:border-blue-500/50 group">
                        <span>{item}</span>
                        <button onClick={() => removeItem(setIngresos, ingresos, i, "Categoría", "elguisadito_ingresos")} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Egresos */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><ArrowDownCircle size={20} className="text-rose-500"/> Gastos Operativos</h3>
                  <form onSubmit={(e) => addItem(e, setEgresos, egresos, newEgreso, setNewEgreso, "Categoría", "elguisadito_egresos")} className="flex gap-2 mb-4">
                    <input type="text" value={newEgreso} onChange={(e) => setNewEgreso(e.target.value)} placeholder="Nueva categoría..." className="flex-1 bg-transparent border border-brand-border rounded-lg p-2 focus:border-brand-primary outline-none" />
                    <button type="submit" className="p-2 bg-brand-primary text-brand-bg rounded-lg"><Plus size={20} /></button>
                  </form>
                  <div className="space-y-2">
                    {egresos.map((item, i) => (
                      <div key={i} className="flex justify-between p-3 rounded-lg border border-brand-border/50 hover:border-rose-500/50 group">
                        <span>{item}</span>
                        <button onClick={() => removeItem(setEgresos, egresos, i, "Categoría", "elguisadito_egresos")} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB: PERSONAL */}
          {activeTab === "personal" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold border-b border-brand-border pb-4">Gestión de Personal</h2>
              <div className="max-w-md">
                <form onSubmit={(e) => addItem(e, setEmpleados, empleados, newEmpleado, setNewEmpleado, "Empleado")} className="flex gap-2 mb-6">
                  <input type="text" value={newEmpleado} onChange={(e) => setNewEmpleado(e.target.value)} placeholder="Nombre y Rol (Ej. Ana - Cajera)" className="flex-1 bg-transparent border border-brand-border rounded-lg p-3 focus:border-brand-primary outline-none" />
                  <button type="submit" className="px-4 font-bold bg-brand-primary text-brand-bg rounded-lg">Añadir</button>
                </form>
                <div className="space-y-2">
                  {empleados.map((item, i) => (
                    <div key={i} className="flex justify-between p-3 rounded-lg border border-brand-border/50 hover:border-brand-primary/50 group bg-slate-900/30">
                      <div className="flex items-center gap-3"><Users size={18} className="text-slate-400"/> {item}</div>
                      <button onClick={() => removeItem(setEmpleados, empleados, i, "Empleado")} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: OPERACION */}
          {activeTab === "operacion" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold border-b border-brand-border pb-4">Operación Externa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Proveedores */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Truck size={20} className="text-emerald-500"/> Lista de Proveedores</h3>
                  <form onSubmit={(e) => addItem(e, setProveedores, proveedores, newProveedor, setNewProveedor, "Proveedor")} className="flex gap-2 mb-4">
                    <input type="text" value={newProveedor} onChange={(e) => setNewProveedor(e.target.value)} placeholder="Nombre del proveedor..." className="flex-1 bg-transparent border border-brand-border rounded-lg p-2 focus:border-brand-primary outline-none" />
                    <button type="submit" className="p-2 bg-brand-primary text-brand-bg rounded-lg"><Plus size={20} /></button>
                  </form>
                  <div className="space-y-2">
                    {proveedores.map((item, i) => (
                      <div key={i} className="flex justify-between p-3 rounded-lg border border-brand-border/50 group">
                        <span>{item}</span>
                        <button onClick={() => removeItem(setProveedores, proveedores, i, "Proveedor")} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Eventos */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar size={20} className="text-purple-500"/> Tipos de Eventos</h3>
                  <form onSubmit={(e) => addItem(e, setEventos, eventos, newEvento, setNewEvento, "Evento")} className="flex gap-2 mb-4">
                    <input type="text" value={newEvento} onChange={(e) => setNewEvento(e.target.value)} placeholder="Tipo de evento..." className="flex-1 bg-transparent border border-brand-border rounded-lg p-2 focus:border-brand-primary outline-none" />
                    <button type="submit" className="p-2 bg-brand-primary text-brand-bg rounded-lg"><Plus size={20} /></button>
                  </form>
                  <div className="space-y-2">
                    {eventos.map((item, i) => (
                      <div key={i} className="flex justify-between p-3 rounded-lg border border-brand-border/50 group">
                        <span>{item}</span>
                        <button onClick={() => removeItem(setEventos, eventos, i, "Evento")} className="opacity-0 group-hover:opacity-100 text-rose-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Necesitamos importar los iconos faltantes de lucide-react para que coincidan.
// Agregaremos ArrowUpCircle y ArrowDownCircle al archivo.
