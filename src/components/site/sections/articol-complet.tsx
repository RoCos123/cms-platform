import type { SectionTone } from "@/lib/templates";
import type { Articol } from "@/lib/blog";
import { formateazaDataArticolului } from "@/lib/blog";
import { minuteDeCitit } from "@/lib/blocuri-text";
import { numara } from "@/lib/numerale";
import { Section } from "@/components/site/section";
import { SectionImage } from "@/components/site/section-image";
import { CorpText } from "@/components/site/corp-text";

/**
 * Un articol, pe pagina lui.
 *
 * O coloană îngustă, nu toată lățimea: un rând de text prea lung obosește
 * fiindcă ochiul pierde începutul rândului următor. ~40em e măsura la care
 * cititul rămâne ușor.
 *
 * Folosit și în previzualizarea din panou, ca ce vede clientul cât scrie să fie
 * exact ce se vede pe site.
 */
export function ArticolComplet({
  articol,
  tone = "deschis",
}: {
  articol: Articol;
  tone?: SectionTone;
}) {
  const data = formateazaDataArticolului(articol.publicatLa);
  // Un articol gol n-are ce timp de citit să anunțe — abia se scrie.
  const durata = articol.continut.trim()
    ? numara(minuteDeCitit(articol.continut), "minut de citit", "minute de citit")
    : null;
  const meta = [data, durata].filter(Boolean).join(" · ");

  return (
    <Section tone={tone}>
      <article style={{ maxWidth: "40em", marginInline: "auto" }}>
        {meta && (
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--s-accent)",
            }}
          >
            {meta}
          </p>
        )}

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
          {articol.titlu}
        </h1>

        {articol.extras && (
          <p
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(18px, 1.9vw, 21px)",
              lineHeight: 1.6,
              color: "var(--s-text-secundar)",
              textWrap: "pretty",
            }}
          >
            {articol.extras}
          </p>
        )}

        {articol.coperta && (
          <div style={{ margin: "clamp(32px, 4vw, 48px) 0 0", borderRadius: "var(--t-raza)", overflow: "hidden" }}>
            <SectionImage
              src={articol.coperta.url}
              alt={articol.coperta.altText}
              aspectRatio="16 / 9"
              sizes="(max-width: 760px) 100vw, 680px"
              // Prima imagine de pe pagină, deci cea după care se măsoară cât de
              // repede se încarcă articolul.
              priority
            />
          </div>
        )}

        <div style={{ marginTop: "clamp(32px, 4vw, 48px)" }}>
          <CorpText text={articol.continut} />
        </div>

        {/*
          Ieșirea din articol. Fără ea, singurul drum înapoi e butonul
          browserului — iar cine a venit din Google n-are unde să se întoarcă și
          pleacă de pe site.
        */}
        <p style={{ margin: "clamp(40px, 5vw, 64px) 0 0" }}>
          {/*
            Ancoră simplă, nu `next/link`, ca peste tot în secțiunile site-ului:
            aceleași componente se randează și în previzualizarea din panou,
            printr-un portal într-un iframe. Acolo contextul de rutare e al
            PANOULUI — un `Link` ar încerca să navigheze panoul, nu site-ul, și
            ar preîncărca pagini de care previzualizarea n-are nevoie.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/blog"
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "var(--s-accent)",
              textDecoration: "none",
            }}
          >
            ← Toate articolele
          </a>
        </p>
      </article>
    </Section>
  );
}
