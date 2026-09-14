import type { SectionTone } from "@/lib/templates";
import type { PunctFocal } from "@/lib/punct-focal";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { SectionImage } from "@/components/site/section-image";

export type PortfolioData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  elemente: {
    titlu: string;
    descriere: string;
    /** „Retreat", „Workshop", „Curs online" — categoria, ca etichetă. */
    eticheta?: string;
    /** „14–16 martie", „Brașov", „12 locuri" — se afișează pe un rând, separate. */
    detalii?: string[];
    /**
     * Materiale de descărcat — fiecare un buton legat de un document din
     * bibliotecă. `url`-ul se re-semnează la randare din `fisierId`
     * (`rescrieAdreseleFisiere`), la fel ca la poze.
     */
    materiale?: { text?: string; fisier?: { fisierId?: string; url?: string } }[];
    buton?: { text: string; href: string };
    /** Aceeași formă ca la încărcare (`ImageValue`): `altText`, nu `alt`. */
    imagine?: { url: string; altText?: string; pozitie?: PunctFocal };
  }[];
};

/**
 * „Experiențe de grup" — retreat-uri, workshopuri, programe.
 *
 * Se deosebește de `features` (serviciile): serviciile sunt ce face clientul
 * în general și rămân la fel ani de zile; astea sunt ediții concrete, cu dată
 * și loc, care se schimbă des. Aceeași componentă pentru amândouă ar fi
 * însemnat câmpuri goale pe jumătate din cazuri.
 */
export function Portfolio({ data, tone }: { data: PortfolioData; tone?: SectionTone }) {
  /*
    Lista lipsește cu totul pe un site abia provizionat: `creeaza_client` pune
    toate secțiunile APRINSE, cu `{}` în ele (migrarea `comutator_lansare` —
    un site nepublicat nu se vede oricum, iar clientul stinge ce nu-i trebuie).
    Fără `?? []`, prima pagină a fiecărui client nou cădea cu 500.

    Goală, secțiunea nu se randează deloc — aceeași regulă ca la „Serviciile
    mele" și „Pachete": un titlu urmat de nimic arată a site stricat.
  */
  const elemente = data.elemente ?? [];
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (elemente.length === 0 && !data.titlu?.trim()) return null;


  return (
    <Section tone={tone} id="programe">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
      />

      <ul
        style={{
          listStyle: "none",
          margin: "52px 0 0",
          padding: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
        }}
      >
        {elemente.map((element, i) => (
          <li
            key={`${element.titlu}-${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "var(--t-raza)",
              border: "1px solid var(--t-chenar)",
              background: "var(--t-fundal-nuantat)",
              color: "var(--t-text)",
            }}
          >
            {element.imagine && (
              <SectionImage
                src={element.imagine.url}
                alt={element.imagine.altText ?? ""}
                aspectRatio="3 / 2"
                sizes="(max-width: 720px) 100vw, 560px"
                pozitie={element.imagine.pozitie}
              />
            )}

            <div style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
              {element.eticheta && (
                <span
                  style={{
                    alignSelf: "flex-start",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    background: "color-mix(in oklab, var(--t-accent) 12%, transparent)",
                    color: "var(--t-accent)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {element.eticheta}
                </span>
              )}

              <h3 style={{ margin: 0, fontSize: "23px", lineHeight: 1.25, fontWeight: 600, textWrap: "pretty" }}>
                {element.titlu}
              </h3>

              {element.detalii && element.detalii.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px 14px",
                    fontSize: "14px",
                    color: "var(--t-text-secundar)",
                  }}
                >
                  {element.detalii.map((detaliu, j) => (
                    // Separatorul aparține elementului DINAINTEA lui, nu celui
                    // de după: pe ecran îngust lista se rupe pe mai multe rânduri,
                    // iar un „·" ajuns la început de rând arată a bulină de listă.
                    <li key={j} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      {detaliu}
                      {j < element.detalii!.length - 1 && (
                        <span aria-hidden style={{ opacity: 0.5 }}>
                          ·
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              <p
                style={{
                  margin: 0,
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "var(--t-text-secundar)",
                  textWrap: "pretty",
                }}
              >
                {element.descriere}
              </p>

              {element.materiale && element.materiale.some((material) => material.fisier?.url) && (
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "10px" }}>
                  {element.materiale.map((material, j) => {
                    const url = material.fisier?.url;
                    if (!url) return null;

                    return (
                      <li key={j}>
                        {/* Fișierul e la noi, servit cu „attachment” — `download`
                            e doar o intenție în plus pentru browser. */}
                        <a
                          href={url}
                          download
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "var(--t-accent)",
                            textDecoration: "none",
                          }}
                        >
                          <svg
                            aria-hidden
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{ flexShrink: 0 }}
                          >
                            <path d="M12 3v11m0 0l4-4m-4 4l-4-4" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M5 21h14" strokeLinecap="round" />
                          </svg>
                          {material.text?.trim() || "Descarcă materialul"}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}

              {element.buton && (
                <a
                  href={element.buton.href}
                  style={{
                    marginTop: "auto",
                    alignSelf: "flex-start",
                    display: "inline-flex",
                    alignItems: "center",
                    height: "46px",
                    paddingInline: "22px",
                    borderRadius: "var(--t-raza-buton)",
                    background: "var(--t-accent)",
                    color: "var(--t-accent-text)",
                    fontSize: "15px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {element.buton.text}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
