"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SaveBar } from "@/components/ui/save-bar";
import { InlineError, StatusBadge, type StatusValue } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { LOCURI_MENIU, esteLocMeniu, type LocMeniu } from "@/lib/pagini";
import { salveazaAranjareaPaginilor, stergePagina } from "./actions";

export type RandPaginaLista = {
  id: string;
  titlu: string;
  slug: string;
  stare: StatusValue;
  loc: LocMeniu;
};

/**
 * Lista paginilor: ordinea din meniu, unde apare fiecare și ce e publicat.
 *
 * Toate trei se salvează împreună, cu bara de jos: se schimbă din același ecran,
 * se uită la aceeași listă și țin de o singură intenție — „aranjez meniul".
 * Ștergerea e imediată și cere confirmare: nu e o modificare care se abandonează.
 */
export function ListaPagini({ initiale }: { initiale: RandPaginaLista[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [referinta, setReferinta] = useState(initiale);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [anunt, setAnunt] = useState("");
  const [deStersId, setDeStersId] = useState<string | null>(null);
  const [seSterge, porneste] = useTransition();
  const { show } = useToast();

  // Când o pagină ajunge prima sau ultima, butonul apăsat se dezactivează și
  // focusul cade pe <body>. Îl mutăm pe butonul pereche, care e tot acolo.
  const butoane = useRef(
    new Map<string, { sus: HTMLButtonElement | null; jos: HTMLButtonElement | null }>(),
  );

  function referintaButon(id: string, directie: "sus" | "jos") {
    return (element: HTMLButtonElement | null) => {
      const pereche = butoane.current.get(id) ?? { sus: null, jos: null };
      pereche[directie] = element;
      butoane.current.set(id, pereche);
    };
  }

  const deSters = randuri.find((rand) => rand.id === deStersId) ?? null;

  const modificat =
    randuri.length !== referinta.length ||
    randuri.some(
      (rand, i) =>
        rand.id !== referinta[i].id ||
        rand.stare !== referinta[i].stare ||
        rand.loc !== referinta[i].loc,
    );

  function schimba(id: string, schimbare: Partial<RandPaginaLista>) {
    setRanduri((precedente) =>
      precedente.map((rand) => (rand.id === id ? { ...rand, ...schimbare } : rand)),
    );
  }

  function muta(index: number, directie: -1 | 1) {
    const destinatie = index + directie;
    if (destinatie < 0 || destinatie >= randuri.length) return;

    const urmatoare = [...randuri];
    [urmatoare[index], urmatoare[destinatie]] = [urmatoare[destinatie], urmatoare[index]];
    setRanduri(urmatoare);

    const mutata = randuri[index];
    setAnunt(`${mutata.titlu}: poziția ${destinatie + 1} din ${urmatoare.length}.`);

    if (destinatie === 0 || destinatie === urmatoare.length - 1) {
      const pereche = butoane.current.get(mutata.id);
      queueMicrotask(() => (directie === -1 ? pereche?.jos : pereche?.sus)?.focus());
    }
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(undefined);

    const rezultat = await salveazaAranjareaPaginilor(
      randuri.map((rand, i) => ({
        id: rand.id,
        pozitie: (i + 1) * 10,
        publicat: rand.stare === "published",
        loc: rand.loc,
      })),
    ).catch(() => null);

    setSeSalveaza(false);

    if (!rezultat || !rezultat.ok) {
      setEroare(rezultat?.mesaj ?? "Nu am putut salva. Verifică legătura la internet.");
      return;
    }

    setReferinta(randuri);
    show("Paginile au fost actualizate.", "success");
  }

  // Meniul de sus are un buget de spațiu, iar clientul nu-l vede până nu se
  // rupe. Nu-l oprim — e site-ul lui — dar îi spunem înainte să se mire.
  const inAntet = randuri.filter(
    (rand) => rand.loc === "header" && rand.stare === "published",
  ).length;

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>

      {eroare && <InlineError>{eroare}</InlineError>}

      {inAntet > 3 && (
        <p className="rounded-base bg-warning-surface px-3 py-2 text-xs text-warning">
          Ai {inAntet} pagini în meniul de sus, pe lângă Despre, Servicii și Contact. Peste trei,
          meniul se rupe pe două rânduri și se citește greu — mută-le pe cele mai puțin căutate în
          subsol.
        </p>
      )}

      <ol className="space-y-2">
        {randuri.map((rand, index) => (
          <li
            key={rand.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-base border border-border bg-surface p-4"
          >
            <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
              {index + 1}
            </span>

            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                {rand.titlu}
                <StatusBadge status={rand.stare} />
              </p>
              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                /{rand.slug}
              </p>
            </div>

            <label className="shrink-0 text-xs text-muted-foreground">
              <span className="sr-only">Unde apare linkul către {rand.titlu}</span>
              <select
                value={rand.loc}
                onChange={(eveniment) => {
                  const aleasa = eveniment.target.value;
                  if (esteLocMeniu(aleasa)) schimba(rand.id, { loc: aleasa });
                }}
                className="rounded-base border border-border bg-surface px-2 py-1.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring"
              >
                {LOCURI_MENIU.map((loc) => (
                  <option key={loc.valoare} value={loc.valoare}>
                    {loc.eticheta}
                  </option>
                ))}
              </select>
            </label>

            <Link
              href={`/dashboard/pagini/${rand.id}`}
              className="shrink-0 rounded-base px-3 py-1.5 text-sm font-medium text-foreground underline hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              Editează
            </Link>

            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={rand.stare === "published"}
                onChange={(eveniment) =>
                  schimba(rand.id, {
                    stare: eveniment.target.checked ? "published" : "unpublished",
                  })
                }
                className="size-4 accent-primary"
              />
              Pe site
            </label>

            <div className="flex shrink-0 gap-1">
              <Button
                ref={referintaButon(rand.id, "sus")}
                variant="ghost"
                size="sm"
                disabled={index === 0}
                onClick={() => muta(index, -1)}
                aria-label={`Mută pagina ${rand.titlu} mai sus`}
              >
                <span aria-hidden>↑</span>
              </Button>
              <Button
                ref={referintaButon(rand.id, "jos")}
                variant="ghost"
                size="sm"
                disabled={index === randuri.length - 1}
                onClick={() => muta(index, 1)}
                aria-label={`Mută pagina ${rand.titlu} mai jos`}
              >
                <span aria-hidden>↓</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={seSterge}
                onClick={() => setDeStersId(rand.id)}
                aria-label={`Șterge pagina ${rand.titlu}`}
              >
                <span aria-hidden>🗑</span>
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <ConfirmDialog
        open={deSters !== null}
        onOpenChange={(deschis) => !deschis && setDeStersId(null)}
        title="Ștergi pagina?"
        description={
          deSters
            ? `„${deSters.titlu}” dispare de pe site, cu tot textul ei. Adresa /${deSters.slug} nu va mai duce nicăieri.`
            : undefined
        }
        warning="Dacă vrei doar să nu se mai vadă pe site, debifează „Pe site” în loc să ștergi."
        confirmLabel="Șterge"
        tone="danger"
        pending={seSterge}
        onConfirm={() => {
          const pagina = deSters;
          if (!pagina) return;
          setDeStersId(null);
          porneste(async () => {
            const rezultat = await stergePagina(pagina.id).catch(() => null);
            if (!rezultat || !rezultat.ok) {
              setEroare(rezultat?.mesaj ?? "Nu am putut șterge. Verifică legătura la internet.");
              return;
            }
            const ramase = randuri.filter((rand) => rand.id !== pagina.id);
            setRanduri(ramase);
            setReferinta(ramase);
            show("Pagina a fost ștearsă.", "success");
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
