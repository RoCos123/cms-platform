import { notFound } from "next/navigation";
import { getTemplate, templateStyle } from "@/lib/templates";
import { templateFontStyle } from "@/lib/templates/fonturi";
import { RenderSections } from "@/components/site/render-sections";
import { SECTIUNI, SERVICII } from "./continut";

/**
 * Previzualizarea site-ului de vânzări, fără bază de date.
 *
 * DE CE EXISTĂ. Site-ul adevărat are nevoie de trei lucruri pe care nu le pot
 * face eu: o adresă în Vercel, un cont în Supabase și o linie de SQL rulată pe
 * baza reală. Dar întrebarea proprietarului era „vreau să văd cum arată”, iar
 * pentru asta nu-i nevoie de niciunul dintre ele: șabloanele sunt cod, iar
 * secțiunile primesc conținutul ca argument.
 *
 * Deci pagina asta randează ACELEAȘI componente, cu ACELAȘI șablon și aceleași
 * fonturi ca site-ul viu — doar că textul vine de aici, nu din `site_content`.
 * Ce se vede aici e ce se va vedea acolo.
 *
 * NUMAI ÎN DEZVOLTARE. În producție dă 404: e o unealtă de lucru, ca galeria de
 * componente din panou, nu o pagină de arătat cuiva. Iar pe un domeniu de
 * client ar fi de-a dreptul rea — un site de psiholog cu o pagină care vinde
 * altceva.
 */
export const metadata = { title: "Probă — site de vânzări" };


export default function ProbaVanzari() {
  if (process.env.NODE_ENV === "production") notFound();

  const template = getTemplate("claritate");

  return (
    <div
      style={{
        ...templateStyle(template),
        ...templateFontStyle(template),
        background: "var(--t-fundal)",
        color: "var(--t-text)",
        fontFamily: "var(--t-font-principal)",
        minHeight: "100%",
      }}
    >
      <RenderSections
        rows={SECTIUNI}
        context={{
          articole: [],
          servicii: SERVICII,
          paginaServiciiActiva: false,
          oreProgramare: { zile: [], luni: [] },
          asezari: template.asezari,
        }}
      />
    </div>
  );
}
