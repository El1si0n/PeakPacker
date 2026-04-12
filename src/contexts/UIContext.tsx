import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
};

type ToastOptions = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
};

type ToastMessage = ToastOptions & { id: number };

type UIContextType = {
  confirm: (options: ConfirmOptions) => void;
  toast: (options: ToastOptions) => void;
};

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const confirm = (options: ConfirmOptions) => {
    setConfirmModal(options);
  };

  const toast = (options: ToastOptions) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { ...options, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, options.duration || 3000);
  };

  const handleConfirm = () => {
    if (confirmModal) {
      confirmModal.onConfirm();
      setConfirmModal(null);
    }
  };

  const handleCancel = () => {
    setConfirmModal(null);
  };

  return (
    <UIContext.Provider value={{ confirm, toast }}>
      {children}
      
      {/* CONFIRM MODAL */}
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--surface-color)] w-full max-w-sm rounded-[2rem] border border-[var(--border-color)] shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 flex flex-col gap-4 text-center">
              <div className="w-16 h-16 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-2">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-color)]">{confirmModal.title}</h3>
              <p className="text-[var(--text-muted)]">{confirmModal.message}</p>
            </div>
            <div className="flex border-t border-[var(--border-color)]">
              <button 
                onClick={handleCancel}
                className="flex-1 p-4 font-semibold text-[var(--text-muted)] hover:bg-[var(--bg-color)] transition-colors border-r border-[var(--border-color)]"
              >
                {confirmModal.cancelText || "Annuler"}
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 p-4 font-bold text-[var(--color-primary)] hover:bg-[var(--bg-color)] transition-colors"
              >
                {confirmModal.confirmText || "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS CONTAINER */}
      <div className="fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 w-full">
        {toasts.map((t) => {
          const isError = t.type === 'error';
          return (
            <div 
              key={t.id} 
              className={`flex items-start gap-3.5 px-5 py-4 rounded-2xl shadow-2xl shadow-black/20 border animate-in slide-in-from-bottom-5 fade-in zoom-in-95 duration-300 pointer-events-auto max-w-sm w-full
                ${isError ? 'bg-red-500/95 backdrop-blur-xl border-red-600/50 text-white' : 'bg-[#1a1a1a]/95 backdrop-blur-xl border-white/10 text-white'}`}
            >
              {isError ? (
                <AlertCircle className="text-white shrink-0 mt-0.5" size={20} />
              ) : (
                <CheckCircle2 className="text-[var(--color-primary)] shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex flex-col flex-grow gap-1">
                 <span className="font-semibold text-sm whitespace-pre-wrap leading-relaxed">{t.message}</span>
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(toast => toast.id !== t.id))} 
                className="ml-auto shrink-0 opacity-40 hover:opacity-100 transition-opacity mt-0.5"
              >
                <X size={18} />
              </button>
            </div>
          );
        })}
      </div>
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
