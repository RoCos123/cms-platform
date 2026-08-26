import type { ReactNode } from "react";
import type { SectionTone } from "@/lib/templates";

const FUNDAL: Record<SectionTone, string> = {
  deschis: "var(--t-fundal)",
  nuantat: "var(--t-fundal-nuantat)",
  relief: "var(--t-fundal-relief)",
  inchis: "var(--t-fundal-inchis)",
};

const TEXT: Record<SectionTone, string> = {
  deschis: "var(--t-text)",
  nuantat: "var(--t-text)",
  relief: "var(--t-text)",
  inchis: "var(--t-text-pe-inchis)",
};

const TEXT_SECUNDAR: Record<SectionTone, string> = {
  deschis: "var(--t-text-secundar)",
  nuantat: "var(--t-text-secundar)",
  relief: "var(--t-text-secundar)",
  inchis: "var(--t-text-secundar-pe-inchis)",
};

const ACCENT: Record<SectionTone, string> = {
  deschis: "var(--t-accent)",
  nuantat: "var(--t-accent)",
  relief: "var(--t-accent)",
  inchis: "var(--t-accent-pe-inchis)",
};

const EROARE: Record<SectionTone, string> = {
  deschis: "var(--t-eroare)",
  nuantat: "var(--t-eroare)",
  relief: "var(--t-eroare)",
  inchis: "var(--t-eroare-pe-inchis)",
};

/**
 * Butonul plin de pe fundalul secțiunii. Pe tonurile deschise e accentul; pe cel
 * închis se inversează, fiindcă un buton terracotta pe maro-închis e o pată care
 * abia se distinge de fundal (2,51:1, sub pragul de 3:1 pentru componente).
 *
 * Nu se aplică butoanelor din interiorul cardurilor: cardul are propriul fundal,
 * mereu deschis, deci acolo accentul rămâne corect.
 */
const BUTON_FUNDAL: Record<SectionTone, string> = {
  deschis: "var(--t-accent)",
  nuantat: "var(--t-accent)",
  relief: "var(--t-accent)",
  inchis: "var(--t-text-pe-inchis)",
};

const BUTON_TEXT: Record<SectionTone, string> = {
  deschis: "var(--t-accent-text)",
  nuantat: "var(--t-accent-text)",
  relief: "var(--t-accent-text)",
  inchis: "var(--t-fundal-inchis)",
};

/**
 * Învelișul oricărei secțiuni de pe site-ul public.
 *
 * Secțiunile nu cunosc culori — cer un TON, iar șablonul decide ce culoare
 * înseamnă. Fără asta, un șablon nou ar cere rescrierea tuturor secțiunilor;
 * așa, cere doar alte valori în fișierul de șablon.
 *
 * Variabilele `--s-*` sunt versiunea „potrivită tonului acesta" a rolurilor din
 * șablon. Există fiindcă nicio culoare nu funcționează pe ambele feluri de
 * fundal: textul secundar de pe închis trebuie deschis, altfel dispare, iar
 * accentul ales să fie lizibil pe crem e prea închis pe maro. O secțiune
 * folosește `--s-*` pentru ce stă DIRECT pe fundalul ei și `--t-*` pentru ce e
 * într-un card cu fundal propriu.
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
        ["--s-accent" as string]: ACCENT[tone],
        ["--s-eroare" as string]: EROARE[tone],
        ["--s-buton-fundal" as string]: BUTON_FUNDAL[tone],
        ["--s-buton-text" as string]: BUTON_TEXT[tone],
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
        color: "var(--s-accent, var(--t-accent))",
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
