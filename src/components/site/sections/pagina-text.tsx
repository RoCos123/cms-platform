import type { SectionTone } from "@/lib/templates";
import type { Pagina } from "@/lib/pagini";
import { Section } from "@/components/site/section";
import { CorpText } from "@/components/site/corp-text";

/**
 * O pagină de sine stătătoare: titlu și text.
 *
 * Fără dată și fără timp de citit, spre deosebire de un articol. O politică de
 * confidențialitate nu se citește „de plăcere", iar o dată pusă lângă titlu ar
 * fi citită ca „scrisă acum trei ani, probabil depășită" — exact impresia pe
 * care n-o vrem la un text care e valabil până se schimbă.
 *
 * Folosit și în previzualizarea din panou, ca ce vede clientul cât scrie să fie
 * exact ce se vede pe site.
 */
export function PaginaText({
  pagina,
  tone = "deschis",
}: {
  pagina: Pick<Pagina, "titlu" | "continut">;
  tone?: SectionTone;
}) {
  return (
    <Section tone={tone}>
      <article style={{ maxWidth: "40em", marginInline: "auto" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(32px, 4.6vw, 52px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            fontWeight: 700,
            textWrap: "balance",
          }}
        >
          {pagina.titlu}
        </h1>

        <div style={{ marginTop: "clamp(28px, 3.5vw, 40px)" }}>
          <CorpText text={pagina.continut} />
        </div>
      </article>
    </Section>
  );
}
