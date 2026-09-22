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
   * TOATĂ, iar locul rămas pe margini se umple cu o copie NECLARĂ a pozei
   * înseși, mărită și estompată. Pentru locurile unde poza e conținutul, nu
   * decorul: o captură de site din care lipsește o margine nu mai arată ce
   * trebuia să arate.
   *
   * De ce copia neclară și nu fundal simplu: căsuța trebuie să rămână de
   * aceeași formă la toate cartonașele (cerut de proprietar: „mărimea și forma
   * căsuței nu se schimbă"), dar o poză de altă formă lăsa atunci două dungi
   * albe, care se citeau ca o greșeală. Copia estompată ia culoarea chiar din
   * marginea capturii — la un site cu fundal crem, dunga iese crem — deci
   * marginea pare continuarea pozei, nu o gaură lângă ea. E tiparul folosit de
   * playerele video pentru filme de altă formă decât ecranul.
   *
   * Geometria nu lasă decât trei purtări când forma pozei nu e forma casetei:
   * tai din poză, o lași mai mică, sau o deformezi. A treia e exclusă — scrisul
   * dintr-o captură turtită se vede imediat. „taie" e prima, „intreaga" e a
   * doua, îmbrăcată ca să nu arate a lipsă.
   *
   * Nu depinde de nimic aflat dinainte: ține pentru orice fișier, fără să i se
   * știe măsurile. Variantele care potriveau caseta după măsurile pozei au
   * picat de trei ori la rând pe drumul până la ecran — fiecare verigă lipsă
   * le întorcea tăcut la tăiere, iar omul vedea „la fel ca înainte".
   */
  incadrare?: "taie" | "intreaga";
}) {
  const intreaga = incadrare === "intreaga";

  const stilInvelis: React.CSSProperties = {
    position: "relative",
    aspectRatio,
    overflow: "hidden",
    background: intreaga ? undefined : "color-mix(in oklab, currentColor 8%, transparent)",
  };

  const objectFit = intreaga ? "contain" : "cover";
  // Punctul focal spune ce parte RĂMÂNE la tăiere. Când nu se taie nimic, n-are
  // ce alege: poza se așază în mijlocul casetei.
  const objectPosition = intreaga ? "50% 50%" : pozitiaImaginii(pozitie);

  /*
    Fundalul de sub poza întreagă: aceeași poză, tăiată ca să umple caseta,
    estompată tare și mărită puțin. Mărirea acoperă marginile pe care `blur` le
    lasă transparente — fără ea s-ar vedea un chenar deschis pe tot conturul.

    Aceeași adresă ca poza din față, deci browserul o ia din memorie: nu e o a
    doua descărcare. `aria-hidden` fiindcă nu spune nimic în plus față de poza
    de deasupra, iar un cititor de ecran n-are de ce s-o audă de două ori.
  */
  const stilFundal: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    filter: "blur(28px)",
    transform: "scale(1.15)",
    // Nu la maximum: o margine prea vie ar trage ochiul de la captura din față.
    opacity: 0.55,
  };

  return (
    <div style={stilInvelis}>
      {intreaga && (
        // eslint-disable-next-line @next/next/no-img-element -- fundal decorativ, aceeași adresă deja descărcată.
        <img src={src} alt="" aria-hidden loading="lazy" decoding="async" style={stilFundal} />
      )}

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
