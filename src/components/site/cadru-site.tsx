import type { ReactNode } from "react";
import { getSesiuneOptionala, getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { articolePublicate } from "@/lib/blog-public";
import { linkurilePaginilor } from "@/lib/pagini-publice";
import { linkurileSociale, paginaEsteActiva } from "@/lib/setari";
import { getTemplate, templateFontsHref, templateStyle } from "@/lib/templates";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AdminBar } from "@/components/site/admin-bar";

/**
 * Cadrul oricărei pagini publice: fonturile șablonului, antetul, subsolul și
 * bara de administrare.
 *
 * Scris o dată. Copiat în fiecare pagină, ar fi însemnat că un link nou în
 * meniu se adaugă în patru locuri — iar al patrulea se uită. Exact așa a apărut
 * și problema pe care am reparat-o la pagina de servicii: meniul de acolo
 * rămăsese în urma celui de pe prima pagină.
 *
 * Toate citirile de aici sunt memorate pe cerere (`cache()`), deci pagina care
 * are ea însăși nevoie de identitatea site-ului sau de articole le cere fără
 * nicio interogare în plus.
 */
export async function CadruSite({
  linkEditare,
  children,
}: {
  /** Ecranul din panou care editează pagina asta — pentru bara de administrare. */
  linkEditare: string;
  children: ReactNode;
}) {
  const { siteId, domain } = await getTenant();

  const [{ site, brand, pagini, social }, articole, linkuriPagini, sesiune] = await Promise.all([
    identitateaSiteului(siteId),
    articolePublicate(siteId),
    linkurilePaginilor(siteId),
    // Pentru un vizitator obișnuit se rezolvă instantaneu cu `null`, fără nicio
    // cerere: fără cookie de sesiune n-are ce verifica.
    getSesiuneOptionala(),
  ]);

  const template = getTemplate(site?.template);
  const nume = site?.name ?? domain;

  // Blogul oprit stinge tot blogul, deci și intrarea din meniu. Iar fără niciun
  // articol publicat, „Blog" ar duce la o pagină pe care scrie doar că articolele
  // vin în curând — mai bine nu-l punem încă.
  const areBlog = paginaEsteActiva(pagini, "blog") && articole.length > 0;

  // Aceeași listă, împărțită după unde a cerut clientul să apară fiecare pagină.
  const catreLink = (pagina: (typeof linkuriPagini)[number]) => ({
    text: pagina.titlu,
    href: `/${pagina.slug}`,
  });
  const inAntet = linkuriPagini.filter((pagina) => pagina.loc === "header").map(catreLink);
  const inSubsol = linkuriPagini.filter((pagina) => pagina.loc === "footer").map(catreLink);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={templateFontsHref(template)} />

      <div
        style={{
          ...templateStyle(template),
          background: "var(--t-fundal)",
          color: "var(--t-text)",
          fontFamily: "var(--t-font-principal)",
          minHeight: "100%",
        }}
      >
        <SiteHeader
          data={{
            nume,
            subtitlu: brand.subtitlu,
            telefon: brand.telefon,
            paginaServicii: paginaEsteActiva(pagini, "servicii"),
            blog: areBlog ? "pagina" : null,
            paginiProprii: inAntet,
          }}
        />

        <main>{children}</main>

        <SiteFooter
          data={{
            nume,
            descriere: brand.descriereSubsol,
            telefon: brand.telefon,
            email: brand.email,
            adresa: brand.adresa,
            acreditare: brand.acreditare,
            linkuri: inSubsol,
            retele: linkurileSociale(social),
          }}
        />

        {sesiune && <AdminBar email={sesiune.email} linkEditare={linkEditare} />}
      </div>
    </>
  );
}
