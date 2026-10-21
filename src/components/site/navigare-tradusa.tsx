"use client";

import { useEffect } from "react";
import { adresaPeTradusa, esteGazdaTradusa } from "@/lib/traducere";

/**
 * Navigarea pe site-ul citit prin traducerea Google (`*.translate.goog`). Pe domeniul
 * site-ului nu face nimic: nu ascultă nimic, nu schimbă nimic.
 *
 * Ce repară (proba proprietarului pe `model-apropiere`, 21 oct. 2026): pe pagina tradusă,
 * un clic în meniu dădea „Can't translate this page". Linkurile site-ului sunt relative
 * (`/servicii`), iar pe gazda tradusă duceau la o adresă fără coada de limbă
 * (`?_x_tr_sl=ro&_x_tr_tl=en…`) — pe care Google n-o mai traduce. Pagina deschisă direct,
 * cu coada, se traducea.
 *
 * Deci, la clic pe un link al site-ului, adresa lui primește coada paginii curente
 * (`adresaPeTradusa`), iar browserul o încarcă întreagă. `stopPropagation` în faza de
 * captură, pe `window`, înaintea oricui: altfel `<Link>`-ul din Next ar face navigarea
 * rapidă, care aduce doar o bucată de pagină — iar bucata aia nu trece prin traducere.
 * Pe pagina tradusă se pierde astfel doar clipa cu logoul și viteza navigării rapide.
 *
 * Comutatorul de limbă (`data-limba`) își are adresa calculată de el, în `data-adresa`:
 * acolo nu se lipește coada curentă, fiindcă tocmai limba se schimbă (sau se iese din
 * traducere, la RO).
 */
export function NavigareTradusa() {
  useEffect(() => {
    if (!esteGazdaTradusa(window.location.hostname)) return;

    tolereazaTextulRescris();
    // Antetul nu mai stă lipit sus pe pagina tradusă — vezi `html[data-tradus]` în globals.css.
    document.documentElement.setAttribute("data-tradus", "");

    function repara(eveniment: MouseEvent, oprestePropagarea: boolean) {
      const tinta = eveniment.target;
      if (!(tinta instanceof Element)) return;
      const link = tinta.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return;

      const adresa = link.dataset.limba
        ? link.dataset.adresa
        : adresaPeTradusa(link.getAttribute("href") ?? "", window.location.href);
      if (!adresa) return;

      // Browserul urmează adresa reparată — sau o deschide în filă nouă, la Ctrl+clic.
      link.href = adresa;
      if (oprestePropagarea) eveniment.stopPropagation();
    }

    const laClic = (eveniment: MouseEvent) => repara(eveniment, true);
    // Clicul pe rotiță (filă nouă) nu e un `click`: doar adresa se repară, restul e al browserului.
    const laClicAuxiliar = (eveniment: MouseEvent) => repara(eveniment, false);

    window.addEventListener("click", laClic, true);
    window.addEventListener("auxclick", laClicAuxiliar, true);
    return () => {
      window.removeEventListener("click", laClic, true);
      window.removeEventListener("auxclick", laClicAuxiliar, true);
    };
  }, []);

  return null;
}

/**
 * Google traduce rescriind textul paginii pe dedesubt: înlocuiește nodurile de text cu
 * altele, învelite în `<font>`. React ține minte nodurile vechi, iar când o parte se
 * schimbă (meniul de pe telefon care se închide, calendarul de programări) încearcă să
 * scoată un nod care nu mai e acolo — și pică, cu o pagină albă (problemă cunoscută,
 * facebook/react#11538). Peticul de aici, același cu cel propus acolo, face ca scoaterea
 * sau inserarea lângă un nod mutat să fie sărite în loc să arunce o eroare.
 *
 * Doar pe gazda tradusă: pe site-ul nostru, React rămâne exact cum e.
 */
function tolereazaTextulRescris() {
  const fereastra = window as Window & { __peticTraducere?: boolean };
  if (fereastra.__peticTraducere) return;
  fereastra.__peticTraducere = true;

  const scoate = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, copil: T): T {
    if (copil.parentNode !== this) return copil;
    return scoate.call(this, copil) as T;
  };

  const insereaza = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, nou: T, reper: Node | null): T {
    if (reper && reper.parentNode !== this) return nou;
    return insereaza.call(this, nou, reper) as T;
  };
}
