"use client";

import { useEffect } from "react";

/**
 * Browserele moderne își afișează propriul text la `beforeunload` și îl ignoră pe
 * al nostru; la navigarea internă îl controlăm noi, așa că merită scris ca pentru om.
 */
const LEAVE_MESSAGE =
  "Ai modificări nesalvate. Dacă pleci de pe pagină acum, se pierd.\n\nVrei să pleci oricum?";

function opensElsewhere(anchor: HTMLAnchorElement): boolean {
  // `download` și `target` diferit de fereastra curentă nu descarcă pagina de sub noi.
  return anchor.hasAttribute("download") || (anchor.target !== "" && anchor.target !== "_self");
}

/**
 * Avertizează utilizatorul înainte să părăsească pagina cu munca nesalvată —
 * atât la închiderea/reîncărcarea filei, cât și la navigarea internă.
 *
 * App Router nu expune un hook oficial de blocare a rutei (nu există echivalent
 * pentru `useBlocker` din React Router). Singurul mecanism oferit de Next este
 * `onNavigate`, prop pe **fiecare** `<Link>` în parte: garda ar trebui legată
 * manual de fiecare link din aplicație și s-ar pierde tăcut la primul uitat.
 * De aceea ascultăm click-urile pe `document`, în faza de captură — acolo prindem
 * orice link intern, indiferent cine l-a scris. Captura contează: React ascultă
 * prin delegare pe rădăcina aplicației, deci un ascultător de captură pe `document`
 * ajunge la eveniment înaintea handlerului lui `<Link>` și îl poate opri.
 *
 * Ce rămâne neacoperit: butoanele Înapoi/Înainte ale browserului. `popstate` se
 * anunță după ce istoricul s-a schimbat deja, iar anularea lui ar însemna
 * rescrierea istoricului — un compromis mai rău decât lipsa avertismentului.
 */
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    // Cât timp nu e nimic de pierdut nu ținem niciun ascultător atașat.
    if (!isDirty) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      // Pentru browserele vechi, care cer `returnValue` setat ca să afișeze dialogul.
      event.returnValue = LEAVE_MESSAGE;
    }

    function handleClick(event: MouseEvent) {
      // Doar click stânga simplu: cu Ctrl/Cmd/Shift linkul se deschide în altă
      // filă sau fereastră, deci pagina curentă (și munca din ea) rămâne pe loc.
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (event.defaultPrevented) return;

      const clicked = event.target instanceof Element ? event.target.closest("a[href]") : null;
      // Ancorele din interiorul unui <svg> sunt SVGAElement, fără navigare de tip pagină.
      if (!(clicked instanceof HTMLAnchorElement)) return;
      if (opensElsewhere(clicked)) return;

      const destination = new URL(clicked.href, window.location.href);
      // Alt domeniu înseamnă descărcarea paginii; acolo avertizează `beforeunload`.
      if (destination.origin !== window.location.origin) return;
      // Link către un punct din pagina curentă (ex. „#contact") — nu pleacă nimeni nicăieri.
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }

      if (window.confirm(LEAVE_MESSAGE)) return;

      // `<Link>` se oprește singur când vede evenimentul anulat, dar oprim și
      // propagarea: un `<a>` obișnuit cu `onClick` propriu (care cheamă `router.push`)
      // n-ar verifica nimic și ar naviga oricum.
      event.preventDefault();
      event.stopPropagation();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Al treilea argument trebuie să repete faza de captură, altfel ascultătorul rămâne atașat.
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty]);
}
