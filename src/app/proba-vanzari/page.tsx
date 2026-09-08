import { notFound } from "next/navigation";
import { getTemplate, templateStyle } from "@/lib/templates";
import { templateFontStyle } from "@/lib/templates/fonturi";
import { RenderSections, type SectionRow } from "@/components/site/render-sections";
import type { Serviciu } from "@/lib/servicii";

/**
 * Previzualizarea site-ului de vânzări, fără bază de date.
 *
 * DE CE EXISTĂ. Site-ul adevărat are nevoie de trei lucruri pe care nu le pot
 * face eu: o adresă în Vercel, un cont în Supabase și o linie de SQL rulată pe
 * baza reală. Dar întrebarea proprietarului era „vreau să văd cum arată”, iar
 * pentru asta nu-i nevoie de niciunul dintre ele: șabloanele sunt cod, iar
 * secțiunile primesc conținutul ca argument.
 *
 * Deci pagina asta randează ACELEAȘI componente, cu ACELAȘI șablon și aceleași
 * fonturi ca site-ul viu — doar că textul vine de aici, nu din `site_content`.
 * Ce se vede aici e ce se va vedea acolo.
 *
 * NUMAI ÎN DEZVOLTARE. În producție dă 404: e o unealtă de lucru, ca galeria de
 * componente din panou, nu o pagină de arătat cuiva. Iar pe un domeniu de
 * client ar fi de-a dreptul rea — un site de psiholog cu o pagină care vinde
 * altceva.
 */
export const metadata = { title: "Probă — site de vânzări" };

const SERVICII: Serviciu[] = [
  {
    id: "1",
    slug: "site-pe-domeniul-tau",
    titlu: "Site pe domeniul tău",
    descriereScurta:
      "Adresa e a ta, nu un subdomeniu împrumutat de la cineva. Rămâne a ta și dacă într-o zi pleci în altă parte.",
    descriereCompleta: "",
  },
  {
    id: "2",
    slug: "patru-infatisari",
    titlu: "Cinci înfățișări, la alegere",
    descriereScurta:
      "Alegi cum arată site-ul dintr-o listă. Se schimbă oricând, dintr-un singur loc, fără să rescrii un rând.",
    descriereCompleta: "",
  },
  {
    id: "3",
    slug: "panou",
    titlu: "Un panou pe înțelesul tău",
    descriereScurta:
      "Fiecare câmp spune ce apare pe site, nu cum se cheamă pe dinăuntru. Nu ai ce strica: ce nu-ți place, schimbi la loc.",
    descriereCompleta: "",
  },
  {
    id: "4",
    slug: "programari",
    titlu: "Programări direct de pe site",
    descriereScurta:
      "Îți treci zilele și orele în care lucrezi, iar oamenii îți cer o oră din calendar. Tu confirmi sau refuzi, din panou.",
    descriereCompleta: "",
  },
  {
    id: "5",
    slug: "blog",
    titlu: "Blog, dacă vrei",
    descriereScurta:
      "Scrii articole când ai ceva de spus — sau nu pornești deloc partea asta. Site-ul arată la fel de bine și fără ea.",
    descriereCompleta: "",
  },
  {
    id: "6",
    slug: "fara-urmarire",
    titlu: "Fără cookie-uri și fără urmărire",
    descriereScurta:
      "Site-ul nu-i urmărește pe vizitatori și nu trimite nimic către nimeni. Politica de confidențialitate vine scrisă, de completat cu datele cabinetului tău.",
    descriereCompleta: "",
  },
];

const SECTIUNI: SectionRow[] = [
  {
    id: "hero",
    key: "hero",
    variant: null,
    tone: "deschis",
    data: {
      eyebrow: "Site-uri pentru cabinete de psihologie",
      titlu: "Un site al tău,",
      titluAccent: "nu un profil pe platforma altcuiva",
      subtitlu:
        "Domeniu propriu, textele scrise de tine, fără abonament lunar. Îl schimbi singur, de câte ori vrei, dintr-un panou făcut pentru cineva care n-a mai făcut asta niciodată.",
      butonPrincipal: { text: "Vezi cât costă", href: "#pachete" },
      butonSecundar: { text: "Scrie-mi", href: "#contact" },
    },
  },
  {
    id: "how",
    key: "howItWorks",
    variant: null,
    tone: "nuantat",
    data: {
      titlu: "Cum decurge",
      intro: "Patru pași, dintre care doar unul cere ceva de la tine.",
      pasi: [
        {
          titlu: "Îmi scrii",
          descriere:
            "Îmi spui cum se cheamă cabinetul și ce adresă ai vrea pe internet. Dacă n-ai încă un domeniu, îl caut și îl cumpăr eu.",
        },
        {
          titlu: "Primești site-ul, gol",
          descriere:
            "În câteva zile ai un site pe adresa ta, cu toate secțiunile pregătite, dar fără text. Deocamdată îl vezi doar tu.",
        },
        {
          titlu: "Scrii textele și pui pozele",
          descriere:
            "Din panou, în ritmul tău. Primești un videoclip scurt în care îți arăt tot ce ai de făcut. Dacă te împotmolești, mă suni.",
        },
        {
          titlu: "Apeși Publică",
          descriere:
            "Din clipa aia site-ul e viu. Îl schimbi oricând, singur, fără să mă întrebi și fără să plătești nimic în plus.",
        },
      ],
    },
  },
  {
    id: "features",
    key: "features",
    variant: null,
    tone: "deschis",
    data: { titlu: "Ce primești", numar: 6 },
  },
  {
    id: "pricing",
    key: "pricing",
    variant: null,
    tone: "nuantat",
    data: {
      eyebrow: "Prețuri",
      titlu: "Un preț, o dată.",
      titluAccent: "Fără abonament lunar.",
      intro: "Plătești când site-ul e gata și îți place. Primul an e inclus în preț.",
      pachete: [
        {
          nume: "Site complet",
          pret: "300 €",
          subPret: "o singură dată, primul an inclus",
          descriere: "Tot ce-i trebuie unui cabinet ca să fie găsit și contactat pe internet.",
          include: [
            "Site pe domeniul tău",
            "Cinci înfățișări, la alegere",
            "Panou din care schimbi singur tot",
            "Programări din calendar",
            "Blog",
            "Instructaj video",
            "Domeniu, găzduire și certificat de securitate",
          ],
          eticheta: "Cel mai ales",
          buton: { text: "Scrie-mi", href: "#contact" },
        },
        {
          nume: "Anii următori",
          pret: "60 €",
          subPret: "pe an, în jur de 300 de lei",
          descriere:
            "Cât costă să rămână în aer, după primul an. Nu ai nimic de plătit în altă parte și nimic de reînnoit singur.",
          include: [
            "Domeniul, reînnoit de mine",
            "Găzduirea și certificatul de securitate",
            "Îmbunătățirile panoului, fără costuri în plus",
          ],
        },
      ],
      nota:
        "Nu ai nimic de plătit în altă parte: domeniul e cumpărat și reînnoit de mine, pe numele tău. Nu există comision pe programări și nici costuri ascunse.",
    },
  },
  {
    id: "faq",
    key: "faq",
    variant: null,
    tone: "deschis",
    data: {
      titlu: "Întrebări frecvente",
      intrebari: [
        {
          intrebare: "Nu mă pricep deloc la calculatoare. Mă descurc?",
          raspuns:
            "Panoul e făcut exact pentru asta. Fiecare câmp spune în cuvinte simple ce apare pe site, iar la început primești un videoclip în care ți-l arăt pas cu pas. Dacă tot nu-ți iese, mă suni.",
        },
        {
          intrebare: "Ce se întâmplă dacă vreau să schimb ceva peste un an?",
          raspuns:
            "Îl schimbi singur, oricând, fără să plătești nimic în plus și fără să mă întrebi. Panoul rămâne al tău tot timpul, nu doar la început.",
        },
        {
          intrebare: "De ce n-aș folosi ceva gratuit?",
          raspuns:
            "Poți. Diferența e adresa — pe un site gratuit ea conține numele altcuiva — și faptul că, dacă platforma aceea se închide sau își schimbă regulile, site-ul tău se duce cu ea. Aici domeniul e al tău, iar conținutul ți-l descarci oricând.",
        },
        {
          intrebare: "Dacă renunț, ce se întâmplă cu ce am scris?",
          raspuns:
            "Îl iei cu tine. Dintr-un buton din panou descarci un fișier cu tot: pagini, articole, texte, lista pozelor. Domeniul rămâne al tău.",
        },
        {
          intrebare: "Ce se întâmplă cu datele oamenilor care mă contactează?",
          raspuns:
            "Rămân la tine, în panou, și nu ajung la nimeni altcineva. Dacă cineva îți cere să nu-i mai păstrezi datele, ai un buton care le șterge din toate locurile deodată. Formularul nu are căsuță de mesaj, dinadins: nu vreau să ajungă la tine, printr-o pagină de internet, lucruri despre sănătatea cuiva înainte să fi vorbit vreodată.",
        },
        {
          intrebare: "Cineva îmi poate bloca toate orele libere?",
          raspuns:
            "Nu. O persoană poate ține o singură oră rezervată deodată, iar un cabinet primește cel mult zece cereri pe oră. Cine încearcă mai mult primește un mesaj care îl trimite la telefon.",
        },
      ],
    },
  },
  {
    id: "contact",
    key: "contact",
    variant: null,
    tone: "inchis",
    data: {
      titlu: "Hai să vorbim",
      intro:
        "Scrie-mi numele cabinetului și numărul tău. Te sun eu și vedem împreună dacă are sens.",
      textButon: "Trimite",
    },
  },
];

export default function ProbaVanzari() {
  if (process.env.NODE_ENV === "production") notFound();

  const template = getTemplate("claritate");

  return (
    <div
      style={{
        ...templateStyle(template),
        ...templateFontStyle(template),
        background: "var(--t-fundal)",
        color: "var(--t-text)",
        fontFamily: "var(--t-font-principal)",
        minHeight: "100%",
      }}
    >
      <RenderSections
        rows={SECTIUNI}
        context={{
          articole: [],
          servicii: SERVICII,
          paginaServiciiActiva: false,
          oreProgramare: { zile: [], luni: [] },
          asezari: template.asezari,
        }}
      />
    </div>
  );
}
