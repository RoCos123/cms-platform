import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SiteHeaderData } from "@/components/site/header";
import type { SiteFooterData } from "@/components/site/footer";
import type { SectionContext, SectionRow } from "@/components/site/render-sections";
import { articolePublicate } from "@/lib/blog-public";
import { esteDespreVizibila, linkPachete } from "@/lib/antet";
import { rescrieAdresele, rescrieAdreseleFisiere } from "@/lib/imagini";
import { adresaFisierului, adresaImaginii } from "@/lib/imagini-adrese";
import { moduleleSiteului } from "@/lib/module";
import { dateleFirmei, numeleModelelor } from "@/lib/pagina-vanzare";
import { tipulSiteului } from "@/lib/pagina-vanzare-date";
import { linkurilePaginilor } from "@/lib/pagini-publice";
import { oreDeAratatPePrimaPagina, seePotFaceProgramari } from "@/lib/programari-publice";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { cheileSectiunilorVizibile, dateleSectiuniiPachete } from "@/lib/sectiuni-vizibile";
import { linkurileSociale, paginaEsteActiva } from "@/lib/setari";
import { identitateaSiteului } from "@/lib/site-public";
import { coloaneleSubsolului } from "@/lib/subsol";

/**
 * Site-ul adevărat al clientului, ca previzualizare pentru ecranul „Aspect".
 *
 * De ce: culorile se judecă pe ce ai tu pe site — pozele tale, textele tale, serviciile tale —
 * nu pe o pagină de exemplu (proprietarul, 18 oct. 2026: „de ce nu am imaginea din modelul
 * Claritate, pe care am creat-o?"). Se citesc ACELEAȘI lucruri ca pe prima pagină publică
 * (`src/app/page.tsx` și `cadru-site.tsx`), prin aceleași funcții: secțiunile vizibile în ordinea
 * lor, adresele pozelor rescrise din `uploadId`, articolele, serviciile, orele de programare.
 *
 * Întoarce `null` când site-ul n-are nicio secțiune vizibilă (un site abia provizionat): atunci
 * ecranul păstrează pagina de exemplu, ca previzualizarea să nu fie goală.
 *
 * Nu e o copie a cadrului public — ce știe antetul și subsolul se cere cu aceleași funcții, dar
 * linkurile sunt doar de privit (previzualizarea nu navighează nicăieri). De ținut în minte: dacă
 * antetul sau subsolul public capătă un câmp nou, previzualizarea nu-l are decât după ce-l primește și aici.
 *
 * `siteId` vine MEREU din sesiune (`verifySession`), niciodată din cerere.
 */
export type PrevizualizareSite = {
  header: SiteHeaderData;
  footer: SiteFooterData;
  randuri: SectionRow[];
  /** Tot contextul secțiunilor, în afară de `asezari`, care vin din șablonul cu culorile alese. */
  context: Omit<SectionContext, "asezari">;
};

export async function previzualizareaSiteului(
  supabase: SupabaseClient,
  siteId: string,
  domeniu: string,
): Promise<PrevizualizareSite | null> {
  const [{ data: rows }, { site, brand, pagini, social }, articole, servicii, linkuriPagini, cheiVizibile, datePachete, tip] =
    await Promise.all([
      // Cu clientul din panou (RLS), ca la editorul de secțiuni; `site_id` explicit peste RLS.
      supabase
        .from("site_content")
        .select("id, key, variant, tone, data")
        .eq("site_id", siteId)
        .eq("visible", true)
        .order("position", { ascending: true }),
      identitateaSiteului(siteId),
      articolePublicate(siteId),
      serviciiPublicate(siteId),
      linkurilePaginilor(siteId),
      cheileSectiunilorVizibile(siteId),
      dateleSectiuniiPachete(siteId),
      tipulSiteului(siteId),
    ]);

  if (!rows || rows.length === 0) return null;

  // Aceeași rescriere ca pe site (`src/app/page.tsx`): pozele și materialele pe adresa de ACUM.
  const randuri = (rows as unknown as SectionRow[]).map((rand) => ({
    ...rand,
    data: rescrieAdreseleFisiere(rescrieAdresele(rand.data, adresaImaginii), adresaFisierului),
  }));

  const nume = site?.name ?? domeniu;
  const areBlog = paginaEsteActiva(pagini, "blog") && articole.length > 0;
  const paginaServiciiActiva = paginaEsteActiva(pagini, "servicii");
  const linkPreturi = linkPachete(datePachete);

  const catreLink = (pagina: (typeof linkuriPagini)[number]) => ({ text: pagina.titlu, href: `/${pagina.slug}` });
  const inAntet = linkuriPagini.filter((pagina) => pagina.loc === "header").map(catreLink);
  if (await seePotFaceProgramari(siteId, moduleleSiteului(site).programari)) {
    inAntet.push({ text: "Programare", href: "/programare" });
  }
  const inSubsol = linkuriPagini.filter((pagina) => pagina.loc === "footer").map(catreLink);

  const logo = brand.logo?.uploadId
    ? { url: adresaImaginii(brand.logo.uploadId), altText: brand.logo.altText }
    : undefined;
  const { servicii: coloanaServicii, cabinet: coloanaCabinet } = await coloaneleSubsolului(siteId, {
    paginaServiciiActiva,
    areBlog,
  });

  return {
    header: {
      nume,
      subtitlu: brand.subtitlu,
      logo,
      telefon: brand.telefon,
      areDespre: esteDespreVizibila(cheiVizibile),
      linkuriSectiuni: linkPreturi ? [linkPreturi] : [],
      paginaServicii: paginaServiciiActiva,
      blog: areBlog ? "pagina" : null,
      paginiProprii: inAntet,
    },
    footer: {
      nume,
      logo,
      subtitlu: brand.subtitlu,
      descriere: brand.descriereSubsol,
      telefon: brand.telefon,
      email: brand.email,
      adresa: brand.adresa,
      acreditare: brand.acreditare,
      copyright: brand.copyright,
      servicii: coloanaServicii,
      cabinet: coloanaCabinet,
      legal: inSubsol.map((link) => ({ eticheta: link.text, href: link.href })),
      retele: linkurileSociale(social),
    },
    randuri,
    context: {
      // Ca pe site: blogul oprit înseamnă blog inexistent, deci și secțiunea se stinge.
      articole: areBlog ? articole : [],
      servicii,
      paginaServiciiActiva,
      oreProgramare: await oreDeAratatPePrimaPagina(siteId, moduleleSiteului(site).programari),
      paginaVanzare:
        tip === "vanzare" ? { modele: numeleModelelor(randuri), firma: dateleFirmei(brand) } : null,
    },
  };
}
