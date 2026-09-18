import type { SectionTone } from "@/lib/templates";
import { Section } from "@/components/site/section";

export type QuoteData = {
  citat: string;
  autor?: string;
};

/**
 * Secțiune găsită în șabloane, absentă din cele 17 definite în Faza 0: o bandă
 * cu un singur citat, folosită ca respiro între blocuri grele. În două dintre
 * șabloane apare de câte două ori în aceeași pagină, o dată pe fundal deschis și
 * o dată pe închis — de aceea tonul e prop, nu valoare fixă.
 */
export function Quote({
  data,
  tone,
  centrat,
}: {
  data: QuoteData;
  tone?: SectionTone;
  /**
   * Citatul centrat, mai mare, fără ghilimeaua-ornament din față — respiro-ul
   * editorial al referinței „Liniște". Doar „Liniște".
   */
  centrat?: boolean;
}) {
  /*
    Fără un citat, secțiunea nu se randează deloc.

    Nu e prudență: `creeaza_client` aprinde toate secțiunile cu `{}` în ele, iar
    fără paza asta un site abia provizionat arăta o ghilimea albastră singură, atârnând într-o bandă goală. Aceeași regulă ca
    peste tot — o secțiune fără conținut nu desenează nimic, nici măcar ornamentul.
  */
  if (!data.citat?.trim()) return null;

  /*
    Varianta centrată a referinței „Liniște": citatul mare, în mijloc, fără
    ghilimeaua-ornament din față. E o bandă de respiro între blocuri, așa că
    lățimea e mărginită ca rândurile să nu se întindă prea mult.
  */
  if (centrat) {
    return (
      <Section tone={tone}>
        <figure style={{ margin: "0 auto", maxWidth: "min(1000px, 100%)", textAlign: "center" }}>
          <blockquote
            style={{
              margin: 0,
              fontFamily: "var(--t-font-secundar)",
              fontStyle: "var(--t-stil-accent)",
              fontWeight: 400,
              fontSize: "clamp(30px, 4.4vw, 60px)",
              lineHeight: 1.22,
              letterSpacing: "-0.01em",
              textWrap: "pretty",
            }}
          >
            {data.citat}
          </blockquote>
          {data.autor && (
            <figcaption
              style={{
                marginTop: "28px",
                fontSize: "14px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--s-text-secundar)",
              }}
            >
              {data.autor}
            </figcaption>
          )}
        </figure>
      </Section>
    );
  }

  return (
    <Section tone={tone}>
      <figure style={{ margin: 0, display: "flex", gap: "clamp(16px, 3vw, 40px)" }}>
        <span
          aria-hidden
          style={{
            fontFamily: "var(--t-font-secundar)",
            fontSize: "clamp(56px, 7vw, 96px)",
            lineHeight: 0.8,
            color: "var(--s-accent)",
            flexShrink: 0,
          }}
        >
          &ldquo;
        </span>
        <div>
          <blockquote
            style={{
              margin: 0,
              fontFamily: "var(--t-font-secundar)",
              fontStyle: "var(--t-stil-accent)",
              fontWeight: 300,
              fontSize: "clamp(26px, 3.6vw, 44px)",
              lineHeight: 1.28,
              letterSpacing: "-0.01em",
              textWrap: "pretty",
            }}
          >
            {data.citat}
          </blockquote>
          {data.autor && (
            <figcaption
              style={{
                marginTop: "20px",
                fontSize: "14px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--s-text-secundar)",
              }}
            >
              {data.autor}
            </figcaption>
          )}
        </div>
      </figure>
    </Section>
  );
}
