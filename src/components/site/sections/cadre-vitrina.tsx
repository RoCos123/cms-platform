"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { SectionImage } from "@/components/site/section-image";
import { TEXTE_VANZARE } from "@/lib/pagina-vanzare";
import type { PunctFocal } from "@/lib/punct-focal";

/** O poză a cartonașului: cea principală (prima) sau o variantă a modelului. */
export type CadruVitrina = {
  src: string;
  alt: string;
  pozitie: PunctFocal;
  /** Ce scrie pe poză cât se vede cadrul ăsta (`etichetaVariantei`). */
  eticheta: string;
  /** Bulina cadrului; `null` = nicio culoare din listă, bulină albă. */
  culoare: { hex: string; matasos: boolean } | null;
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
 * în alta, singure, la `PAS_MS`. Sus, o etichetă spune ce se vede („Safir · Modern"), cu câte o
 * bulină pentru fiecare poză.
 *
 * Când NU se mișcă: cât timp cartonașul nu e pe ecran (pornește când ajunge vizitatorul la el, nu
 * pe ascuns, mai sus în pagină); cât stă mausul pe cartonaș; după ce omul a apăsat o bulină (a luat
 * el controlul); și deloc la cine a cerut mai puțină mișcare (`prefers-reduced-motion`) — ca la
 * banda cu servicii, OPRITĂ, nu absentă: bulinele se pot apăsa și atunci.
 *
 * Trecerea: poza nouă se aprinde PESTE cea veche, care rămâne plină dedesubt până se termină.
 * Două poze stinse pe jumătate deodată ar lăsa să se vadă fundalul printre ele, în mijlocul
 * trecerii. Stiva e izolată (`isolation`), ca straturile ei să nu treacă peste numele și butonul
 * cartonașului, care vin după ea.
 *
 * Bulinele sunt butoane, deci nu pot sta în linkul cartonașului (un buton în link nu e voie): de-asta
 * componenta primește și linkul, și pune eticheta lângă el, nu în el. Restul de peste poză — voalul,
 * numele — vine de la cartonaș, ca `children`.
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
  const [aleasDeOm, setAleasDeOm] = useState(false);
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
    if (numar < 2 || !peEcran || subMaus || aleasDeOm || miscareRedusa) return;
    const ceas = window.setInterval(
      () => setStare((s) => ({ curent: (s.curent + 1) % numar, anterior: s.curent })),
      PAS_MS,
    );
    return () => window.clearInterval(ceas);
  }, [numar, peEcran, subMaus, aleasDeOm, miscareRedusa]);

  function alege(k: number) {
    setAleasDeOm(true);
    setStare((s) => (s.curent === k ? s : { curent: k, anterior: s.curent }));
  }

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
            transition: k === stare.curent && !miscareRedusa ? `opacity ${TRECERE_MS}ms ease` : "none",
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

  return (
    <>
      {legatura ? (
        <a {...legatura} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
          {poze}
        </a>
      ) : (
        poze
      )}

      {/* Rândul nu prinde clicuri, doar bulinele: clicul pe etichetă ajunge la demo, ca pe restul pozei. */}
      <div
        style={{
          position: "absolute",
          top: "14px",
          left: "14px",
          maxWidth: "calc(100% - 28px)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px 4px 4px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.94)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.16)",
          color: "#1a1a1a",
          fontSize: "12.5px",
          fontWeight: 600,
          lineHeight: 1.2,
          pointerEvents: "none",
        }}
      >
        <span style={{ display: "flex", flexShrink: 0 }}>
          {cadre.map((cadru, k) => (
            <button
              key={`${cadru.src}-${k}`}
              type="button"
              aria-label={`${TEXTE_VANZARE.variante.arata}: ${cadru.eticheta}`}
              aria-pressed={k === stare.curent}
              onClick={() => alege(k)}
              style={{
                pointerEvents: "auto",
                width: "24px",
                height: "24px",
                display: "grid",
                placeItems: "center",
                padding: 0,
                border: 0,
                borderRadius: "999px",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <span aria-hidden style={stilBulina(cadru.culoare, k === stare.curent)} />
            </button>
          ))}
        </span>
        {/* Eticheta e deja în numele bulinei apăsate; citită și aici, ar suna de două ori. */}
        <span aria-hidden style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cadre[stare.curent]?.eticheta}
        </span>
      </div>
    </>
  );
}

/** Bulina unei poze: culoarea ei (cu luciu, la cele mătăsoase), albă fără culoare, inel pe cea de acum. */
function stilBulina(culoare: CadruVitrina["culoare"], activa: boolean): React.CSSProperties {
  return {
    width: "14px",
    height: "14px",
    borderRadius: "50%",
    backgroundColor: culoare?.hex ?? "#fff",
    backgroundImage: culoare?.matasos
      ? "linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0) 55%, rgba(0,0,0,0.18))"
      : undefined,
    boxShadow: culoare ? "inset 0 0 0 1px rgba(0,0,0,0.12)" : "inset 0 0 0 1.5px rgba(0,0,0,0.35)",
    outline: activa ? "2px solid #1a1a1a" : undefined,
    outlineOffset: "2px",
  };
}
