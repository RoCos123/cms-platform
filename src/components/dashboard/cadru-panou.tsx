"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Scheletul panoului, făcut să meargă și pe telefon.
 *
 * Pe ecran lat: meniul din stânga stă mereu la vedere, ca înainte. Pe telefon:
 * meniul de 256px ar fi mâncat tot ecranul, așa că se ascunde și se deschide ca
 * un SERTAR, dintr-un buton hamburger din antet, cu un fundal întunecat peste
 * restul paginii. Se închide singur după ce ai ales din meniu (pagina se
 * schimbă), din buton, din fundal sau cu Escape.
 *
 * E o componentă de client (are nevoie de stare: sertar deschis/închis), dar
 * primește bucățile deja randate pe server ca `slot`-uri — numele site-ului,
 * meniul, uneltele din antet — ca aranjamentul să nu care el datele.
 */
export function CadruPanou({
  antetSite,
  nav,
  unelteAntet,
  children,
}: {
  /** Numele și domeniul site-ului, sus în meniu. */
  antetSite: ReactNode;
  /** Meniul propriu-zis (`SidebarNav`). */
  nav: ReactNode;
  /** Ce stă în dreapta antetului: temă, email, deconectare. */
  unelteAntet: ReactNode;
  children: ReactNode;
}) {
  const [deschis, setDeschis] = useState(false);

  // Escape închide sertarul — reflexul oricui a mai văzut un panou care se
  // deschide peste ecran.
  useEffect(() => {
    if (!deschis) return;
    const laTasta = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDeschis(false);
    };
    window.addEventListener("keydown", laTasta);
    return () => window.removeEventListener("keydown", laTasta);
  }, [deschis]);

  return (
    <div className="flex flex-1 bg-background">
      {/* Fundalul întunecat, doar pe telefon, cât timp sertarul e deschis. */}
      {deschis && (
        <button
          type="button"
          aria-label="Închide meniul"
          onClick={() => setDeschis(false)}
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        />
      )}

      <aside
        // După ce ai apăsat un link din meniu, sertarul se închide singur. Pe
        // ecran lat n-are ce închide (meniul e oricum mereu la vedere).
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setDeschis(false);
        }}
        className={cn(
          "flex w-64 shrink-0 flex-col border-r border-border bg-background",
          // Pe telefon: fix, peste conținut, glisează din stânga. Pe ecran lat
          // (`lg:`) redevine o coloană obișnuită, mereu la vedere.
          "fixed inset-y-0 left-0 z-40 transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          deschis ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="relative">
          {antetSite}
          <button
            type="button"
            aria-label="Închide meniul"
            onClick={() => setDeschis(false)}
            className="absolute right-2 top-3 rounded-base p-2 text-muted-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {nav}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              aria-label="Deschide meniul"
              aria-expanded={deschis}
              onClick={() => setDeschis(true)}
              className="rounded-base p-2 text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring lg:hidden"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
            </button>
            <p className="hidden truncate text-sm text-muted-foreground sm:block">Panou de administrare</p>
          </div>
          <div className="flex min-w-0 items-center gap-3 lg:gap-4">{unelteAntet}</div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
