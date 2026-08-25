"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type ToastTone = "success" | "danger" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

export type ToastContextValue = {
  /**
   * Afișează o notificare scurtă. Tonul implicit e neutru („info").
   * Confirmările pleacă singure; erorile rămân până le închide utilizatorul.
   */
  show: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * `null` = fără cronometru. O eroare care dispare singură după patru secunde e o
 * eroare pe care omul n-a apucat s-o citească — și n-are de unde s-o recitească,
 * fiindcă notificarea nu lasă urmă nicăieri. Stă până o închide el.
 */
const AUTO_DISMISS_MS: Record<ToastTone, number | null> = {
  success: 4000,
  info: 4000,
  danger: null,
};

const TONES: Record<ToastTone, string> = {
  success: "border-success/30 bg-success-surface text-success",
  danger: "border-danger/30 bg-danger-surface text-danger",
  info: "border-border bg-surface text-foreground",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const clearTimer = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer === undefined) return;
    clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      clearTimer(id);
      // Închiderea manuală poate să se suprapună cu cronometrul; păstrând aceeași
      // referință când nu mai e nimic de scos, React nu mai re-randează degeaba.
      setToasts((current) =>
        current.some((toast) => toast.id === id)
          ? current.filter((toast) => toast.id !== id)
          : current,
      );
    },
    [clearTimer],
  );

  const scheduleDismiss = useCallback(
    (id: number, tone: ToastTone) => {
      clearTimer(id);
      const delay = AUTO_DISMISS_MS[tone];
      if (delay === null) return;
      timersRef.current.set(
        id,
        setTimeout(() => dismiss(id), delay),
      );
    },
    [clearTimer, dismiss],
  );

  const show = useCallback(
    (message: string, tone: ToastTone = "info") => {
      const id = nextIdRef.current++;
      setToasts((current) => [...current, { id, message, tone }]);
      scheduleDismiss(id, tone);
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const renderToast = (toast: Toast) => (
    <div
      key={toast.id}
      // Utilizatorul care citește mai încet oprește cronometrul doar trecând
      // cu mausul sau ajungând cu tastatura pe butonul de închidere.
      onMouseEnter={() => clearTimer(toast.id)}
      onMouseLeave={() => scheduleDismiss(toast.id, toast.tone)}
      onFocusCapture={() => clearTimer(toast.id)}
      onBlurCapture={() => scheduleDismiss(toast.id, toast.tone)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-base border px-4 py-3 shadow-lg",
        TONES[toast.tone],
      )}
    >
      <p className="flex-1 text-sm">{toast.message}</p>
      <Button
        variant="ghost"
        size="sm"
        aria-label="Închide notificarea"
        onClick={() => dismiss(toast.id)}
        className="-mr-1.5 size-7 shrink-0 px-0 text-current hover:bg-transparent hover:text-current hover:opacity-70"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="size-3.5"
          aria-hidden
          focusable="false"
        >
          <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" />
        </svg>
      </Button>
    </div>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-end gap-2 p-4">
        {/*
          Ambele regiuni trebuie să existe în pagină înainte să apară primul mesaj
          — un aria-live montat odată cu conținutul nu e anunțat de cititoarele de
          ecran. De aceea stau aici goale, niciodată `display: none` (asta le-ar
          scoate din arborele de accesibilitate și le-ar readuce în aceeași
          situație), și de aceea nu se randează condiționat.

          Sunt două, nu una: „polite" așteaptă la coadă după orice altceva citește
          cititorul de ecran în acel moment. Pentru o confirmare e exact ce trebuie
          — nu întrerupem pe nimeni pentru „Salvat". Pentru o eroare, așteptarea
          înseamnă că mesajul poate fi ratat cu totul, așa că erorile intră într-o
          regiune „assertive", care întrerupe.
        */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="flex w-full flex-col items-end gap-2"
        >
          {toasts.filter((toast) => toast.tone !== "danger").map(renderToast)}
        </div>
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="false"
          className="flex w-full flex-col items-end gap-2"
        >
          {toasts.filter((toast) => toast.tone === "danger").map(renderToast)}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast poate fi folosit doar în interiorul <ToastProvider>.");
  }
  return context;
}
