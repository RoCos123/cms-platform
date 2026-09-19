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
export function CardArticol({
  articol,
  friendly,
  curat,
}: {
  articol: ArticolListat;
  friendly?: boolean;
  /**
   * Cardul fără fundal și fără chenar — doar imaginea rotunjită și textul
   * dedesubt, pe fundalul paginii, ca la referința „Liniște". Doar „Liniște".
   */
  curat?: boolean;
}) {
  const data = formateazaDataArticolului(articol.publicatLa);

  return (
    <a
      href={`/blog/${articol.slug}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        color: "var(--t-text)",
        textDecoration: "none",
        // La „Liniște" (`curat`) cardul n-are fundal, chenar ori tăietură: doar
        // imaginea rotunjită și textul pe fundalul paginii, ca la referință.
        ...(curat
          ? {}
          : {
              overflow: "hidden",
              borderRadius: "var(--t-raza)",
              border: "1px solid var(--t-chenar)",
              background: "var(--t-suprafata, var(--t-fundal-nuantat))",
              // Cardul prietenos plutește ușor peste fundal, ca la sursă; celelalte
              // șabloane rămân cu cardul plat de dinainte.
              ...(friendly ? { boxShadow: "0 18px 42px -26px rgba(61, 53, 39, 0.45)" } : {}),
            }),
      }}
    >
      {articol.coperta && (
        // La „curat" imaginea își poartă singură rotunjirea (cardul n-o mai taie).
        <div
          style={
            curat
              ? { borderRadius: "var(--t-raza)", overflow: "hidden", marginBottom: "22px" }
              : undefined
          }
        >
          <SectionImage
            src={articol.coperta.url}
            // Coperta e decorativă AICI: titlul de dedesubt e în același link și
            // spune deja despre ce e articolul. Descrierea ei se citește pe pagina
            // articolului, unde imaginea chiar poartă informație.
            alt=""
            // Punctul focal ales la tragere — corectat 19 sept. 2026, vezi
            // comentariul de pe `coperta` din blog.ts.
            pozitie={articol.coperta.pozitie}
            // La „curat" imaginea e ceva mai înaltă (4/3), ca la referință.
            aspectRatio={curat ? "4 / 3" : "16 / 9"}
            sizes="(max-width: 720px) 100vw, 380px"
          />
        </div>
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
          padding: curat ? 0 : "28px",
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

        {/*
          La „curat" (Liniște), titlul ia fontul de afișaj al șablonului
          (serif), ca titlul secțiunii de deasupra — corectat 19 sept. 2026,
          găsit prin comparație directă: fără `fontFamily`, cade pe sans-serif-ul
          principal, un caracter tipografic complet diferit de restul paginii.
        */}
        <h3
          style={{
            margin: 0,
            fontSize: "20px",
            lineHeight: 1.3,
            fontFamily: curat ? "var(--t-font-titlu)" : undefined,
            fontWeight: curat ? ("var(--t-greutate-titlu)" as unknown as number) : friendly ? 700 : 600,
            textWrap: "pretty",
          }}
        >
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

        {/*
          La „Liniște" (`curat`) nu apare niciun „Citește →": întreg cardul e
          link, iar referința se bazează doar pe titlu și imagine, fără rând de
          îndemn. La restul rămâne, ca înainte.
        */}
        {!curat && (
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
        )}
      </div>
    </a>
  );
}

/** Grila în care stau cartonașele. Aceeași pe prima pagină și pe blog. */
export function GrilaArticole({
  articole,
  friendly,
  curat,
}: {
  articole: ArticolListat[];
  friendly?: boolean;
  curat?: boolean;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "48px 0 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(288px, 100%), 1fr))",
        // Fără card, rândul cere puțin mai mult aer între coloane.
        gap: curat ? "40px 28px" : "20px",
      }}
    >
      {articole.map((articol) => (
        <li key={articol.slug}>
          <CardArticol articol={articol} friendly={friendly} curat={curat} />
        </li>
      ))}
    </ul>
  );
}
