import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { headers } from "next/headers";
import { adresaSiteuluiOptionala } from "@/lib/seo";
import { BandaNepublicat } from "@/components/site/banda-nepublicat";
import { estePanou, esteConectare } from "@/lib/rute";
import "./globals.css";

// `preload: false`: Geist sunt fonturile PANOULUI, dar layoutul ăsta înfășoară și
// site-urile publice ale clienților, unde textul e scris cu fontul ȘABLONULUI
// (`--t-font-*`), nu cu Geist. Cu preload pornit, fiecare pagină publică
// preîncărca două fișiere Geist pe care nu le folosea. Rămân auto-găzduite; în
// panou se încarcă leneș, cu fontul de sistem până sosesc — un panou intern n-are
// nevoie de preîncărcare.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
});

/**
 * Doar plasa de siguranță, pentru rutele care nu-și pun titlu propriu.
 *
 * Fără `template`, deliberat: layoutul ăsta înfășoară și panoul, și site-urile
 * publice ale clienților. Un tipar de forma „%s · sitepsihologi.ro” ar fi lipit
 * numele platformei noastre la titlul din Google al fiecărui cabinet.
 *
 * A devenit `generateMetadata` ca să poată citi domeniul clientului din cererea
 * curentă — un obiect constant n-are de unde să-l știe.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    /**
     * Adresa față de care se rezolvă tot ce e relativ în metadate: adresa
     * canonică, linkurile și imaginile din cardurile sociale.
     *
     * Fără ea, Next le rezolvă față de `localhost:3000`. Nu e o ipoteză —
     * originalul chiar a plecat așa în producție, iar fiecare partajare pe
     * Facebook sau WhatsApp arăta un card rupt, cu o imagine care nu se putea
     * încărca de nicăieri (audit-site-public.md).
     *
     * Fiindcă stă aici, în layoutul rădăcină, fiecare pagină de mai jos își
     * scrie adresa canonică relativ („/servicii”) și n-o mai lipește de mână din
     * domeniu. Domeniul rămâne într-un singur loc: ăsta.
     *
     * `null` doar pe `/site-unavailable`, singura pagină servită tocmai fiindcă
     * n-a putut fi rezolvat niciun client. Ea nu declară nicio adresă, deci n-are
     * ce rămâne nerezolvat.
     */
    metadataBase: await adresaSiteuluiOptionala(),
    /**
     * Un site nepublicat nu intră în niciun motor de căutare.
     *
     * Aici, în layoutul rădăcină, nu pe fiecare pagină: dacă ar fi de pus în
     * fiecare, s-ar uita la a treia. Steagul vine din antetul pus de proxy pe
     * baza lui `sites.published_at` — vezi migrarea `comutator_lansare`.
     *
     * Merge la pachet cu `robots.txt` și `sitemap.xml`, care refuză și ele.
     * CONVENȚIA proiectului: cele trei locuri se schimbă mereu împreună.
     */
    ...((await nepublicat()) ? { robots: { index: false, follow: false } } : {}),
    title: "sitepsihologi.ro",
    description: "Platformă CMS multi-tenant pentru site-uri de prezentare profesională.",
  };
}

/** Site-ul cerut e încă nepublicat? Antetul e pus de proxy, nu de cerere. */
async function nepublicat(): Promise<boolean> {
  return (await headers()).get("x-nepublicat") === "1";
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  /*
   * Banda se arată doar pe site-ul public, nu și în panou: în panou clientul are
   * oricum butonul de publicare în fața ochilor, iar o bandă peste fiecare ecran
   * ar fi zgomot. `x-cale` e pus tot de proxy.
   */
  const cale = (await headers()).get("x-cale") ?? "";
  const aratBanda = (await nepublicat()) && !estePanou(cale) && !esteConectare(cale);

  return (
    <html
      lang="ro"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {aratBanda && <BandaNepublicat />}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
