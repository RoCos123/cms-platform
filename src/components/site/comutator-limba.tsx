"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import {
  LIMBA_ORIGINALA,
  LIMBI_SITE,
  adresaInLimba,
  esteGazdaTradusa,
  gazdaOriginala,
  limbaPaginii,
} from "@/lib/traducere";
import { Steag, type CodSteag } from "./steaguri";

/**
 * Alegerea limbii din antet: o bulină cu steagul limbii în care e citită pagina; apăsată,
 * deschide lista Română · English · Deutsch, fiecare cu steagul ei. Pornită de client din
 * Setări (`pagini.limbi`).
 *
 * Bulină, nu un rând „RO · EN · DE" (cerut de proprietar, 21 oct. 2026): ocupă locul unui
 * singur buton, iar pe telefon se vede direct în antet, lângă ☰ — rândul de litere stătea
 * ascuns în meniu, unde un străin trebuia să ghicească să-l caute.
 *
 * Nu traduce nimic: English și Deutsch sunt linkuri către traducerea Google a aceleiași
 * pagini (`adresaInLimba`), Română duce înapoi la pagina noastră. Până apasă cineva, nu se
 * încarcă nimic de la Google. Adresele se scriu întâi pe server, din domeniul site-ului, ca
 * linkurile să existe și fără JavaScript; după încărcare se refac din adresa ferestrei: pe
 * pagina tradusă, gazda e a Google, iar limba bulinei e cea din coada ei.
 *
 * `translate="no"` pe tot: Google nu rescrie numele limbilor și nici nodurile lor — React
 * deschide și închide lista fără să dea peste noduri mutate de traducere.
 */
export function ComutatorLimba({
  domeniu,
}: {
  /** Domeniul site-ului, cum l-a rezolvat serverul — doar pentru prima randare. */
  domeniu: string;
}) {
  const [deschis, setDeschis] = useState(false);
  const radacina = useRef<HTMLDivElement>(null);
  const buton = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  const cale = usePathname() || "/";
  // `null` pe server și la prima randare din browser (ca s-o potrivească pe a serverului),
  // apoi adresa reală a ferestrei. Se recitește la fiecare randare, deci și după o
  // navigare (`cale` nouă).
  const adresaFerestrei = useSyncExternalStore(faraAbonare, citesteFereastra, () => null);
  const fereastra = adresaFerestrei === null ? null : imparteFereastra(adresaFerestrei);

  const tradusa = fereastra !== null && esteGazdaTradusa(fereastra.gazda);
  const site = (tradusa && gazdaOriginala(fereastra.gazda)) || fereastra?.gazda || domeniu;
  const paginaCurenta = cale + (fereastra?.cautare ?? "");
  const activa = fereastra ? limbaPaginii(fereastra.gazda, fereastra.cautare) : LIMBA_ORIGINALA;
  // O limbă aleasă din bara Google, care nu e în listă (franceza, de pildă): bulina arată
  // atunci steagul românesc — pagina de la care pleacă traducerea —, dar nicio limbă bifată.
  const curenta = LIMBI_SITE.find((limba) => limba.cod === activa) ?? LIMBI_SITE[0];

  useEffect(() => {
    if (!deschis) return;

    function laApasare(eveniment: PointerEvent) {
      if (!radacina.current?.contains(eveniment.target as Node)) setDeschis(false);
    }
    function laTasta(eveniment: KeyboardEvent) {
      if (eveniment.key !== "Escape") return;
      setDeschis(false);
      // Focusul înapoi pe bulină, nu pe <body>: următorul Tab continuă de unde era.
      buton.current?.focus();
    }

    document.addEventListener("pointerdown", laApasare);
    document.addEventListener("keydown", laTasta);
    return () => {
      document.removeEventListener("pointerdown", laApasare);
      document.removeEventListener("keydown", laTasta);
    };
  }, [deschis]);

  return (
    <div ref={radacina} translate="no" className="antet-limba">
      <button
        ref={buton}
        type="button"
        className="antet-limba-buton"
        aria-expanded={deschis}
        aria-controls={idLista}
        aria-label={`Limba · Language · Sprache: ${curenta.nume}`}
        title={`Limba · Language · Sprache: ${curenta.nume}`}
        onClick={() => setDeschis((precedent) => !precedent)}
      >
        <Steag cod={curenta.cod as CodSteag} forma="rotund" />
      </button>

      <ul id={idLista} className="antet-limba-lista" hidden={!deschis}>
        {LIMBI_SITE.map((limba) => {
          // Pe pagina noastră, Română e chiar pagina asta: adresă relativă, ca să meargă și pe banc.
          const adresa =
            limba.cod === LIMBA_ORIGINALA && !tradusa
              ? paginaCurenta
              : adresaInLimba(site, paginaCurenta, limba.cod);
          const esteActiva = activa === limba.cod;

          return (
            <li key={limba.cod}>
              <a
                href={adresa}
                data-limba={limba.cod}
                data-adresa={adresa}
                lang={limba.cod}
                hrefLang={limba.cod}
                title={`${limba.nume} — ${limba.nota}`}
                aria-current={esteActiva ? "true" : undefined}
                // Traducerea nu e o pagină a site-ului: motoarele de căutare n-au ce urma acolo.
                rel={limba.cod === LIMBA_ORIGINALA ? undefined : "nofollow"}
                className="antet-limba-optiune"
                onClick={() => setDeschis(false)}
              >
                <Steag cod={limba.cod} forma="drept" />
                <span>{limba.nume}</span>
                {esteActiva && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="antet-limba-bifa">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Nimic de ascultat: adresa se schimbă doar odată cu pagina, care oricum randează din nou. */
function faraAbonare() {
  return () => {};
}

/** Un șir, nu un obiect: `useSyncExternalStore` compară instantaneele cu `Object.is`. */
function citesteFereastra(): string {
  return `${window.location.hostname} ${window.location.search}`;
}

function imparteFereastra(valoare: string): { gazda: string; cautare: string } {
  const spatiu = valoare.indexOf(" ");
  return { gazda: valoare.slice(0, spatiu), cautare: valoare.slice(spatiu + 1) };
}
