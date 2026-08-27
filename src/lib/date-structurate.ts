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
  nume: string;
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
 * Un psiholog care lucrează doar online chiar n-are adresă de pus, iar pentru
 * el datele astea n-ar trebui inventate.
 *
 * Fără `Person`, deși planul îl cerea: câmpul din Setări se cheamă „Numele tău
 * SAU al cabinetului”, deci nu se poate ști dacă „Cabinet Individual de
 * Psihologie Maria Ionescu” e o persoană sau o firmă. Un `Person` cu numele
 * unei firme e dată greșită, iar dată greșită e mai rău decât lipsă: Google o
 * ignoră pe toată. Se rezolvă cu o singură întrebare în plus în Setări.
 */
export function dateleCabinetului(baza: URL, cabinet: Cabinet): Obiect | null {
  if (!cabinet.adresa?.trim()) return null;

  return faraGoluri({
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: cabinet.nume,
    address: cabinet.adresa,
    url: baza.toString(),
    telephone: cabinet.telefon,
    email: cabinet.email,
    description: cabinet.descriere,
    // „Psiholog clinician” — ce fel de cabinet e, în cuvintele clientului.
    disambiguatingDescription: cabinet.subtitlu,
    // „Membru al Colegiului Psihologilor din România” — apartenența declarată.
    memberOf: cabinet.acreditare ? { "@type": "Organization", name: cabinet.acreditare } : undefined,
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
    author: { "@type": "Person", name: cabinet.nume },
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
