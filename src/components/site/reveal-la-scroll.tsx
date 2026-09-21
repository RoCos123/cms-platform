"use client";

import { useEffect } from "react";

function reduceMiscarea(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

/**
 * Intrarea în cadru a secțiunilor, la scroll — măsurată din site-ul-sursă
 * „Dragoș Geamănă". Fiecare `[data-reveal]` (pus de `Section`, pe conținutul ei)
 * care e SUB primul ecran pornește ascuns și apare cu un fade prima dată când
 * intră în cadru; ce e deja pe primul ecran NU se atinge.
 *
 * De ce așa, și nu invers (ascuns din CSS, dezvăluit de JS): titlul din hero e
 * elementul după care Google măsoară viteza (LCP). Dacă pornește `opacity: 0` și
 * așteaptă ca JS-ul să pună clasa care-l arată, LCP-ul se duce în câteva secunde
 * degeaba — exact regresia prinsă în raportul Lighthouse (titlul, un `span`, cu
 * „render delay" de ~3s). Așa, ascunderea o pune JS-ul DOAR pe ce e sub fold, pe
 * care oricum nu-l vezi încă; primul ecran se pictează instant, fără să aștepte
 * nimic.
 *
 * Ce e sub fold e ascuns înainte să ajungi la el, deci nu se vede saltul la 0;
 * când derulezi, fade-ul îl aduce înapoi. Fără mișcare pentru cine a cerut-o
 * (`prefers-reduced-motion`) — atunci nu se ascunde nimic. Fără JavaScript, la
 * fel: nimic nu pune clasa de ascundere, deci totul e vizibil din oficiu (nu mai
 * e nevoie de plasa `<noscript>` de dinainte).
 */
export function RevealLaScroll() {
  useEffect(() => {
    if (reduceMiscarea()) return;

    const elemente = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (elemente.length === 0) return;

    const observator = new IntersectionObserver(
      (intrari, obs) => {
        for (const intrare of intrari) {
          if (!intrare.isIntersecting) continue;
          intrare.target.classList.remove("reveal-ascuns");
          obs.unobserve(intrare.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    const inaltime = window.innerHeight;
    elemente.forEach((el) => {
      const cadru = el.getBoundingClientRect();
      // Deja pe ecran (fie și parțial) → nu-l atingem: rămâne vizibil, pictat
      // din primul cadru. Doar ce e strict sub fold pornește ascuns și face fade.
      const peEcran = cadru.top < inaltime && cadru.bottom > 0;
      if (peEcran) return;
      el.classList.add("reveal-ascuns");
      observator.observe(el);
    });

    return () => observator.disconnect();
  }, []);

  return null;
}
