import type { ReactNode } from "react";
import type { SectionTone } from "@/lib/templates";

const FUNDAL: Record<SectionTone, string> = {
  deschis: "var(--t-fundal)",
  nuantat: "var(--t-fundal-nuantat)",
  inchis: "var(--t-fundal-inchis)",
};

const TEXT: Record<SectionTone, string> = {
  deschis: "var(--t-text)",
  nuantat: "var(--t-text)",
  inchis: "var(--t-text-pe-inchis)",
};

const TEXT_SECUNDAR: Record<SectionTone, string> = {
  deschis: "var(--t-text-secundar)",
  nuantat: "var(--t-text-secundar)",
  inchis: "var(--t-text-secundar-pe-inchis)",
};

/**
 * Învelișul oricărei secțiuni de pe site-ul public.
 *
 * Secțiunile nu cunosc culori — cer un TON, iar șablonul decide ce culoare
 * înseamnă. Fără asta, un șablon nou ar cere rescrierea tuturor secțiunilor;
 * așa, cere doar alte valori în fișierul de șablon.
 *
 * `--s-text-secundar` se publică mai departe fiindcă textul secundar de pe fundal
 * închis nu e același cu cel de pe fundal deschis: pe închis trebuie deschis,
 * altfel dispare.
 */
export function Section({
  tone = "deschis",
  id,
  children,
  className,
}: {
  tone?: SectionTone;
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={className}
      style={{
        background: FUNDAL[tone],
        color: TEXT[tone],
        ["--s-text-secundar" as string]: TEXT_SECUNDAR[tone],
        paddingBlock: "var(--t-spatiere)",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto", paddingInline: "clamp(20px, 5vw, 64px)" }}>
        {children}
      </div>
    </section>
  );
}

/** Eticheta mică de deasupra titlului („● CABINET · BUCUREȘTI"). */
export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: "0 0 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--t-accent)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "999px",
          background: "currentColor",
          flexShrink: 0,
        }}
      />
      {children}
    </p>
  );
}
