"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { mesajSchimbare, verificaAdresaNoua } from "@/lib/schimba-email-cont";
import { schimbaEmailul } from "./actions";

/**
 * „Schimbă emailul" — adresa cu care un client intră în panou, schimbată de
 * proprietarul platformei. Ce se întâmplă pe server (două locuri, o ordine, o
 * plasă): `src/lib/schimba-email-cont.ts`.
 *
 * O SINGURĂ fereastră, nu două pași: pune adresa veche și cea nouă una sub
 * alta, ca pe un „înainte / după", chiar deasupra butonului de confirmare, iar
 * focusul de pornire stă pe „Renunță" (la fel ca la orice ștergere: un Enter dat
 * din reflex nu schimbă nimic). Câmpul nu e într-un `<form>`, deci nici Enter din
 * câmp nu trimite.
 *
 * Verificarea adresei e ACEEAȘI cu a serverului (`verificaAdresaNoua`): aici doar
 * arată din timp ce urmează să se întâmple; serverul o face oricum a doua oară.
 */
export function SchimbaEmail({
  siteId,
  numeSite,
  emailCurent,
}: {
  siteId: string;
  numeSite: string;
  emailCurent: string;
}) {
  const router = useRouter();
  const idCamp = useId();
  const idEroare = useId();
  const camp = useRef<HTMLInputElement>(null);

  const [deschis, setDeschis] = useState(false);
  const [adresa, setAdresa] = useState("");
  const [eroare, setEroare] = useState<string | null>(null);
  const [schimbat, setSchimbat] = useState<string | null>(null);

  /** Rămâne deschis după o confirmare care n-a mers — vezi `laSchimbareaStarii`. */
  const ramaneDeschis = useRef(false);

  const verdict = verificaAdresaNoua(adresa, emailCurent);

  // Efectul copilului (`ConfirmDialog`) pune focusul pe „Renunță"; al părintelui
  // rulează după el, deci ultimul cuvânt îl are câmpul — omul vine aici ca să scrie.
  useEffect(() => {
    if (deschis) camp.current?.focus();
  }, [deschis]);

  function deschide() {
    setAdresa("");
    setEroare(null);
    setSchimbat(null);
    setDeschis(true);
  }

  /**
   * `ConfirmDialog` își cheamă `onOpenChange(false)` și după o confirmare
   * REUȘITĂ, și la „Renunță". La o confirmare eșuată vrem dialogul deschis, cu
   * eroarea în el — fără să aruncăm o excepție (ar ajunge în consolă ca o eroare
   * a aplicației, deși e doar „adresa nu e bună").
   */
  function laSchimbareaStarii(vaFiDeschis: boolean) {
    if (!vaFiDeschis && ramaneDeschis.current) {
      ramaneDeschis.current = false;
      return;
    }
    setDeschis(vaFiDeschis);
  }

  async function confirma() {
    if (!verdict.ok) {
      setEroare(adresa.trim() === "" ? "Scrie adresa nouă." : mesajSchimbare(verdict.eroare));
      ramaneDeschis.current = true;
      return;
    }

    setEroare(null);
    const rezultat = await schimbaEmailul(siteId, adresa);

    if (rezultat.ok) {
      setSchimbat(rezultat.nou);
      // Lista citește adresa de pe server; fără asta ar arăta încă pe cea veche.
      router.refresh();
      return;
    }

    if (rezultat.eroare === "neautentificat") {
      router.push("/proprietar/login");
      return;
    }

    setEroare(mesajSchimbare(rezultat.eroare, rezultat.vechi, rezultat.nou));
    ramaneDeschis.current = true;
  }

  return (
    <>
      <button
        type="button"
        onClick={deschide}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Schimbă emailul
      </button>

      {schimbat && (
        <p role="status" className="basis-full text-xs text-success">
          Adresa e acum {schimbat}.
        </p>
      )}

      <ConfirmDialog
        open={deschis}
        onOpenChange={laSchimbareaStarii}
        title="Schimbă emailul contului"
        confirmLabel="Schimbă adresa"
        onConfirm={confirma}
        description={
          <div className="space-y-4">
            <p>
              Adresa cu care <strong className="font-medium text-foreground">{numeSite}</strong> intră
              în panou.
            </p>

            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 rounded-base border border-border bg-background p-3 text-sm">
              <dt>Acum</dt>
              <dd className="break-all text-foreground">{emailCurent}</dd>
              <dt>După</dt>
              <dd className="break-all text-foreground">
                {verdict.ok ? verdict.email : <span className="text-muted-foreground">—</span>}
              </dd>
            </dl>

            <div className="space-y-1.5">
              <label htmlFor={idCamp} className="block text-sm font-medium text-foreground">
                Adresa nouă
              </label>
              <input
                ref={camp}
                id={idCamp}
                type="email"
                inputMode="email"
                autoComplete="off"
                value={adresa}
                onChange={(e) => {
                  setAdresa(e.target.value);
                  setEroare(null);
                }}
                aria-invalid={eroare ? true : undefined}
                aria-describedby={eroare ? idEroare : undefined}
                className="w-full rounded-base border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              {eroare && (
                <p id={idEroare} role="alert" className="text-sm text-danger">
                  {eroare}
                </p>
              )}
            </div>
          </div>
        }
        warning={
          <ul className="list-disc space-y-1 pl-5">
            <li>Clientul intră de acum cu adresa nouă; cea veche nu mai merge.</li>
            <li>Parola rămâne aceeași. Nu se trimite niciun email.</li>
            <li>
              „Ți-ai uitat parola?” va trimite linkul la adresa nouă. Dacă e greșită, clientul
              rămâne în afara contului.
            </li>
          </ul>
        }
      />
    </>
  );
}
