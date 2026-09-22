import Image from "next/image";
import { pozitiaImaginii, type PunctFocal } from "@/lib/punct-focal";

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
 *
 * `pozitie` (punctul focal) hotărăște ce rămâne în cadru când poza e tăiată. Un
 * `object-position` derivat din el; lipsă → „50% 50%", exact ca înainte.
 */
export function SectionImage({
  src,
  alt,
  aspectRatio,
  sizes = "(max-width: 720px) 100vw, 50vw",
  priority = false,
  pozitie,
  incadrare = "taie",
}: {
  src: string;
  alt: string;
  aspectRatio: string;
  sizes?: string;
  priority?: boolean;
  pozitie?: PunctFocal;
  /**
   * Ce se întâmplă când poza nu are exact forma casetei.
   *
   * `"taie"` (obișnuit, `object-fit: cover`) — poza umple caseta, iar ce
   * prisosește se taie. Bun peste tot unde poza e o ilustrație: cadrul rămâne
   * egal de la un card la altul, indiferent ce-a încărcat clientul.
   *
   * `"intreaga"` (`object-fit: contain`) — poza se micșorează până încape
   * TOATĂ, iar dacă rămâne loc pe margini, se vede fundalul de sub ea. Pentru
   * locurile unde poza însăși e conținutul, nu decorul: o captură de site din
   * care lipsește o margine nu mai arată ce trebuia să arate.
   *
   * De ce e o alegere și nu o deducere din măsuri: „intreaga" ține fără să
   * știe nimic despre fișier. Varianta care potrivea caseta după măsurile
   * pozei a picat de trei ori la rând în drumul până la ecran — fiecare
   * verigă lipsă o întorcea tăcut la tăiere, iar omul vedea „la fel ca
   * înainte". Aici nu mai e nimic de aflat: orice poză încape, oricare ar fi
   * măsurile ei și chiar dacă nu le știe nimeni.
   */
  incadrare?: "taie" | "intreaga";
}) {
  const intreaga = incadrare === "intreaga";

  const stilInvelis: React.CSSProperties = {
    position: "relative",
    aspectRatio,
    overflow: "hidden",
    // La „intreaga", fundalul rămâne al cardului: dunga de lângă poză trebuie
    // să pară parte din cartonaș, nu o gaură în el.
    background: intreaga ? undefined : "color-mix(in oklab, currentColor 8%, transparent)",
  };

  const objectFit = intreaga ? "contain" : "cover";
  // Punctul focal spune ce parte RĂMÂNE la tăiere. Când nu se taie nimic, n-are
  // ce alege: poza se așază în mijlocul casetei.
  const objectPosition = intreaga ? "50% 50%" : pozitiaImaginii(pozitie);

  return (
    <div style={stilInvelis}>
      {poateFiOptimizata(src) ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit, objectPosition }} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- vezi comentariul de mai sus: gazdă necunoscută.
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit, objectPosition }}
        />
      )}
    </div>
  );
}
