/**
 * Ce știe panoul despre secțiunile paginii principale: cum se numesc și ce
 * câmpuri au.
 *
 * Deliberat separat de `src/components/site/render-sections.tsx`: acela e
 * registrul de RANDARE și trage după el toate componentele site-ului public.
 *
 * Formularele de editare se GENEREAZĂ din descrierile de mai jos, nu se scriu
 * de mână pentru fiecare secțiune. Motivul e simplu: sunt douăsprezece secțiuni
 * azi și vor fi mai multe. Douăsprezece formulare scrise separat ar diverge —
 * unul ar valida altfel, altul ar arăta altfel, al treilea ar uita o etichetă.
 * Aici, o secțiune nouă înseamnă o intrare nouă în listă.
 *
 * Numele sunt cele confirmate în decizii-faza-0.md §6 („vocabularul e al
 * clientului, nu al developerului"), plus cele trei secțiuni descoperite în
 * șabloane și corecția `logos` din design/sabloane/README.md.
 */

type CampComun = {
  /** Cheia din JSON-ul secțiunii. */
  cheie: string;
  /** Eticheta din formular. Scrisă pentru client, nu pentru developer. */
  eticheta: string;
  /** Sub etichetă — explică la ce folosește câmpul, dacă nu e evident. */
  hint?: string;
  obligatoriu?: boolean;
};

export type CampSchema =
  | (CampComun & { tip: "text"; max?: number })
  /** Ca „text”, dar cu tastatură de email pe telefon și verificare a formei. */
  | (CampComun & { tip: "email"; max?: number })
  /**
   * O adresă către care duce un link. Verificată: fără asta, un text oarecare
   * scris aici produce un link care nu duce nicăieri, iar clientul n-are cum
   * să-și dea seama — pe pagină arată exact ca unul bun.
   */
  | (CampComun & {
      tip: "adresa";
      max?: number;
      /**
       * Cere o adresă completă către alt site (`https://`), nu una din site-ul
       * propriu. Pentru un profil de Facebook, un „/facebook” ar trece
       * validarea obișnuită și ar produce un link care nu duce nicăieri — iar
       * la datele structurate ar fi mai rău de atât: i-am spune lui Google că
       * profilul e găzduit chiar pe domeniul cabinetului.
       */
      doarExtern?: boolean;
    })
  /**
   * Partea din adresă care identifică elementul („consiliere-parentala”).
   * Se generează din alt câmp, dar rămâne editabilă: odată publicat ceva, adresa
   * lui nu mai trebuie să se schimbe singură când i se corectează titlul.
   */
  | (CampComun & {
      tip: "slug";
      dinCheia: string;
      prefix?: string;
      max?: number;
      /**
       * Adrese pe care câmpul nu le acceptă, fiindcă sunt deja ale altcuiva pe
       * site. Vezi `ADRESE_REZERVATE` în `@/lib/pagini`.
       */
      slugInterzise?: string[];
    })
  | (CampComun & {
      tip: "textLung";
      /** Limita în caractere. Oprește scrisul în casetă (`maxLength`). */
      max?: number;
      /**
       * Limita în cuvinte, pentru textele lungi.
       *
       * Caracterele sunt măsura potrivită pentru un titlu sau un extras, unde
       * contează dacă intră într-un rând. Pentru un articol, nimeni nu-și
       * numără caracterele — și nici nu poate ghici dacă 20.000 înseamnă mult
       * sau puțin. Cuvintele se pot compara cu ce a mai scris.
       *
       * Când e pusă, câmpul arată și cât ai scris până acum. Spre deosebire de
       * limita în caractere, asta NU oprește scrisul: o oprire bruscă la
       * jumătatea unui cuvânt, după o oră de scris, ar fi mai supărătoare decât
       * un mesaj la salvare.
       */
      maxCuvinte?: number;
      randuri?: number;
      /**
       * Textul e randat cu `CorpText`: fiecare rând e un paragraf, iar un rând
       * care începe cu `## ` e subtitlu.
       *
       * Când e pus, câmpul arată și regulile astea, cu un exemplu alături.
       * Nu se pot ghici — iar un client care nu le știe scrie tot articolul ca
       * pe un bloc compact, apoi se întreabă de ce arată prost pe site.
       */
      cuSubtitluri?: boolean;
    })
  | (CampComun & { tip: "numar"; min?: number; maxim?: number })
  /** Pereche text + adresă. În JSON: `{ text, href }`. */
  | (CampComun & { tip: "link" })
  /** În JSON: `{ url, altText, uploadId? }` — aceeași formă ca la încărcare. */
  | (CampComun & {
      tip: "imagine";
      /**
       * Dimensiunile recomandate, arătate CHIAR în zona de încărcare, înainte ca
       * omul să pună poza — ca să știe ce fișier să caute, nu să afle după ce a
       * încărcat ceva prea mic sau de altă formă. Se pune doar unde forma chiar
       * contează (logoul); la o poză obișnuită, care se taie oricum în ramă,
       * n-ar ajuta cu nimic.
       */
      dimensiuni?: string;
    })
  /**
   * Un document de descărcat, ales din bibliotecă. În JSON: `{ fisierId, url }`
   * — `fisierId` e sursa de adevăr, `url` se re-semnează la randare
   * (`rescrieAdreseleFisiere`), exact ca la imagini.
   */
  | (CampComun & { tip: "document" })
  /** Listă de rânduri de text simplu (paragrafe, detalii). */
  | (CampComun & { tip: "listaText"; etichetaElement: string; max?: number })
  /** Listă de elemente cu mai multe câmpuri fiecare (servicii, pași, mărturii). */
  | (CampComun & {
      tip: "lista";
      etichetaElement: string;
      campuri: CampSchema[];
      /** Ce câmp al elementului se afișează ca titlu al rândului în listă. */
      rezumatDin: string;
      max?: number;
    });

export type MetaSectiune = {
  cheie: string;
  nume: string;
  /** O propoziție care spune la ce folosește secțiunea, nu cum e construită. */
  descriere: string;
  /**
   * Poate apărea de mai multe ori pe aceeași pagină?
   *
   * Aici se ține regula, nu în baza de date: migrarea 20260826130000 a scos
   * constrângerea `unique (site_id, key)` tocmai fiindcă Postgres n-are cum să
   * știe că banda cu citat e repetabilă, iar secțiunea „Servicii” nu.
   */
  repetabila: boolean;
  campuri: CampSchema[];
  /**
   * Textul nu se editează aici, ci vine din altă parte a panoului. Secțiunea
   * are tot formular (titlu, câte articole), dar clientul trebuie să știe de la
   * început unde să caute conținutul.
   */
  continutDinAltaParte?: string;
};

/** Antetul repetat de aproape fiecare secțiune. Scris o dată, folosit peste tot. */
function campuriAntet(hintTitlu?: string): CampSchema[] {
  return [
    {
      tip: "text",
      cheie: "eyebrow",
      eticheta: "Etichetă mică",
      hint: "Cuvântul mic de deasupra titlului. Lasă gol dacă nu vrei niciunul.",
      max: 60,
    },
    { tip: "text", cheie: "titlu", eticheta: "Titlu", obligatoriu: true, hint: hintTitlu, max: 120 },
    {
      tip: "text",
      cheie: "titluAccent",
      eticheta: "Ultimele cuvinte din titlu",
      hint: "Se scriu cu alt font, înclinat. Ex.: titlu „Hai să”, accent „vorbim.”.",
      max: 80,
    },
  ];
}

const INTRO: CampSchema = {
  tip: "textLung",
  cheie: "intro",
  eticheta: "Text introductiv",
  hint: "Una-două propoziții sub titlu.",
  randuri: 3,
  max: 400,
};

const LISTA: MetaSectiune[] = [
  {
    cheie: "hero",
    nume: "Prima secțiune",
    descriere: "Ce vede omul în primele două secunde: cine ești și ce faci.",
    repetabila: false,
    campuri: [
      ...campuriAntet("Cel mai citit text de pe tot site-ul. Merită timp."),
      {
        tip: "textLung",
        cheie: "subtitlu",
        eticheta: "Text de sub titlu",
        hint: "Două-trei propoziții. Cui te adresezi și cu ce îl ajuți.",
        randuri: 3,
        max: 400,
      },
      {
        tip: "imagine",
        cheie: "imagine",
        eticheta: "Poza ta",
        hint: "Opțională. Apare lângă text. Merge cel mai bine una pătrată sau verticală — una lată se taie pe margini.",
      },
      {
        tip: "lista",
        cheie: "bulinePoza",
        eticheta: "Buline peste poză",
        etichetaElement: "bulină",
        rezumatDin: "mare",
        max: 2,
        hint: "Mici etichete care plutesc peste poză, ca „Răspund în / sub 24h”. Cel mult două, opționale. Fără ele, poza rămâne curată.",
        campuri: [
          {
            tip: "text",
            cheie: "emoji",
            eticheta: "Emoji",
            hint: "Un singur semn, ex.: 💬 sau 💚. Opțional.",
            max: 4,
          },
          {
            tip: "text",
            cheie: "mic",
            eticheta: "Rândul mic (sus)",
            hint: "Ex.: „Răspund în”. Opțional.",
            max: 40,
          },
          {
            tip: "text",
            cheie: "mare",
            eticheta: "Rândul mare (jos)",
            obligatoriu: true,
            hint: "Ex.: „sub 24h” sau „Sesiuni flexibile”.",
            max: 40,
          },
        ],
      },
      { tip: "link", cheie: "butonPrincipal", eticheta: "Butonul principal" },
      {
        tip: "link",
        cheie: "butonSecundar",
        eticheta: "Al doilea buton",
        hint: "Opțional. Ex.: „Vezi serviciile”.",
      },
    ],
  },
  {
    cheie: "aboutTeaser",
    nume: "Despre mine (pe prima pagină)",
    descriere: "Scurtă prezentare, cu trimitere către pagina completă.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      {
        tip: "listaText",
        cheie: "paragrafe",
        eticheta: "Paragrafe",
        etichetaElement: "paragraf",
        hint: "Fiecare rând de aici e un paragraf pe site.",
        obligatoriu: true,
        max: 6,
      },
      {
        tip: "textLung",
        cheie: "fraza",
        eticheta: "Fraza scoasă în evidență",
        hint: "Se scrie mai mare, înclinat. O propoziție care rezumă felul tău de a lucra.",
        randuri: 2,
        max: 240,
      },
      {
        tip: "listaText",
        cheie: "teme",
        eticheta: "Domenii / teme",
        etichetaElement: "temă",
        hint: "Etichete scurte cu ce lucrezi: Traumă, Anxietate, Cupluri, Somatic Experiencing. Apar sub text, ca niște etichete, pe șablonul Apropiere. Fără ele, nu apar.",
        max: 6,
      },
      {
        tip: "lista",
        cheie: "etichete",
        eticheta: "Repere scurte",
        etichetaElement: "reper",
        rezumatDin: "mare",
        max: 4,
        hint: "Câteva repere sub text, unul lângă altul, ca +5 / ani de experiență sau Atestat / liberă practică. Fără ele, nu apare nimic.",
        campuri: [
          {
            tip: "text",
            cheie: "mare",
            eticheta: "Textul mare",
            obligatoriu: true,
            hint: "Cifra sau cuvântul scos în față. Ex.: +5, Atestat, Online.",
            max: 40,
          },
          {
            tip: "text",
            cheie: "mic",
            eticheta: "Sub el, mărunt",
            hint: "Ex.: ani de experiență, de liberă practică, & fizic.",
            max: 60,
          },
        ],
      },
      {
        tip: "imagine",
        cheie: "imagine",
        eticheta: "Poza ta",
        hint: "Opțională. Apare lângă text. Merge cel mai bine una pătrată sau verticală — una lată se taie pe margini.",
      },
      { tip: "link", cheie: "buton", eticheta: "Buton" },
    ],
  },
  {
    cheie: "quote",
    nume: "Bandă cu citat",
    descriere: "Un singur gând, pe toată lățimea. Respiro între blocurile grele.",
    repetabila: true,
    campuri: [
      {
        tip: "textLung",
        cheie: "citat",
        eticheta: "Citatul",
        obligatoriu: true,
        randuri: 3,
        max: 300,
      },
      {
        tip: "text",
        cheie: "autor",
        eticheta: "Cine a spus-o",
        hint: "Lasă gol dacă e gândul tău.",
        max: 80,
      },
    ],
  },
  {
    cheie: "features",
    nume: "Serviciile mele",
    descriere: "Ce oferi. Textele vin din Servicii, nu de aici.",
    repetabila: false,
    continutDinAltaParte:
      "Serviciile se scriu la Servicii, în meniu — o singură dată, cu tot cu descrierea lungă. Aici alegi doar cum arată secțiunea de pe prima pagină și câte servicii se văd. Restul se citesc pe pagina de servicii.",
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "numar",
        cheie: "numar",
        eticheta: "Câte servicii se văd pe prima pagină",
        min: 1,
        maxim: 12,
        hint: "Lasă gol ca să le arăți pe toate. Cu pagina de servicii oprită, se arată oricum toate — altfel restul n-ar mai apărea nicăieri.",
      },
    ],
  },
  {
    cheie: "bandaServicii",
    nume: "Bandă cu servicii",
    descriere: "O fâșie îngustă care derulează numele serviciilor tale.",
    repetabila: false,
    continutDinAltaParte:
      "Banda arată numele serviciilor tale, unul după altul, mișcându-se lin. Nu scrii nimic aici — numele vin din Servicii, din meniu. O pornești sau o oprești din lista de secțiuni.",
    campuri: [],
  },
  {
    cheie: "howItWorks",
    nume: "Cum decurge colaborarea",
    descriere: "Pașii de la primul mesaj la ședințele propriu-zise.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "lista",
        cheie: "pasi",
        eticheta: "Pași",
        etichetaElement: "pas",
        rezumatDin: "titlu",
        max: 6,
        hint: "Numerele se pun singure, după ordinea de aici.",
        campuri: [
          { tip: "text", cheie: "titlu", eticheta: "Numele pasului", obligatoriu: true, max: 80 },
          {
            tip: "textLung",
            cheie: "descriere",
            eticheta: "Ce se întâmplă",
            obligatoriu: true,
            randuri: 3,
            max: 400,
          },
        ],
      },
    ],
  },
  {
    cheie: "logos",
    nume: "Apariții și acreditări",
    descriere: "Emisiuni, podcasturi, articole în presă.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "lista",
        cheie: "aparitii",
        eticheta: "Apariții",
        etichetaElement: "apariție",
        rezumatDin: "titlu",
        max: 12,
        campuri: [
          {
            tip: "text",
            cheie: "tip",
            eticheta: "Felul apariției",
            hint: "Ex.: Podcast, Emisiune TV, Interviu.",
            max: 40,
          },
          {
            tip: "text",
            cheie: "sursa",
            eticheta: "Unde a apărut",
            obligatoriu: true,
            hint: "Numele emisiunii, al podcastului sau al publicației.",
            max: 80,
          },
          { tip: "text", cheie: "titlu", eticheta: "Titlul discuției", obligatoriu: true, max: 140 },
          { tip: "textLung", cheie: "descriere", eticheta: "Despre ce a fost", randuri: 2, max: 300 },
          { tip: "text", cheie: "data", eticheta: "Când", hint: "Ex.: martie 2026", max: 40 },
          {
            tip: "adresa",
            cheie: "href",
            eticheta: "Link (video sau articol)",
            hint: "Un link de la YouTube face apariția video, cu buton de play. Orice alt link (articol, podcast, pagina emisiunii) rămâne „Vezi materialul →”.",
            max: 300,
          },
          { tip: "imagine", cheie: "imagine", eticheta: "Imagine" },
        ],
      },
    ],
  },
  {
    cheie: "pricing",
    nume: "Pachete",
    descriere: "Prețuri scrise pe față, în una până la patru variante.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      {
        tip: "lista",
        cheie: "pachete",
        eticheta: "Pachete",
        etichetaElement: "pachet",
        rezumatDin: "nume",
        // Patru încap pe un ecran de laptop fără să se micșoreze de necitit, iar
        // peste patru nimeni nu mai compară, ci se încurcă.
        max: 4,
        hint: "Scrie prețul așa cum vrei să-l citească omul, cu tot cu monedă.",
        campuri: [
          {
            tip: "text",
            cheie: "nume",
            eticheta: "Numele pachetului",
            obligatoriu: true,
            hint: "Ex.: Site complet, 5 ședințe, Evaluare psihologică.",
            max: 60,
          },
          {
            /*
             * Text, nu număr, dinadins. Un câmp numeric ar fi cerut și o monedă,
             * și o regulă de formatare, și tot n-ar fi putut scrie „de la 300 €”
             * sau „200 lei/an”. Aici prețul e o propoziție scurtă, nu o sumă cu
             * care se calculează ceva.
             */
            tip: "text",
            cheie: "pret",
            eticheta: "Prețul",
            obligatoriu: true,
            hint: "Ex.: 300 €, de la 250 lei, 200 lei/an.",
            max: 40,
          },
          {
            tip: "text",
            cheie: "subPret",
            eticheta: "Ce se înțelege prin preț",
            // Se chema un scurt calificativ („primul an inclus”), de-aici 60. Dar
            // clienții îl folosesc pentru o propoziție întreagă („3 ședințe
            // gratuite să ne cunoaștem și să facem planul”), care nu încăpea. Sub
            // preț se randează ca paragraf, deci un rând mai lung doar se rupe pe
            // două — nu strică pachetul.
            hint: "Ex.: primul an inclus, per ședință, sau o propoziție scurtă despre ce intră în preț.",
            max: 140,
          },
          {
            tip: "textLung",
            cheie: "descriere",
            eticheta: "Pe scurt, pentru cine e",
            randuri: 2,
            max: 240,
          },
          {
            tip: "listaText",
            cheie: "include",
            eticheta: "Ce include",
            etichetaElement: "rând",
            max: 8,
            hint: "Câte un lucru pe rând. Scrie ce primește omul, nu cum se cheamă pe dinăuntru.",
          },
          {
            /*
             * O etichetă, nu o bifă „evidențiat". Panoul n-are câmp de tip bifă,
             * dar asta nu e motivul: eticheta spune și DE CE e scos în față
             * („Cel mai ales", „Recomandat"), pe când o bifă doar l-ar colora.
             */
            tip: "text",
            cheie: "eticheta",
            eticheta: "Etichetă (scoate pachetul în față)",
            hint: "Ex.: Cel mai ales. Lasă gol la restul, altfel nu mai iese niciunul în evidență.",
            max: 24,
          },
          { tip: "link", cheie: "buton", eticheta: "Buton" },
        ],
      },
      {
        tip: "textLung",
        cheie: "nota",
        eticheta: "Notă sub pachete",
        randuri: 2,
        hint: "Ex.: Prețurile nu includ costul domeniului. Se plătește după ce site-ul e gata.",
        max: 300,
      },
    ],
  },
  {
    cheie: "testimonials",
    nume: "Păreri",
    descriere: "Mărturii de la oameni cu care ai lucrat.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      {
        tip: "lista",
        cheie: "marturii",
        eticheta: "Mărturii",
        etichetaElement: "mărturie",
        rezumatDin: "autor",
        max: 9,
        hint: "Publică o mărturie doar dacă ai acordul scris al persoanei.",
        campuri: [
          {
            tip: "textLung",
            cheie: "text",
            eticheta: "Ce a spus",
            obligatoriu: true,
            randuri: 4,
            max: 600,
          },
          {
            tip: "text",
            cheie: "autor",
            eticheta: "Cine",
            obligatoriu: true,
            hint: "De obicei doar inițialele sau prenumele.",
            max: 60,
          },
          {
            tip: "text",
            cheie: "context",
            eticheta: "Pe ce ați lucrat",
            hint: "Ex.: anxietate, consiliere de cuplu.",
            max: 80,
          },
        ],
      },
    ],
  },
  {
    cheie: "portfolio",
    nume: "Programe și materiale",
    descriere: "Ateliere, retreaturi, programe de grup.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "lista",
        cheie: "elemente",
        eticheta: "Programe",
        etichetaElement: "program",
        rezumatDin: "titlu",
        max: 8,
        campuri: [
          {
            tip: "text",
            cheie: "eticheta",
            eticheta: "Felul programului",
            hint: "Ex.: Retreat, Atelier, Curs online.",
            max: 40,
          },
          { tip: "text", cheie: "titlu", eticheta: "Numele programului", obligatoriu: true, max: 120 },
          {
            tip: "textLung",
            cheie: "descriere",
            eticheta: "Descriere",
            obligatoriu: true,
            randuri: 3,
            max: 500,
          },
          {
            tip: "listaText",
            cheie: "detalii",
            eticheta: "Detalii scurte",
            etichetaElement: "detaliu",
            hint: "Câte unul pe rând: data, locul, câte locuri sunt.",
            max: 4,
          },
          {
            tip: "lista",
            cheie: "materiale",
            eticheta: "Materiale de descărcat",
            etichetaElement: "material",
            rezumatDin: "text",
            max: 8,
            hint: "Fișe, formulare, acorduri — fiecare cu butonul lui de descărcare. Încarcă-le întâi în Bibliotecă → Documente.",
            campuri: [
              {
                tip: "text",
                cheie: "text",
                eticheta: "Textul butonului",
                hint: "Ex.: Descarcă fișa de exerciții. Gol → „Descarcă materialul”.",
                max: 60,
              },
              { tip: "document", cheie: "fisier", eticheta: "Documentul" },
            ],
          },
          { tip: "link", cheie: "buton", eticheta: "Buton" },
          { tip: "imagine", cheie: "imagine", eticheta: "Imagine" },
        ],
      },
    ],
  },
  {
    cheie: "latestPosts",
    nume: "Articole recente",
    descriere: "Ultimele articole de pe blog. Textele vin din Blog, nu de aici.",
    repetabila: false,
    continutDinAltaParte:
      "Articolele se scriu la Blog, în meniu. Aici alegi doar cum arată secțiunea și câte se văd pe prima pagină. Dacă n-ai niciun articol publicat, secțiunea nu apare deloc pe site.",
    campuri: [
      ...campuriAntet(),
      {
        tip: "numar",
        cheie: "numar",
        eticheta: "Câte articole se văd pe prima pagină",
        min: 1,
        maxim: 6,
        hint: "Lasă gol ca să le arăți pe toate. Cu pagina de blog oprită, se arată oricum toate — altfel restul n-ar mai apărea nicăieri.",
      },
    ],
  },
  {
    cheie: "faq",
    nume: "Întrebări frecvente",
    descriere: "Răspunsuri la ce te-ar întreba oricine înainte de prima ședință.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      {
        tip: "lista",
        cheie: "intrebari",
        eticheta: "Întrebări",
        etichetaElement: "întrebare",
        rezumatDin: "intrebare",
        max: 15,
        campuri: [
          { tip: "text", cheie: "intrebare", eticheta: "Întrebarea", obligatoriu: true, max: 200 },
          {
            tip: "textLung",
            cheie: "raspuns",
            eticheta: "Răspunsul",
            obligatoriu: true,
            randuri: 4,
            max: 900,
          },
        ],
      },
    ],
  },
  {
    cheie: "programare",
    nume: "Programare online",
    descriere: "Primele ore libere și un buton către pagina de programare.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "text",
        cheie: "textButon",
        eticheta: "Textul butonului",
        hint: "Duce la pagina cu toate orele. Ex.: Vezi toate orele libere.",
        max: 40,
      },
    ],
  },
  {
    cheie: "newsletter",
    nume: "Newsletter",
    descriere: "Invitație de abonare la lista ta de email.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      { tip: "text", cheie: "textButon", eticheta: "Textul butonului", max: 40 },
      {
        tip: "text",
        cheie: "placeholder",
        eticheta: "Textul din câmpul de email",
        hint: "Exemplul palid care se vede până începe omul să scrie.",
        max: 60,
      },
      {
        tip: "textLung",
        cheie: "notaLegala",
        eticheta: "Nota de dedesubt",
        hint: "Cât de des scrii și cum se poate dezabona cineva. Obligatoriu prin lege să știe asta dinainte.",
        randuri: 2,
        max: 300,
      },
      {
        tip: "text",
        cheie: "mesajSucces",
        eticheta: "Ce citește omul după abonare",
        max: 200,
      },
    ],
  },
  {
    cheie: "contact",
    nume: "Contact",
    descriere: "Formularul prin care îți ajunge un mesaj, plus datele cabinetului.",
    repetabila: false,
    campuri: [
      ...campuriAntet(),
      INTRO,
      {
        tip: "lista",
        cheie: "detalii",
        eticheta: "Datele cabinetului",
        etichetaElement: "rând",
        rezumatDin: "eticheta",
        max: 6,
        campuri: [
          {
            tip: "text",
            cheie: "eticheta",
            eticheta: "Ce este",
            obligatoriu: true,
            hint: "Ex.: Telefon, Email, Cabinet, Program.",
            max: 40,
          },
          {
            tip: "textLung",
            cheie: "valoare",
            eticheta: "Conținutul",
            hint: "Poți scrie pe mai multe rânduri — util pentru program.",
            obligatoriu: true,
            randuri: 2,
            max: 300,
          },
        ],
      },
      { tip: "text", cheie: "textButon", eticheta: "Textul butonului", max: 40 },
      {
        tip: "text",
        cheie: "notaFormular",
        eticheta: "Rând mic deasupra formularului",
        hint: "Opțional. O reasigurare scurtă lângă formular. Ex.: Răspund personal în maxim 24 de ore.",
        max: 120,
      },
      {
        tip: "textLung",
        cheie: "textAcord",
        eticheta: "Textul de lângă bifa de acord",
        hint: "Linkul către Politica de confidențialitate se adaugă automat la sfârșit.",
        randuri: 2,
        max: 300,
      },
      {
        tip: "adresa",
        cheie: "linkConfidentialitate",
        eticheta: "Adresa politicii de confidențialitate",
        hint: "Cât timp e gol, textul apare fără link. Se completează când pagina există.",
        max: 200,
      },
      {
        tip: "text",
        cheie: "mesajSucces",
        eticheta: "Ce citește omul după ce trimite mesajul",
        max: 200,
      },
    ],
  },
];

const DUPA_CHEIE = new Map(LISTA.map((meta) => [meta.cheie, meta]));

export function metaSectiune(cheie: string): MetaSectiune | null {
  return DUPA_CHEIE.get(cheie) ?? null;
}

export function listaSectiuni(): MetaSectiune[] {
  return LISTA;
}
