"use client";

import { Fragment, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ComutatorLimba } from "./comutator-limba";

export type LinkAntet = { text: string; href: string };

/**
 * Navigarea din antetul site-ului public.
 *
 * Pe ecran lat e un rând de linkuri. Sub 900px devine un buton care deschide un
 * panou — fiindcă un cabinet real se numește „Cabinet de psihoterapie Anghel
 * Alexandru", nu „Cabinet A": numele, patru linkuri și butonul de telefon nu
 * încap împreună pe un telefon, iar rezultatul era o pagină publică lată de 700
 * de pixeli pe un ecran de 390. Măsurat, nu presupus.
 *
 * Ce e vizibil când se decide din CSS, nu din JavaScript: un meniu care apare
 * abia după ce se încarcă scriptul clipește la fiecare încărcare de pagină.
 */
export function HeaderNav({
  linkuri,
  domeniuLimbi,
}: {
  linkuri: LinkAntet[];
  /**
   * Domeniul site-ului, când e pornită alegerea limbii (`pagini.limbi`); altfel lipsește și
   * bulina nu apare. Stă după rândul de linkuri, iar pe telefon, lângă butonul ☰.
   */
  domeniuLimbi?: string;
}) {
  const [deschis, setDeschis] = useState(false);
  const butonRef = useRef<HTMLButtonElement>(null);
  const idPanou = useId();

  useEffect(() => {
    if (!deschis) return;

    function laTasta(eveniment: KeyboardEvent) {
      if (eveniment.key !== "Escape") return;
      setDeschis(false);
      // Focusul înapoi pe buton: altfel ar cădea pe <body> și următorul Tab ar
      // reporni din capul paginii.
      butonRef.current?.focus();
    }

    document.addEventListener("keydown", laTasta);
    return () => document.removeEventListener("keydown", laTasta);
  }, [deschis]);

  // Cu bulina limbii, meniul, bulina și ☰ stau împreună într-un grup: pe calculator bulina
  // vine imediat după linkuri, pe telefon imediat lângă ☰ — nu plutind în golul dintre nume
  // și restul antetului. Fără bulină, nimic în plus: antetul rămâne exact cum era.
  const Invelis = domeniuLimbi ? GrupCuLimba : Fragment;

  return (
    <Invelis>
      <nav aria-label="Navigare principală" className="antet-nav">
        {linkuri.map((link) => (
          <a key={link.href} href={link.href} className="antet-link">
            {link.text}
          </a>
        ))}
      </nav>

      {/* Bulina limbii stă în afara rândului de linkuri, deci se vede pe orice ecran. */}
      {domeniuLimbi && <ComutatorLimba domeniu={domeniuLimbi} />}

      <button
        ref={butonRef}
        type="button"
        className="antet-meniu-buton"
        aria-expanded={deschis}
        aria-controls={idPanou}
        onClick={() => setDeschis((precedent) => !precedent)}
      >
        <span className="sr-only">{deschis ? "Închide meniul" : "Deschide meniul"}</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {deschis ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {deschis && (
        <div id={idPanou} className="antet-panou">
          {linkuri.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="antet-panou-link"
              onClick={() => setDeschis(false)}
            >
              {link.text}
            </a>
          ))}
        </div>
      )}
    </Invelis>
  );
}

function GrupCuLimba({ children }: { children: ReactNode }) {
  return <div className="antet-grup">{children}</div>;
}
