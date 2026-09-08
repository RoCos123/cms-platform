export type SiteFooterData = {
  nume: string;
  descriere?: string;
  telefon?: string;
  email?: string;
  adresa?: string;
  /** Acreditări, cod din registrul profesional — apar în toate patru șabloanele. */
  acreditare?: string;
  linkuri?: { text: string; href: string }[];
  /** Profilurile de pe rețele, deja filtrate de `linkurileSociale`. */
  retele?: { nume: string; adresa: string }[];
};

/**
 * Subsolul site-ului public. Ca și antetul, e cadrul paginii, nu o secțiune
 * editabilă — datele vin din setările site-ului.
 *
 * Paginile legale sunt legate de aici, nu din meniul principal: sunt obligatorii,
 * dar nu sunt ce caută vizitatorul.
 */
export function SiteFooter({ data }: { data: SiteFooterData }) {
  const retele = data.retele ?? [];
  const linkuri = data.linkuri ?? [];

  const an = new Date().getFullYear();

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
            gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))",
            gap: "40px",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{data.nume}</p>
            {data.descriere && (
              <p
                style={{
                  margin: "14px 0 0",
                  maxWidth: "26em",
                  fontSize: "16px",
                  lineHeight: 1.7,
                  color: "var(--t-text-secundar-pe-inchis)",
                  textWrap: "pretty",
                }}
              >
                {data.descriere}
              </p>
            )}
          </div>

          {/*
            `overflowWrap: "anywhere"` și `minWidth: 0`: o adresă de forma
            contact@cabinetdepsihoterapieanghelalexandru.ro n-are niciun spațiu
            la care browserul să o rupă, așa că iese din coloană și împinge toată
            pagina afară din ecran. Măsurat pe un telefon de 390px: documentul
            ieșea lat de 431.
          */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: 0,
              fontSize: "16px",
              overflowWrap: "anywhere",
            }}
          >
            {data.telefon && (
              <a href={`tel:${data.telefon.replace(/\s/g, "")}`} style={{ color: "inherit", textDecoration: "none" }}>
                {data.telefon}
              </a>
            )}
            {data.email && (
              <a href={`mailto:${data.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                {data.email}
              </a>
            )}
            {data.adresa && (
              <span style={{ color: "var(--t-text-secundar-pe-inchis)" }}>{data.adresa}</span>
            )}
          </div>

          {retele.length > 0 && (
            <nav
              aria-label="Pe rețele"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: 0,
                fontSize: "16px",
                overflowWrap: "anywhere",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  color: "var(--t-text-secundar-pe-inchis)",
                }}
              >
                Pe rețele
              </p>
              {retele.map((retea) => (
                <a
                  key={retea.adresa}
                  href={retea.adresa}
                  // Profilul e pe alt site: `noopener` ca pagina deschisă să nu
                  // poată ajunge la fereastra cabinetului prin `window.opener`.
                  target="_blank"
                  rel="me noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {retea.nume}
                </a>
              ))}
            </nav>
          )}

          {linkuri.length > 0 && (
            <nav
              aria-label="Legături din subsol"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                minWidth: 0,
                fontSize: "16px",
                overflowWrap: "anywhere",
              }}
            >
              {linkuri.map((link) => (
                <a key={link.href} href={link.href} style={{ color: "inherit", textDecoration: "none" }}>
                  {link.text}
                </a>
              ))}
            </nav>
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
            fontSize: "14px",
            color: "var(--t-text-secundar-pe-inchis)",
          }}
        >
          <span>
            © {an} {data.nume}
          </span>
          {data.acreditare && <span>{data.acreditare}</span>}
        </div>
      </div>
    </footer>
  );
}
