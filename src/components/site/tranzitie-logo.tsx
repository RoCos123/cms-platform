"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Clipa cu logoul la schimbarea paginii, pe site-ul public.
 *
 * Ce se vede: apeși un link către altă pagină, ecranul se acoperă scurt cu
 * logoul (pe fundalul șablonului), apoi apare pagina nouă. Ca la site-urile
 * îngrijite — un moment de respiro în locul unui salt sec.
 *
 * Partea grea: cadrul site-ului (`CadruSite`, cu componenta asta) se reface la
 * FIECARE pagină — nu stă într-un layout comun. Deci instanța care pornește
 * clipa moare exact când sosește pagina nouă. Ca s-o ținem un minim garantat,
 * predăm ștafeta prin `sessionStorage`:
 *   1. la CLIC pe un link intern, pagina care pleacă însemnează clipa și acoperă
 *      deja golul de încărcare cu logoul;
 *   2. pagina care SOSEȘTE citește semnul la montare și ține logoul până se
 *      împlinește minimul socotit din clipa clicului, apoi îl stinge.
 * Cele două acoperiri arată identic, așa că predarea e nevăzută.
 *
 * Ce NU declanșează clipa: clic cu Ctrl/Cmd sau pe rotiță (filă nouă), linkuri
 * către alt site, descărcări, ancore pe aceeași pagină, „înapoi/înainte" din
 * browser. Fără logo încărcat sau pentru cine a cerut mai puțină mișcare, nimic.
 *
 * Temporizatoarele NU se anulează la desprindere, ci scriu prin `pune`, care
 * tace dacă instanța nu mai e montată. Așa, dubla rulare a efectelor din
 * StrictMode (dezvoltare) nu mai taie stingerea — altfel logoul rămânea agățat.
 */
const MINIM_MS = 500;
const STINGERE_MS = 240;
// Dacă navigarea nu se mai produce (un link oprit din altă parte, o descărcare
// nerecunoscută), pagina care pleacă nu rămâne acoperită la nesfârșit.
const SIGURANTA_MS = 2500;
// Un semn mai vechi de-atât e rămas dintr-o navigare care n-a mai avut loc — îl
// ignorăm, ca să nu apară un logo din senin la o încărcare obișnuită.
const PROASPAT_MS = 4000;
const CHEIE = "tranzitie-logo:pornit";

// Layout effect pe client (acoperim pagina nouă din primul cadru, fără o clipire
// în care se vede pagina înainte de logo), effect simplu pe server — ca să nu
// apară avertismentul de `useLayoutEffect` la randarea pe server.
const useEfectDeAsezare = typeof document === "undefined" ? useEffect : useLayoutEffect;

function citesteSemn(): number | null {
  try {
    const v = sessionStorage.getItem(CHEIE);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
}

function scrieSemn(valoare: number | null) {
  try {
    if (valoare === null) sessionStorage.removeItem(CHEIE);
    else sessionStorage.setItem(CHEIE, String(valoare));
  } catch {
    // Mod privat, stocare blocată: fără ștafetă, dar site-ul merge la fel.
  }
}

function reduceMiscarea(): boolean {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function TranzitieLogo({ logoUrl }: { logoUrl?: string }) {
  const [stare, setStare] = useState<"ascuns" | "vizibil" | "iese">("ascuns");
  const montat = useRef(true);

  useEffect(() => {
    montat.current = true;
    return () => {
      montat.current = false;
    };
  }, []);

  // Scrie starea doar cât instanța e montată. Temporizatoarele rămase de la o
  // pagină plecată tac aici, în loc să fie anulate la desprindere (ceea ce ar
  // tăia și stingerea, în dubla rulare din StrictMode).
  const pune = useCallback((s: "ascuns" | "vizibil" | "iese") => {
    if (montat.current) setStare(s);
  }, []);

  const stinge = useCallback(() => {
    pune("iese");
    setTimeout(() => pune("ascuns"), STINGERE_MS);
  }, [pune]);

  // SOSIRE: am ajuns aici printr-un clic? Arătăm logoul din primul cadru și-l
  // ținem până se împlinește minimul socotit din clipa acelui clic.
  useEfectDeAsezare(() => {
    const pornitLa = citesteSemn();
    scrieSemn(null); // semnul e consumat pe orice pagină, ca să nu rămână agățat

    // Fără logo, nu apare nimic: o clipă cu numele scris mare ar semăna mai
    // degrabă a defect decât a gest. Pagina se schimbă instant, ca oriunde.
    if (!logoUrl || pornitLa === null || reduceMiscarea()) return;
    if (Date.now() - pornitLa > PROASPAT_MS) return;

    pune("vizibil");
    const ramas = Math.max(0, MINIM_MS - (Date.now() - pornitLa));
    setTimeout(stinge, ramas);
    // Rulează o singură dată, la montare (fiecare pagină e o montare nouă).
  }, []);

  // PLECARE: clic pe un link intern către altă pagină. Însemnăm clipa (o preia
  // pagina următoare) și acoperim deja golul de încărcare.
  useEffect(() => {
    if (!logoUrl || reduceMiscarea()) return;

    function laClic(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = (e.target as Element | null)?.closest?.("a");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;

      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;

      let url: URL;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return; // doar o ancoră, nu altă pagină

      scrieSemn(Date.now());
      pune("vizibil");
      // Dacă navigarea nu se mai produce, nu rămânem acoperiți (și curățăm semnul).
      setTimeout(() => {
        scrieSemn(null);
        stinge();
      }, SIGURANTA_MS);
    }

    document.addEventListener("click", laClic, true);
    return () => document.removeEventListener("click", laClic, true);
  }, [logoUrl, pune, stinge]);

  if (stare === "ascuns" || !logoUrl) return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "var(--t-fundal)",
        opacity: stare === "iese" ? 0 : 1,
        transition: `opacity ${STINGERE_MS}ms ease`,
        pointerEvents: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        style={{
          height: "clamp(48px, 8vw, 72px)",
          width: "auto",
          maxWidth: "60vw",
          objectFit: "contain",
          // Pulsează („respiră") cât timp se încarcă pagina nouă — semn că se
          // lucrează, nu că s-a blocat. `@keyframes puls-logo` e în globals.css.
          // Cât cade overlay-ul (`iese`), oprim pulsul, ca ieșirea să fie o simplă
          // stingere, nu o zvâcnire. Cine a cerut mai puțină mișcare nu ajunge
          // aici oricum — overlay-ul nu se arată deloc la `prefers-reduced-motion`.
          animation: stare === "iese" ? undefined : "puls-logo 1.1s ease-in-out infinite",
        }}
      />
    </div>
  );
}
