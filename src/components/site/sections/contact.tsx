import type { SectionTone } from "@/lib/templates";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { ContactForm } from "./contact-form";

export type ContactData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  /**
   * Telefon, email, adresă, program — ce se afișează lângă formular.
   *
   * Nu există câmp de adresă a linkului: se deduce din conținut. Un client n-are
   * de ce să știe că un număr de telefon apăsabil se scrie „tel:0721234567" —
   * iar când i se cere, scrie ce nimerește și obține un link care nu duce
   * nicăieri, dar arată ca unul bun.
   */
  detalii?: { eticheta: string; valoare: string }[];
  textButon?: string;
  textAcord?: string;
  linkConfidentialitate?: string;
  /** Ce citește omul după trimitere. Clientul îl poate scrie cu vocea lui. */
  mesajSucces?: string;
};

/**
 * Ce se întâmplă când apeși pe un rând din datele cabinetului.
 *
 * Un număr de telefon deschide apelul, o adresă de email deschide un mesaj,
 * restul rămâne text simplu. Programul („Luni – vineri, 10:00 – 19:00") conține
 * litere și, de obicei, mai multe rânduri — deci nu e confundat cu un număr.
 */
function adresaDedusa(valoare: string | undefined): string | null {
  // `undefined`, nu doar șir gol: în previzualizarea din panou, un rând
  // proaspăt adăugat n-are încă nicio valoare, iar câmpurile goale nu ajung
  // deloc în datele secțiunii. Tipul spune „string" fiindcă asta e forma
  // salvată — dar tipurile nu se aplică datelor venite din JSON.
  const curat = (valoare ?? "").trim();

  // Mai multe rânduri înseamnă program sau adresă, niciodată telefon sau email.
  if (curat.includes("\n")) return null;

  if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(curat)) return `mailto:${curat}`;

  const cifre = curat.replace(/[\s().-]/g, "");
  if (/^\+?\d{6,15}$/.test(cifre)) return `tel:${cifre}`;

  return null;
}

const ACORD_IMPLICIT =
  "Sunt de acord ca datele scrise aici să fie folosite ca să primesc un răspuns. Am citit";

/**
 * „Contact" — formularul prin care ajunge un mesaj la cabinet.
 *
 * Datele de contact stau LÂNGĂ formular, nu în locul lui: cine preferă telefonul
 * nu trebuie să completeze nimic, iar cine nu poate vorbi la telefon (destul de
 * des, exact motivul pentru care caută un psiholog) are unde scrie.
 */
export function Contact({ data, tone = "deschis" }: { data: ContactData; tone?: SectionTone }) {
  // Cheia publică lipsă înseamnă că platforma n-are Turnstile configurat: nu
  // randăm caseta. Serverul sare, la rândul lui, peste verificare — cele două
  // decizii trebuie să rămână împreună (vezi src/lib/antispam.ts).
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || null;

  return (
    <Section tone={tone} id="contact">
      <div
        style={{
          display: "grid",
          gap: "clamp(40px, 6vw, 80px)",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          alignItems: "start",
        }}
      >
        <div>
          <SectionHeading
            eyebrow={data.eyebrow}
            titlu={data.titlu}
            titluAccent={data.titluAccent}
            intro={data.intro}
            maxWidthTitlu="11em"
          />

          {data.detalii && data.detalii.length > 0 && (
            <dl style={{ margin: "40px 0 0", display: "flex", flexDirection: "column", gap: "20px" }}>
              {data.detalii.map((detaliu) => {
                const adresa = adresaDedusa(detaliu.valoare);

                return (
                <div key={detaliu.eticheta}>
                  <dt
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: "var(--s-text-secundar)",
                    }}
                  >
                    {detaliu.eticheta}
                  </dt>
                  {/* `pre-line`: dacă omul a scris programul pe două rânduri
                      (luni-vineri, apoi sâmbăta), așa trebuie să apară. */}
                  <dd style={{ margin: "6px 0 0", fontSize: "18px", whiteSpace: "pre-line" }}>
                    {adresa ? (
                      <a
                        href={adresa}
                        style={{
                          color: "inherit",
                          // Preflight-ul Tailwind anulează sublinierea implicită a
                          // linkurilor. Fără linia asta, un număr de telefon arată
                          // exact ca un text obișnuit și nimeni nu-l apasă.
                          textDecoration: "underline",
                          textDecorationColor: "color-mix(in oklab, currentColor 40%, transparent)",
                          textUnderlineOffset: "3px",
                        }}
                      >
                        {detaliu.valoare}
                      </a>
                    ) : (
                      detaliu.valoare
                    )}
                  </dd>
                </div>
                );
              })}
            </dl>
          )}
        </div>

        <ContactForm
          siteKey={siteKey}
          temaCaptcha={tone === "inchis" ? "dark" : "light"}
          textAcord={data.textAcord ?? ACORD_IMPLICIT}
          linkConfidentialitate={data.linkConfidentialitate ?? "/confidentialitate"}
          mesajSucces={data.mesajSucces}
          textButon={data.textButon ?? "Trimite mesajul"}
        />
      </div>
    </Section>
  );
}
