"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SectionImage } from "@/components/site/section-image";
import type { PunctFocal } from "@/lib/punct-focal";

/** O poză a cartonașului: cea principală (prima) sau o variantă a modelului. */
export type CadruVitrina = {
  src: string;
  alt: string;
  pozitie: PunctFocal;
};

/** Cât stă fiecare poză, și cât ține trecerea la următoarea. Văzute în machetă de proprietar. */
const PAS_MS = 3500;
const TRECERE_MS = 800;

function abonareMiscare(anunta: () => void) {
  const interogare = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  interogare?.addEventListener("change", anunta);
  return () => interogare?.removeEventListener("change", anunta);
}
const miscareRedusaAcum = () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);

/**
 * Poza unui cartonaș din galeria de modele, când modelul are „Alte variante" (30 oct. 2026,
 * varianta B aleasă de proprietar): capturile aceluiași demo în alte culori și fonturi trec una
 * în alta, singure, la `PAS_MS`. Nimic scris și nicio bulină peste poză — prima versiune avea o
 * etichetă („Safir · Modern") cu buline de apăsat; proprietarul, după ce a văzut-o pe site: „nu
 * vreau să scrie nimic […] doar să se schimbe automat".
 *
 * Când NU se mișcă: cât timp cartonașul nu e pe ecran (pornește când ajunge vizitatorul la el, nu
 * pe ascuns, mai sus în pagină); cât stă mausul pe cartonaș; și deloc la cine a cerut mai puțină
 * mișcare (`prefers-reduced-motion`, ex. „Efecte de animație" oprite în Windows) — ca la banda cu
 * servicii. Fără buline, omul acela vede doar poza principală.
 *
 * Trecerea: poza nouă se aprinde PESTE cea veche, care rămâne plină dedesubt până se termină.
 * Două poze stinse pe jumătate deodată ar lăsa să se vadă fundalul printre ele, în mijlocul
 * trecerii. Stiva e izolată (`isolation`), ca straturile ei să nu treacă peste numele și butonul
 * cartonașului, care vin după ea. Restul de peste poză — voalul, numele — vine de la cartonaș, ca
 * `children`.
 */
export function CadreVitrina({
  cadre,
  legatura,
  children,
}: {
  cadre: CadruVitrina[];
  /** Linkul cartonașului (demo-ul), cu atributele lui; `null` = cartonaș fără adresă. */
  legatura: { href: string; target?: string; rel?: string } | null;
  /** Ce stă peste poză: voalul și, uneori, numele modelului. */
  children: ReactNode;
}) {
  const stiva = useRef<HTMLDivElement>(null);
  const [stare, setStare] = useState<{ curent: number; anterior: number | null }>({ curent: 0, anterior: null });
  const [peEcran, setPeEcran] = useState(false);
  const [subMaus, setSubMaus] = useState(false);
  const miscareRedusa = useSyncExternalStore(abonareMiscare, miscareRedusaAcum, () => false);
  const numar = cadre.length;

  useEffect(() => {
    const element = stiva.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observator = new IntersectionObserver(([intrare]) => setPeEcran(intrare.isIntersecting), {
      threshold: 0.35,
    });
    observator.observe(element);
    return () => observator.disconnect();
  }, []);

  useEffect(() => {
    // Tot cartonașul, nu doar poza: și pe butonul „Vreau acest model" mausul înseamnă „mă uit".
    const cartonas = stiva.current?.closest("li");
    if (!cartonas) return;
    // Doar mausul: pe telefon, o atingere deschide demo-ul oricum.
    const intra = (e: PointerEvent) => e.pointerType === "mouse" && setSubMaus(true);
    const iese = (e: PointerEvent) => e.pointerType === "mouse" && setSubMaus(false);
    cartonas.addEventListener("pointerenter", intra);
    cartonas.addEventListener("pointerleave", iese);
    return () => {
      cartonas.removeEventListener("pointerenter", intra);
      cartonas.removeEventListener("pointerleave", iese);
    };
  }, []);

  useEffect(() => {
    if (numar < 2 || !peEcran || subMaus || miscareRedusa) return;
    const ceas = window.setInterval(
      () => setStare((s) => ({ curent: (s.curent + 1) % numar, anterior: s.curent })),
      PAS_MS,
    );
    return () => window.clearInterval(ceas);
  }, [numar, peEcran, subMaus, miscareRedusa]);

  const poze = (
    <div ref={stiva} style={{ position: "relative", isolation: "isolate" }}>
      {cadre.map((cadru, k) => (
        <div
          key={`${cadru.src}-${k}`}
          // Capturile în plus repetă același model: un cititor de ecran îl aude o dată, din poza principală.
          aria-hidden={k === 0 ? undefined : true}
          style={{
            // Prima poză ține locul (înălțimea casetei); celelalte stau peste ea.
            ...(k === 0 ? { position: "relative" as const } : { position: "absolute" as const, inset: 0 }),
            zIndex: k === stare.curent ? 2 : k === stare.anterior ? 1 : 0,
            opacity: k === stare.curent || k === stare.anterior ? 1 : 0,
            transition: k === stare.curent ? `opacity ${TRECERE_MS}ms ease` : "none",
          }}
        >
          <SectionImage
            src={cadru.src}
            alt={k === 0 ? cadru.alt : ""}
            aspectRatio="16 / 9"
            sizes="(max-width: 720px) 100vw, 560px"
            pozitie={cadru.pozitie}
          />
        </div>
      ))}
      <div style={{ position: "absolute", inset: 0, zIndex: 3 }}>{children}</div>
    </div>
  );

  return legatura ? (
    <a {...legatura} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
      {poze}
    </a>
  ) : (
    poze
  );
}
