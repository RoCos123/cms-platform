import type { Metadata } from "next";
import { getTenant } from "@/lib/dal";
import { identitateaSiteului } from "@/lib/site-public";
import { linkurileSociale, paginaEsteActiva } from "@/lib/setari";
import { moduleleSiteului } from "@/lib/module";
import { getTemplate } from "@/lib/templates";
import { oreDeAratatPePrimaPagina } from "@/lib/programari-publice";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { articolePublicate } from "@/lib/blog-public";
import { tenantTable } from "@/lib/supabase/admin";
import { adresaSiteului } from "@/lib/seo";
import {
  caJsonLd,
  dateleCabinetului,
  dateleIntrebarilor,
  datelePsihologului,
  type Intrebare,
} from "@/lib/date-structurate";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import { rescrieAdresele } from "@/lib/imagini";
import { adresaImaginii } from "@/lib/imagini-adrese";
import { CadruSite } from "@/components/site/cadru-site";
import { DateStructurate } from "@/components/site/date-structurate";

export async function generateMetadata(): Promise<Metadata> {
  const { siteId, domain } = await getTenant();
  const { site, seo, brand } = await identitateaSiteului(siteId);

  const nume = site?.name ?? domain;
  const titlu = seo.titlu || nume;
  const descriere = seo.descriere || brand.descriereSubsol;

  return {
    title: titlu,
    description: descriere,
    /**
     * Adresa canonică e domeniul propriu al clientului, nu gazda de pe care s-a
     * servit cererea. Site-ul e accesibil și de pe adrese de preview; fără linia
     * asta, Google le-ar putea indexa ca pagini separate, iar cabinetul ar
     * concura cu sine însuși în rezultate.
     *
     * Scrisă relativ: domeniul vine din `metadataBase`, pus o singură dată în
     * layoutul rădăcină.
     */
    alternates: { canonical: "/" },
    openGraph: {
      title: titlu,
      description: descriere,
      url: "/",
      siteName: nume,
      locale: "ro_RO",
      type: "website",
    },
  };
}

export default async function PublicHomePage() {
  const { siteId, domain } = await getTenant();

  const [{ site, pagini, brand, seo, social }, { data: rows }, articole, servicii] =
    await Promise.all([
    identitateaSiteului(siteId),
    (await tenantTable("site_content"))
      .select("id, key, variant, tone, data, visible, position")
      .eq("visible", true)
      .order("position", { ascending: true }),
    // Articolele și serviciile se citesc o dată aici, nu în componente:
    // „Articole recente” și „Serviciile mele” își iau conținutul din altă parte,
    // dar o componentă care își face singură interogarea n-ar putea fi
    // previzualizată în panou.
    //
    // Toate articolele, nu primele trei: secțiunea are un câmp „câte se văd”,
    // iar o limită fixă aici l-ar fi făcut să nu însemne nimic peste 3. Forma
    // listată nu poartă textul articolelor, deci nu costă.
    articolePublicate(siteId),
    serviciiPublicate(siteId),
  ]);

  // Dublul cast e necesar cât timp nu generăm tipurile bazei de date: `tenantTable`
  // primește numele tabelului ca `string`, deci supabase-js nu poate deduce forma
  // rândului și cade pe un tip de eroare. De înlocuit cu tipuri generate
  // (`supabase gen types`) când schema se stabilizează.
  /*
   * Adresele imaginilor se derivă din `uploadId`, nu se iau din JSON. Cele
   * scrise acolo sunt de pe vremea depozitului public și nu mai duc nicăieri —
   * iar o adresă absolută rămasă în conținut nu trebuie să mai poată fi randată
   * deloc. Vezi `rescrieAdresele` în src/lib/imagini.ts.
   */
  const sections = ((rows ?? []) as unknown as SectionRow[]).map((rand) => ({
    ...rand,
    data: rescrieAdresele(rand.data, adresaImaginii),
  }));

  /**
   * Întrebările pentru `FAQPage` se iau din secțiunea de pe pagină, nu din tot
   * ce e scris în panou: regula lui Google e că datele structurate descriu ce
   * CHIAR se vede. Rândurile de aici sunt deja filtrate pe `visible`.
   *
   * `flatMap` peste toate rândurile cu cheia `faq`, nu `find`: cheia unei
   * secțiuni nu e unică (vezi `SectionRow`), iar un al doilea bloc de întrebări
   * ar rămâne altfel nedeclarat.
   */
  const intrebari = sections
    .filter((rand) => rand.key === "faq")
    .flatMap((rand) => (rand.data as { intrebari?: Intrebare[] } | null)?.intrebari ?? []);

  /**
   * Aceleași date, citite o dată, pentru amândouă fișele: cabinetul e o firmă,
   * psihologul e un om, iar ele se leagă între ele. Ce ține de om — meseria,
   * acreditarea — ajunge pe fișa lui abia când Setările îi știu numele.
   */
  const cabinet = {
    nume: site?.name ?? domain,
    numePersoana: brand.numeleTau,
    subtitlu: brand.subtitlu,
    telefon: brand.telefon,
    email: brand.email,
    adresa: brand.adresa,
    acreditare: brand.acreditare,
    descriere: seo.descriere || brand.descriereSubsol,
    profiluri: linkurileSociale(social).map((retea) => retea.adresa),
  };

  const baza = await adresaSiteului();

  const dateStructurate = caJsonLd([
    dateleCabinetului(baza, cabinet),
    datelePsihologului(baza, cabinet),
    dateleIntrebarilor(intrebari),
  ]);

  return (
    <CadruSite linkEditare="/dashboard/sectiuni">
      <DateStructurate date={dateStructurate} />
      {sections.length > 0 ? (
        <RenderSections
          rows={sections}
          context={{
            // Blogul oprit înseamnă blog inexistent: și pagina, și articolele, și
            // secțiunea de aici. De asta lista se golește, nu se marchează cumva —
            // secțiunea se stinge apoi singură, fără să știe de comutator.
            articole: paginaEsteActiva(pagini, "blog") ? articole : [],
            servicii,
            paginaServiciiActiva: paginaEsteActiva(pagini, "servicii"),
            // Goală când modulul e oprit sau nu sunt ore: secțiunea se stinge
            // atunci singură, fără să știe de comutator.
            oreProgramare: await oreDeAratatPePrimaPagina(
              siteId,
              moduleleSiteului(site).programari,
            ),
            // Așezările vin din șablon. Necunoscut sau lipsă → cel implicit,
            // ca peste tot: o pagină publică trebuie să se randeze mereu.
            asezari: getTemplate(site?.template as string | null).asezari,
          }}
        />
      ) : (
        // Un site fără nicio secțiune nu trebuie să fie o pagină albă: clientul
        // tocmai a fost provizionat și încă nu a scris nimic.
        <div style={{ padding: "120px 24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "18px", color: "var(--t-text-secundar)" }}>
            {site?.name ?? domain} — site în pregătire.
          </p>
        </div>
      )}
    </CadruSite>
  );
}
