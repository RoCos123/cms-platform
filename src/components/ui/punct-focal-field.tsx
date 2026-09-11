"use client";

import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  normalizeazaPunctFocal,
  pozitiaImaginii,
  type PunctFocal,
} from "@/lib/punct-focal";

/**
 * Alegerea punctului focal al unei poze: pe ce parte să rămână centrată când
 * site-ul o taie la altă formă. Clientul trage un cerculeț peste ce vrea să
 * rămână mereu vizibil — de obicei fața.
 *
 * De ce un PUNCT pe toată poza, nu tras „în ramă" ca la Facebook: aceeași poză
 * apare pe site tăiată la forme diferite (pătrat la prima secțiune, 4:5 la
 * „Despre mine", 16:9 la apariții). Un punct ales o dată e valabil pentru toate;
 * o ramă anume ar fi mințit despre celelalte. De-aia arătăm poza întreagă și,
 * dedesubt, câteva exemple de tăiere care se mișcă odată cu punctul.
 *
 * Mișcarea merge și din maus (trage sau apasă oriunde pe poză), și din taste
 * (săgeți, cu Shift pas mai mare), fiindcă un control care se mișcă doar din
 * maus e inaccesibil cui navighează din tastatură.
 */
export function SelectorPunctFocal({
  src,
  value,
  onChange,
}: {
  src: string;
  value: PunctFocal;
  onChange: (punct: PunctFocal) => void;
}) {
  const zonaRef = useRef<HTMLDivElement>(null);
  const cerculetRef = useRef<HTMLButtonElement>(null);
  // Rama de lucru ia forma reală a pozei, ca procentul de sub deget să fie exact
  // procentul din imagine — altfel, cu benzi goale în jur, punctul ar sări.
  const [proportie, setProportie] = useState("3 / 2");
  const [tras, setTras] = useState(false);

  function dinPozitie(clientX: number, clientY: number) {
    const zona = zonaRef.current;
    if (!zona) return;
    const cadru = zona.getBoundingClientRect();
    if (cadru.width === 0 || cadru.height === 0) return;

    onChange(
      normalizeazaPunctFocal({
        x: ((clientX - cadru.left) / cadru.width) * 100,
        y: ((clientY - cadru.top) / cadru.height) * 100,
      }),
    );
  }

  function laApasare(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setTras(true);
    cerculetRef.current?.focus();
    dinPozitie(e.clientX, e.clientY);
  }

  function laMiscare(e: ReactPointerEvent<HTMLDivElement>) {
    if (tras) dinPozitie(e.clientX, e.clientY);
  }

  function laRidicare(e: ReactPointerEvent<HTMLDivElement>) {
    setTras(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function laTasta(e: ReactKeyboardEvent<HTMLButtonElement>) {
    const pas = e.shiftKey ? 10 : 1;
    const mutari: Record<string, [number, number]> = {
      ArrowLeft: [-pas, 0],
      ArrowRight: [pas, 0],
      ArrowUp: [0, -pas],
      ArrowDown: [0, pas],
    };
    const mutare = mutari[e.key];
    if (!mutare) return;

    e.preventDefault();
    onChange(normalizeazaPunctFocal({ x: value.x + mutare[0], y: value.y + mutare[1] }));
  }

  const objectPosition = pozitiaImaginii(value);

  return (
    <div className="space-y-2">
      <div
        ref={zonaRef}
        onPointerDown={laApasare}
        onPointerMove={laMiscare}
        onPointerUp={laRidicare}
        onPointerCancel={laRidicare}
        className="relative mx-auto w-full max-w-[320px] overflow-hidden rounded-base border border-border bg-surface-muted"
        style={{ aspectRatio: proportie, touchAction: "none", cursor: "crosshair" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare locală, orice gazdă, fără optimizare */}
        <img
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalWidth > 0 && img.naturalHeight > 0) {
              setProportie(`${img.naturalWidth} / ${img.naturalHeight}`);
            }
          }}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
        />

        <button
          ref={cerculetRef}
          type="button"
          onKeyDown={laTasta}
          aria-label={`Punct focal: ${value.x}% pe orizontală, ${value.y}% pe verticală. Mută-l cu săgețile.`}
          className="pointer-events-none absolute z-10 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary/60 shadow-[0_0_0_2px_rgba(0,0,0,0.4)] outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ left: `${value.x}%`, top: `${value.y}%` }}
        />
      </div>

      {/*
        Exemple de tăiere, ca omul să vadă efectul fără să iasă din panou. Nu sunt
        chiar formele de pe site (fiecare secțiune taie altfel), ci două forme
        obișnuite — de-aia scrie „exemple". Se mișcă live odată cu punctul.
      */}
      <div aria-hidden className="flex items-center justify-center gap-3">
        <ExempluTaiere src={src} proportie="1 / 1" objectPosition={objectPosition} eticheta="Pătrat" />
        <ExempluTaiere src={src} proportie="16 / 9" objectPosition={objectPosition} eticheta="Lat" />
      </div>
    </div>
  );
}

function ExempluTaiere({
  src,
  proportie,
  objectPosition,
  eticheta,
}: {
  src: string;
  proportie: string;
  objectPosition: string;
  eticheta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-20 overflow-hidden rounded-base border border-border bg-surface-muted"
        style={{ aspectRatio: proportie }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare locală, orice gazdă */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground">{eticheta}</span>
    </div>
  );
}
