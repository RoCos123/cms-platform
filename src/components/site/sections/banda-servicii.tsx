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
 * accent, ca în șablonul-model.
 */
export function BandaServicii({ servicii }: { servicii: Serviciu[]; tone?: SectionTone }) {
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
        background: "var(--t-accent)",
        color: "var(--t-accent-text)",
        overflow: "hidden",
        paddingBlock: "clamp(14px, 1.7vw, 22px)",
      }}
    >
      {/* Rândul care se mișcă e decor: dublat și derulat, n-are ce citi un
          cititor de ecran în el. Numele „adevărate" stau o dată, ascunse vizual,
          mai jos. */}
      <div
        className="banda-servicii-track"
        aria-hidden
        style={{
          display: "inline-flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          willChange: "transform",
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
            <span style={{ opacity: 0.55, fontSize: "clamp(11px, 1.1vw, 15px)" }}>✦</span>
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
