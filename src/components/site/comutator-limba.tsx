"use client";

import { usePathname } from "next/navigation";
import { Fragment, useSyncExternalStore } from "react";
import {
  LIMBA_ORIGINALA,
  LIMBI_SITE,
  adresaInLimba,
  esteGazdaTradusa,
  gazdaOriginala,
  limbaPaginii,
} from "@/lib/traducere";

/**
 * Alegerea limbii din antet: RO · EN · DE. Pornită de client din Setări (`pagini.limbi`).
 *
 * Nu traduce nimic: EN și DE sunt linkuri către traducerea Google a aceleiași pagini
 * (`adresaInLimba`), iar RO duce înapoi la pagina noastră. Până apasă cineva, nu se
 * încarcă nimic de la Google.
 *
 * Adresele se scriu întâi pe server, din domeniul site-ului, ca linkurile să meargă și
 * fără JavaScript. După încărcare se refac din adresa reală a ferestrei: pe pagina
 * tradusă, gazda e a Google, iar limba marcată e cea din coada ei.
 *
 * `translate="no"`: Google nu atinge etichetele (n-ar avea ce traduce la „EN") și nici
 * nodurile lor — React le poate schimba liniștit la refacere.
 */
export function ComutatorLimba({
  domeniu,
  varianta,
}: {
  /** Domeniul site-ului, cum l-a rezolvat serverul — doar pentru prima randare. */
  domeniu: string;
  /** `rand`: în rândul de linkuri al antetului; `panou`: în meniul de pe telefon. */
  varianta: "rand" | "panou";
}) {
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

  return (
    <div
      translate="no"
      className={varianta === "rand" ? "antet-limbi" : "antet-limbi antet-limbi--panou"}
      role="group"
      aria-label="Limba / Language / Sprache"
    >
      {LIMBI_SITE.map((limba, index) => {
        // Pe pagina noastră, RO e chiar pagina asta: adresă relativă, ca să meargă și pe banc.
        const adresa =
          limba.cod === LIMBA_ORIGINALA && !tradusa
            ? paginaCurenta
            : adresaInLimba(site, paginaCurenta, limba.cod);
        const esteActiva = activa === limba.cod;

        return (
          <Fragment key={limba.cod}>
            {index > 0 && (
              <span aria-hidden className="antet-limbi-punct">
                ·
              </span>
            )}
            <a
              href={adresa}
              data-limba={limba.cod}
              data-adresa={adresa}
              lang={limba.cod}
              title={limba.titlu}
              aria-label={limba.titlu}
              aria-current={esteActiva ? "true" : undefined}
              // Traducerea nu e o pagină a site-ului: motoarele de căutare n-au ce urma acolo.
              rel={limba.cod === LIMBA_ORIGINALA ? undefined : "nofollow"}
              className={esteActiva ? "antet-limba antet-limba--activa" : "antet-limba"}
            >
              {limba.eticheta}
            </a>
          </Fragment>
        );
      })}
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
