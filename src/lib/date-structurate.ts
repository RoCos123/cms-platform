/**
 * Datele structurate (JSON-LD) pe care le citesc motoarele de căutare.
 *
 * Se generează singure din ce a completat clientul în Setări — nu există niciun
 * câmp în plus de completat pentru „SEO”, și nici ocazia de a-l uita. Ăsta e
 * rostul: în original, tot ce ținea de indexare era o listă de bifat manual,
 * iar ce se bifează manual se și uită.
 *
 * Modulul e pur — fără rețea, fără `next/headers` — ca să poată fi probat
 * direct cu Node (`e2e/date-structurate.proba.mjs`).
 */

/** Ce știm despre cabinet, din grupurile `brand` și `seo` ale Setărilor. */
export type Cabinet = {
  /** Numele legal al cabinetului: „Cabinet Individual de Psihologie <nume>”. */
  nume: string;
  /** Numele psihologului ca om. Gol la cabinetele care nu l-au completat. */
  numePersoana?: string;
  subtitlu?: string;
  telefon?: string;
  email?: string;
  adresa?: string;
  acreditare?: string;
  descriere?: string;
};

/** O întrebare din secțiunea „Întrebări frecvente”. */
export type Intrebare = { intrebare: string; raspuns: string };

/** Cât îi trebuie unui articol ca să se descrie singur. */
export type ArticolulPaginii = {
  titlu: string;
  extras?: string;
  publicatLa?: string | null;
  imagine?: string | null;
  /** Adresa absolută a articolului. */
  adresa: string;
};

type Obiect = Record<string, unknown>;

/**
 * Ancorele prin care fișa cabinetului și cea a psihologului se leagă între ele.
 *
 * Fără ele, ar fi două fișe fără nicio legătură pe aceeași pagină, iar un motor
 * de căutare n-ar avea de unde ști că omul ăla ține cabinetul ăla. Cu ele, e o
 * singură poveste: o firmă, fondată de un om, care lucrează acolo.
 */
const ANCORA_CABINET = "#cabinet";
const ANCORA_PSIHOLOG = "#psiholog";

function ancora(baza: URL, care: string): string {
  return new URL(care, baza).toString();
}

/**
 * Scoate câmpurile goale dintr-un obiect.
 *
 * Un `"telephone": ""` nu e o informație lipsă pentru un motor de căutare, e o
 * informație greșită: spune că am completat câmpul și că atât e numărul.
 */
function faraGoluri(obiect: Obiect): Obiect {
  return Object.fromEntries(
    Object.entries(obiect).filter(([, valoare]) => {
      if (valoare === undefined || valoare === null) return false;
      if (typeof valoare === "string") return valoare.trim() !== "";
      if (Array.isArray(valoare)) return valoare.length > 0;
      return true;
    }),
  );
}

/**
 * Cabinetul, ca `LocalBusiness`.
 *
 * `null` fără adresă, deliberat. Google cere adresa la `LocalBusiness`, iar o
 * fișă de firmă fără ea nu e o fișă pe jumătate — e una respinsă la validare.
 * Un psiholog care lucrează doar online chiar n-are adresă de pus; el primește
 * în schimb fișa de om, din `datelePsihologului`.
 *
 * Numele de aici e cel legal al cabinetului. Nu se pune niciodată pe o fișă de
 * `Person`: o firmă numită după om e ceva obișnuit, un om numit „Cabinet
 * Individual de Psihologie Maria Ionescu” nu există.
 */
export function dateleCabinetului(baza: URL, cabinet: Cabinet): Obiect | null {
  if (!cabinet.adresa?.trim()) return null;

  const arePsiholog = Boolean(cabinet.numePersoana?.trim());

  return faraGoluri({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": ancora(baza, ANCORA_CABINET),
    name: cabinet.nume,
    address: cabinet.adresa,
    url: baza.toString(),
    telephone: cabinet.telefon,
    email: cabinet.email,
    description: cabinet.descriere,
    /**
     * Când știm cine e omul, faptele care țin de el se mută pe fișa lui.
     * „Psiholog clinician” e o meserie, iar la Colegiul Psihologilor sunt
     * membri oameni, nu clădiri. Stau aici doar cât timp n-avem pe cine altul
     * să le punem — mai bine agățate de firmă decât nescrise deloc.
     */
    disambiguatingDescription: arePsiholog ? undefined : cabinet.subtitlu,
    memberOf:
      !arePsiholog && cabinet.acreditare
        ? { "@type": "Organization", name: cabinet.acreditare }
        : undefined,
    founder: arePsiholog ? { "@id": ancora(baza, ANCORA_PSIHOLOG) } : undefined,
  });
}

/**
 * Psihologul, ca `Person`.
 *
 * `null` până când clientul își scrie numele ca om în Setări. Nu se deduce
 * tăind „Cabinet Individual de Psihologie ” din numele firmei: merge la cei
 * care scriu exact forma aia și iese aiurea la „C.I.P. Maria Ionescu” sau
 * „Cabinet psihologic dr. Maria Ionescu”. Iar un nume fals aici nu strică doar
 * rândul lui — Google poate arunca tot blocul, cu telefon și adresă cu tot.
 *
 * Nu depinde de adresă: un psiholog care lucrează doar online n-are fișă de
 * firmă, dar rămâne un om cu nume, meserie și acreditare. Înainte, el nu avea
 * absolut nicio dată structurată.
 */
export function datelePsihologului(baza: URL, cabinet: Cabinet): Obiect | null {
  const nume = cabinet.numePersoana?.trim();
  if (!nume) return null;

  return faraGoluri({
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ancora(baza, ANCORA_PSIHOLOG),
    name: nume,
    url: baza.toString(),
    jobTitle: cabinet.subtitlu,
    telephone: cabinet.telefon,
    email: cabinet.email,
    memberOf: cabinet.acreditare
      ? { "@type": "Organization", name: cabinet.acreditare }
      : undefined,
    worksFor: cabinet.adresa?.trim() ? { "@id": ancora(baza, ANCORA_CABINET) } : undefined,
  });
}

/**
 * Întrebările frecvente, ca `FAQPage`.
 *
 * `null` când nu există niciuna. Regula lui Google e că `FAQPage` se pune doar
 * unde întrebările CHIAR se văd pe pagină; de asta apelantul trebuie să dea
 * întrebările secțiunii vizibile, nu tot ce e scris în panou.
 */
export function dateleIntrebarilor(intrebari: Intrebare[]): Obiect | null {
  const bune = intrebari.filter((i) => i.intrebare?.trim() && i.raspuns?.trim());
  if (bune.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: bune.map((i) => ({
      "@type": "Question",
      name: i.intrebare,
      acceptedAnswer: { "@type": "Answer", text: i.raspuns },
    })),
  };
}

/**
 * Un articol, ca `BlogPosting`.
 *
 * `author` e omul, când îi știm numele — un articol despre anxietate scris de un
 * psiholog cu nume și acreditare cântărește altfel decât unul semnat de o firmă.
 *
 * Când nu-l știm, autorul e `Organization`, niciodată `Person` cu numele
 * cabinetului. Asimetria e aceeași ca pe prima pagină: o firmă numită după om e
 * ceva obișnuit, deci `Organization` rămâne adevărat oricum; un `Person` numit
 * „Cabinet Individual de Psihologie Maria Ionescu” nu e nimeni.
 *
 * `publisher` rămâne mereu cabinetul: el ține site-ul, indiferent cine scrie.
 *
 * Fără `dateModified`: citirea articolului nu aduce `updated_at`, iar o dată
 * inventată acolo i-ar spune lui Google că textul se rescrie la fiecare vizită.
 */
export function dateleArticolului(
  cabinet: Cabinet,
  articol: ArticolulPaginii,
): Obiect {
  return faraGoluri({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: articol.titlu,
    description: articol.extras,
    datePublished: articol.publicatLa ?? undefined,
    image: articol.imagine ?? undefined,
    mainEntityOfPage: articol.adresa,
    author: cabinet.numePersoana?.trim()
      ? { "@type": "Person", name: cabinet.numePersoana.trim() }
      : { "@type": "Organization", name: cabinet.nume },
    publisher: { "@type": "Organization", name: cabinet.nume },
  });
}

/**
 * Datele, gata de pus într-un `<script type="application/ld+json">`.
 *
 * Fiecare `<` devine `\u003c`. NU e exces de prudență: textul de aici e scris
 * de client în panou, iar un răspuns de la „Întrebări frecvente” care conține
 * `</script>` ar închide blocul mai devreme și ar lăsa restul textului să intre
 * în pagină ca HTML. Adică oricine poate scrie în panou ar putea scrie și cod
 * în pagina publică.
 *
 * `\u003c` e echivalent cu `<` înăuntrul unui șir JSON, deci datele rămân
 * exact aceleași pentru cine le citește.
 */
export function caJsonLd(date: (Obiect | null)[]): string | null {
  const bune = date.filter((d): d is Obiect => d !== null);
  if (bune.length === 0) return null;

  return JSON.stringify(bune.length === 1 ? bune[0] : bune).replace(/</g, "\\u003c");
}
