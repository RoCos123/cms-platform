"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  MAXIM_DESCRIERE_IMAGINE,
  descrieFolosirile,
  formateazaData,
  formateazaMarimea,
  type ImagineBiblioteca,
} from "@/lib/imagini";
import { salveazaDescriereaImaginii, stergeImaginea } from "./actions";

/**
 * Detaliile imaginii alese: ce e, unde e pusă, cum se descrie și cum se șterge.
 *
 * Primește `key={imagine.id}` de la părinte, deci se remontează la fiecare
 * schimbare de selecție. Așa descrierea scrisă pe jumătate pentru o poză nu
 * apare peste alta — iar componenta nu trebuie să sincronizeze nimic cu props.
 */
export function PanouImagine({
  imagine,
  onSters,
}: {
  imagine: ImagineBiblioteca | null;
  /** Selecția din grilă trebuie să dispară odată cu imaginea. */
  onSters: () => void;
}) {
  if (!imagine) {
    return (
      <aside className="rounded-base border border-border bg-surface p-5">
        <p className="text-xs text-muted-foreground">
          Apasă pe o imagine ca să-i vezi aici detaliile: cum se cheamă, cât e de mare, în
          ce pagini e pusă și ce scrie despre ea.
        </p>
      </aside>
    );
  }

  return <Detalii imagine={imagine} onSters={onSters} />;
}

/**
 * Partea cu stare, separată doar ca `imagine` să fie sigur prezentă.
 *
 * Un singur `if` la început n-ar fi ajuns: un parametru poate fi reatribuit,
 * deci verificarea nu se propagă în funcțiile scrise mai jos, iar fiecare ar fi
 * cerut un `!` — adică exact promisiunea pe care compilatorul n-o poate ține.
 */
function Detalii({
  imagine,
  onSters,
}: {
  imagine: ImagineBiblioteca;
  onSters: () => void;
}) {
  const [descriere, setDescriere] = useState(imagine.descriere);
  const [eroare, setEroare] = useState<string | null>(null);
  const [eroareStergere, setEroareStergere] = useState<string | null>(null);
  const [deSters, setDeSters] = useState(false);
  const [seSalveaza, porneste] = useTransition();
  const { show } = useToast();

  const modificat = descriere.trim() !== imagine.descriere.trim();
  const incarcataLa = formateazaData(imagine.incarcataLa);
  // Aceeași imagine pusă de două ori în același loc e tot un singur loc de unde
  // trebuie scoasă: clientul întreabă „unde e", nu „de câte ori".
  const locuri = [...new Map(imagine.folosiri.map((f) => [f.href, f])).values()];

  function salveaza() {
    setEroare(null);
    porneste(async () => {
      const rezultat = await salveazaDescriereaImaginii(imagine.id, descriere).catch(() => null);

      if (!rezultat) {
        setEroare("Nu am putut salva. Verifică legătura la internet și mai încearcă o dată.");
        return;
      }
      if (!rezultat.ok) {
        setEroare(rezultat.mesaj);
        return;
      }

      show(
        locuri.length > 0
          ? "Descrierea a fost salvată, și pe site."
          : "Descrierea a fost salvată.",
        "success",
      );
    });
  }

  /**
   * Aruncă la eșec, ca ConfirmDialog să țină dialogul deschis: mesajul se
   * citește acolo, sub întrebare, iar butonul poate fi apăsat din nou. Închis,
   * eroarea ar rămâne pe un panou pe care omul nu se mai uită.
   */
  async function sterge() {
    setEroareStergere(null);

    const rezultat = await stergeImaginea(imagine.id).catch(() => null);

    if (!rezultat) {
      setEroareStergere(
        "Nu am putut șterge. Verifică legătura la internet și mai încearcă o dată.",
      );
      throw new Error("Ștergerea imaginii nu a ajuns la server.");
    }
    if (!rezultat.ok) {
      setEroareStergere(rezultat.mesaj);
      throw new Error(rezultat.mesaj);
    }

    onSters();
    show("Imaginea a fost ștearsă.", "success");
  }

  const consecinta =
    locuri.length > 0
      ? `${descrieFolosirile(locuri)} O scoatem și de acolo, ca pe site să nu rămână o imagine ruptă.`
      : null;

  const avertisment =
    eroareStergere || consecinta ? (
      <>
        {eroareStergere && <span className="block font-medium">{eroareStergere}</span>}
        {consecinta && <span className={eroareStergere ? "mt-1 block" : undefined}>{consecinta}</span>}
      </>
    ) : undefined;

  return (
    <aside
      aria-label="Detaliile imaginii alese"
      className="space-y-4 rounded-base border border-border bg-surface p-5"
    >
      <div className="relative aspect-video overflow-hidden rounded-base border border-border bg-surface-muted">
        <Image
          src={imagine.url}
          alt={imagine.descriere}
          fill
          sizes="(max-width: 1024px) 90vw, 280px"
          className="object-contain"
        />
      </div>

      <div className="space-y-1">
        <p className="break-all text-sm font-medium text-foreground">{imagine.numeFisier}</p>
        <p className="text-xs text-muted-foreground">
          {imagine.latime && imagine.inaltime
            ? `${imagine.latime} × ${imagine.inaltime} pixeli · ${formateazaMarimea(imagine.marimeOcteti)}`
            : formateazaMarimea(imagine.marimeOcteti)}
        </p>
        {incarcataLa && (
          <p className="text-xs text-muted-foreground">Încărcată pe {incarcataLa}</p>
        )}
      </div>

      <TextAreaField
        label="Descrierea imaginii"
        rows={3}
        maxLength={MAXIM_DESCRIERE_IMAGINE}
        value={descriere}
        onChange={(eveniment) => setDescriere(eveniment.target.value)}
        placeholder="Ex.: Cabinet luminos, cu două fotolii și o masă joasă"
        hint={
          locuri.length > 0
            ? "Se citește cu voce tare de programele folosite de persoanele care nu văd, și apare în locul pozei dacă nu se încarcă. Se schimbă peste tot unde e pusă imaginea."
            : "Se citește cu voce tare de programele folosite de persoanele care nu văd, și apare în locul pozei dacă nu se încarcă."
        }
      />

      {modificat && (
        <Button onClick={salveaza} disabled={seSalveaza} className="w-full">
          {seSalveaza ? "Se salvează…" : "Salvează descrierea"}
        </Button>
      )}

      <div className="space-y-2">
        <p className="text-xs font-medium text-foreground">{descrieFolosirile(locuri)}</p>
        {locuri.length > 0 ? (
          <ul className="space-y-1 text-xs">
            {locuri.map((loc) => (
              <li key={loc.href}>
                <Link href={loc.href} className="text-muted-foreground underline hover:text-foreground">
                  Deschide {loc.nume}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          // O poză încărcată și nepusă nicăieri e exact momentul în care omul se
          // întreabă ce mai are de făcut. Îi spunem, aici, nu într-un ghid.
          <p className="text-xs text-muted-foreground">
            Deschide{" "}
            <Link href="/dashboard/sectiuni" className="underline hover:text-foreground">
              secțiunea în care o vrei
            </Link>{" "}
            și apasă „Alege din bibliotecă”. Aceeași poză poate intra în mai multe
            secțiuni.
          </p>
        )}
      </div>

      {eroare && (
        <p className="rounded-base bg-danger-surface px-3 py-2 text-xs text-danger">{eroare}</p>
      )}

      <Button
        variant="ghost"
        onClick={() => setDeSters(true)}
        disabled={seSalveaza}
        className="w-full hover:bg-danger-surface hover:text-danger"
      >
        Șterge imaginea
      </Button>

      <ConfirmDialog
        open={deSters}
        onOpenChange={(deschis) => {
          if (deschis) return;
          setDeSters(false);
          setEroareStergere(null);
        }}
        title="Ștergi imaginea?"
        description={`„${imagine.numeFisier}” dispare din bibliotecă și nu mai poate fi recuperată.`}
        warning={avertisment}
        confirmLabel="Șterge definitiv"
        cancelLabel="Păstrează"
        tone="danger"
        onConfirm={sterge}
      />
    </aside>
  );
}
