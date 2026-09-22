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
    imagine?: {
      url: string;
      altText?: string;
      pozitie?: PunctFocal;
      /** Măsurile citite la încărcare. Lipsesc la pozele mai vechi. */
      latime?: number;
      inaltime?: number;
    };
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
export function Portfolio({
  data,
  tone,
  variant,
}: {
  data: PortfolioData;
  tone?: SectionTone;
  /**
   * `"vitrina"` — cartonaș doar cu poza (mare) și numele scris peste ea, fără
   * etichetă, detalii, descriere sau materiale. Cerut pentru galeria de
   * șabloane de pe `sitepsihologi.ro` (21 sept. 2026): acolo poza E mesajul —
   * un vizitator care apasă cartonașul vede șablonul viu, nu mai are nevoie
   * să citească o descriere înainte. Adresa din `buton.href`, dacă e pusă,
   * face TOT cartonașul clicabil; nici textul butonului, nici adresa nu se
   * mai afișează nicăieri.
   * Se pune din SQL (`variant` pe rândul din `site_content`), nu din panou —
   * la fel ca `"linie"` de la „Serviciile mele".
   * Orice altă valoare (inclusiv lipsa) = cartonașul complet, ca la un
   * retreat/workshop real, unde descrierea contează.
   */
  variant?: string | null;
}) {
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

  const vitrina = variant === "vitrina";

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
          /*
            La „vitrina" cartonașele sunt mai LARGI dinadins: acolo tot rostul
            secțiunii e captura, iar pe trei coloane o captură de site întreg
            ajunge o miniatură din care nu se înțelege nimic. Două coloane pe
            ecran de calculator, una pe telefon (`min(100%, …)` — fără el,
            pragul de 400px face cartonașul să dea pe dinafară pe ecrane
            înguste). Restul secțiunilor rămân pe pragul vechi.
          */
          gridTemplateColumns: vitrina
            ? "repeat(auto-fit, minmax(min(100%, 400px), 1fr))"
            : "repeat(auto-fit, minmax(320px, 1fr))",
          /*
            La „vitrina", cartonașul e exact cât caseta lui și nimic altceva —
            nu se întinde cât cel mai înalt din rând, cum face grila din
            obișnuință. Azi toate casetele sunt oricum 16/9, deci nu se vede
            nicio diferență; rândul rămâne fiindcă ziua în care cineva schimbă
            raportul e ziua în care, fără el, ar apărea o fâșie de fundal gol
            sub cartonașele mai scunde. La restul secțiunilor, unde sub poză
            vine text de lungimi diferite, întinderea e chiar ce trebuie:
            cartonașele rămân egale.
          */
          alignItems: vitrina ? "start" : undefined,
          gap: "24px",
        }}
      >
        {elemente.map((element, i) =>
          vitrina ? (
            <CartonasVitrina key={`${element.titlu}-${i}`} element={element} />
          ) : (
          <li
            key={`${element.titlu}-${i}`}
            style={{
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: "var(--t-raza)",
              border: "1px solid var(--t-chenar)",
              background: "var(--t-suprafata, var(--t-fundal-nuantat))",
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

              {element.buton?.text && (
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
          ),
        )}
      </ul>
    </Section>
  );
}

/**
 * Cartonașul „vitrina": doar poza (mare) și numele, într-un cadru care imită o
 * fereastră de browser — cerut pentru galeria de șabloane de pe
 * `sitepsihologi.ro` (21 sept. 2026, referință: softwaves.ro): poza, colțuri
 * rotunjite, numele scris PESTE ea, pe un voal întunecat. Atât.
 *
 * A avut o vreme și o ramă care imita o fereastră de browser (trei puncte plus
 * o bară de adresă). Proprietarul a cerut-o scoasă, uitându-se la referință —
 * acolo nu e. Notat fiindcă e a doua oară când o presupunere de-a mea despre
 * cum arată softwaves.ro a trebuit corectată de cineva care chiar o vede:
 * mediul de lucru n-are ieșire la internet, deci referința se citește din ce
 * spune proprietarul, nu din ce-mi închipui eu.
 *
 * Nimic altceva — fără etichetă, detalii, descriere, materiale sau bandă cu
 * buton sub poză. Cerut cuvânt cu cuvânt de proprietar: „nu avem nevoie de
 * scrisul ăla […] avem nevoie doar de denumirea șablonului".
 *
 * APASĂ TOT CARTONAȘUL, nu un buton dintr-un colț: la referință dalele sunt
 * clicabile întregi, iar un buton în plus ar fi fost exact textul pe care
 * proprietarul l-a scos. Fără `buton.href` cartonașul rămâne identic la
 * vedere, doar că nu duce nicăieri — deci galeria arată la fel și înainte, și
 * după ce fiecare șablon-demo își primește adresa.
 *
 * Componentă proprie, nu o ramură în bucla de mai sus: are alt raport al pozei
 * (16/10, nu 3/2) și alt fel de a-și pune textul — peste imagine, nu sub ea —
 * deci ar fi însemnat `style`-uri condiționale peste tot, în loc de un cod
 * separat, mai simplu de citit.
 */
function CartonasVitrina({
  element,
}: {
  element: PortfolioData["elemente"][number];
}) {
  const href = element.buton?.href?.trim() || null;

  /*
    CĂSUȚA E FIXĂ, POZA SE VEDE ÎNTREAGĂ ÎN EA.

    Cerut de proprietar, în cuvintele lui: „căsuța are o mărime, acea mărime
    rămâne pentru fiecare căsuță, mărimea și forma căsuței nu se schimbă. Vreau
    ca orice poză pe care o încarc să ia automat mărimea căsuței." Deci raport
    fix 16/9 la toate cartonașele, indiferent ce fișier se încarcă — o galerie
    de cartonașe de forme diferite arăta dezordonat.

    Mai devreme caseta lua forma pozei (din `latime`/`inaltime`). S-a renunțat:
    rezolva dungile, dar strica tocmai lucrul cerut aici, ca toate să fie la
    fel. Măsurile rămân în date — se văd în bibliotecă și pot folosi altundeva
    — doar că galeria nu mai decide nimic după ele.

    Ce se întâmplă cu o poză de altă formă: se vede TOATĂ, micșorată cât e
    nevoie, iar locul rămas se umple cu o copie estompată a ei
    (`incadrare="intreaga"`, vezi `SectionImage`). Nu se taie și nu se
    deformează. Istoricul lung al deciziei — trei rapoarte fixe încercate pe
    rând, apoi caseta după măsuri, apoi asta — e în CONTEXT.md.
  */
  const raport = "16 / 9";

  const continut = (
    <div style={{ position: "relative" }}>
      {element.imagine && (
        <SectionImage
          src={element.imagine.url}
          alt={element.imagine.altText ?? ""}
          aspectRatio={raport}
          sizes="(max-width: 720px) 100vw, 560px"
          incadrare="intreaga"
        />
      )}

      {/* Voalul: fără el, un nume alb scris peste captura unui site deschis
          la culoare ar fi ilizibil — vezi cardul „Servicii" pentru același
          voal, la altă secțiune. Ținut jos și scurt (se stinge pe la 62%):
          captura E marfa, iar un voal întins pe jumătate de cartonaș ar
          întuneca exact partea din site pe care omul vrea s-o vadă. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.66), rgba(0,0,0,0.06) 38%, transparent 62%)",
        }}
      />

      <h3
        style={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          left: "20px",
          margin: 0,
          textAlign: "right",
          fontSize: "clamp(20px, 2.6vw, 28px)",
          lineHeight: 1.15,
          fontWeight: 700,
          color: "#fff",
          textWrap: "pretty",
        }}
      >
        {element.titlu}
      </h3>
    </div>
  );

  return (
    <li
      className="cartonas-vitrina"
      style={{
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        /*
          Colțuri vizibil mai rotunde decât ale șablonului — cerute de
          proprietar, după referință (softwaves.ro). `max(…)` și nu 18px fix:
          Claritate, șablonul pe care stă azi galeria, are `--t-raza` de 6px și
          ar lăsa cartonașele aproape drepte; dar dacă galeria ajunge vreodată
          pe un șablon mai rotund, nu vrem s-o tragem înapoi la 18.
        */
        borderRadius: "max(var(--t-raza), 18px)",
        border: "1px solid var(--t-chenar)",
        background: "var(--t-suprafata, var(--t-fundal-nuantat))",
      }}
    >
      {href ? (
        <a href={href} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
          {continut}
        </a>
      ) : (
        continut
      )}
    </li>
  );
}
