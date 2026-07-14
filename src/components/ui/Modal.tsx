import { X } from "lucide-react";

export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-brand-border">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
