"use client";

import { useEffect } from "react";

function reduceMiscarea(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Intrarea în cadru a secțiunilor, la scroll — măsurată din site-ul-sursă
 * „Dragoș Geamănă" (fișierul original, nu o presupunere): fiecare `[data-reveal]`
 * (pus de `Section`, pe conținutul ei, nu pe fundalul colorat) pornește invizibil
 * și deplasat, apoi capătă clasa `is-in` prima dată când intră în ecran — o
 * singură dată, nu la fiecare intrare/ieșire, ca la referință.
 *
 * Platformă, nu Liniește: mecanismul e comun tuturor șabloanelor (`Section` e
 * componenta comună), cerut explicit așa de proprietar — „funcție nouă,
 * disponibilă la toți" (nota de arhitectură din 11 sept.).
 *
 * Fără mișcare pentru cine a cerut-o (`prefers-reduced-motion`): CSS-ul din
 * `globals.css` ține regula sub `no-preference`, deci elementele sunt oricum
 * vizibile din start — aici doar evităm să mai pornim observatorul degeaba.
 *
 * Fără JavaScript deloc: regula CSS ar ține conținutul invizibil la nesfârșit,
 * de-aia `cadru-site.tsx` pune un `<noscript>` care o anulează.
 */
export function RevealLaScroll() {
  useEffect(() => {
    if (reduceMiscarea()) return;

    const elemente = document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-in)");
    if (elemente.length === 0) return;

    const observator = new IntersectionObserver(
      (intrari, obs) => {
        for (const intrare of intrari) {
          if (!intrare.isIntersecting) continue;
          intrare.target.classList.add("is-in");
          obs.unobserve(intrare.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    elemente.forEach((el) => observator.observe(el));
    return () => observator.disconnect();
  }, []);

  return null;
}
