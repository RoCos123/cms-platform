import type { ReactNode } from "react";
import { SectionEyebrow } from "@/components/site/section";

/**
 * Antetul repetat de aproape fiecare secțiune: etichetă mică, titlu cu un accent
 * în serif italic, uneori un paragraf de intro.
 *
 * Extras după ce tiparul s-a repetat identic în șapte secțiuni — nu înainte.
 * Secțiunile deja scrise îl vor prelua pe măsură ce sunt atinse; rescrise acum
 * doar ca să folosească un helper, ar fi un diff mare fără nicio schimbare
 * vizibilă pe site.
 */
export function SectionHeading({
  eyebrow,
  titlu,
  titluAccent,
  intro,
  maxWidthTitlu = "13em",
  actiune,
}: {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  maxWidthTitlu?: string;
  /** Link-ul din dreapta titlului („Vezi toate →"), dacă secțiunea are unul. */
  actiune?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: "24px",
      }}
    >
      <div>
        {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}

        <h2
          style={{
            margin: 0,
            maxWidth: maxWidthTitlu,
            fontSize: "clamp(32px, 4.4vw, 54px)",
            lineHeight: 1.08,
            letterSpacing: "-0.025em",
            fontFamily: "var(--t-font-titlu)",
            fontWeight: "var(--t-greutate-titlu)" as unknown as number,
            textWrap: "balance",
          }}
        >
          {titlu}
          {titluAccent && (
            <>
              {" "}
              <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "var(--t-stil-accent)", fontWeight: 300 }}>
                {titluAccent}
              </span>
            </>
          )}
        </h2>

        {intro && (
          <p
            style={{
              margin: "22px 0 0",
              maxWidth: "38em",
              fontSize: "17px",
              lineHeight: 1.7,
              color: "var(--s-text-secundar)",
              textWrap: "pretty",
            }}
          >
            {intro}
          </p>
        )}
      </div>

      {actiune}
    </div>
  );
}
