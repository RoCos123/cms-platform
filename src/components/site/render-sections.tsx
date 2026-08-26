import type { ReactNode } from "react";
import type { SectionTone } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";
import { Hero, type HeroData } from "./sections/hero";
import { Quote, type QuoteData } from "./sections/quote";
import { Features, type FeaturesData } from "./sections/features";
import { AboutTeaser, type AboutTeaserData } from "./sections/about-teaser";
import { HowItWorks, type HowItWorksData } from "./sections/how-it-works";
import { Testimonials, type TestimonialsData } from "./sections/testimonials";
import { Faq, type FaqData } from "./sections/faq";
import { LatestPosts, type LatestPostsData, type Articol } from "./sections/latest-posts";
import { Logos, type LogosData } from "./sections/logos";
import { Portfolio, type PortfolioData } from "./sections/portfolio";
import { Contact, type ContactData } from "./sections/contact";
import { Newsletter, type NewsletterData } from "./sections/newsletter";

/** Un rând din `site_content`, așa cum vine din baza de date. */
export type SectionRow = {
  /**
   * Identitatea rândului. Cheia secțiunii NU e unică: aceeași secțiune poate
   * apărea de mai multe ori pe pagină (banda cu citat, în două șabloane).
   */
  id: string;
  key: string;
  variant: string | null;
  tone: SectionTone;
  data: unknown;
};

/**
 * Date care nu aparțin niciunei secțiuni anume, dar de care unele au nevoie.
 * `latestPosts` e singura de acest fel deocamdată: își ia conținutul din blog,
 * nu din propriul rând.
 */
export type SectionContext = {
  /**
   * Articolele publicate. Goală când blogul e oprit din panou: acolo comutatorul
   * stinge tot blogul — pagina, articolele și secțiunea de aici. Spre deosebire
   * de un serviciu, care se citește întreg pe cartonaș, un cartonaș de articol
   * fără pagina lui n-ar avea unde duce.
   */
  articole: Articol[];
  /** Serviciile publicate. „Serviciile mele" le citește de aici, nu din rândul ei. */
  servicii: Serviciu[];
  /** E pornită pagina cu serviciile descrise pe larg? Decide dacă mai sunt linkuri. */
  paginaServiciiActiva: boolean;
};

/**
 * Registrul cheie → componentă. Cheile sunt cele 21 din
 * design/sabloane/README.md; aici sunt înregistrate doar cele construite.
 *
 * O cheie necunoscută nu e o eroare: baza de date poate conține secțiuni pe care
 * codul nu le știe încă (sau nu le mai știe). Se sare peste ele în tăcere pe
 * site-ul public — un vizitator nu trebuie să vadă niciodată o eroare fiindcă
 * panoul a mers înaintea codului.
 */
const REGISTRU: Record<string, (row: SectionRow, ctx: SectionContext) => ReactNode> = {
  hero: (row) => <Hero data={row.data as HeroData} tone={row.tone} />,
  quote: (row) => <Quote data={row.data as QuoteData} tone={row.tone} />,
  features: (row, ctx) => (
    <Features
      data={row.data as FeaturesData}
      servicii={ctx.servicii}
      paginaDetaliata={ctx.paginaServiciiActiva}
      tone={row.tone}
    />
  ),
  aboutTeaser: (row) => <AboutTeaser data={row.data as AboutTeaserData} tone={row.tone} />,
  howItWorks: (row) => <HowItWorks data={row.data as HowItWorksData} tone={row.tone} />,
  testimonials: (row) => <Testimonials data={row.data as TestimonialsData} tone={row.tone} />,
  faq: (row) => <Faq data={row.data as FaqData} tone={row.tone} />,
  latestPosts: (row, ctx) => (
    <LatestPosts data={row.data as LatestPostsData} articole={ctx.articole} tone={row.tone} />
  ),
  logos: (row) => <Logos data={row.data as LogosData} tone={row.tone} />,
  portfolio: (row) => <Portfolio data={row.data as PortfolioData} tone={row.tone} />,
  contact: (row) => <Contact data={row.data as ContactData} tone={row.tone} />,
  newsletter: (row) => <Newsletter data={row.data as NewsletterData} tone={row.tone} />,
};

export function sectiuneCunoscuta(key: string): boolean {
  return key in REGISTRU;
}

export function RenderSections({
  rows,
  context,
}: {
  rows: SectionRow[];
  context: SectionContext;
}) {
  return (
    <>
      {rows.map((row) => {
        const randeaza = REGISTRU[row.key];
        if (!randeaza) return null;
        return <div key={row.id}>{randeaza(row, context)}</div>;
      })}
    </>
  );
}
