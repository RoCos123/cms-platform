import type { CSSProperties } from "react";
import { IcoanaSociala } from "@/components/site/icoana-sociala";

export type LinkSubsol = { eticheta: string; href: string };

export type SiteFooterData = {
  nume: string;
  /** Logoul, dacă are unul. Adresa e deja semnată de cine construiește datele. */
  logo?: { url: string; altText?: string };
  subtitlu?: string;
  descriere?: string;
  telefon?: string;
  email?: string;
  adresa?: string;
  /** Acreditări, cod din registrul profesional — apar în bara de jos. */
  acreditare?: string;
  /** Coloana SERVICII: „Toate serviciile" + fiecare serviciu publicat. */
  servicii?: LinkSubsol[];
  /** Coloana CABINET: secțiunile vizibile + Blog + Contact. */
  cabinet?: LinkSubsol[];
  /** Paginile legale (Politica de confidențialitate) — în bara de jos. */
  legal?: LinkSubsol[];
  /** Profilurile de pe rețele, deja filtrate de `linkurileSociale`. */
  retele?: { nume: string; adresa: string }[];
};

const TITLU_COLOANA: CSSProperties = {
  margin: 0,
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "var(--t-text-secundar-pe-inchis)",
};

const LINK_COLOANA: CSSProperties = {
  color: "var(--t-accent-pe-inchis)",
  textDecoration: "none",
  fontSize: "16px",
  textWrap: "pretty",
};

/** O coloană de linkuri cu titlu (SERVICII, CABINET). Goală → nu se desenează. */
function ColoanaLinkuri({ titlu, linkuri }: { titlu: string; linkuri: LinkSubsol[] }) {
  if (linkuri.length === 0) return null;

  return (
    <nav
      aria-label={titlu}
      style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: 0 }}
    >
      <p style={TITLU_COLOANA}>{titlu}</p>
      {linkuri.map((link) => (
        <a key={`${link.href}-${link.eticheta}`} href={link.href} style={LINK_COLOANA}>
          {link.eticheta}
        </a>
      ))}
    </nav>
  );
}

/**
 * Subsolul site-ului public — patru coloane: identitatea (logo, nume, descriere,
 * rețele), serviciile, cabinetul (secțiuni + pagini) și contactul. Ca și antetul,
 * e cadrul paginii, nu o secțiune editabilă: datele vin din setările site-ului,
 * iar coloanele de servicii și cabinet se umplu singure din ce e publicat.
 *
 * Fiecare coloană dispare dacă n-are ce arăta — un cabinet fără servicii publicate
 * nu vede o coloană „Servicii" goală.
 */
export function SiteFooter({ data }: { data: SiteFooterData }) {
  const retele = data.retele ?? [];
  const servicii = data.servicii ?? [];
  const cabinet = data.cabinet ?? [];
  const legal = data.legal ?? [];

  const an = new Date().getFullYear();
  const areContact = Boolean(data.telefon || data.email || data.adresa);

  return (
    <footer
      style={{
        background: "var(--t-fundal-inchis)",
        color: "var(--t-text-pe-inchis)",
        paddingBlock: "clamp(56px, 7vw, 88px) 40px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto", paddingInline: "clamp(20px, 5vw, 64px)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: "clamp(32px, 4vw, 56px)",
          }}
        >
          {/* Coloana identității: logo + nume + subtitlu + descriere + rețele. */}
          <div style={{ minWidth: 0 }}>
            {data.logo?.url && (
              // Logo simplu, nu prin optimizator: are înălțime fixă și lățime
              // liberă (orice formă), iar `next/image` cere dimensiuni știute.
              // `alt=""` — numele scris dedesubt e deja citit de cititorul de
              // ecran, n-are rost și din poză.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logo.url}
                alt=""
                style={{
                  display: "block",
                  height: "clamp(38px, 4.5vw, 52px)",
                  width: "auto",
                  maxWidth: "200px",
                  objectFit: "contain",
                  marginBottom: "16px",
                }}
              />
            )}

            <p style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{data.nume}</p>

            {data.subtitlu && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--t-text-secundar-pe-inchis)",
                }}
              >
                {data.subtitlu}
              </p>
            )}

            {data.descriere && (
              <p
                style={{
                  margin: "16px 0 0",
                  maxWidth: "28em",
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "var(--t-text-secundar-pe-inchis)",
                  textWrap: "pretty",
                }}
              >
                {data.descriere}
              </p>
            )}

            {retele.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "20px" }}>
                {retele.map((retea) => (
                  <a
                    key={retea.adresa}
                    href={retea.adresa}
                    // Profilul e pe alt site: `noopener` ca pagina deschisă să nu
                    // poată ajunge la fereastra cabinetului prin `window.opener`.
                    target="_blank"
                    rel="me noopener noreferrer"
                    aria-label={retea.nume}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "40px",
                      height: "40px",
                      borderRadius: "999px",
                      background: "color-mix(in oklab, var(--t-text-pe-inchis) 12%, transparent)",
                      color: "var(--t-text-pe-inchis)",
                      textDecoration: "none",
                    }}
                  >
                    <IcoanaSociala nume={retea.nume} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <ColoanaLinkuri titlu="Servicii" linkuri={servicii} />
          <ColoanaLinkuri titlu="Cabinet" linkuri={cabinet} />

          {areContact && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                minWidth: 0,
                // O adresă lungă fără spații (un email) n-are unde să se rupă și
                // ar împinge pagina în afara ecranului. Măsurat pe 390px.
                overflowWrap: "anywhere",
              }}
            >
              <p style={TITLU_COLOANA}>Contact</p>
              {data.telefon && (
                <a
                  href={`tel:${data.telefon.replace(/\s/g, "")}`}
                  style={{ color: "inherit", textDecoration: "none", fontSize: "16px" }}
                >
                  {data.telefon}
                </a>
              )}
              {data.email && (
                <a
                  href={`mailto:${data.email}`}
                  style={{ color: "inherit", textDecoration: "none", fontSize: "16px" }}
                >
                  {data.email}
                </a>
              )}
              {data.adresa && (
                <span style={{ color: "var(--t-text-secundar-pe-inchis)", fontSize: "16px" }}>
                  {data.adresa}
                </span>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: "clamp(40px, 5vw, 64px)",
            paddingTop: "24px",
            borderTop: "1px solid color-mix(in oklab, var(--t-text-pe-inchis) 16%, transparent)",
            display: "flex",
            flexWrap: "wrap",
            gap: "12px 24px",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            color: "var(--t-text-secundar-pe-inchis)",
          }}
        >
          <span>
            © {an} {data.nume}
          </span>

          {(legal.length > 0 || data.acreditare) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", alignItems: "center" }}>
              {legal.map((link) => (
                <a key={link.href} href={link.href} style={{ color: "inherit", textDecoration: "none" }}>
                  {link.eticheta}
                </a>
              ))}
              {data.acreditare && <span>{data.acreditare}</span>}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
