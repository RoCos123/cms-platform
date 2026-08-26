import type { SectionTone } from "@/lib/templates";
import { Hero, type HeroData } from "./sections/hero";
import { Quote, type QuoteData } from "./sections/quote";
import { Features, type FeaturesData } from "./sections/features";

/** Un rând din `site_content`, așa cum vine din baza de date. */
export type SectionRow = {
  key: string;
  variant: string | null;
  tone: SectionTone;
  data: unknown;
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
const REGISTRU: Record<string, (row: SectionRow) => React.ReactNode> = {
  hero: (row) => <Hero data={row.data as HeroData} tone={row.tone} />,
  quote: (row) => <Quote data={row.data as QuoteData} tone={row.tone} />,
  features: (row) => <Features data={row.data as FeaturesData} tone={row.tone} />,
};

export function sectiuneCunoscuta(key: string): boolean {
  return key in REGISTRU;
}

export function RenderSections({ rows }: { rows: SectionRow[] }) {
  return (
    <>
      {rows.map((row) => {
        const randeaza = REGISTRU[row.key];
        if (!randeaza) return null;
        return <div key={row.key}>{randeaza(row)}</div>;
      })}
    </>
  );
}
