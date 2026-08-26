import Link from "next/link";

export type SiteHeaderData = {
  nume: string;
  /** Rândul mic de sub nume („PSIHOLOG CLINICIAN"). */
  subtitlu?: string;
  /** Inițiala din medalion, când nu există logo încărcat. */
  initiala?: string;
  linkuri?: { text: string; href: string }[];
  telefon?: string;
};

const LINKURI_IMPLICITE = [
  { text: "Despre", href: "#despre" },
  { text: "Servicii", href: "#servicii" },
  { text: "Blog", href: "#articole" },
  { text: "Contact", href: "#contact" },
];

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
  const linkuri = data.linkuri?.length ? data.linkuri : LINKURI_IMPLICITE;
  const initiala = data.initiala ?? data.nume.trim().charAt(0).toUpperCase();

  return (
    <header
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
          paddingInline: "clamp(20px, 5vw, 64px)",
          height: "76px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
        }}
      >
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit" }}
        >
          <span
            aria-hidden
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
          <span style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
            <span style={{ fontSize: "17px", fontWeight: 600 }}>{data.nume}</span>
            {data.subtitlu && (
              <span
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--t-text-secundar)",
                }}
              >
                {data.subtitlu}
              </span>
            )}
          </span>
        </Link>

        <nav
          aria-label="Navigare principală"
          style={{ display: "flex", gap: "28px", fontSize: "15px" }}
        >
          {linkuri.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{ color: "var(--t-text)", textDecoration: "none", whiteSpace: "nowrap" }}
            >
              {link.text}
            </a>
          ))}
        </nav>

        {data.telefon && (
          <a
            href={`tel:${data.telefon.replace(/\s/g, "")}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              height: "44px",
              paddingInline: "20px",
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
            {data.telefon}
          </a>
        )}
      </div>
    </header>
  );
}
