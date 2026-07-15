"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, Activity } from "lucide-react";

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full bg-brand-primary text-brand-bg shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] hover:scale-110 transition-all duration-300 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <Sparkles size={28} />
      </button>

      {/* Ventana de Chat */}
      <div 
        className={`fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] bg-slate-900 border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: "600px", maxHeight: "calc(100vh - 4rem)" }}
      >
        {/* Cabecera */}
        <div className="bg-slate-800 p-4 border-b border-brand-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center text-brand-primary">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Asistente Financiero</h3>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En línea
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 mt-10">
              <Sparkles size={40} className="mx-auto text-brand-primary opacity-50 mb-4" />
              <p className="font-bold text-white mb-2">¡Hola! Soy tu IA de negocios.</p>
              <p className="text-sm">Pregúntame sobre tus ventas, gastos o pide un consejo para optimizar tu rentabilidad en El Guisadito.</p>
            </div>
          )}
          
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                  m.role === 'user' 
                    ? 'bg-brand-primary text-brand-bg rounded-tr-sm' 
                    : 'bg-slate-800 text-slate-200 border border-brand-border rounded-tl-sm'
                }`}
              >
                {/* Formateo simple de markdown para listas y negritas (rudimentario para mantenerlo ligero) */}
                <div 
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: m.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
                
                {/* Mostrar herramientas si se usaron */}
                {m.toolInvocations?.map(toolInvocation => {
                  const toolCallId = toolInvocation.toolCallId;
                  if ('result' in toolInvocation) {
                    return (
                      <div key={toolCallId} className="mt-2 text-[10px] bg-slate-900/50 p-2 rounded text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-mono">
                        <Activity size={12} /> Consultó Base de Datos
                      </div>
                    );
                  }
                  return (
                    <div key={toolCallId} className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Loader2 size={12} className="animate-spin" /> Analizando números...
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-brand-border bg-slate-900">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) handleSubmit(e);
            }} 
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Escribe tu pregunta aquí..."
              className="flex-1 bg-slate-800 border border-brand-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="p-3 bg-brand-primary text-brand-bg rounded-xl hover:bg-brand-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Impulsado por Gemini 1.5</span>
          </div>
        </div>
      </div>
    </>
  );
}
