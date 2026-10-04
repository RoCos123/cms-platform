"use client";

import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { descrieFolosirile, type ImagineBiblioteca } from "@/lib/imagini";
import { stergeImaginea } from "./actions";

/**
 * Dialogul „Ștergi imaginea?", UNIC pentru toate locurile de unde se poate șterge
 * o poză: butonul din panoul de detalii și „X"-ul din colțul fiecărei miniaturi.
 *
 * DE CE E COMUN. Ștergerea nu e inofensivă: o poză folosită pe site e scoasă și
 * de acolo, iar dialogul spune asta („E pusă la Despre mine… O scoatem și de
 * acolo"). Dacă „X"-ul din grilă și butonul din panou și-ar fi avut fiecare
 * dialogul, unul dintre ele ar fi ajuns, la prima schimbare, să șteargă fără să
 * avertizeze. Un singur dialog, o singură regulă.
 *
 * Aruncă la eșec, ca `ConfirmDialog` să țină dialogul deschis: mesajul se
 * citește acolo, sub întrebare, iar butonul poate fi apăsat din nou.
 */
export function DialogStergereImagine({
  imagine,
  onSters,
  onInchis,
}: {
  /** Poza de șters; `null` = dialogul e închis. */
  imagine: ImagineBiblioteca | null;
  /** Selecția din grilă trebuie să dispară odată cu imaginea. */
  onSters: (id: string) => void;
  onInchis: () => void;
}) {
  const [eroare, setEroare] = useState<string | null>(null);
  const { show } = useToast();

  // Locurile, fără dubluri: aceeași pagină apare o singură dată în text.
  const locuri = imagine
    ? [...new Map(imagine.folosiri.map((f) => [f.href, f])).values()]
    : [];

  async function sterge() {
    if (!imagine) return;
    setEroare(null);

    const rezultat = await stergeImaginea(imagine.id).catch(() => null);

    if (!rezultat) {
      setEroare("Nu am putut șterge. Verifică legătura la internet și mai încearcă o dată.");
      throw new Error("Ștergerea imaginii nu a ajuns la server.");
    }
    if (!rezultat.ok) {
      setEroare(rezultat.mesaj);
      throw new Error(rezultat.mesaj);
    }

    onSters(imagine.id);
    show("Imaginea a fost ștearsă.", "success");
  }

  const consecinta =
    locuri.length > 0
      ? `${descrieFolosirile(locuri)} O scoatem și de acolo, ca pe site să nu rămână o imagine ruptă.`
      : null;

  const avertisment =
    eroare || consecinta ? (
      <>
        {eroare && <span className="block font-medium">{eroare}</span>}
        {consecinta && <span className={eroare ? "mt-1 block" : undefined}>{consecinta}</span>}
      </>
    ) : undefined;

  return (
    <ConfirmDialog
      open={imagine !== null}
      onOpenChange={(deschis) => {
        if (deschis) return;
        setEroare(null);
        onInchis();
      }}
      title="Ștergi imaginea?"
      description={
        imagine
          ? `„${imagine.numeFisier}” dispare din bibliotecă și nu mai poate fi recuperată.`
          : ""
      }
      warning={avertisment}
      confirmLabel="Șterge definitiv"
      cancelLabel="Păstrează"
      tone="danger"
      onConfirm={sterge}
    />
  );
}
