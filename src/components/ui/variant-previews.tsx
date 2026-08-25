import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Miniaturi provizorii pentru VariantPicker: schițe abstracte, nu capturi reale.
 * Fidelitatea vizuală a variantelor nu e încă decisă, așa că desenăm doar
 * ARANJAMENTUL (unde stă titlul, textul, imaginea) — atât cât să recunoști
 * modelul dintr-o privire. Când există capturi adevărate, se schimbă doar ce se
 * trimite în prop-ul `preview`, nu componenta care le afișează.
 *
 * Culoarea vine din `currentColor` (fixat pe text-muted-foreground), iar
 * ierarhia se face din opacitate — așa schița merge pe orice temă, fără culori
 * brute și fără variante `dark:`.
 */
export type PreviewProps = {
  className?: string;
};

const SVG_CLASS = "h-auto w-full text-muted-foreground";

/** Opacități folosite consecvent în toate schițele, ca să se citească la fel. */
const INK = {
  title: 0.8,
  action: 0.6,
  nav: 0.45,
  text: 0.32,
  media: 0.18,
} as const;

/** Bara de sus (siglă + meniu) e identică peste tot: doar restul paginii diferă. */
function NavSketch() {
  return (
    <g fill="currentColor">
      <rect x="12" y="10" width="20" height="6" rx="2" opacity={INK.nav} />
      <rect x="106" y="11" width="12" height="4" rx="2" opacity={INK.text} />
      <rect x="122" y="11" width="12" height="4" rx="2" opacity={INK.text} />
      <rect x="138" y="11" width="10" height="4" rx="2" opacity={INK.text} />
    </g>
  );
}

/** Bloc de imagine: dreptunghi cu un „soare" și o „linie de deal" înăuntru. */
function MediaSketch({
  x,
  y,
  width,
  height,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  return (
    <g fill="currentColor">
      <rect x={x} y={y} width={width} height={height} rx="4" opacity={INK.media} />
      <circle cx={x + width * 0.28} cy={y + height * 0.32} r="4" opacity={INK.action} />
      <path
        d={`M${x + 6} ${y + height - 6} L${x + width * 0.42} ${y + height * 0.5} L${x + width * 0.66} ${y + height - 6} Z`}
        opacity={INK.nav}
      />
    </g>
  );
}

function PreviewFrame({
  className,
  title,
  children,
}: PreviewProps & { title: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={cn(SVG_CLASS, className)}
      role="img"
      aria-label={title}
    >
      <NavSketch />
      {children}
    </svg>
  );
}

/** Titlu și text la stânga, imaginea alături — aranjamentul clasic de prezentare. */
export function PreviewClasic({ className }: PreviewProps) {
  return (
    <PreviewFrame className={className} title="Schiță: titlu la stânga, imagine alături">
      <g fill="currentColor">
        <rect x="12" y="32" width="62" height="9" rx="2" opacity={INK.title} />
        <rect x="12" y="47" width="54" height="4" rx="2" opacity={INK.text} />
        <rect x="12" y="55" width="44" height="4" rx="2" opacity={INK.text} />
        <rect x="12" y="68" width="28" height="9" rx="4" opacity={INK.action} />
      </g>
      <MediaSketch x={88} y={30} width={60} height={47} />
      <g fill="currentColor" opacity={INK.media}>
        <rect x="12" y="90" width="40" height="18" rx="3" />
        <rect x="60" y="90" width="40" height="18" rx="3" />
        <rect x="108" y="90" width="40" height="18" rx="3" />
      </g>
    </PreviewFrame>
  );
}

/** Totul aliniat pe mijloc, cu o imagine lată dedesubt — aer mult, mesaj scurt. */
export function PreviewCentrat({ className }: PreviewProps) {
  return (
    <PreviewFrame className={className} title="Schiță: totul aliniat pe centru">
      <g fill="currentColor">
        <rect x="40" y="32" width="80" height="9" rx="2" opacity={INK.title} />
        <rect x="48" y="47" width="64" height="4" rx="2" opacity={INK.text} />
        <rect x="56" y="55" width="48" height="4" rx="2" opacity={INK.text} />
        <rect x="66" y="66" width="28" height="9" rx="4" opacity={INK.action} />
      </g>
      <MediaSketch x={26} y={84} width={108} height={26} />
    </PreviewFrame>
  );
}

/** Imagine mare sus, titlu dedesubt și text pe două coloane — ca într-o revistă. */
export function PreviewEditorial({ className }: PreviewProps) {
  return (
    <PreviewFrame className={className} title="Schiță: imagine mare sus, text pe două coloane">
      <MediaSketch x={12} y={24} width={136} height={34} />
      <g fill="currentColor">
        <rect x="12" y="64" width="72" height="9" rx="2" opacity={INK.title} />
        <rect x="12" y="80" width="62" height="4" rx="2" opacity={INK.text} />
        <rect x="12" y="88" width="62" height="4" rx="2" opacity={INK.text} />
        <rect x="12" y="96" width="44" height="4" rx="2" opacity={INK.text} />
        <rect x="86" y="80" width="62" height="4" rx="2" opacity={INK.text} />
        <rect x="86" y="88" width="62" height="4" rx="2" opacity={INK.text} />
        <rect x="86" y="96" width="52" height="4" rx="2" opacity={INK.text} />
      </g>
    </PreviewFrame>
  );
}
