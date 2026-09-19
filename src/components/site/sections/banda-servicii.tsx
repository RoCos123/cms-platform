import type { SectionTone } from "@/lib/templates";
import type { Serviciu } from "@/lib/servicii";

/**
 * Banda cu servicii — o fâșie îngustă cu numele serviciilor, care se derulează
 * lin pe fundalul de accent.
 *
 * Auto-conținut: numele vin din Servicii, ca la „Serviciile mele", nu din rândul
 * secțiunii. Fără niciun serviciu publicat, banda dispare — un titlu care se
 * mișcă în gol arată a defect.
 *
 * Mișcarea stă într-un `<style>` CHIAR în componentă, nu în CSS-ul global: un
 * `@keyframes` nu se poate scrie inline, iar previzualizarea din panou rulează
 * într-un iframe propriu, care n-ar vedea stilul global. Așa, banda se mișcă și
 * pe site, și în previzualizare. Cine a cerut mai puțină mișcare
 * (`prefers-reduced-motion`) primește banda OPRITĂ, nu absentă.
 *
 * `tone` se primește ca la orice secțiune, dar nu-l folosește: banda e mereu pe
 * accent, ca în șablonul-model — CU O EXCEPȚIE, `discreta`.
 */
export function BandaServicii({
  servicii,
  discreta,
}: {
  servicii: Serviciu[];
  tone?: SectionTone;
  /**
   * Varianta discretă a referinței „Liniște": fundal crem (nu accentul plin),
   * cuvinte și steaua despărțitoare estompate uniform, ca banda decorativă din
   * josul hero-ului acolo. Corectat 19 sept. 2026 — decizia „mereu pe accent"
   * de mai sus era corectă pentru șablonul ei de origine, dar pe crem un accent
   * plin arată ca o bară verde fără legătură cu restul paginii. Doar „Liniște".
   */
  discreta?: boolean;
}) {
  const nume = servicii.map((s) => s.titlu).filter((t) => t?.trim());
  if (nume.length === 0) return null;

  // O jumătate destul de lată cât să umple ecranul și cu puține servicii; apoi
  // două jumătăți IDENTICE, ca bucla la -50% să se închidă fără salt.
  const repetari = Math.max(2, Math.ceil(10 / nume.length));
  const jumatate = Array.from({ length: repetari }, () => nume).flat();
  const track = [...jumatate, ...jumatate];

  return (
    <div
      style={{
        position: "relative",
        background: discreta ? "var(--t-fundal)" : "var(--t-accent)",
        color: discreta ? "var(--t-text-secundar)" : "var(--t-accent-text)",
        overflow: "hidden",
        paddingBlock: "clamp(14px, 1.7vw, 22px)",
      }}
    >
      {/* Rândul care se mișcă e decor: dublat și derulat, n-are ce citi un
          cititor de ecran în el. Numele „adevărate" stau o dată, ascunse vizual,
          mai jos.

          La `discreta`, opacitatea stă AICI, pe tot rândul deodată (cuvinte ȘI
          stele), ca la referință — un singur număr, nu o dimare separată pe
          fiecare stea, care ar fi scos-o din pas cu textul. */}
      <div
        className="banda-servicii-track"
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          willChange: "transform",
          opacity: discreta ? 0.55 : undefined,
        }}
      >
        {track.map((titlu, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "var(--t-font-secundar)",
                fontStyle: "italic",
                fontSize: "clamp(18px, 2vw, 26px)",
                lineHeight: 1.2,
                paddingInline: "clamp(22px, 3.4vw, 48px)",
              }}
            >
              {titlu}
            </span>
            <span
              style={{
                color: discreta ? "var(--t-accent)" : undefined,
                opacity: discreta ? 1 : 0.55,
                // La `discreta`, steaua ia ACELEAȘI proprietăți de font ca
                // cuvântul de alături (serif italic, aceeași mărime) — corectat
                // 19 sept. 2026, găsit prin măsurătoare pe pixeli: fără ele,
                // glifa ✦ cade pe fontul principal sans-serif, subțire, la
                // ~60% din înălțimea literelor mari — la referință steaua e
                // cât o literă mare, un sparkle plin, nu o punctuație firavă.
                fontFamily: discreta ? "var(--t-font-secundar)" : undefined,
                fontStyle: discreta ? "italic" : undefined,
                fontSize: discreta ? "clamp(18px, 2vw, 26px)" : "clamp(11px, 1.1vw, 15px)",
              }}
            >
              ✦
            </span>
          </span>
        ))}
      </div>

      {/* Lista, o singură dată, pentru cititoarele de ecran. */}
      <span
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clipPath: "inset(50%)",
          whiteSpace: "nowrap",
        }}
      >
        Servicii: {nume.join(", ")}.
      </span>

      <style>{`
        @keyframes banda-servicii-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .banda-servicii-track { animation: banda-servicii-scroll 45s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .banda-servicii-track { animation: none; } }
      `}</style>
    </div>
  );
}
