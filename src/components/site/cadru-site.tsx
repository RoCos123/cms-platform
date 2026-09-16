import type { ReactNode } from "react";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { articolePublicate } from "@/lib/blog-public";
import { linkurilePaginilor } from "@/lib/pagini-publice";
import { linkurileSociale, paginaEsteActiva } from "@/lib/setari";
import { moduleleSiteului } from "@/lib/module";
import { seePotFaceProgramari } from "@/lib/programari-publice";
import { getTemplate, templateStyle } from "@/lib/templates";
import { templateFontStyle } from "@/lib/templates/fonturi";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { coloaneleSubsolului } from "@/lib/subsol";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { BaraAdmin } from "@/components/site/bara-admin";
import { NumaratorVizite } from "@/components/site/numarator-vizite";

/**
 * Cadrul oricărei pagini publice: fonturile șablonului, antetul, subsolul și,
 * ca frunze proprii dependente de vizitator, bara de administrare și numărarea
 * vizitelor (`BaraAdmin`, `NumaratorVizite`).
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

  // Doar citiri funcție de `siteId` — nimic dependent de vizitator. Sesiunea (bara
  // de administrare) și numărarea vizitelor stau în frunze proprii, `BaraAdmin` și
  // `NumaratorVizite`, ca acest cadru să poată fi memorat între cereri fără riscul
  // de a servi bara unui proprietar altui vizitator. (Pasul 1 din cache-ul pe tenant.)
  const [{ site, brand, pagini, social }, articole, linkuriPagini] = await Promise.all([
    identitateaSiteului(siteId),
    articolePublicate(siteId),
    linkurilePaginilor(siteId),
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

  /*
   * „Programare" intră în meniu doar dacă modulul e cumpărat ȘI clientul a
   * bifat măcar o zi. A doua condiție contează la fel de mult: un link către o
   * pagină fără nicio oră liberă e mai rău decât niciun link.
   *
   * Se pune la capătul meniului, nu la început: e o acțiune, iar acțiunea vine
   * după ce omul a citit despre cine ești.
   */
  if (await seePotFaceProgramari(siteId, moduleleSiteului(site).programari)) {
    inAntet.push({ text: "Programare", href: "/programare" });
  }
  const inSubsol = linkuriPagini.filter((pagina) => pagina.loc === "footer").map(catreLink);

  // Logoul semnat din id (adresa poate expira), folosit și în antet, și în
  // subsol. Plus coloanele de servicii și cabinet ale subsolului, umplute din ce
  // e publicat — vezi `coloaneleSubsolului`.
  const logoSemnat = brand.logo?.uploadId
    ? { url: adresaImaginii(brand.logo.uploadId), altText: brand.logo.altText }
    : undefined;
  const { servicii: coloanaServicii, cabinet: coloanaCabinet } = await coloaneleSubsolului(siteId, {
    paginaServiciiActiva: paginaEsteActiva(pagini, "servicii"),
    areBlog,
  });

  return (
    <>
      <div
        style={{
          ...templateStyle(template),
          ...templateFontStyle(template),
          background: "var(--t-fundal)",
          color: "var(--t-text)",
          fontFamily: "var(--t-font-principal)",
          minHeight: "100%",
          // Un șir lung fără spații (un „hhhhh…" scris în panou, un link, un
          // email) n-are unde să se rupă, așa că ar ieși din chenar în loc să
          // coboare pe rândul următor. `overflow-wrap` se moștenește, deci pus
          // aici, pe rădăcina site-ului public, apără TOT textul din toate
          // secțiunile, nu doar unul. `break-word` rupe doar cuvintele care
          // altfel ar depăși rândul — textul normal se comportă neschimbat.
          overflowWrap: "break-word",
        }}
      >
        <SiteHeader
          data={{
            nume,
            subtitlu: brand.subtitlu,
            logo: logoSemnat,
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
            logo: logoSemnat,
            subtitlu: brand.subtitlu,
            descriere: brand.descriereSubsol,
            telefon: brand.telefon,
            email: brand.email,
            adresa: brand.adresa,
            acreditare: brand.acreditare,
            servicii: coloanaServicii,
            cabinet: coloanaCabinet,
            legal: inSubsol.map((link) => ({ eticheta: link.text, href: link.href })),
            retele: linkurileSociale(social),
          }}
        />

        {/*
          Cele două frunze dependente de vizitator, surori ale conținutului de mai
          sus (care ține doar de `siteId`): bara de administrare + bula (`BaraAdmin`)
          și numărarea vizitei (`NumaratorVizite`, invizibilă). Vezi comentariul de
          la Promise.all.
        */}
        <BaraAdmin numar={brand.whatsapp} linkEditare={linkEditare} />

        <NumaratorVizite siteId={siteId} />
      </div>
    </>
  );
}
