import type { SectionTone } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";

/**
 * Serviciile, pe larg — conținutul paginii `/servicii`.
 *
 * O singură pagină cu toate serviciile descrise, nu câte o pagină pentru
 * fiecare. Un cabinet cu șase servicii ar fi avut șase pagini de scris, iar
 * multe ar fi rămas cu trei rânduri într-o pagină goală: șase pagini slabe
 * arată mai rău decât una bună.
 *
 * Fiecare serviciu are totuși `id` propriu în pagină, deci se poate trimite
 * cuiva un link direct la el (`/servicii#consiliere-parentala`).
 */
export function ServiciiDetaliate({
  eyebrow,
  titlu,
  titluAccent,
  intro,
  servicii,
  tone = "deschis",
}: {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  servicii: Serviciu[];
  tone?: SectionTone;
}) {
  return (
    <Section tone={tone}>
      <SectionHeading
        eyebrow={eyebrow}
        titlu={titlu}
        titluAccent={titluAccent}
        intro={intro}
        maxWidthTitlu="12em"
      />

      {servicii.length === 0 ? (
        <p style={{ marginTop: "40px", color: "var(--s-text-secundar)" }}>
          Serviciile se adaugă în curând.
        </p>
      ) : (
        <div style={{ marginTop: "clamp(48px, 6vw, 80px)" }}>
          {servicii.map((serviciu, i) => (
            <BlocServiciu key={serviciu.id} serviciu={serviciu} primul={i === 0} />
          ))}
        </div>
      )}
    </Section>
  );
}

/**
 * Un serviciu descris pe larg. Folosit și în previzualizarea din panou, ca
 * ce vede clientul cât scrie să fie exact ce se vede pe site.
 */
export function BlocServiciu({ serviciu, primul = true }: { serviciu: Serviciu; primul?: boolean }) {
  const meta = [serviciu.durata, serviciu.pret].filter(Boolean) as string[];

  return (
    <article
      id={serviciu.slug || undefined}
      style={{
        paddingBlock: "clamp(36px, 5vw, 56px)",
        borderTop: primul ? undefined : "1px solid var(--t-chenar)",
        // Ancora nu trebuie să ducă titlul fix sub antetul lipit de sus.
        scrollMarginTop: "96px",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "clamp(20px, 4vw, 56px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
          alignItems: "start",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(26px, 3.2vw, 38px)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              fontWeight: 700,
              textWrap: "balance",
            }}
          >
            {serviciu.titlu}
          </h2>

          {meta.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: "18px 0 0",
                padding: 0,
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              {meta.map((valoare) => (
                <li
                  key={valoare}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "999px",
                    border: "1px solid var(--t-chenar)",
                    fontSize: "14px",
                    color: "var(--s-text-secundar)",
                  }}
                >
                  {valoare}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          {paragrafe(serviciu.descriereCompleta || serviciu.descriereScurta).map((paragraf, i) => (
            <p
              key={i}
              style={{
                margin: i === 0 ? 0 : "18px 0 0",
                fontSize: "17px",
                lineHeight: 1.75,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {paragraf}
            </p>
          ))}
        </div>
      </div>
    </article>
  );
}

/**
 * Textul lung se scrie într-o casetă obișnuită, cu Enter între idei. Un rând
 * gol înseamnă paragraf nou; rândurile simple rămân împreună, ca la scris de
 * mână. Fără asta, tot textul ar apărea ca un bloc compact.
 */
function paragrafe(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((bucata) => bucata.trim())
    .filter(Boolean);
}
