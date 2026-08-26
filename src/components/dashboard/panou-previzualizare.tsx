"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CadruPrevizualizare } from "./cadru-previzualizare";
import { LimitaEroare } from "./limita-eroare";
import { templateFontsHref, templateStyle, type Template } from "@/lib/templates";

const LATIMI = [
  { eticheta: "Laptop", valoare: 1180 },
  { eticheta: "Telefon", valoare: 390 },
] as const;

/**
 * Coloana de previzualizare, aceeași peste tot în panou.
 *
 * Extrasă când a fost nevoie de ea a doua oară (secțiuni și setări). Dacă
 * fiecare ecran și-ar fi construit-o singur, comutatorul Laptop/Telefon ar fi
 * ajuns să arate altfel într-un loc decât în celălalt, iar plasa de siguranță
 * ar fi lipsit exact de unde n-a pus-o nimeni.
 */
export function PanouPrevizualizare({
  template,
  cheie,
  titlu = "Cum arată pe site",
  nota,
  children,
}: {
  template: Template;
  /** Se schimbă odată cu conținutul — repornește previzualizarea după o eroare. */
  cheie: unknown;
  titlu?: string;
  nota: ReactNode;
  children: ReactNode;
}) {
  const [latime, setLatime] = useState<number>(LATIMI[0].valoare);

  return (
    // Pe ecran lat stă în dreapta formularului și rămâne lipită sus cât derulezi.
    // Pe ecran îngust cele două coloane se așază una sub alta, iar previzualizarea
    // trece DEASUPRA: sub formular ar ajunge după zeci de câmpuri, adică s-ar
    // scrie fără s-o vadă nimeni.
    <div className="sticky top-0 z-10 order-first bg-background pb-4 lg:order-none lg:top-6 lg:pb-0">
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{titlu}</p>
        <div className="flex gap-1" role="group" aria-label="Lățimea previzualizării">
          {LATIMI.map((optiune) => (
            <Button
              key={optiune.valoare}
              size="sm"
              variant={latime === optiune.valoare ? "secondary" : "ghost"}
              aria-pressed={latime === optiune.valoare}
              onClick={() => setLatime(optiune.valoare)}
            >
              {optiune.eticheta}
            </Button>
          ))}
        </div>
      </div>

      <div className="max-h-[52vh] overflow-hidden rounded-base lg:max-h-none lg:overflow-visible">
        <LimitaEroare
          cheie={cheie}
          fallback={
            <div className="rounded-base border border-border bg-surface p-6 text-sm text-muted-foreground">
              Previzualizarea nu s-a putut afișa pentru ce e scris acum în formular.
              Continuă să scrii — se reia singură. Ce ai completat nu s-a pierdut.
            </div>
          }
        >
          <CadruPrevizualizare latime={latime} fonturi={templateFontsHref(template)}>
            <div
              style={{
                ...templateStyle(template),
                background: "var(--t-fundal)",
                color: "var(--t-text)",
                fontFamily: "var(--t-font-principal)",
              }}
            >
              {children}
            </div>
          </CadruPrevizualizare>
        </LimitaEroare>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">{nota}</p>
    </div>
  );
}
