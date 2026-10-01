"use client";

import {
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ZOOM_MAXIM,
  ZOOM_MINIM,
  dupaTragere,
  normalizeazaPunctFocal,
  normalizeazaZoom,
  pozitiaImaginii,
  scaraImaginii,
  surplusulPozei,
  type PunctFocal,
} from "@/lib/punct-focal";

/**
 * Repoziționarea unei poze, ca la Facebook: o vezi într-o ramă, o tragi cu
 * mausul, iar ce rămâne în cadru e ce se vede pe site. NU un punct de pus —
 * clientul nu știe ce e un „punct focal", dar știe să tragă o poză.
 *
 * Rama e pătrată, o formă neutră: un portret iese pe verticală (îl tragi în
 * sus/jos ca să alegi fața), o poză lată iese pe orizontală. Pe site poza se
 * taie la mai multe forme, dar `object-position` în procente e valabil pentru
 * toate, deci o poziție aleasă o dată se respectă peste tot.
 *
 * `onChange` se cheamă cât timp tragi (previzualizare live); `onCommit`, când
 * dai drumul — acolo apelantul salvează, ca să nu batem serverul la fiecare
 * pixel. Merge și din tastatură (săgeți), pentru cine nu folosește mausul.
 */
export function RepozitionareImagine({
  src,
  value,
  onChange,
  onCommit,
  raport,
}: {
  src: string;
  value: PunctFocal;
  onChange: (punct: PunctFocal) => void;
  onCommit?: (punct: PunctFocal) => void;
  /**
   * Forma ramei, ca `aspect-ratio` („4 / 5"). Vine din locul de pe site unde
   * ajunge poza (`raportRamei`). Lipsă → pătrat, purtarea de dinainte.
   */
  raport?: string;
}) {
  const ramaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const inceput = useRef<{ x: number; y: number; punct: PunctFocal } | null>(
    null,
  );
  const ultima = useRef(value);
  const [trage, setTrage] = useState(false);

  /**
   * Cât IESE imaginea din ramă pe fiecare axă, în pixeli (`object-fit: cover`).
   * De asta depinde cât se mișcă procentul la un pixel tras — se măsoară din
   * dimensiunile reale ale imaginii și mărimea ramei, nu se presupune.
   *
   * Dimensiunile se citesc DIRECT din elementul `<img>`, la momentul tragerii, nu
   * dintr-un `onLoad`: o poză deja în cache e „complete" înainte ca React să-i
   * lege `onLoad`, deci evenimentul nu mai vine, iar tragerea ar rămâne moartă.
   */
  function surplus(): { surplusX: number; surplusY: number } {
    const rama = ramaRef.current;
    const img = imgRef.current;
    if (!rama || !img) return { surplusX: 0, surplusY: 0 };

    return surplusulPozei({
      latimeRama: rama.clientWidth,
      inaltimeRama: rama.clientHeight,
      latimeFisier: img.naturalWidth,
      inaltimeFisier: img.naturalHeight,
      zoom: value.zoom,
    });
  }

  function laApasare(e: ReactPointerEvent<HTMLDivElement>) {
    e.preventDefault();
    // Starea de tragere se pune ÎNAINTE de captură: `setPointerCapture` poate
    // arunca (pointer deja eliberat, id necunoscut), iar dacă am fi capturat
    // întâi, tragerea n-ar mai porni deloc. Fără captură, mișcările tot ajung
    // la ramă cât timp degetul e peste ea; captura doar le prinde și dincolo.
    inceput.current = { x: e.clientX, y: e.clientY, punct: value };
    ultima.current = value;
    setTrage(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fără captură — se poate trage tot, doar în interiorul ramei.
    }
  }

  function laMiscare(e: ReactPointerEvent<HTMLDivElement>) {
    if (!inceput.current) return;
    const { surplusX, surplusY } = surplus();
    const nou = dupaTragere(inceput.current.punct, {
      dx: e.clientX - inceput.current.x,
      dy: e.clientY - inceput.current.y,
      surplusX,
      surplusY,
    });
    ultima.current = nou;
    onChange(nou);
  }

  function laRidicare(e: ReactPointerEvent<HTMLDivElement>) {
    if (!inceput.current) return;
    inceput.current = null;
    setTrage(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    onCommit?.(ultima.current);
  }

  function laTasta(e: ReactKeyboardEvent<HTMLDivElement>) {
    const pas = e.shiftKey ? 10 : 4;
    // Săgeata arată ÎNCOTRO vrei să vezi mai mult: jos dezvelește partea de jos,
    // deci procentul crește. Doar pe axa unde imaginea chiar iese din ramă.
    const mutari: Record<string, [number, number]> = {
      ArrowLeft: [-pas, 0],
      ArrowRight: [pas, 0],
      ArrowUp: [0, -pas],
      ArrowDown: [0, pas],
    };
    const m = mutari[e.key];
    if (!m) return;

    e.preventDefault();
    const { surplusX, surplusY } = surplus();
    const nou = normalizeazaPunctFocal({
      x: surplusX > 0 ? value.x + m[0] : value.x,
      y: surplusY > 0 ? value.y + m[1] : value.y,
    });
    ultima.current = nou;
    onChange(nou);
    onCommit?.(nou);
  }

  const zoom = normalizeazaZoom(value.zoom);

  return (
    <div className="mx-auto w-full max-w-[320px]">
      <div
        ref={ramaRef}
        role="group"
        aria-label="Poziția pozei — trage de imagine sau folosește săgețile"
        tabIndex={0}
        onPointerDown={laApasare}
        onPointerMove={laMiscare}
        onPointerUp={laRidicare}
        onPointerCancel={laRidicare}
        onKeyDown={laTasta}
        className="relative mx-auto w-full max-w-[320px] select-none overflow-hidden rounded-base border border-border bg-surface-muted outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        style={{
          touchAction: "none",
          cursor: trage ? "grabbing" : "grab",
          /*
          Forma ramei e a LOCULUI de pe site unde ajunge poza, nu un pătrat ales
          de noi. Altfel ce încadrezi aici nu e ce iese acolo — și, mai rău,
          `object-fit: cover` lasă poza să se miște doar pe axa pe care îi
          prisosește ceva, iar axa aia diferă de la o ramă la alta. Pătratul a
          rămas doar ca rezervă, pentru un câmp a cărui formă n-o știm.
        */
          aspectRatio: raport ?? "1 / 1",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- previzualizare locală în panou, orice gazdă */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: pozitiaImaginii(value),
            // Aceeași pereche ca pe site (`SectionImage`): originea e chiar
            // punctul focal, ca punctul ales să rămână pe loc la mărire.
            transform: scaraImaginii(value),
            transformOrigin: pozitiaImaginii(value),
          }}
        />

        {/* Indiciu că poza se trage. Piere cât timp tragi, ca să nu stea în cale. */}
        {!trage && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45 px-2 py-1.5 text-center text-[11px] font-medium text-white"
          >
            Trage de poză ca s-o poziționezi
          </span>
        )}
      </div>

      {/*
        Mărirea. Fără ea, o poză lată într-o ramă înaltă nu se poate trage deloc
        sus-jos: `object-fit: cover` o potrivește fix pe înălțime, deci deasupra
        și dedesubt nu există nimic de adus în cadru. Mărită, îi prisosește pe
        amândouă axele — și abia atunci are rost să tragi în toate direcțiile.
      */}
      <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="shrink-0">Mărime</span>
        <input
          type="range"
          min={ZOOM_MINIM}
          max={ZOOM_MAXIM}
          step={0.05}
          value={zoom}
          aria-label="Cât de mare e poza în ramă"
          onChange={(e) => {
            const nou = normalizeazaZoom(Number(e.target.value));
            const punct = normalizeazaPunctFocal({ ...value, zoom: nou });
            ultima.current = punct;
            onChange(punct);
          }}
          // Mărirea se salvează la ridicarea degetului, nu la fiecare pixel de
          // glisare: altfel ar pleca zeci de scrieri pentru o singură reglare.
          onPointerUp={() => onCommit?.(ultima.current)}
          onKeyUp={() => onCommit?.(ultima.current)}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
        />
        <span className="w-10 shrink-0 text-right tabular-nums">
          {zoom.toFixed(1)}×
        </span>
      </label>
    </div>
  );
}
