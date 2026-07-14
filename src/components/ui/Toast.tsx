"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div key={t.id} className="animate-in slide-in-from-right-8 fade-in duration-300 flex items-center gap-3 bg-slate-900 border border-brand-border text-white px-5 py-4 rounded-xl shadow-2xl min-w-[300px]">
            {t.type === "success" && <CheckCircle2 className="text-emerald-500" size={24} />}
            {t.type === "error" && <XCircle className="text-rose-500" size={24} />}
            {t.type === "info" && <Info className="text-blue-500" size={24} />}
            <span className="flex-1 font-semibold text-sm">{t.message}</span>
            <button onClick={() => removeToast(t.id)} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context.toast;
}
