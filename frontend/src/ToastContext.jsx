import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

const ToastContext = createContext(null);
let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message, type = "success") => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => remove(id), 3500);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ success: (m) => push(m, "success"), error: (m) => push(m, "error") }}>
      {children}
      <div style={{ position: "fixed", top: 20, left: "50%", zIndex: 200, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card"
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
              background: "white", minWidth: 240, maxWidth: 360,
              animation: "toastIn 0.25s ease both", transform: "translateX(-50%)",
              borderLeft: `3px solid ${t.type === "success" ? "#1B7F79" : "#E85D4E"}`,
            }}
          >
            {t.type === "success" ? <CheckCircle2 size={18} color="#1B7F79" style={{ flexShrink: 0 }} /> : <XCircle size={18} color="#E85D4E" style={{ flexShrink: 0 }} />}
            <p style={{ fontSize: 13, flex: 1, margin: 0 }}>{t.message}</p>
            <button onClick={() => remove(t.id)} style={{ background: "none", border: "none", padding: 2, opacity: 0.4 }}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
