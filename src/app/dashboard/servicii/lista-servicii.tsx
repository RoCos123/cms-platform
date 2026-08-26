"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SaveBar } from "@/components/ui/save-bar";
import { InlineError } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { salveazaOrdineaServiciilor, stergeServiciu } from "./actions";

export type RandServiciuLista = {
  id: string;
  titlu: string;
  descriereScurta: string;
  publicat: boolean;
};

/**
 * Lista serviciilor: ordinea de pe site, ce e publicat și ce e ciornă.
 *
 * Ordinea și publicarea se salvează împreună, cu bara de jos — la fel ca la
 * secțiuni, ca să nu existe două feluri de a salva în același panou. Ștergerea
 * e imediată și cere confirmare: nu e o modificare care se poate abandona.
 */
export function ListaServicii({ initiale }: { initiale: RandServiciuLista[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [referinta, setReferinta] = useState(initiale);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [anunt, setAnunt] = useState("");
  const [deSters, setDeSters] = useState<RandServiciuLista | null>(null);
  const [seSterge, porneste] = useTransition();
  const { show } = useToast();

  // Când un serviciu ajunge primul sau ultimul, butonul apăsat se dezactivează
  // și focusul cade pe <body>. Îl mutăm pe butonul pereche, care e tot acolo.
  const butoane = useRef(new Map<string, { sus: HTMLButtonElement | null; jos: HTMLButtonElement | null }>());

  function referintaButon(id: string, directie: "sus" | "jos") {
    return (element: HTMLButtonElement | null) => {
      const pereche = butoane.current.get(id) ?? { sus: null, jos: null };
      pereche[directie] = element;
      butoane.current.set(id, pereche);
    };
  }

  const modificat =
    randuri.length !== referinta.length ||
    randuri.some((rand, i) => rand.id !== referinta[i].id || rand.publicat !== referinta[i].publicat);

  function muta(index: number, directie: -1 | 1) {
    const destinatie = index + directie;
    if (destinatie < 0 || destinatie >= randuri.length) return;

    const urmatoare = [...randuri];
    [urmatoare[index], urmatoare[destinatie]] = [urmatoare[destinatie], urmatoare[index]];
    setRanduri(urmatoare);

    const mutat = randuri[index];
    setAnunt(`${mutat.titlu}: poziția ${destinatie + 1} din ${urmatoare.length}.`);

    if (destinatie === 0 || destinatie === urmatoare.length - 1) {
      const pereche = butoane.current.get(mutat.id);
      queueMicrotask(() => (directie === -1 ? pereche?.jos : pereche?.sus)?.focus());
    }
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaOrdineaServiciilor(
      randuri.map((rand, i) => ({ id: rand.id, pozitie: (i + 1) * 10, publicat: rand.publicat })),
    );

    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      return;
    }

    setReferinta(randuri);
    show("Serviciile au fost actualizate.", "success");
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>

      {eroare && <InlineError>{eroare}</InlineError>}

      <ol className="space-y-2">
        {randuri.map((rand, index) => (
          <li
            key={rand.id}
            className="flex items-center gap-4 rounded-base border border-border bg-surface p-4"
          >
            <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                {rand.titlu}
                {!rand.publicat && (
                  <span className="rounded-base border border-border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                    ciornă
                  </span>
                )}
              </p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {rand.descriereScurta || "Fără descriere scurtă."}
              </p>
            </div>

            <Link
              href={`/dashboard/servicii/${rand.id}`}
              className="shrink-0 rounded-base px-3 py-1.5 text-sm font-medium text-foreground underline hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Editează
            </Link>

            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rand.publicat}
                onChange={() =>
                  setRanduri((precedente) =>
                    precedente.map((r) => (r.id === rand.id ? { ...r, publicat: !r.publicat } : r)),
                  )
                }
                className="size-4 accent-primary"
              />
              Publicat
            </label>

            <div className="flex shrink-0 gap-1">
              <Button
                ref={referintaButon(rand.id, "sus")}
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => muta(index, -1)}
                aria-label={`Mută serviciul ${rand.titlu} mai sus`}
              >
                <span aria-hidden>↑</span>
              </Button>
              <Button
                ref={referintaButon(rand.id, "jos")}
                variant="ghost"
                size="sm"
                disabled={index === randuri.length - 1}
                onClick={() => muta(index, 1)}
                aria-label={`Mută serviciul ${rand.titlu} mai jos`}
              >
                <span aria-hidden>↓</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={seSterge}
                onClick={() => setDeSters(rand)}
                aria-label={`Șterge serviciul ${rand.titlu}`}
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={deSters !== null}
        onOpenChange={(deschis) => !deschis && setDeSters(null)}
        title="Ștergi serviciul?"
        description={
          deSters ? `„${deSters.titlu}” dispare de pe site și din panou, cu tot textul lui.` : undefined
        }
        warning="Dacă vrei doar să nu se mai vadă pe site, debifează „Publicat” în loc să ștergi."
        confirmLabel="Șterge"
        tone="danger"
        pending={seSterge}
        onConfirm={() => {
          const serviciu = deSters;
          if (!serviciu) return;
          setDeSters(null);
          porneste(async () => {
            const rezultat = await stergeServiciu(serviciu.id);
            if (!rezultat.ok) {
              setEroare(rezultat.mesaj);
              return;
            }
            const ramase = randuri.filter((r) => r.id !== serviciu.id);
            setRanduri(ramase);
            setReferinta(ramase);
            show("Serviciul a fost șters.", "success");
          });
        }}
      />

      <SaveBar
        isDirty={modificat}
        isSaving={seSalveaza}
        onSave={salveaza}
        onDiscard={() => {
          setRanduri(referinta);
          setEroare(undefined);
        }}
        error={eroare}
      />
    </>
  );
}
