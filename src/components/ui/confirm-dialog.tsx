"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, ReactNode, SyntheticEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type ConfirmTone = "default" | "danger";

type ConfirmDialogBaseProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  /**
   * Slot pentru un avertisment suplimentar, afișat sub descriere — locul pentru
   * consecințe pe care utilizatorul nu le vede din ecranul curent
   * (ex. „Imaginea e folosită în 3 locuri pe site").
   */
  warning?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Poate fi asincron (Server Action); dialogul rămâne deschis cât timp rulează. */
  onConfirm: () => void | Promise<void>;
  tone?: ConfirmTone;
  /** Pentru cazul în care părintele conduce acțiunea (useTransition / useActionState). */
  pending?: boolean;
};

/**
 * Două stiluri de închidere, ca dialogul să se potrivească și cu un `open` din
 * state boolean, și cu un părinte care ține datele confirmate („ce anume șterg").
 * Tipul cere cel puțin unul: un dialog fără cale de închidere ar bloca ecranul.
 */
type ConfirmDialogCloseProps =
  | {
      /** Chemat cu `false` la Renunță, Escape, click pe fundal și după o confirmare reușită. */
      onOpenChange: (open: boolean) => void;
      /** Chemat doar când utilizatorul renunță, niciodată după confirmare. */
      onCancel?: () => void;
    }
  | {
      onOpenChange?: (open: boolean) => void;
      onCancel: () => void;
    };

export type ConfirmDialogProps = ConfirmDialogBaseProps & ConfirmDialogCloseProps;

/**
 * `showModal()` mută focusul pe primul element focusabil, dar noi îl vrem explicit
 * pe „Renunță": la o ștergere, un Enter din reflex nu trebuie să distrugă nimic.
 */
const INITIAL_FOCUS_ATTR = "data-confirm-initial-focus";

export function ConfirmDialog({
  open,
  onOpenChange,
  onCancel,
  title,
  description,
  warning,
  confirmLabel,
  cancelLabel = "Renunță",
  onConfirm,
  tone = "default",
  pending = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const pointerDownOnBackdrop = useRef(false);
  const [running, setRunning] = useState(false);

  const titleId = useId();
  const descriptionId = useId();
  const busy = pending || running;

  const restoreFocus = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    // Browserele moderne întorc singure focusul la `close()`, dar nu toate — și nu
    // dacă dialogul dispare odată cu o schimbare de rută.
    if (trigger?.isConnected) trigger.focus();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!open) {
      // `close()` declanșează handleNativeClose, care se ocupă de focus.
      if (dialog.open) dialog.close();
      return;
    }

    if (!dialog.open) {
      // Reținem declanșatorul cât încă are focusul, înainte ca modalul să-l fure.
      triggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    }
    dialog.querySelector<HTMLElement>(`[${INITIAL_FOCUS_ATTR}]`)?.focus();
  }, [open]);

  useEffect(() => () => restoreFocus(), [restoreFocus]);

  function requestClose() {
    if (busy) return;
    onCancel?.();
    onOpenChange?.(false);
  }

  function handleNativeCancel(event: SyntheticEvent<HTMLDialogElement>) {
    // Escape în mijlocul acțiunii ar ascunde rezultatul înainte ca el să existe.
    if (busy) event.preventDefault();
  }

  function handleNativeClose() {
    restoreFocus();
    // Escape închide dialogul nativ fără să treacă prin React; starea trebuie să afle.
    // Când închiderea a pornit din React, `open` e deja false și nu repetăm anunțul.
    if (open) requestClose();
  }

  function handlePointerDown(event: PointerEvent<HTMLDialogElement>) {
    // Click-ul pe fundal e raportat pe <dialog>; tot conținutul stă într-un copil.
    pointerDownOnBackdrop.current = event.target === dialogRef.current;
  }

  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    // O selecție de text începută în dialog și terminată pe fundal nu e o intenție de închidere.
    if (!pointerDownOnBackdrop.current || event.target !== dialogRef.current) return;
    pointerDownOnBackdrop.current = false;
    requestClose();
  }

  async function handleConfirm() {
    setRunning(true);
    try {
      await onConfirm();
      onOpenChange?.(false);
    } finally {
      // La eșec dialogul rămâne deschis, ca utilizatorul să vadă eroarea și să reîncerce.
      setRunning(false);
    }
  }

  const resolvedConfirmLabel = confirmLabel ?? (tone === "danger" ? "Șterge" : "Confirmă");

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={handleNativeCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      className={cn(
        // Lățimea lasă o margine pe telefon; înălțimea se limitează ca un avertisment
        // lung să curgă în dialog, nu sub marginea ecranului.
        "m-auto w-[calc(100%-2rem)] max-w-md max-h-[calc(100dvh-4rem)] overflow-y-auto",
        "rounded-base border border-border bg-surface p-0 text-foreground shadow-xl",
        // Voalul folosește tokenul de pagină, nu un negru fix: altfel în temă închisă
        // ar lumina ecranul în loc să-l estompeze. Blurul dă separarea de conținut.
        "backdrop:bg-background/70 backdrop:backdrop-blur-sm",
      )}
    >
      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <h2 id={titleId} className="text-base font-semibold text-foreground">
            {title}
          </h2>
          {description && (
            <div id={descriptionId} className="text-sm text-muted-foreground">
              {description}
            </div>
          )}
        </div>

        {warning && (
          <div className="flex items-start gap-2 rounded-base bg-warning-surface px-3 py-2 text-xs text-warning">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px size-4 shrink-0"
              aria-hidden
              focusable="false"
            >
              <path d="M10 3.4 2.7 16.2h14.6L10 3.4Z" />
              <path d="M10 8.4v3.3" />
              <path d="M10 14h.01" />
            </svg>
            <div>{warning}</div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            onClick={requestClose}
            disabled={busy}
            data-confirm-initial-focus=""
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? "Un moment…" : resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
