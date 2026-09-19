import type { SectionTone } from "@/lib/templates";
import { Section, SectionEyebrow } from "@/components/site/section";
import { NewsletterForm } from "./newsletter-form";

export type NewsletterData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  textButon?: string;
  placeholder?: string;
  /** Nota de sub formular: cât de des scrii și cum se dezabonează cineva. */
  notaLegala?: string;
  mesajSucces?: string;
};

const NOTA_IMPLICITA =
  "Fără spam. Te poți dezabona oricând, dintr-un singur clic, din orice email primit.";

/**
 * „Newsletter" — abonarea la lista de email.
 *
 * Nota de dedesubt nu e text de umplutură: prin GDPR, omul trebuie să știe la ce
 * se abonează și cum iese, ÎNAINTE să se aboneze. Adresa se salvează
 * neconfirmată; dovada consimțământului pentru marketing e confirmarea prin
 * email, care se implementează în Faza 6, când există trimitere de emailuri.
 */
export function Newsletter({ data, tone = "inchis" }: { data: NewsletterData; tone?: SectionTone }) {
  /*
    Fără un titlu, secțiunea nu se randează deloc.

    Nu e prudență: `creeaza_client` aprinde toate secțiunile cu `{}` în ele, iar
    fără paza asta un site abia provizionat arăta o bandă neagră cu un câmp de email și niciun cuvânt lângă el. Aceeași regulă ca
    peste tot — o secțiune fără conținut nu desenează nimic, nici măcar ornamentul.
  */
  if (!data.titlu?.trim()) return null;

  const siteKey = process.env.NEXT_PUBLIC_CAPTCHA_SITE_KEY || null;
  const furnizorCaptcha = process.env.NEXT_PUBLIC_CAPTCHA_FURNIZOR || null;

  return (
    <Section tone={tone} id="newsletter">
      <div style={{ maxWidth: "620px", marginInline: "auto", textAlign: "center" }}>
        {data.eyebrow && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <SectionEyebrow>{data.eyebrow}</SectionEyebrow>
          </div>
        )}

        <h2
          style={{
            margin: 0,
            fontSize: "clamp(30px, 4vw, 48px)",
            lineHeight: 1.1,
            letterSpacing: "-0.025em",
            // Fontul de titlu al șablonului, ca la `SectionHeading` — corectat
            // 19 sept. 2026: secțiunea asta nu trece prin `SectionHeading`
            // (are propriul antet), deci rămăsese pe fontul implicit, diferit
            // de restul titlurilor paginii (ex. „Apariții").
            fontFamily: "var(--t-font-titlu)",
            fontWeight: "var(--t-greutate-titlu)" as unknown as number,
            textWrap: "balance",
          }}
        >
          {data.titlu}
          {data.titluAccent && (
            <>
              {" "}
              <span style={{ fontFamily: "var(--t-font-secundar)", fontStyle: "var(--t-stil-accent)", fontWeight: 300 }}>
                {data.titluAccent}
              </span>
            </>
          )}
        </h2>

        {data.intro && (
          <p
            style={{
              margin: "20px 0 0",
              fontSize: "17px",
              lineHeight: 1.7,
              color: "var(--s-text-secundar)",
              textWrap: "pretty",
            }}
          >
            {data.intro}
          </p>
        )}

        <div style={{ marginTop: "32px", textAlign: "left" }}>
          <NewsletterForm
            siteKey={siteKey}
            furnizorCaptcha={furnizorCaptcha}
            temaCaptcha={tone === "inchis" ? "dark" : "light"}
            textButon={data.textButon ?? "Abonează-mă"}
            placeholder={data.placeholder ?? "adresa@exemplu.ro"}
            mesajSucces={data.mesajSucces}
          />
        </div>

        <p
          style={{
            margin: "18px 0 0",
            fontSize: "14px",
            lineHeight: 1.6,
            color: "var(--s-text-secundar)",
            textWrap: "pretty",
          }}
        >
          {data.notaLegala ?? NOTA_IMPLICITA}
        </p>
      </div>
    </Section>
  );
}
