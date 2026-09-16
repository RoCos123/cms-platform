import type { CampSchema } from "@/lib/sectiuni";

/**
 * Setările site-ului, descrise în același fel ca secțiunile — deci editate cu
 * același formular. Nu e o coincidență fericită, e motivul pentru care
 * formularul a fost făcut să se construiască dintr-o descriere.
 *
 * Datele astea nu stau într-un singur loc: numele cabinetului e o coloană în
 * `sites` (singura pe care proprietarul are dreptul s-o schimbe — domeniul e
 * blocat prin grant, vezi migrarea de întărire), restul stau în grupurile
 * `brand` și `seo` din `site_settings`. Împărțirea o face acțiunea de salvare;
 * clientul vede un singur formular, fiindcă pentru el sunt un singur lucru.
 */

export const CAMPURI_CABINET: CampSchema[] = [
  {
    tip: "text",
    cheie: "nume",
    /**
     * Se chema „Numele tău sau al cabinetului”, iar acel „sau” a fost rădăcina
     * unei probleme întregi: din câmp nu se putea ști dacă textul e numele unui
     * om sau al unei firme, deci nu se putea spune motoarelor de căutare cine e
     * cine. Acum omul își are câmpul lui, mai jos, iar ăsta e fără echivoc.
     */
    eticheta: "Numele cabinetului",
    hint: "Cum e înregistrat, întreg. Apare sus în antet și în subsolul fiecărei pagini.",
    obligatoriu: true,
    max: 120,
  },
  {
    tip: "text",
    cheie: "numeleTau",
    eticheta: "Numele tău",
    /**
     * Singurul câmp din formular care NU se vede nicăieri pe site, de aceea
     * hint-ul o spune din prima: un client care completează ceva și nu-l
     * regăsește pe pagină crede că s-a stricat salvarea.
     *
     * Există fiindcă numele cabinetului e, prin lege, „Cabinet Individual de
     * Psihologie <nume>”. Din el nu se poate scoate numele omului fără să
     * ghicim — iar din ghicit ies date false, pe care motoarele de căutare le
     * pedepsesc aruncând tot, nu doar rândul greșit.
     */
    hint: "Nu apare pe site. Îl citesc doar motoarele de căutare, ca să știe că în spatele cabinetului e un om — și să te găsească cine te caută pe numele tău, nu pe al cabinetului.",
    max: 80,
  },
  {
    tip: "text",
    cheie: "subtitlu",
    eticheta: "Rândul mic de sub nume",
    hint: "Ex.: Psiholog clinician. Lasă gol dacă nu vrei niciunul.",
    max: 80,
  },
  {
    tip: "imagine",
    cheie: "logo",
    eticheta: "Logo",
    hint: "Opțional. Apare sus în antet și jos în subsol, lângă nume. Merge cel mai bine un semn mic pe fundal transparent (PNG), care se vede și pe fundal deschis, și pe cel închis. Fără el, apare inițiala și numele.",
    dimensiuni: "Recomandat: circa 400 × 150 px (lat) sau ~250 × 250 px (pătrat).",
  },
  {
    tip: "text",
    cheie: "telefon",
    eticheta: "Telefon",
    hint: "Apare în antet și în subsol, ca număr pe care se poate apăsa.",
    max: 40,
  },
  {
    tip: "text",
    cheie: "whatsapp",
    eticheta: "WhatsApp",
    hint: "Numărul tău de WhatsApp. Apare ca un buton verde, fix în colțul din dreapta-jos, pe care vizitatorul apasă și-ți scrie direct. Lasă gol dacă nu vrei butonul. Scrie-l cum vrei — „0722…” sau „+40 722…”, îl aranjăm noi.",
    max: 40,
  },
  { tip: "email", cheie: "email", eticheta: "Adresa de email", max: 200 },
  { tip: "text", cheie: "adresa", eticheta: "Adresa cabinetului", max: 200 },
  {
    tip: "text",
    cheie: "acreditare",
    eticheta: "Acreditare",
    hint: "Ex.: Membru al Colegiului Psihologilor din România.",
    max: 160,
  },
  {
    tip: "textLung",
    cheie: "descriereSubsol",
    eticheta: "Textul din subsol",
    hint: "Una-două propoziții despre ce faci, sub numele cabinetului, jos pe pagină.",
    randuri: 3,
    max: 300,
  },
];

/**
 * Etichetele descriu ce SE VEDE, nu cum se numesc lucrurile în meseria noastră.
 * „Titlul din rezultatele Google" presupune că omul știe deja din ce e făcut un
 * rezultat Google; „titlul albastru" e ceva ce a văzut de mii de ori.
 *
 * Limitele nu sunt inventate: Google taie titlul pe la 60 de caractere și
 * descrierea pe la 160. Un text mai lung nu e o eroare, dar se termină cu „…"
 * în rezultate — deci merită spus dinainte, nu descoperit după.
 */
export const CAMPURI_SEO: CampSchema[] = [
  {
    tip: "text",
    cheie: "titlu",
    eticheta: "Titlul albastru, pe care se apasă",
    hint: "Dacă îl lași gol, se folosește numele tău. Peste 60 de caractere, Google îl taie.",
    max: 60,
  },
  {
    tip: "textLung",
    cheie: "descriere",
    eticheta: "Cele două rânduri gri de sub titlu",
    hint: "Singurul text pe care îl citește cineva înainte să decidă dacă intră pe site. Scrie-l pentru omul care caută ajutor, nu pentru Google. Peste 160 de caractere, se taie.",
    randuri: 3,
    max: 160,
  },
];

/**
 * Profilurile de pe rețele.
 *
 * Fac două lucruri deodată, și al doilea e cel care contează: apar ca linkuri
 * în subsolul site-ului, dar ajung și în datele structurate, ca `sameAs` —
 * adică îi spun lui Google că pagina de Facebook și site-ul sunt aceeași
 * persoană. Fără ele, motorul de căutare vede două prezențe fără nicio legătură.
 *
 * `doarExtern` fiindcă o adresă relativă („/facebook”) ar produce un link mort
 * în subsol și, mai rău, i-ar spune lui Google că profilul e găzduit pe
 * domeniul cabinetului.
 *
 * Patru, nu toate câte există: astea sunt cele pe care le folosesc cabinetele
 * din România. Una nouă e un rând în lista de mai jos — formularul, validarea,
 * subsolul și datele structurate o preiau singure.
 */
export const CAMPURI_SOCIAL: CampSchema[] = [
  {
    tip: "adresa",
    cheie: "facebook",
    eticheta: "Facebook",
    hint: "Adresa paginii tale, copiată din bara browserului. Ex.: https://facebook.com/cabinetulmeu",
    doarExtern: true,
    max: 200,
  },
  {
    tip: "adresa",
    cheie: "instagram",
    eticheta: "Instagram",
    doarExtern: true,
    max: 200,
  },
  {
    tip: "adresa",
    cheie: "linkedin",
    eticheta: "LinkedIn",
    doarExtern: true,
    max: 200,
  },
  {
    tip: "adresa",
    cheie: "youtube",
    eticheta: "YouTube",
    doarExtern: true,
    max: 200,
  },
  {
    tip: "adresa",
    cheie: "tiktok",
    eticheta: "TikTok",
    doarExtern: true,
    max: 200,
  },
];

/** Ce citește site-ul public din `site_settings.brand`. */
export type Brand = {
  /** Numele psihologului ca om, separat de numele legal al cabinetului. */
  numeleTau?: string;
  subtitlu?: string;
  /**
   * Logoul, ca orice imagine din panou: `uploadId` e sursa de adevăr, `url` se
   * re-semnează la citire (adresa poate expira). Lipsă = subsolul arată doar numele.
   */
  logo?: { uploadId?: string; url?: string; altText?: string };
  telefon?: string;
  whatsapp?: string;
  email?: string;
  adresa?: string;
  acreditare?: string;
  descriereSubsol?: string;
};

export type Seo = {
  titlu?: string;
  descriere?: string;
};

/** Ce citește site-ul public din `site_settings.social`. */
export type Social = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
};

/** Numele rețelelor, în ordinea în care apar în subsol. */
const RETELE: { cheie: keyof Social; nume: string }[] = [
  { cheie: "facebook", nume: "Facebook" },
  { cheie: "instagram", nume: "Instagram" },
  { cheie: "linkedin", nume: "LinkedIn" },
  { cheie: "youtube", nume: "YouTube" },
  { cheie: "tiktok", nume: "TikTok" },
];

export type LinkSocial = { nume: string; adresa: string };

/**
 * Profilurile completate, în ordine, doar cele care chiar duc undeva.
 *
 * Filtrul se repetă aici, deși formularul validează deja: în bază pot exista
 * valori scrise înainte ca validarea să ceară adresă întreagă, iar un link mort
 * în subsolul unui client e vizibil pentru oricine intră pe site.
 */
export function linkurileSociale(social: Social | null | undefined): LinkSocial[] {
  if (!social) return [];

  return RETELE.flatMap(({ cheie, nume }) => {
    const adresa = social[cheie]?.trim();
    if (!adresa) return [];

    try {
      const url = new URL(adresa);
      if (url.protocol !== "https:" && url.protocol !== "http:") return [];
      if (!url.hostname.includes(".")) return [];
    } catch {
      return [];
    }

    return [{ nume, adresa }];
  });
}

/**
 * Paginile care pot fi pornite sau oprite din panou.
 *
 * Nu orice pagină e opțională: prima pagină există mereu. Astea două au sens
 * doar dacă clientul chiar le folosește — un cabinet care nu scrie articole n-are
 * de ce să aibă un blog gol la /blog.
 */
export type PaginaOptionala = "servicii" | "blog";

/**
 * Lipsa unei valori înseamnă PORNIT: cine n-a atins comutatorul are site-ul așa
 * cum i l-am construit. O valoare implicită „oprit" ar fi făcut ca o pagină
 * scrisă de client să dispară în tăcere la prima citire a setărilor.
 */
export type Pagini = Partial<Record<PaginaOptionala, boolean>>;

export function paginaEsteActiva(
  pagini: Pagini | null | undefined,
  care: PaginaOptionala,
): boolean {
  return pagini?.[care] !== false;
}
