"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SaveBar } from "@/components/ui/save-bar";
import { useToast } from "@/components/ui/toast";
import { metaSectiune } from "@/lib/sectiuni";
import { salveazaStructuraPaginii } from "./actions";

export type RandSectiune = {
  id: string;
  cheie: string;
  vizibil: boolean;
  /** Conținut demonstrativ, pus de noi la provizionare — nu scris de client. */
  demo: boolean;
};

/**
 * Ecranul „Pagina principală → Secțiuni": ordinea și vizibilitatea.
 *
 * Mutare cu butoane sus/jos, nu cu tragere cu mouse-ul. Tragerea arată bine
 * într-o demonstrație și e inutilizabilă cu tastatura sau pe telefon, unde
 * gestul se bate cap în cap cu derularea paginii. Pentru o listă de douăsprezece
 * elemente, două butoane fac aceeași treabă și funcționează pentru toată lumea.
 */
export function ListaSectiuni({ initiale }: { initiale: RandSectiune[] }) {
  const [randuri, setRanduri] = useState(initiale);
  const [referinta, setReferinta] = useState(initiale);
  const [seSalveaza, setSeSalveaza] = useState(false);
  const [eroare, setEroare] = useState<string | undefined>();
  const [anunt, setAnunt] = useState("");
  const { show } = useToast();

  // Când un element ajunge primul sau ultimul, butonul apăsat se dezactivează și
  // focusul cade pe <body> — următorul Tab ar reporni din capul paginii. Îl mutăm
  // pe butonul pereche al aceluiași element, care e tot acolo.
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
    randuri.some((rand, i) => rand.id !== referinta[i].id || rand.vizibil !== referinta[i].vizibil);

  function muta(index: number, directie: -1 | 1) {
    const destinatie = index + directie;
    if (destinatie < 0 || destinatie >= randuri.length) return;

    const urmatoare = [...randuri];
    [urmatoare[index], urmatoare[destinatie]] = [urmatoare[destinatie], urmatoare[index]];
    setRanduri(urmatoare);

    const mutat = randuri[index];
    const nume = numeSectiune(mutat.cheie);
    setAnunt(`${nume}: poziția ${destinatie + 1} din ${urmatoare.length}.`);

    // Butonul apăsat se dezactivează exact când elementul ajunge la capăt.
    const laCapat = destinatie === 0 || destinatie === urmatoare.length - 1;
    if (laCapat) {
      const pereche = butoane.current.get(mutat.id);
      queueMicrotask(() => (directie === -1 ? pereche?.jos : pereche?.sus)?.focus());
    }
  }

  function comutaVizibil(id: string) {
    setRanduri((precedente) =>
      precedente.map((rand) => (rand.id === id ? { ...rand, vizibil: !rand.vizibil } : rand)),
    );
  }

  async function salveaza() {
    setSeSalveaza(true);
    setEroare(undefined);

    // Pozițiile se renumerotează din zece în zece, nu 1, 2, 3: rămâne loc de
    // inserat o secțiune între două existente fără să le atingem pe toate.
    const rezultat = await salveazaStructuraPaginii(
      randuri.map((rand, i) => ({ id: rand.id, pozitie: (i + 1) * 10, vizibil: rand.vizibil })),
    );

    setSeSalveaza(false);

    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      return;
    }

    setReferinta(randuri);
    show("Pagina principală a fost actualizată.", "success");
  }

  return (
    <>
      <p aria-live="polite" className="sr-only">
        {anunt}
      </p>

      <ol className="space-y-2">
        {randuri.map((rand, index) => {
          const meta = metaSectiune(rand.cheie);

          return (
            <li
              key={rand.id}
              className="flex items-center gap-4 rounded-base border border-border bg-surface p-4"
            >
              <span className="w-6 shrink-0 text-sm tabular-nums text-muted-foreground">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                  {numeSectiune(rand.cheie)}
                  {!meta && (
                    <span className="rounded-base border border-warning/30 bg-warning-surface px-2 py-0.5 text-xs font-normal text-warning">
                      necunoscută
                    </span>
                  )}
                  {rand.demo && (
                    <span className="rounded-base border border-border px-2 py-0.5 text-xs font-normal text-muted-foreground">
                      text demonstrativ
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {meta?.descriere ??
                    "Secțiune pe care panoul nu o cunoaște încă. Pe site nu se afișează."}
                </p>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rand.vizibil}
                  onChange={() => comutaVizibil(rand.id)}
                  className="size-4 accent-primary"
                />
                Vizibilă
              </label>

              <div className="flex shrink-0 gap-1">
                <Button
                  ref={referintaButon(rand.id, "sus")}
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => muta(index, -1)}
                  aria-label={`Mută secțiunea ${numeSectiune(rand.cheie)} mai sus`}
                >
                  <span aria-hidden>↑</span>
                </Button>
                <Button
                  ref={referintaButon(rand.id, "jos")}
                  variant="ghost"
                  size="sm"
                  disabled={index === randuri.length - 1}
                  onClick={() => muta(index, 1)}
                  aria-label={`Mută secțiunea ${numeSectiune(rand.cheie)} mai jos`}
                >
                  <span aria-hidden>↓</span>
                </Button>
              </div>
            </li>
          );
        })}
      </ol>

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

/**
 * O cheie necunoscută nu e o eroare de arătat clientului: baza de date poate
 * conține o secțiune pe care codul nu o știe încă. Se afișează cheia brută, ca
 * rândul să rămână identificabil și mutabil.
 */
function numeSectiune(cheie: string): string {
  return metaSectiune(cheie)?.nume ?? cheie;
}
