import Image from "next/image";

/**
 * Prin optimizator trec DOAR adresele relative — adică fișierele servite de noi,
 * din depozitul privat (`/imagini/<id>/<semnătură>`). `next.config.ts` nu mai
 * are nicio gazdă externă în `remotePatterns`, deci o adresă absolută dusă la
 * `<Image>` ar arunca și ar dărâma pagina publică a clientului.
 *
 * Regula proiectului e că un vizitator nu vede niciodată o eroare fiindcă cineva
 * a pus o valoare neprevăzută în panou. Deci adresele către alte site-uri, puse
 * de client, se randează ca `<img>` simplu: imaginea se vede, doar că
 * neoptimizată.
 */
function poateFiOptimizata(src: string): boolean {
  return src.startsWith("/");
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
