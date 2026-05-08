"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export interface ToastNotification {
  id: string;
  emoji: string;
  title: string;
  body: string;
  type: "expense" | "journal";
}

const listeners: Set<(n: ToastNotification) => void> = new Set();

/** Call this from anywhere to fire a toast */
export function fireToast(n: Omit<ToastNotification, "id">) {
  const full: ToastNotification = { ...n, id: Math.random().toString(36).slice(2) };
  listeners.forEach((fn) => fn(full));
}

export function NotificationToast() {
  const [queue, setQueue] = useState<ToastNotification[]>([]);

  useEffect(() => {
    function handler(n: ToastNotification) {
      setQueue((q) => [n, ...q].slice(0, 3)); // max 3 toasts
      setTimeout(() => {
        setQueue((q) => q.filter((t) => t.id !== n.id));
      }, 5000);
    }
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  if (queue.length === 0) return null;

  return (
    <div className="fixed top-4 left-0 right-0 z-[999] flex flex-col gap-2 px-4 pointer-events-none"
         style={{ paddingTop: "env(safe-area-inset-top)" }}>
      {queue.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-xl animate-slide-down"
          style={{
            background: toast.type === "expense"
              ? "linear-gradient(135deg, #E87060ee, #F4A590ee)"
              : "linear-gradient(135deg, #8B7AB8ee, #b09dd4ee)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <span className="text-2xl shrink-0 mt-0.5">{toast.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-sm leading-tight">{toast.title}</p>
            <p className="text-white/80 text-xs mt-0.5 leading-snug">{toast.body}</p>
          </div>
          <button
            onClick={() => setQueue((q) => q.filter((t) => t.id !== toast.id))}
            className="shrink-0 mt-0.5 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
            <X className="h-3 w-3 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
