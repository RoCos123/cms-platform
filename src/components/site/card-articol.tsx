import { SectionImage } from "@/components/site/section-image";
import { formateazaDataArticolului, type ArticolListat } from "@/lib/blog";

/**
 * Cartonașul unui articol.
 *
 * Unul singur, folosit și de secțiunea „Articole recente" de pe prima pagină, și
 * de pagina de blog. Două cartonașe scrise separat ar fi început identice și ar
 * fi ajuns diferite — iar cititorul care trece de pe prima pagină pe blog ar fi
 * simțit că a nimerit pe alt site.
 */
export function CardArticol({ articol, friendly }: { articol: ArticolListat; friendly?: boolean }) {
  const data = formateazaDataArticolului(articol.publicatLa);

  return (
    <a
      href={`/blog/${articol.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        borderRadius: "var(--t-raza)",
        border: "1px solid var(--t-chenar)",
        background: "var(--t-suprafata, var(--t-fundal-nuantat))",
        color: "var(--t-text)",
        textDecoration: "none",
        // Cardul prietenos plutește ușor peste fundal, ca la sursă; celelalte
        // șabloane rămân cu cardul plat de dinainte.
        ...(friendly ? { boxShadow: "0 18px 42px -26px rgba(61, 53, 39, 0.45)" } : {}),
      }}
    >
      {articol.coperta && (
        <SectionImage
          src={articol.coperta.url}
          // Coperta e decorativă AICI: titlul de dedesubt e în același link și
          // spune deja despre ce e articolul. Descrierea ei se citește pe pagina
          // articolului, unde imaginea chiar poartă informație.
          alt=""
          aspectRatio="16 / 9"
          sizes="(max-width: 720px) 100vw, 380px"
        />
      )}

      {/*
        Fără copertă, textul se așază pe mijloc. Într-un rând în care unele
        articole au poză și altele nu, cele fără ar fi rămas altfel cu textul
        lipit sus și o gaură dedesubt — cardul arată a stricat, nu a articol
        fără imagine.
      */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: articol.coperta ? undefined : "center",
          gap: "12px",
          flex: 1,
          padding: "28px",
        }}
      >
        {data && (
          <span
            style={{
              // La modelul prietenos data e scrisă normal, mărunt; la rest rămâne
              // în majuscule răsfirate, ca înainte.
              fontSize: "13px",
              letterSpacing: friendly ? "0" : "0.1em",
              textTransform: friendly ? "none" : "uppercase",
              color: "var(--t-text-secundar)",
            }}
          >
            {data}
          </span>
        )}

        <h3 style={{ margin: 0, fontSize: "20px", lineHeight: 1.3, fontWeight: friendly ? 700 : 600, textWrap: "pretty" }}>
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

        <span
          style={{
            // Lipit de jos doar când sus e o copertă care fixează începutul
            // textului; altfel ar anula centrarea de mai sus.
            marginTop: articol.coperta ? "auto" : undefined,
            paddingTop: "8px",
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--t-accent)",
          }}
        >
          {friendly ? "Citește mai departe →" : "Citește →"}
        </span>
      </div>
    </a>
  );
}

/** Grila în care stau cartonașele. Aceeași pe prima pagină și pe blog. */
export function GrilaArticole({ articole, friendly }: { articole: ArticolListat[]; friendly?: boolean }) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "48px 0 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(288px, 100%), 1fr))",
        gap: "20px",
      }}
    >
      {articole.map((articol) => (
        <li key={articol.slug}>
          <CardArticol articol={articol} friendly={friendly} />
        </li>
      ))}
    </ul>
  );
}
