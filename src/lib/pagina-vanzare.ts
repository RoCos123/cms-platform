import { linkWhatsApp } from "@/lib/whatsapp";

/**
 * Pagina de vânzare — sitepsihologi.ro: textele ei scrise în cod și regulile mici
 * de care au nevoie deopotrivă browserul și serverul.
 *
 * DE CE UN SINGUR FIȘIER. Brieful din 9 oct. 2026 cere ca fiecare text al paginii
 * să se poată schimba dintr-un singur loc, fără umblat prin componente. Textele pe
 * care le scrie proprietarul stau în panou (secțiunile, Setări); cele pe care le
 * pune codul — etichetele formularului, butonul de pe cartonașele cu modele,
 * linkul din bară, textul alternativ al cartonașului de distribuire — stau AICI.
 * Un text nou al paginii de vânzare, scris în cod, vine tot aici.
 *
 * Nimic de aici nu se vede pe un site de cabinet: totul atârnă de marcajul
 * `sites.tip = 'vanzare'` (migrarea `pagina_de_vanzare`, citit în
 * `pagina-vanzare-date.ts`).
 *
 * Fișier neutru — nici „use client", nici „use server" — fiindcă îl citesc și
 * formularul din browser, și acțiunea de pe server. Fără bază de date, ca să se
 * poată proba în Node (`e2e/pagina-vanzare.proba.mjs`).
 */

export const TEXTE_VANZARE = {
  /** Bara de sus. „Modele" e nou (brief 2.1); celelalte sunt cele de pe orice site. */
  meniu: {
    modele: "Modele",
    despre: "Despre",
    servicii: "Servicii",
    blog: "Blog",
    contact: "Contact",
  },

  /** Butonul de pe fiecare cartonaș de model: duce la formular, cu modelul deja ales. */
  butonModel: "Vreau acest model",

  /** Textul alternativ al cartonașului de distribuire (imaginea care apare la un link trimis). */
  cartonasAlt: "sitepsihologi.ro: site-uri pentru cabinete de psihologie și psihoterapie",

  formular: {
    nume: "Numele tău",
    email: "Adresa de email",
    telefon: "Telefon",
    model: "Modelul preferat",
    /** Prima opțiune din listă, și cea aleasă din start: nimeni nu e pus să aleagă un model doar ca să poată trimite. */
    nehotarat: "Încă nu m-am hotărât",
    mesaj: "Mesaj",
    /** Lângă eticheta unui câmp care se poate lăsa gol. */
    optional: "(opțional)",
    politica: "Politica de confidențialitate",
    seTrimite: "Se trimite…",
    eroareTelefon: "Numărul de telefon nu pare complet.",
    eroareModel: "Alege unul dintre modelele din listă.",
  },

  /**
   * Etichetele datelor firmei (brief, punctul 4). Denumirea, CUI-ul, Registrul
   * Comerțului și sediul se scriu în Setări → „Datele firmei"; telefonul,
   * WhatsApp-ul și emailul, în Setări → „Datele cabinetului". O valoare goală nu
   * aduce nici eticheta ei pe pagină.
   */
  firma: {
    cui: "CUI",
    regCom: "Nr. Reg. Com.",
    sediu: "Sediu:",
    telefon: "Telefon",
    whatsapp: "WhatsApp",
    email: "E-mail",
  },

  /** Subsolul: o singură listă, aceleași linkuri ca bara de sus (brief 1.3). */
  subsol: {
    /** Nu se vede: e numele listei pentru cititoarele de ecran. */
    navigare: "Navigare",
    contact: "Contact",
  },
} as const;

/** Ce fel de site e. Toate site-urile sunt „cabinet", în afară de pagina de vânzare. */
export type TipSite = "cabinet" | "vanzare";

/**
 * Valoarea din bază → tipul site-ului. Orice altceva decât „vanzare" (lipsă,
 * greșeală de scriere, coloană încă inexistentă) înseamnă „cabinet": pasul greșit
 * într-o parte ar arăta unui cabinet un formular cu text liber — exact ce regula
 * din 28 aug. 2026 interzice.
 */
export function tipulDinValoare(valoare: unknown): TipSite {
  return valoare === "vanzare" ? "vanzare" : "cabinet";
}

/** Varianta secțiunii „portfolio" care e galeria de modele (cartonașe cu poză și nume). */
export const VARIANTA_MODELE = "vitrina";

/**
 * Atributul pus pe butonul „Vreau acest model". Formularul îl caută la clic și
 * alege modelul în listă — cele două părți trebuie să folosească același nume.
 */
export const ATRIBUT_MODEL = "data-model";

/** Un rând din `site_content`, cât e nevoie ca să găsim modelele. */
type RandSectiune = { key: string; variant: string | null; data: unknown };

/**
 * Numele modelelor, luate din galeria de pe pagină — singura listă de modele.
 *
 * Brieful (2.2) cere ca lista (nume, adresă demo, imagine) să stea într-un singur
 * loc: ea e secțiunea „portfolio" cu varianta „vitrina", editabilă din panou.
 * Formularul nu are o listă a lui: își ia opțiunile de aici, iar serverul verifică
 * alegerea tot față de lista asta. Un model adăugat sau redenumit în panou apare
 * singur și în formular.
 *
 * Fără nume gol și fără dubluri — o dublură ar face aceeași opțiune de două ori.
 */
export function numeleModelelor(randuri: readonly RandSectiune[]): string[] {
  const nume: string[] = [];

  for (const rand of randuri) {
    if (rand.key !== "portfolio" || rand.variant !== VARIANTA_MODELE) continue;

    const elemente = (rand.data as { elemente?: unknown } | null)?.elemente;
    if (!Array.isArray(elemente)) continue;

    for (const element of elemente) {
      const titlu = (element as { titlu?: unknown } | null)?.titlu;
      const curat = typeof titlu === "string" ? titlu.trim() : "";
      if (curat && !nume.includes(curat)) nume.push(curat);
    }
  }

  return nume;
}

/** Opțiunile listei „Modelul preferat": întâi „Încă nu m-am hotărât", apoi modelele. */
export function optiunileModelului(modele: readonly string[]): string[] {
  return [TEXTE_VANZARE.formular.nehotarat, ...modele.filter((m) => m !== TEXTE_VANZARE.formular.nehotarat)];
}

/** E alegerea una dintre opțiunile listei? Serverul nu primește altceva de la un om. */
export function modelulEsteValid(valoare: string, modele: readonly string[]): boolean {
  return optiunileModelului(modele).includes(valoare);
}

/** Datele firmei, curățate: un câmp gol sau doar cu spații lipsește de tot. */
export type DateFirma = {
  denumire?: string;
  cui?: string;
  regCom?: string;
  sediu?: string;
  telefon?: string;
  whatsapp?: string;
  email?: string;
  tva?: string;
};

/**
 * Din `site_settings.brand` → datele firmei.
 *
 * Denumirea, CUI-ul, Registrul Comerțului, sediul și TVA-ul vin din câmpurile
 * `firma…` (Setări → „Datele firmei"). Telefonul, WhatsApp-ul și emailul vin din
 * câmpurile pe care le are orice site (Setări → „Datele cabinetului"): sunt
 * aceleași numere care apar deja în bara de sus, în subsol și în bula verde, deci
 * se scriu o singură dată (hotărât cu proprietarul, 9 oct. 2026).
 */
export function dateleFirmei(brand: unknown): DateFirma {
  const sursa = (typeof brand === "object" && brand !== null ? brand : {}) as Record<string, unknown>;
  const curat = (cheie: string) => {
    const valoare = sursa[cheie];
    return typeof valoare === "string" && valoare.trim() !== "" ? valoare.trim() : undefined;
  };

  const firma: DateFirma = {
    denumire: curat("firmaDenumire"),
    cui: curat("firmaCui"),
    regCom: curat("firmaRegCom"),
    sediu: curat("firmaSediu"),
    telefon: curat("telefon"),
    whatsapp: curat("whatsapp"),
    email: curat("email"),
    tva: curat("firmaTva"),
  };
  // Fără chei goale: `{ cui: undefined }` și `{}` trebuie să fie același lucru.
  return Object.fromEntries(Object.entries(firma).filter(([, valoare]) => valoare !== undefined));
}

/**
 * Rândul legal din subsol: denumirea, CUI-ul, numărul din Registrul Comerțului și
 * sediul, despărțite prin „·". Fiecare bucată apare doar dacă e completată, cu
 * eticheta ei; fără nicio bucată, `null` — rândul nu se desenează deloc.
 */
export function rindulLegal(firma: DateFirma): string | null {
  const etichete = TEXTE_VANZARE.firma;
  const bucati = [
    firma.denumire,
    firma.cui && `${etichete.cui} ${firma.cui}`,
    firma.regCom && `${etichete.regCom} ${firma.regCom}`,
    firma.sediu && `${etichete.sediu} ${firma.sediu}`,
  ].filter((bucata): bucata is string => Boolean(bucata));

  return bucati.length > 0 ? bucati.join(" · ") : null;
}

/**
 * Telefonul, WhatsApp-ul și emailul (din „Datele cabinetului"), ca rânduri pentru
 * blocul de lângă formular — doar cele completate. Fiecare cu adresa lui: telefonul sună,
 * WhatsApp-ul deschide conversația, emailul deschide un mesaj. Un WhatsApp care
 * nu se poate transforma în adresă (scris pe jumătate) rămâne text, nu link mort.
 */
export function randurileDeContact(firma: DateFirma): { eticheta: string; valoare: string; href?: string }[] {
  const etichete = TEXTE_VANZARE.firma;
  const randuri: { eticheta: string; valoare: string; href?: string }[] = [];

  if (firma.telefon) {
    randuri.push({ eticheta: etichete.telefon, valoare: firma.telefon, href: `tel:${firma.telefon.replace(/[\s().-]/g, "")}` });
  }
  if (firma.whatsapp) {
    randuri.push({ eticheta: etichete.whatsapp, valoare: firma.whatsapp, href: linkWhatsApp(firma.whatsapp) ?? undefined });
  }
  if (firma.email) {
    randuri.push({ eticheta: etichete.email, valoare: firma.email, href: `mailto:${firma.email}` });
  }

  return randuri;
}
