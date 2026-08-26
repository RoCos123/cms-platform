"use client";

import { useEffect } from "react";

/**
 * Ce vede cineva dacă o pagină nu se poate randa.
 *
 * Fără fișierul acesta, Next arată propriul ecran, în engleză: „This page
 * couldn't load. Reload to try again, or go back." Pe site-ul unui cabinet din
 * România, asta e mai rău decât o eroare — e o eroare care pare a altcuiva.
 *
 * Acoperă atât site-ul public, cât și panoul: e cea mai apropiată limită de
 * eroare pentru ambele.
 */
export default function EroarePagina({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Pagina nu s-a putut randa:", error);
  }, [error]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Pagina nu s-a putut încărca
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ceva n-a mers bine de partea noastră. Încearcă din nou — de obicei
          e de ajuns.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center justify-center rounded-base bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Încearcă din nou
          </button>
          {/*
            `<a>`, nu `<Link>`, și e singurul loc din proiect unde e așa.
            `<Link>` face o navigare din browser, refolosind ce are routerul în
            memorie — adică exact starea care tocmai a eșuat. O încărcare
            completă cere pagina de la zero, iar aici tocmai asta vrem: butonul
            ăsta e ultima cale de scăpare, nu o navigare obișnuită.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex h-9 items-center justify-center rounded-base border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Înapoi la pagina principală
          </a>
        </div>

        {/*
          Codul erorii, nu mesajul ei: mesajul poate conține detalii interne, iar
          codul e tot ce ne trebuie ca să găsim ce s-a întâmplat, dacă cineva ne
          scrie.
        */}
        {error.digest && (
          <p className="mt-6 text-xs text-muted-foreground">Cod: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
