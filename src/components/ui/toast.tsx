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
  const viewportRef = useRef<HTMLDivElement | null>(null);

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

  /**
   * Re-afișează popoverul la fiecare schimbare a listei: „top layer" e o stivă,
   * iar un `<dialog>` deschis după el s-ar așeza deasupra. Re-afișarea îl readuce
   * în vârf. `try/catch` fiindcă `showPopover()` aruncă dacă elementul e deja
   * afișat sau dacă browserul nu cunoaște API-ul — în ambele cazuri, notificarea
   * rămâne perfect audibilă prin regiunile live, doar poziționarea suferă.
   */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || typeof viewport.showPopover !== "function") return;

    try {
      if (toasts.length === 0) {
        viewport.hidePopover();
        return;
      }
      viewport.hidePopover();
      viewport.showPopover();
    } catch {
      // Vezi mai sus: degradare tăcută, nu pierdem funcționalitatea esențială.
    }
  }, [toasts]);

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

      {/*
        Anunțul și partea vizuală sunt separate deliberat.

        Regiunile live de mai jos rămân permanent în pagină, ascunse vizual: un
        `aria-live` montat odată cu conținutul nu e anunțat de cititoarele de
        ecran, iar `display: none` l-ar scoate din arborele de accesibilitate.
        Ele poartă doar textul.

        Sunt două, nu una: „polite" așteaptă la coadă după ce citește cititorul de
        ecran în acel moment — exact ce vrem pentru „Salvat", nu întrerupem pe
        nimeni. Pentru o eroare, așteptarea înseamnă că mesajul poate fi ratat cu
        totul, deci erorile intră într-o regiune „assertive", care întrerupe.
      */}
      <div className="sr-only">
        <div role="status" aria-live="polite" aria-atomic="false">
          {toasts
            .filter((toast) => toast.tone !== "danger")
            .map((toast) => (
              <p key={toast.id}>{toast.message}</p>
            ))}
        </div>
        <div role="alert" aria-live="assertive" aria-atomic="false">
          {toasts
            .filter((toast) => toast.tone === "danger")
            .map((toast) => (
              <p key={toast.id}>{toast.message}</p>
            ))}
        </div>
      </div>

      {/*
        Partea vizuală e un popover, nu un simplu `fixed z-50`. Toate modalele
        aplicației folosesc `<dialog>.showModal()`, care le urcă în „top layer" —
        deasupra oricărui z-index. O notificare ridicată cât e deschisă biblioteca
        media ar fi apărut sub voal, invizibilă. Un popover intră în același strat,
        iar `viewportRef` îl re-afișează la fiecare mesaj nou ca să ajungă peste
        dialogul deschis între timp.

        `aria-hidden`: textul e deja anunțat de regiunile de mai sus; fără el,
        fiecare mesaj s-ar citi de două ori.
      */}
      <div
        ref={viewportRef}
        popover="manual"
        aria-hidden="true"
        className={cn(
          "pointer-events-none inset-[unset] bottom-0 left-0 right-0 m-0 w-full max-w-full",
          "flex flex-col items-end gap-2 border-0 bg-transparent p-4",
        )}
      >
        {toasts.map(renderToast)}
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
