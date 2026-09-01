import Link from "next/link";

/**
 * Banda pe care o vede DOAR clientul, pe site-ul lui încă nepublicat.
 *
 * Fără ea, ar deschide site-ul, l-ar vedea întreg și ar crede că e în aer — iar
 * apoi s-ar mira că nu-l găsește nimeni. Banda spune exact cele două lucruri de
 * care are nevoie: că numai el îl vede, și pe unde se publică.
 *
 * `position: sticky`, nu `fixed`: fixată, ar acoperi conținutul la derulare pe
 * telefon, exact acolo unde ecranul e mic. Așa se dă la o parte cu pagina.
 */
export function BandaNepublicat() {
  return (
    <div
      role="status"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px 14px",
        padding: "10px 16px",
        background: "#1F2937",
        color: "#F9FAFB",
        fontSize: "14px",
        lineHeight: 1.5,
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <span>
        <strong style={{ fontWeight: 600 }}>Site-ul nu e încă publicat.</strong> Îl vezi doar tu,
        fiindcă ești conectat.
      </span>
      <Link
        href="/dashboard/setari"
        style={{ color: "#F9FAFB", textDecorationThickness: "1px", textUnderlineOffset: "3px" }}
      >
        Publică-l din Setări
      </Link>
    </div>
  );
}
