import type { SectionTone } from "@/lib/templates";
import type { LunaCalendar } from "@/lib/calendar";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { ProgramareRapida } from "./programare-rapida";

/** O zi cu orele ei libere, gata scrisă pentru afișare. */
export type ZiCuOreScrise = { zi: string; scris: string; ore: string[] };

/**
 * Zilele libere și aceleași zile aranjate ca un calendar.
 *
 * Tipul stă aici, nu lângă funcția care îl produce: `programari-publice.ts` e
 * `server-only`, iar secțiunea ajunge și în pachetul de client (se randează în
 * previzualizarea din panou). Un `import type` s-ar șterge la compilare, dar
 * direcția asta e cea pe care o are deja `ZiCuOreScrise`.
 */
export type OreDePrimaPagina = { zile: ZiCuOreScrise[]; luni: LunaCalendar[] };

export type ProgramareData = {
  eyebrow?: string;
  titlu?: string;
  titluAccent?: string;
  intro?: string;
  textButon?: string;
};

/**
 * „Programare” — ora se cere direct de pe prima pagină.
 *
 * Prima variantă arăta trei zile cu câteva ore și un buton către
 * `/programare`: două pagini și încă o alegere pentru ceva ce se hotărăște
 * dintr-o privire. Acum e un calendar, iar formularul — numele și telefonul —
 * se deschide dedesubt abia după ce s-a ales o oră.
 *
 * Nu se randează deloc fără ore libere. Asta se întâmplă în trei cazuri —
 * modulul nu e cumpărat, clientul n-a bifat nicio zi, sau chiar s-au ocupat
 * toate — și în toate trei o secțiune goală ar arăta a defect. Comportamentul e
 * același ca la „Articole recente” fără articole.
 */
export function Programare({
  data,
  zile,
  luni,
  tone = "deschis",
}: {
  data: ProgramareData;
  zile: ZiCuOreScrise[];
  luni: LunaCalendar[];
  tone?: SectionTone;
}) {
  if (zile.length === 0) return null;

  return (
    <Section tone={tone} id="programare">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu || "Programează o ședință"}
        titluAccent={data.titluAccent}
        intro={data.intro}
        maxWidthTitlu="11em"
      />

      <div style={{ marginTop: "clamp(32px, 4vw, 48px)", maxWidth: "46em" }}>
        <ProgramareRapida
          zile={zile}
          luni={luni}
          textButon={data.textButon}
          siteKey={process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || null}
          furnizorCaptcha={process.env.NEXT_PUBLIC_CAPTCHA_FURNIZOR || null}
          // Pe fundalul închis, caseta antispam trebuie să fie și ea închisă —
          // altfel e un dreptunghi alb în mijlocul secțiunii.
          temaCaptcha={tone === "inchis" ? "dark" : "light"}
        />
      </div>
    </Section>
  );
}
