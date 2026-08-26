import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";

export type LatestPostsData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  /** Câte articole se afișează. Restul se văd pe pagina de blog. */
  numar?: number;
  linkToateArticolele?: { text: string; href: string };
};

export type Articol = {
  slug: string;
  titlu: string;
  extras: string;
  publishedAt: string | null;
  categorie?: string | null;
};

/**
 * „Articole recente" — secțiunea care apărea în TOATE patru șabloanele analizate
 * și lipsea din cele 17 definite în Faza 0.
 *
 * Se deosebește de restul: nu-și ține conținutul în `site_content`, ci îl citește
 * din `blog_articles`. Secțiunea reține doar CUM se afișează (titlu, câte), nu CE
 * — altfel articolele ar exista în două locuri și s-ar desincroniza, exact
 * problema semnalată în auditul original.
 */
export function LatestPosts({
  data,
  articole,
  tone,
}: {
  data: LatestPostsData;
  articole: Articol[];
  tone?: SectionTone;
}) {
  // Fără articole publicate, secțiunea nu se randează deloc: un titlu
  // „Articole recente" urmat de nimic arată a site stricat, nu a site nou.
  if (articole.length === 0) return null;

  return (
    <Section tone={tone} id="articole">
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
          {data.eyebrow && <SectionEyebrow>{data.eyebrow}</SectionEyebrow>}
          <h2
            style={{
              margin: 0,
              maxWidth: "12em",
              fontSize: "clamp(32px, 4.4vw, 54px)",
              lineHeight: 1.08,
              letterSpacing: "-0.025em",
              fontWeight: 700,
              textWrap: "balance",
            }}
          >
            {data.titlu}
            {data.titluAccent && (
              <>
                {" "}
                <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "italic", fontWeight: 300 }}>
                  {data.titluAccent}
                </span>
              </>
            )}
          </h2>
        </div>

        {data.linkToateArticolele && (
          <a
            href={data.linkToateArticolele.href}
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--t-accent)",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {data.linkToateArticolele.text} →
          </a>
        )}
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: "48px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(288px, 1fr))",
          gap: "20px",
        }}
      >
        {articole.map((articol) => (
          <li key={articol.slug}>
            <a
              href={`/blog/${articol.slug}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                height: "100%",
                padding: "28px",
                borderRadius: "var(--t-raza)",
                border: "1px solid var(--t-chenar)",
                background: "var(--t-fundal-nuantat)",
                color: "var(--t-text)",
                textDecoration: "none",
              }}
            >
              {(articol.categorie || articol.publishedAt) && (
                <span
                  style={{
                    fontSize: "12px",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--t-text-secundar)",
                  }}
                >
                  {[articol.categorie, formateazaData(articol.publishedAt)].filter(Boolean).join(" · ")}
                </span>
              )}
              <h3 style={{ margin: 0, fontSize: "20px", lineHeight: 1.3, fontWeight: 600, textWrap: "pretty" }}>
                {articol.titlu}
              </h3>
              {articol.extras && (
                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    lineHeight: 1.65,
                    color: "var(--t-text-secundar)",
                    textWrap: "pretty",
                  }}
                >
                  {articol.extras}
                </p>
              )}
              <span style={{ marginTop: "auto", paddingTop: "8px", fontSize: "15px", fontWeight: 600, color: "var(--t-accent)" }}>
                Citește →
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const FORMAT_DATA = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric" });

function formateazaData(iso: string | null): string | null {
  if (!iso) return null;
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : FORMAT_DATA.format(data);
}
