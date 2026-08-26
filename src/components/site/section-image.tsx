import Image from "next/image";

/**
 * Gazda ale cărei imagini pot trece prin optimizatorul Next (aceeași din
 * `next.config.ts`). `NEXT_PUBLIC_*` e înlocuită la build, deci se citește și
 * într-o componentă de server, și în una de client.
 */
const GAZDA_OPTIMIZABILA = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
})();

function poateFiOptimizata(src: string): boolean {
  if (!GAZDA_OPTIMIZABILA) return false;
  try {
    return new URL(src).hostname === GAZDA_OPTIMIZABILA;
  } catch {
    // Adresă relativă („/imagini/x.jpg") — servită de noi, deci optimizabilă.
    return src.startsWith("/");
  }
}

/**
 * Imaginea unei secțiuni de pe site-ul public.
 *
 * `next/image` optimizează, dar ARUNCĂ dacă gazda nu e în `remotePatterns` —
 * iar o adresă lipită de client de pe alt site ar dărâma toată pagina publică.
 * Regula proiectului e că un vizitator nu vede niciodată o eroare fiindcă
 * cineva a pus o valoare neprevăzută în panou.
 *
 * Deci: gazdele cunoscute trec prin optimizator, restul se randează ca `<img>`
 * simplu. Imaginea se vede în ambele cazuri; diferă doar performanța.
 *
 * `aspectRatio` e obligatoriu, nu opțional: fără el, înălțimea imaginii se află
 * abia după încărcare și conținutul de dedesubt sare (CLS).
 */
export function SectionImage({
  src,
  alt,
  aspectRatio,
  sizes = "(max-width: 720px) 100vw, 50vw",
  priority = false,
}: {
  src: string;
  alt: string;
  aspectRatio: string;
  sizes?: string;
  priority?: boolean;
}) {
  const stilInvelis: React.CSSProperties = {
    position: "relative",
    aspectRatio,
    overflow: "hidden",
    background: "color-mix(in oklab, currentColor 8%, transparent)",
  };

  return (
    <div style={stilInvelis}>
      {poateFiOptimizata(src) ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- vezi comentariul de mai sus: gazdă necunoscută.
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}
