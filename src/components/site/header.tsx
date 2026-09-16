import Link from "next/link";
import { HeaderNav, type LinkAntet } from "./header-nav";

export type SiteHeaderData = {
  nume: string;
  /** Rândul mic de sub nume („PSIHOLOG CLINICIAN"). */
  subtitlu?: string;
  /** Logoul, dacă are unul. Adresa e deja semnată de cine construiește datele. */
  logo?: { url: string; altText?: string };
  /** Inițiala din medalion, când nu există logo încărcat. */
  initiala?: string;
  linkuri?: LinkAntet[];
  telefon?: string;
  /** E pornită pagina cu serviciile pe larg? Atunci „Servicii" duce acolo. */
  paginaServicii?: boolean;
  /**
   * Unde duce „Blog": la pagina `/blog`, la secțiunea de pe prima pagină, sau
   * nicăieri — caz în care linkul nu apare deloc. Fără articole publicate,
   * secțiunea „Articole recente" nu se randează, deci „/#articole" ar fi o
   * ancoră către un loc care nu există.
   */
  blog?: "pagina" | "sectiune" | null;
  /**
   * Paginile scrise de client care cer un loc în meniu. Se ADAUGĂ la cele
   * implicite, nu le înlocuiesc (pentru asta există `linkuri`).
   */
  paginiProprii?: LinkAntet[];
};

/**
 * Adresele încep cu „/", nu cu „#".
 *
 * Un „#despre" e un loc din PAGINA CURENTĂ. Pe prima pagină merge; pe pagina de
 * servicii nu există nimic cu numele acela, deci apăsarea nu face nimic — omul
 * rămâne blocat, cu impresia că site-ul e stricat. „/#despre" spune „du-te la
 * prima pagină, la secțiunea despre", și merge de oriunde.
 */
function linkuriImplicite(
  paginaServicii: boolean,
  blog: "pagina" | "sectiune" | null,
  paginiProprii: LinkAntet[],
): LinkAntet[] {
  return [
    { text: "Despre", href: "/#despre" },
    { text: "Servicii", href: paginaServicii ? "/servicii" : "/#servicii" },
    // Un meniu cu patru intrări din care una nu face nimic e mai rău decât unul
    // cu trei: prima dă impresia unui site stricat, a doua e doar un site fără blog.
    ...(blog ? [{ text: "Blog", href: blog === "pagina" ? "/blog" : "/#articole" }] : []),
    // Paginile proprii intră aici, nu la coadă: „Contact" rămâne ultimul, unde
    // îl caută toată lumea de douăzeci de ani încoace.
    ...paginiProprii,
    { text: "Contact", href: "/#contact" },
  ];
}

/**
 * Antetul site-ului public. Nu e o secțiune editabilă din cele 21 — e cadrul
 * paginii, la fel ca subsolul, deci datele lui vin din setările site-ului, nu
 * din `site_content`.
 *
 * Numărul de telefon stă într-un buton, nu într-un rând de text: în toate patru
 * șabloanele e cea mai vizibilă acțiune din antet, iar publicul-țintă sună mai
 * degrabă decât completează formulare.
 */
export function SiteHeader({ data }: { data: SiteHeaderData }) {
  const linkuri = data.linkuri?.length
    ? data.linkuri
    : linkuriImplicite(data.paginaServicii ?? false, data.blog ?? null, data.paginiProprii ?? []);
  const initiala = data.initiala ?? data.nume.trim().charAt(0).toUpperCase();

  return (
    <header
      // Peste cinci linkuri, meniul se strânge în buton mai devreme (vezi
      // globals.css): un nume real de cabinet plus șase linkuri nu mai încap pe
      // un rând la 950px, oricât de bine s-ar purta fiecare în parte.
      className={linkuri.length > 5 ? "antet antet--multe-linkuri" : "antet"}
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "color-mix(in oklab, var(--t-fundal) 88%, transparent)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid color-mix(in oklab, var(--t-chenar) 60%, transparent)",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          paddingInline: "clamp(16px, 5vw, 64px)",
          /*
            `minHeight`, nu `height`: numărul de linkuri nu mai e fix de când
            clientul își poate pune paginile lui în meniu, deci nicio înălțime
            fixă nu poate fi cea bună pentru toate site-urile. În cel mai rău caz
            antetul crește — în loc să taie numele cabinetului.

            Rândul NU se rupe (fără `flex-wrap`): cu el, numele s-ar duce pe un
            rând al lui în loc să se îngusteze, iar antetul ar fi 120px chiar și
            acolo unde totul încăpea lejer. Ce se rupe, la nevoie, sunt linkurile
            între ele — vezi `.antet-nav` în globals.css.
          */
          minHeight: "76px",
          paddingBlock: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          // Panoul de meniu se poziționează față de rândul ăsta.
          position: "relative",
        }}
      >
        <Link
          href="/"
          // `minWidth: 0` ca numele să se poată prescurta: fără el, un nume de
          // patruzeci de caractere împinge butoanele afară din ecran în loc să
          // se taie el.
          style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, textDecoration: "none", color: "inherit" }}
        >
          {data.logo?.url ? (
            // Logo încărcat: ia locul medalionului cu inițiala. Înălțime fixă,
            // lățime liberă (orice formă). `alt=""` — numele scris chiar alături
            // e deja citit de cititorul de ecran, n-are rost și din poză.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logo.url}
              alt=""
              style={{
                display: "block",
                height: "40px",
                width: "auto",
                maxWidth: "160px",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
          ) : (
            <span
              aria-hidden
              className="antet-medalion"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "999px",
                background: "var(--t-accent)",
                color: "var(--t-accent-text)",
                display: "grid",
                placeItems: "center",
                fontFamily: "var(--t-font-secundar)",
                fontSize: "19px",
                flexShrink: 0,
              }}
            >
              {initiala}
            </span>
          )}
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15, minWidth: 0 }}>
            <span className="antet-nume">{data.nume}</span>
            {data.subtitlu && <span className="antet-subtitlu">{data.subtitlu}</span>}
          </span>
        </Link>

        <HeaderNav linkuri={linkuri} />

        {data.telefon && (
          <a
            href={`tel:${data.telefon.replace(/\s/g, "")}`}
            // Eticheta stă pe link, nu într-un text ascuns lângă număr: pe ecran
            // lat numărul e vizibil, iar un text ascuns în plus l-ar face pe
            // cititorul de ecran să-l citească de două ori.
            aria-label={`Sună la ${data.telefon}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              height: "44px",
              paddingInline: "clamp(14px, 3vw, 20px)",
              borderRadius: "var(--t-raza-buton)",
              background: "var(--t-fundal-inchis)",
              color: "var(--t-text-pe-inchis)",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.6 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.8.6a2 2 0 0 1 1.7 2z" />
            </svg>
            {/* Pe ecran mic rămâne doar icoana: numărul scris ia locul numelui. */}
            <span className="antet-telefon-text" aria-hidden>
              {data.telefon}
            </span>
          </a>
        )}
      </div>
    </header>
  );
}
