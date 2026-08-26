"use client";

import { useEffect, useId, useRef, useState } from "react";

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
export function HeaderNav({ linkuri }: { linkuri: LinkAntet[] }) {
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

  return (
    <>
      <nav aria-label="Navigare principală" className="antet-nav">
        {linkuri.map((link) => (
          <a key={link.href} href={link.href} className="antet-link">
            {link.text}
          </a>
        ))}
      </nav>

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
    </>
  );
}
