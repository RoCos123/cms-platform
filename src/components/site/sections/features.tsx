import type { SectionTone } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";
import { Section } from "@/components/site/section";
import { SectionHeading } from "@/components/site/section-heading";
import { SectionImage } from "@/components/site/section-image";

export type FeaturesData = {
  eyebrow?: string;
  titlu: string;
  titluAccent?: string;
  intro?: string;
  /** Câte se arată pe prima pagină. Lipsă = toate. */
  numar?: number;
};

/**
 * „Serviciile mele" — vitrina de pe prima pagină.
 *
 * Nu-și ține conținutul: îl citește din Servicii, la fel cum „Articole recente"
 * îl citește din Blog. Secțiunea reține doar CUM se afișează (titlu, câte), nu
 * CE — altfel fiecare serviciu ar fi scris de două ori, o dată aici și o dată pe
 * pagina de servicii, iar cele două ar ajunge să se contrazică.
 */
export function Features({
  data,
  servicii,
  paginaDetaliata,
  variant,
  tone,
  friendly,
  imagine,
}: {
  data: FeaturesData;
  servicii: Serviciu[];
  /** E pornită pagina cu descrierile pe larg? Dacă nu, cardurile nu duc nicăieri. */
  paginaDetaliata: boolean;
  /** `"linie"` = banda orizontală. Orice altceva (inclusiv lipsa) = cartonașe. */
  variant?: string | null;
  tone?: SectionTone;
  /**
   * Cardurile de servicii ca la modelul prietenos: titlu + descriere + preț
   * mare sub o linie punctată, unele colorate (verde/piersică), fără poză și
   * fără iconiță. Doar „Apropiere"; restul rămân cu cardurile de dinainte.
   */
  friendly?: boolean;
  /**
   * Cardurile de servicii ca la referința „Liniște": carduri-imagine cu un voal
   * întunecat peste poză, titlul pe imagine și o săgeată în colț. Doar „Liniște".
   */
  imagine?: boolean;
}) {
  // Fără niciun serviciu publicat, secțiunea nu se randează deloc: un titlu
  // „Serviciile mele" urmat de nimic arată a site stricat, nu a site nou.
  /*
    Titlul singur e de ajuns ca să se vadă secțiunea, chiar fără nimic sub el.

    Hotărât de proprietar, uitându-se la primul site provizionat: un site nou
    trebuie să-și arate SCHELETUL — toate secțiunile, fiecare cu numele ei ca
    text de pornire — ca omul să vadă ce are de completat și unde. Ascunse, ele
    făceau panoul să mintă: acolo scria „vizibilă", pe site nu era nimic.

    Fără titlu ȘI fără conținut, tot nu se randează nimic: aia e secțiunea pe
    care clientul a golit-o dinadins.
  */
  if (servicii.length === 0 && !data.titlu?.trim()) return null;

  // Limita „câte se văd" are sens doar cât timp restul se pot vedea altundeva.
  // Cu pagina detaliată oprită, un serviciu tăiat de aici n-ar mai apărea NICĂIERI
  // pe site — clientul l-ar fi scris degeaba, fără să afle vreodată.
  const afisate = data.numar && paginaDetaliata ? servicii.slice(0, data.numar) : servicii;
  const maiSunt = servicii.length > afisate.length;

  return (
    <Section tone={tone} id="servicii">
      <SectionHeading
        eyebrow={data.eyebrow}
        titlu={data.titlu}
        titluAccent={data.titluAccent}
        intro={data.intro}
        maxWidthTitlu="14em"
        actiune={
          maiSunt && paginaDetaliata ? (
            /*
              Ancoră simplă, nu `next/link`, ca peste tot în secțiunile site-ului:
              aceleași componente se randează și în previzualizarea din panou,
              printr-un portal într-un iframe. Acolo contextul de rutare e al
              PANOULUI — un `Link` ar încerca să navigheze panoul, nu site-ul, și
              ar preîncărca pagini de care previzualizarea n-are nevoie.
            */
            // eslint-disable-next-line @next/next/no-html-link-for-pages
            <a
              href="/servicii"
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "var(--s-accent)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Toate serviciile →
            </a>
          ) : undefined
        }
      />

      {variant === "linie" ? (
        <Linie servicii={afisate} paginaDetaliata={paginaDetaliata} />
      ) : imagine ? (
        <ServiciiImagine servicii={afisate} paginaDetaliata={paginaDetaliata} />
      ) : friendly ? (
        <ServiciiFriendly servicii={afisate} paginaDetaliata={paginaDetaliata} />
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: "56px 0 0",
            padding: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(288px, 100%), 1fr))",
            gap: "20px",
          }}
        >
          {afisate.map((serviciu) => (
            <li key={serviciu.id}>
              {/*
                Cardul întreg e link, nu doar rândul de jos: pe telefon, o țintă de
                opt pixeli înălțime e greu de nimerit, iar oricine vede un card cu
                „Află mai multe" încearcă oricum să apese oriunde pe el.

                Fără pagina detaliată n-are unde să ducă, deci nu e link deloc: un
                card care pare apăsabil și nu face nimic e mai rău decât unul
                simplu.
              */}
              <Card
                link={paginaDetaliata ? `/servicii#${serviciu.slug}` : undefined}
                cover={serviciu.coperta}
              >
                <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 600, textWrap: "pretty" }}>
                  {serviciu.titlu}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    lineHeight: 1.7,
                    color: "var(--t-text-secundar)",
                    textWrap: "pretty",
                  }}
                >
                  {serviciu.descriereScurta}
                </p>

                {(serviciu.durata || serviciu.pret) && (
                  <p style={{ margin: 0, fontSize: "14px", color: "var(--t-text-secundar)" }}>
                    {[serviciu.durata, serviciu.pret].filter(Boolean).join(" · ")}
                  </p>
                )}

                {paginaDetaliata && (
                  <span
                    style={{
                      marginTop: "auto",
                      paddingTop: "12px",
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "var(--t-accent)",
                    }}
                  >
                    Află mai multe →
                  </span>
                )}
              </Card>
              </li>
            ))}
        </ul>
      )}
    </Section>
  );
}

/**
 * Varianta „linie": aceleași servicii, așezate pe o bandă orizontală, cu câte un
 * punct de fiecare. Se cere din `variant` pe rândul de secțiune, nu din date —
 * e o alegere de așezare, nu conținut al clientului.
 *
 * DE CE PUNCTE, NU NUMERE. Numerele ar spune „unul după altul", ca la „Cum
 * decurge". Serviciile n-au ordine: nimeni nu ia blogul DUPĂ programări. Punctele
 * dau aceeași bandă continuă fără să promită o succesiune care nu există.
 *
 * DE CE `columnGap: 0`. Linia nu e desenată o dată, pe listă, ci bucată cu
 * bucată: fiecare element își duce propriul punct și propriul segment până la
 * marginea lui. Așa se leagă singure într-o linie continuă, iar când grila se
 * rupe în două rânduri fiecare rând își are linia lui — fără nicio interogare de
 * lățime și fără media queries, pe care stilurile în linie nu le pot exprima.
 * Aerul dintre coloane vine din padding-ul textului, nu din gap.
 *
 * Ultimul segment se stinge în transparent: o linie care se oprește brusc la
 * marginea din dreapta arată a desen tăiat, nu a capăt de bandă.
 */
function Linie({
  servicii,
  paginaDetaliata,
}: {
  servicii: Serviciu[];
  paginaDetaliata: boolean;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "64px 0 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
        columnGap: 0,
        rowGap: "52px",
      }}
    >
      {servicii.map((serviciu, index) => (
        <li key={serviciu.id}>
          <div aria-hidden style={{ display: "flex", alignItems: "center", height: "14px" }}>
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                background: "var(--s-accent)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                flex: 1,
                height: "2px",
                /*
                  `currentColor` la opacitate mică, nu `--t-chenar`: linia stă
                  direct pe fundalul secțiunii, iar `Section` nu dă niciun
                  `--s-chenar`. Așa se albește singură pe tonul închis, unde un
                  chenar de card ar fi rămas invizibil.
                */
                background:
                  index === servicii.length - 1
                    ? "linear-gradient(to right, currentColor, transparent)"
                    : "currentColor",
                opacity: 0.2,
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "24px", paddingRight: "32px" }}>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: 600, textWrap: "pretty" }}>
              {paginaDetaliata ? (
                // Ancoră simplă, nu `next/link` — vezi explicația de la cartonașe.
                <a
                  href={`/servicii#${serviciu.slug}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {serviciu.titlu}
                </a>
              ) : (
                serviciu.titlu
              )}
            </h3>

            <p
              style={{
                margin: 0,
                fontSize: "16px",
                lineHeight: 1.7,
                color: "var(--s-text-secundar)",
                textWrap: "pretty",
              }}
            >
              {serviciu.descriereScurta}
            </p>

            {(serviciu.durata || serviciu.pret) && (
              <p style={{ margin: 0, fontSize: "14px", color: "var(--s-text-secundar)" }}>
                {[serviciu.durata, serviciu.pret].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Cardurile de servicii ale modelului prietenos: titlu, descriere, iar sub o
 * linie punctată prețul mare. Unele carduri sunt colorate (verde/piersică),
 * după un tipar fix — fără poză și fără iconiță (cerut). Doar „Apropiere".
 *
 * Culorile cardurilor vin din nivelul ȘABLONULUI (`--t-…`): rămân deschise
 * oricare ar fi tonul secțiunii, ca la celelalte carduri prietenoase.
 */
function ServiciiFriendly({
  servicii,
  paginaDetaliata,
}: {
  servicii: Serviciu[];
  paginaDetaliata: boolean;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "56px 0 0",
        padding: 0,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(288px, 100%), 1fr))",
        gap: "20px",
      }}
    >
      {servicii.map((serviciu, i) => {
        // Tipar fix de accente, ca la sursă: al doilea card verde, al patrulea
        // piersică, restul deschise; se repetă la fiecare patru.
        const accent = i % 4 === 1 ? "salvie" : i % 4 === 3 ? "piersica" : "deschis";
        const fundal =
          accent === "salvie"
            ? "var(--t-accent-pe-inchis)"
            : accent === "piersica"
              ? "var(--t-accent-cald)"
              : "var(--t-suprafata, var(--t-fundal-nuantat))";
        const chenar =
          accent === "salvie"
            ? "var(--t-accent)"
            : accent === "piersica"
              ? "var(--t-accent-cald-inchis)"
              : "var(--t-chenar)";
        const stil: React.CSSProperties = {
          display: "flex",
          flexDirection: "column",
          height: "100%",
          gap: "14px",
          padding: "28px",
          borderRadius: "var(--t-raza)",
          background: fundal,
          border: `1px solid ${chenar}`,
          color: "var(--t-text)",
          textDecoration: "none",
        };
        const continut = (
          <>
            <h3 style={{ margin: 0, fontSize: "21px", fontWeight: 700, textWrap: "pretty" }}>{serviciu.titlu}</h3>
            <p style={{ margin: 0, flex: 1, fontSize: "15px", lineHeight: 1.6, color: "var(--t-text-secundar)", textWrap: "pretty" }}>
              {serviciu.descriereScurta}
            </p>
            {serviciu.pret && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "16px",
                  // Linie punctată vizibilă pe orice fundal de card (alb, salvie,
                  // piersică): din culoarea textului, nu din `--t-chenar`.
                  borderTop: "1px dashed color-mix(in oklab, var(--t-text) 20%, transparent)",
                }}
              >
                <span style={{ fontSize: "22px", fontWeight: 800 }}>{serviciu.pret}</span>
                {paginaDetaliata && (
                  <span aria-hidden style={{ fontSize: "18px", color: "var(--t-accent)" }}>
                    →
                  </span>
                )}
              </div>
            )}
          </>
        );
        return (
          <li key={serviciu.id}>
            {paginaDetaliata ? (
              <a href={`/servicii#${serviciu.slug}`} style={stil}>
                {continut}
              </a>
            ) : (
              <div style={stil}>{continut}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Cardurile de servicii ale referinței „Liniște": carduri-imagine pe fundal
 * închis, cu poza serviciului peste tot cardul, un voal întunecat care se
 * îngroașă spre bază, titlul (și descrierea scurtă) peste imagine și o săgeată
 * rotundă în colț. Fără poză, cardul rămâne un dreptunghi închis doar cu titlul —
 * un serviciu abia scris, fără copertă, tot arată a card, nu a gol. Doar
 * „Liniște".
 *
 * Culorile vin din nivelul ȘABLONULUI (`--t-…`): cardul e mereu închis, iar
 * textul mereu deschis, oricare ar fi tonul benzii (la referință banda e închisă).
 */
function ServiciiImagine({
  servicii,
  paginaDetaliata,
}: {
  servicii: Serviciu[];
  paginaDetaliata: boolean;
}) {
  return (
    <ul
      style={{
        listStyle: "none",
        margin: "56px 0 0",
        padding: 0,
        display: "grid",
        // Minim mare (420px) ca să iasă DOUĂ coloane pe lat și una pe telefon,
        // fără media query — cardurile-imagine sunt late, ca la referință.
        gridTemplateColumns: "repeat(auto-fit, minmax(min(420px, 100%), 1fr))",
        gap: "24px",
      }}
    >
      {servicii.map((serviciu) => {
        const continut = (
          <>
            {serviciu.coperta && (
              <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
                <SectionImage
                  src={serviciu.coperta.url}
                  alt=""
                  aspectRatio="5 / 4"
                  sizes="(max-width: 860px) 100vw, 50vw"
                />
                {/*
                  Voalul: transparent sus, întunecat spre bază, ca titlul alb să
                  se citească peste orice poză. E un strat peste imagine, sub text.
                */}
                <div
                  aria-hidden
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(15,22,18,0) 30%, rgba(15,22,18,0.55) 62%, rgba(15,22,18,0.95) 100%)",
                  }}
                />
              </div>
            )}

            <div
              style={{
                position: "relative",
                zIndex: 2,
                padding: "clamp(28px, 3vw, 44px)",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "clamp(24px, 2.4vw, 34px)",
                    fontWeight: 600,
                    color: "var(--t-text-pe-inchis)",
                    textShadow: "0 2px 20px rgba(0, 0, 0, 0.45)",
                    textWrap: "pretty",
                  }}
                >
                  {serviciu.titlu}
                </h3>
                {serviciu.descriereScurta?.trim() && (
                  <p
                    style={{
                      margin: "10px 0 0",
                      fontSize: "15px",
                      lineHeight: 1.55,
                      maxWidth: "34ch",
                      color: "color-mix(in oklab, var(--t-text-pe-inchis) 88%, transparent)",
                      textShadow: "0 1px 10px rgba(0, 0, 0, 0.5)",
                      textWrap: "pretty",
                    }}
                  >
                    {serviciu.descriereScurta}
                  </p>
                )}
              </div>

              {/*
                Săgeata rotundă, doar când cardul chiar duce undeva (pagina
                detaliată pornită). Un cerc apăsabil pe un card care nu face nimic
                ar minți, ca „Află mai multe" din cardurile obișnuite.
              */}
              {paginaDetaliata && (
                <span
                  aria-hidden
                  style={{
                    flexShrink: 0,
                    width: "52px",
                    height: "52px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "var(--t-fundal)",
                    color: "var(--t-text)",
                    fontSize: "18px",
                  }}
                >
                  →
                </span>
              )}
            </div>
          </>
        );

        const stil: React.CSSProperties = {
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          aspectRatio: "5 / 4",
          borderRadius: "var(--t-raza)",
          overflow: "hidden",
          // Fundalul de sub poză (și cardul întreg, fără poză): un închis o
          // treaptă peste banda secțiunii, ca să se desprindă de ea.
          background: "color-mix(in oklab, var(--t-fundal-inchis) 82%, #ffffff)",
          textDecoration: "none",
        };

        return (
          <li key={serviciu.id}>
            {paginaDetaliata ? (
              <a href={`/servicii#${serviciu.slug}`} style={stil}>
                {continut}
              </a>
            ) : (
              <div style={stil}>{continut}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Cardul unui serviciu. Link doar când există unde să ducă — un `<a>` fără
 * `href` nu e focusabil și e anunțat ca link stricat de cititoarele de ecran.
 *
 * Cu poză, cardul o poartă lată în cap (`overflow: hidden` o taie la colțurile
 * rotunjite), iar textul stă într-un strat cu marginile lui dedesubt. Fără poză,
 * arată exact ca înainte — un card doar cu text.
 */
function Card({
  link,
  cover,
  children,
}: {
  link?: string;
  cover?: { url: string } | null;
  children: React.ReactNode;
}) {
  const stil: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--t-fundal-nuantat)",
    border: "1px solid var(--t-chenar)",
    borderRadius: "var(--t-raza)",
    overflow: "hidden",
    color: "var(--t-text)",
    textDecoration: "none",
  };

  const continut = (
    <>
      {cover && (
        <SectionImage
          src={cover.url}
          // Decor: numele serviciului, chiar sub poză, spune ce e — deci poza nu
          // repetă informația pentru cititoarele de ecran.
          alt=""
          aspectRatio="3 / 2"
          sizes="(max-width: 720px) 100vw, (max-width: 1040px) 50vw, 33vw"
        />
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "32px", flex: 1 }}>
        {children}
      </div>
    </>
  );

  if (!link) return <div style={stil}>{continut}</div>;

  return (
    <a href={link} style={stil}>
      {continut}
    </a>
  );
}
