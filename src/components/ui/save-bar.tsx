"use client";

import { useEffect, useRef, useState } from "react";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { ConfirmDialog } from "./confirm-dialog";
import { InlineError } from "./feedback";

export type SaveBarProps = {
  /** Există modificări față de ultima salvare? Bara apare doar când e `true`. */
  isDirty: boolean;
  isSaving: boolean;
  onSave: () => void | Promise<void>;
  /** Aduce formularul înapoi la ultima variantă salvată. */
  onDiscard: () => void | Promise<void>;
  /** Mesajul unei salvări eșuate, scris pentru client, nu pentru consolă. */
  error?: string;
  className?: string;
};

/**
 * Bara de salvare a unui ecran de editare: se ridică de jos în momentul în care
 * apare prima modificare și nu pleacă până nu e salvată sau abandonată explicit.
 */
export function SaveBar({
  isDirty,
  isSaving,
  onSave,
  onDiscard,
  error,
  className,
}: SaveBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastIsDirty, setLastIsDirty] = useState(isDirty);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const wasDirtyRef = useRef(isDirty);

  // Garda stă înăuntru, nu în ecranul care folosește bara: dacă ar trebui chemată
  // separat, ar fi uitată exact acolo unde e mai mult de pierdut.
  useUnsavedChanges(isDirty);

  useEffect(() => {
    const justSettled = wasDirtyRef.current && !isDirty;
    wasDirtyRef.current = isDirty;
    if (!justSettled) return;

    // `inert` scoate bara din pagină cu tot cu focusul din ea, iar cine tocmai a
    // apăsat Salvează cu tastatura rămâne cu focusul aruncat pe <body>: următorul
    // Tab ar reporni din capul documentului. Îl mutăm pe anunțul de stare, care stă
    // lipit de bară, deci tabularea continuă de unde era. Dacă între timp focusul a
    // ajuns în altă parte (o salvare pornită din altă zonă a ecranului), nu-l furăm.
    const active = document.activeElement;
    if (active && active !== document.body) return;
    statusRef.current?.focus();
  }, [isDirty]);

  if (lastIsDirty !== isDirty) {
    setLastIsDirty(isDirty);
    // Dacă modificările dispar din altă parte (o salvare pornită în alt fel) cât
    // dialogul e deschis, întrebarea „renunți?" rămâne fără obiect. Ajustarea se
    // face în timpul randării, nu într-un efect, ca dialogul să nu apuce să
    // clipească deschis peste o bară care tocmai s-a golit.
    if (!isDirty) setConfirmOpen(false);
  }

  return (
    <>
      {/* Învelișul lipit nu prinde click-uri, doar bara din el: altfel banda transparentă
          de deasupra barei ar înghiți click-uri din conținutul de dedesubt. */}
      <div className={cn("pointer-events-none sticky bottom-0 z-30 pt-3", className)}>
        {/*
         * Bara rămâne în flux și ascunsă, ca să-și rezerve din start înălțimea: dacă ar
         * fi montată abia la prima modificare, conținutul ar sări sau ultimul câmp din
         * formular ar ajunge sub ea. `inert` o scoate din ordinea de tabulare și dintre
         * elementele citite de cititoarele de ecran cât timp e invizibilă.
         */}
        <div
          inert={!isDirty}
          className={cn(
            "flex flex-col gap-3 rounded-base border border-border-strong bg-surface px-4 py-3 shadow-lg",
            "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none",
            isDirty
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "translate-y-2 opacity-0",
          )}
        >
          {error && (
            <div role="alert">
              <InlineError>{error}</InlineError>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
            <p className="flex items-center gap-2 text-sm text-foreground">
              <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden />
              <span className="font-medium">Ai modificări nesalvate</span>
              <span className="hidden text-muted-foreground sm:inline">
                — se pierd dacă pleci de pe pagină.
              </span>
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmOpen(true)}
                disabled={isSaving}
              >
                Renunță la modificări
              </Button>
              <Button
                onClick={() => {
                  void onSave();
                }}
                disabled={isSaving}
                aria-busy={isSaving}
              >
                {isSaving ? "Se salvează…" : "Salvează"}
              </Button>
            </div>
          </div>
        </div>

        {/*
         * Anunțul pentru cititoarele de ecran stă în afara barei: înăuntru ar fi `inert`
         * exact când are ceva de spus, iar o regiune live care apare odată cu textul ei
         * nu e citită. Aici există dinainte, deci schimbarea stării chiar se aude. Tot ea
         * primește focusul rămas orfan când bara devine `inert` (vezi efectul de mai sus).
         */}
        <p ref={statusRef} tabIndex={-1} aria-live="polite" className="sr-only">
          {isDirty ? "Ai modificări nesalvate." : "Nu mai ai modificări nesalvate."}
        </p>
      </div>

      {/*
       * Dialogul stă în afara învelișului lipit: `pointer-events` se moștenește, așa că
       * din interiorul unui `pointer-events-none` nici butoanele lui n-ar mai răspunde
       * la maus — nici măcar când e deschis peste toată pagina.
       */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Renunți la modificări?"
        description="Tot ce ai schimbat de la ultima salvare se pierde și pagina revine la varianta salvată."
        confirmLabel="Da, renunț"
        cancelLabel="Continuă editarea"
        tone="danger"
        onConfirm={onDiscard}
        pending={isSaving}
      />
    </>
  );
}
