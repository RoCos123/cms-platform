"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "./feedback";

export type VariantOption = {
  id: string;
  /** Numele pe care îl vede clientul: „Clasic", „Centrat", „Editorial". */
  label: string;
  /** O propoziție scurtă, nu o listă de caracteristici tehnice. */
  description?: string;
  /**
   * Miniatura opțiunii. E `ReactNode`, nu o cale de imagine, tocmai ca schițele
   * SVG provizorii de azi să poată fi înlocuite cu <Image> și capturi reale
   * fără să se schimbe nimic aici.
   */
  preview: ReactNode;
};

export type VariantPickerProps = {
  value: string;
  onChange: (id: string) => void;
  variants: VariantOption[];
  /** Întrebarea de deasupra grupului, ex. „Cum vrei să arate pagina?". */
  label?: string;
  /** Lămurire sub întrebare — ce se întâmplă dacă alege, că poate reveni oricând. */
  hint?: string;
  className?: string;
};

/**
 * Selector de model de pagină cu miniaturi. Originalul era o listă de butoane
 * radio cu descrieri tehnice („A — asymmetric + floating cards"), pe care un
 * psiholog nu avea cum să le compare; aici alegerea se face uitându-te la formă.
 *
 * Comportamentul de tastatură respectă tiparul „radiogroup": un singur element
 * din grup e în ordinea de tabulare, iar săgețile mută focusul ȘI selecția.
 */
export function VariantPicker({
  value,
  onChange,
  variants,
  label,
  hint,
  className,
}: VariantPickerProps) {
  const groupId = useId();
  const optionsRef = useRef(new Map<string, HTMLButtonElement>());
  /**
   * Cât timp cineva navighează prin grup, elementul tabulabil e cel focusat —
   * altfel ar fi cel selectat, iar Tab-ul dus și înapoi ar arunca focusul pe
   * altă miniatură decât cea pe care tocmai o priveai. La ieșirea din grup
   * revenim la selecție, ca următorul Tab să pice tot pe opțiunea aleasă.
   */
  const [focusedId, setFocusedId] = useState<string | null>(null);

  /**
   * Întrebarea și lămurirea se randează la fel și când există opțiuni, și când
   * nu — altfel, pe lista goală, dispărea și contextul, nu doar miniaturile.
   */
  const header = (label || hint) && (
    <div className="space-y-1">
      {label && (
        <p id={`${groupId}-label`} className="text-sm font-medium text-foreground">
          {label}
        </p>
      )}
      {hint && (
        <p id={`${groupId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );

  if (variants.length === 0) {
    return (
      <div className={cn("space-y-3", className)}>
        {header}
        <EmptyState
          title="Niciun model de pagină disponibil"
          description="Modelele apar aici imediat ce sunt configurate. Până atunci, pagina rămâne pe aranjamentul implicit."
        />
      </div>
    );
  }

  const has = (id: string) => variants.some((variant) => variant.id === id);
  const selectedId = has(value) ? value : variants[0].id;
  const activeId = focusedId !== null && has(focusedId) ? focusedId : selectedId;

  function select(index: number) {
    // Navigarea circulară: de la ultima opțiune săgeata dreapta duce la prima.
    const next = variants[(index + variants.length) % variants.length];
    onChange(next.id);
    // Focusul mută și `focusedId`, prin handlerul onFocus al butonului.
    optionsRef.current.get(next.id)?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = variants.findIndex((variant) => variant.id === activeId);
    if (current < 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        select(current + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        select(current - 1);
        break;
      case "Home":
        event.preventDefault();
        select(0);
        break;
      case "End":
        event.preventDefault();
        select(variants.length - 1);
        break;
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      {header}

      <div
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-label` : undefined}
        aria-label={label ? undefined : "Alege modelul de pagină"}
        aria-describedby={hint ? `${groupId}-hint` : undefined}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocusedId(null);
        }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {variants.map((variant) => {
          /*
           * Comparăm cu `selectedId`, nu cu `value`: dacă `value` nu e în listă
           * (câmp încă gol, model șters între timp), `selectedId` cade pe prima
           * opțiune — cea care primește deja `tabIndex={0}`. Comparat cu `value`,
           * grupul rămânea fără niciun `aria-checked` și fără niciun chenar de
           * selecție, deși tastatura se purta ca și cum prima ar fi aleasă.
           */
          const selected = variant.id === selectedId;
          const optionId = `${groupId}-${variant.id}`;

          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-labelledby={`${optionId}-label`}
              aria-describedby={variant.description ? `${optionId}-description` : undefined}
              /* Un singur element din grup e tabulabil; restul se ating cu săgețile. */
              tabIndex={variant.id === activeId ? 0 : -1}
              ref={(node) => {
                const map = optionsRef.current;
                if (node) map.set(variant.id, node);
                else map.delete(variant.id);
              }}
              onFocus={() => setFocusedId(variant.id)}
              onClick={() => onChange(variant.id)}
              className={cn(
                "relative flex flex-col gap-3 rounded-base border p-3 text-left transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "border-primary bg-surface ring-2 ring-primary"
                  : "border-border bg-surface hover:border-border-strong hover:bg-surface-hover",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute right-4 top-4 flex size-5 items-center justify-center rounded-full transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-strong bg-surface",
                )}
              >
                {selected && <CheckIcon />}
              </span>

              {/* Schița e decor: tot ce trebuie citit cu voce tare stă în etichetă. */}
              <span
                aria-hidden
                className="flex items-center justify-center overflow-hidden rounded-base border border-border bg-surface-muted p-3"
              >
                {variant.preview}
              </span>

              <span className="block space-y-1 pr-6">
                <span
                  id={`${optionId}-label`}
                  className="block text-sm font-medium text-foreground"
                >
                  {variant.label}
                </span>
                {variant.description && (
                  <span
                    id={`${optionId}-description`}
                    className="block text-xs text-muted-foreground"
                  >
                    {variant.description}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3.5"
    >
      <path d="M3.5 8.5l3 3 6-6" />
    </svg>
  );
}
