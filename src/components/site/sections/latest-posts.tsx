import type { SectionTone } from "@/lib/templates";
import type { ArticolListat } from "@/lib/blog";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { GrilaArticole } from "@/components/site/card-articol";

/**
 * Tipul stă în `@/lib/blog`, unde e și restul blogului. Re-exportat de aici ca
 * să nu rupem importurile existente — dar definiția e una singură.
 */
export type { ArticolListat as Articol };

export type LatestPostsData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  /** Câte se văd pe prima pagină. Lipsă = toate. */
  numar?: number;
};

/**
 * „Articole recente" — vitrina blogului de pe prima pagină.
 *
 * Nu-și ține conținutul: îl citește din Blog, la fel cum „Serviciile mele" îl
 * citește din Servicii. Secțiunea reține doar CUM se afișează (titlu, câte), nu
 * CE — altfel fiecare articol ar fi scris de două ori și cele două variante ar
 * ajunge să se contrazică.
 */
export function LatestPosts({
  data,
  articole,
  tone,
  friendly,
  curat,
}: {
  data: LatestPostsData;
  /**
   * Articolele publicate. Goală când blogul e oprit din panou — atunci nu există
   * nici pagina lor, deci nici secțiunea asta n-ar avea unde trimite.
   */
  articole: ArticolListat[];
  tone?: SectionTone;
  /** Cardurile de blog în stilul prietenos. Doar „Apropiere". */
  friendly?: boolean;
  /** Cardurile de blog fără fundal, doar imagine + text. Doar „Liniște". */
  curat?: boolean;
}) {
  // Fără articole publicate, secțiunea nu se randează deloc: un titlu „Articole
  // recente" urmat de nimic arată a site stricat, nu a site nou.
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (articole.length === 0 && !data.titlu?.trim()) return null;

  const afisate = data.numar ? articole.slice(0, data.numar) : articole;
  const maiSunt = articole.length > afisate.length;

  return (
    <Section tone={tone} id="articole">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        maxWidthTitlu="12em"
        actiune={
          maiSunt ? (
            /*
              Ancoră simplă, nu `next/link`, ca peste tot în secțiunile site-ului:
              aceleași componente se randează și în previzualizarea din panou,
              printr-un portal într-un iframe. Acolo contextul de rutare e al
              PANOULUI — un `Link` ar încerca să navigheze panoul, nu site-ul, și
              ar preîncărca pagini de care previzualizarea n-are nevoie.
            */
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/blog"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--s-accent)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Toate articolele →
            </a>
          ) : undefined
        }
      />

      <GrilaArticole articole={afisate} friendly={friendly} curat={curat} />
    </Section>
  );
}
