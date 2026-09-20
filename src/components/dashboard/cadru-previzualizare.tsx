"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Previzualizarea unei secțiuni, într-un `<iframe>`.
 *
 * De ce iframe și nu un simplu `<div>` micșorat: secțiunile site-ului își
 * calculează mărimile din lățimea ferestrei (`clamp(32px, 4.4vw, 54px)`).
 * Într-un div, `4vw` s-ar referi tot la fereastra panoului, deci titlurile ar
 * ieși uriașe într-o casetă îngustă — o previzualizare care minte. Un iframe are
 * propria fereastră, deci ce se vede aici e ce se vede pe site.
 *
 * Conținutul e randat prin portal, nu serializat: aceleași componente ca pe
 * site-ul public, actualizate la fiecare tastă.
 */
export function CadruPrevizualizare({
  latime,
  children,
}: {
  /** Lățimea ferestrei simulate, în pixeli. 1180 = laptop, 390 = telefon. */
  latime: number;
  children: ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [document_, setDocument_] = useState<Document | null>(null);
  const [inaltime, setInaltime] = useState(420);
  const [scara, setScara] = useState(1);
  const [latimeContainer, setLatimeContainer] = useState(0);

  /*
   * Stilurile paginii nu ajung singure în iframe. Fără ele lipsește preflight-ul
   * Tailwind, iar titlurile ar căpăta marginile implicite ale browserului și
   * listele ar primi buline — adică previzualizarea ar arăta altfel decât site-ul.
   *
   * Fonturile vin tot de aici, de când sunt servite de la noi: `next/font` pune
   * regulile `@font-face` chiar în foaia de stil a aplicației, iar copierea de
   * mai jos le ia cu ea. Înainte se dădea separat adresa de la Google, într-un
   * prop; acum n-ar mai avea ce adresă să primească.
   */
  useEffect(() => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;

    function copiazaStiluri(doc: Document) {
      doc.head.replaceChildren();
      document
        .querySelectorAll('style, link[rel="stylesheet"]')
        .forEach((nod) => doc.head.appendChild(nod.cloneNode(true)));

      /*
       * Intrarea în cadru la scroll (`[data-reveal]`, din `Section`) pornește
       * conținutul invizibil până-l „vede" un IntersectionObserver — care aici
       * n-are ce observa, fiindcă fereastra asta nu derulează (`scrolling="no"`,
       * totul e vizibil dintr-odată). Fără linia asta, fiecare previzualizare
       * din panou ar rămâne cu secțiunile goale, la nesfârșit.
       */
      const suprascriereReveal = doc.createElement("style");
      suprascriereReveal.textContent =
        "[data-reveal]{opacity:1!important;transform:none!important;}";
      doc.head.appendChild(suprascriereReveal);

      doc.body.style.margin = "0";
      // Previzualizarea se privește, nu se folosește: `inert` scoate tot ce e
      // înăuntru din ordinea de tabulare și din arborele de accesibilitate, ca
      // un Tab din formular să nu aterizeze în butoanele unui site fals.
      doc.body.setAttribute("inert", "");
    }

    copiazaStiluri(doc);
    setDocument_(doc);

    // În dezvoltare, stilurile sunt injectate pe parcurs, nu toate la încărcare.
    const observator = new MutationObserver(() => copiazaStiluri(doc));
    observator.observe(document.head, { childList: true });
    return () => observator.disconnect();
  }, []);

  // Înălțimea iframe-ului urmează conținutul: altfel ar avea o înălțime fixă și
  // ori ar tăia secțiunea, ori ar lăsa gol sub ea.
  useEffect(() => {
    const corp = document_?.body;
    if (!corp) return;

    const observator = new ResizeObserver(() => setInaltime(corp.scrollHeight));
    observator.observe(corp);
    return () => observator.disconnect();
  }, [document_]);

  // Fereastra simulată e mai lată decât coloana din panou, deci se micșorează.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observator = new ResizeObserver(([intrare]) => {
      setLatimeContainer(intrare.contentRect.width);
      // Niciodată peste 1: o fereastră de telefon mărită la 900px n-ar mai fi o
      // previzualizare de telefon, ci o minciună la scară mare.
      setScara(Math.min(1, intrare.contentRect.width / latime));
    });
    observator.observe(container);
    return () => observator.disconnect();
  }, [latime]);

  // Fereastra îngustă (telefon) încape întreagă, deci rămâne loc pe lateral.
  // Centrată, arată a dispozitiv; lipită la stânga, arată a randare stricată.
  const deplasare = Math.max(0, (latimeContainer - latime * scara) / 2);

  return (
    <div
      ref={containerRef}
      style={{ height: inaltime * scara, overflow: "hidden" }}
      className="rounded-base border border-border bg-surface"
    >
      <iframe
        ref={iframeRef}
        title="Previzualizare"
        tabIndex={-1}
        scrolling="no"
        style={{
          width: latime,
          height: inaltime,
          border: 0,
          transform: `translateX(${deplasare}px) scale(${scara})`,
          transformOrigin: "top left",
        }}
      />
      {document_ && createPortal(children, document_.body)}
    </div>
  );
}
