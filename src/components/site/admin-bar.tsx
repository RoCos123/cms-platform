import Link from "next/link";

/**
 * Bara de administrare: se vede pe site DOAR de proprietarul lui, conectat.
 *
 * Rezolvă o problemă reală: cineva care intră în panou o dată pe lună nu ține
 * minte adresa de conectare și nu are de unde s-o afle de pe propriul site.
 *
 * Se randează abia după ce `getSesiuneOptionala()` a confirmat și că omul e
 * autentificat, și că aparține ACESTUI site. Pentru un vizitator obișnuit,
 * componenta nu produce niciun octet — nici măcar un indiciu că site-ul are
 * panou.
 *
 * Deocamdată se randează din pagina principală, singura pagină publică. Când
 * apar și celelalte (blog, servicii), se mută într-un layout comun al site-ului
 * public, ca `linkEditare` să poată trimite la ecranul potrivit fiecărei pagini.
 *
 * Arată deliberat a unealtă, nu a parte din site: fundal închis, neutru, fără
 * culorile șablonului. Proprietarul trebuie să vadă instantaneu ce e site-ul lui
 * și ce e barele noastre — altfel ar încerca s-o editeze.
 */
export function AdminBar({ email, linkEditare }: { email: string; linkEditare: string }) {
  return (
    <nav
      aria-label="Bara de administrare"
      className="admin-bar"
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "4px",
        padding: "6px",
        borderRadius: "999px",
        background: "#16130F",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 28px rgba(0,0,0,0.28)",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "14px",
        color: "#FFFFFF",
      }}
    >
      <span
        title={email}
        className="admin-bar-email"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          paddingInline: "12px 8px",
          color: "rgba(255,255,255,0.62)",
          fontSize: "13px",
          maxWidth: "200px",
        }}
      >
        <span
          aria-hidden
          style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#5BBD7A", flexShrink: 0 }}
        />
        {/*
          Prescurtarea cu „…" stă pe un element propriu: `text-overflow` nu se
          aplică pe un container flex, iar pe cel de deasupra emailul s-ar fi
          tăiat sec, fără să se vadă că mai urmează ceva.
        */}
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {email}
        </span>
      </span>

      <Link href={linkEditare} style={LINK_PRINCIPAL}>
        Editează pagina
      </Link>
      <Link href="/dashboard" style={LINK_SECUNDAR}>
        Panou
      </Link>
    </nav>
  );
}

const LINK_SECUNDAR: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: "32px",
  paddingInline: "14px",
  borderRadius: "999px",
  color: "rgba(255,255,255,0.86)",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const LINK_PRINCIPAL: React.CSSProperties = {
  ...LINK_SECUNDAR,
  background: "#FFFFFF",
  color: "#16130F",
  fontWeight: 600,
};
