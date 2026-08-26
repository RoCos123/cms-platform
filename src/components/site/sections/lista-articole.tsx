import type { SectionTone } from "@/lib/templates";
import type { ArticolListat } from "@/lib/blog";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { GrilaArticole } from "@/components/site/card-articol";

/**
 * Conținutul paginii `/blog`: toate articolele publicate, cele mai noi întâi.
 *
 * Titlul îl împrumută de la secțiunea „Articole recente" a paginii principale —
 * aceleași cuvinte, scrise o dată. Un titlu separat ar fi însemnat încă un câmp
 * de completat, care spune același lucru.
 */
export function ListaArticole({
  eyebrow,
  titlu,
  titluAccent,
  articole,
  tone = "deschis",
}: {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  articole: ArticolListat[];
  tone?: SectionTone;
}) {
  return (
    <Section tone={tone}>
      <SectionHeading eyebrow={eyebrow} titlu={titlu} titluAccent={titluAccent} maxWidthTitlu="12em" />

      {articole.length === 0 ? (
        // Pagina poate fi pornită înainte de primul articol — cineva care
        // nimerește adresa merită o propoziție, nu o pagină pe jumătate goală.
        <p style={{ marginTop: "40px", fontSize: "17px", color: "var(--s-text-secundar)" }}>
          Primul articol se scrie acum. Revino peste câteva zile.
        </p>
      ) : (
        <GrilaArticole articole={articole} />
      )}
    </Section>
  );
}
