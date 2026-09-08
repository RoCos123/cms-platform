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
    id: "sabloane",
    key: "portfolio",
    variant: null,
    tone: "deschis",
    data: {
      eyebrow: "Înfățișări",
      titlu: "Cinci feluri de a arăta.",
      titluAccent: "Alegi tu, și te răzgândești oricând.",
      intro:
        "Aceleași texte, aceleași poze — doar altă înfățișare. Se schimbă dintr-un singur loc, fără să rescrii nimic.",
      elemente: [
      {
        titlu: "Căldură",
        descriere: "Crem cald și cărămiziu, cu titluri groase. Cel mai primitor dintre toate.",
        imagine: { url: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22800%22%20height%3D%22500%22%3E%0A%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%23F8F1EA%22/%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22772%22%20height%3D%22472%22%20fill%3D%22none%22%20stroke%3D%22%23904D39%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%20opacity%3D%220.55%22/%3E%0A%3Ccircle%20cx%3D%2270%22%20cy%3D%2286%22%20r%3D%227%22%20fill%3D%22%23904D39%22/%3E%0A%3Crect%20x%3D%2294%22%20y%3D%2279%22%20width%3D%22150%22%20height%3D%2213%22%20rx%3D%226%22%20fill%3D%22%23904D39%22%20opacity%3D%220.5%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22196%22%20font-family%3D%22Manrope%2C%20sans-serif%22%20font-size%3D%2262%22%20font-weight%3D%22700%22%20fill%3D%22%232A1F1A%22%3EC%C4%83ldur%C4%83%3C/text%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22232%22%20width%3D%22520%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%232A1F1A%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22262%22%20width%3D%22430%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%232A1F1A%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22292%22%20width%3D%22470%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%232A1F1A%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22344%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22%23904D39%22/%3E%0A%3Crect%20x%3D%22266%22%20y%3D%22344%22%20width%3D%22150%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%232A1F1A%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22452%22%20font-family%3D%22Manrope%2C%20sans-serif%22%20font-size%3D%2219%22%20fill%3D%22%232A1F1A%22%20opacity%3D%220.5%22%3Eexemplu%20%E2%80%94%20aici%20va%20veni%20o%20captur%C4%83%20adev%C4%83rat%C4%83%3C/text%3E%0A%3C/svg%3E", altText: "Șablonul Căldură" },
      },
      {
        titlu: "Liniște",
        descriere: "Nisip și verde, titluri cu serife. Așezat și liniștit, fără să fie sobru.",
        imagine: { url: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22800%22%20height%3D%22500%22%3E%0A%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%23F3EDE2%22/%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22772%22%20height%3D%22472%22%20fill%3D%22none%22%20stroke%3D%22%234C6A52%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%20opacity%3D%220.55%22/%3E%0A%3Ccircle%20cx%3D%2270%22%20cy%3D%2286%22%20r%3D%227%22%20fill%3D%22%234C6A52%22/%3E%0A%3Crect%20x%3D%2294%22%20y%3D%2279%22%20width%3D%22150%22%20height%3D%2213%22%20rx%3D%226%22%20fill%3D%22%234C6A52%22%20opacity%3D%220.5%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22196%22%20font-family%3D%22DM%20Sans%2C%20sans-serif%22%20font-size%3D%2262%22%20font-weight%3D%22700%22%20fill%3D%22%231F2A24%22%3ELini%C8%99te%3C/text%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22232%22%20width%3D%22520%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231F2A24%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22262%22%20width%3D%22430%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231F2A24%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22292%22%20width%3D%22470%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231F2A24%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22344%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22%234C6A52%22/%3E%0A%3Crect%20x%3D%22266%22%20y%3D%22344%22%20width%3D%22150%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%231F2A24%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22452%22%20font-family%3D%22DM%20Sans%2C%20sans-serif%22%20font-size%3D%2219%22%20fill%3D%22%231F2A24%22%20opacity%3D%220.5%22%3Eexemplu%20%E2%80%94%20aici%20va%20veni%20o%20captur%C4%83%20adev%C4%83rat%C4%83%3C/text%3E%0A%3C/svg%3E", altText: "Șablonul Liniște" },
      },
      {
        titlu: "Lumină",
        descriere: "Albăstrui deschis și mov. Cel mai luminos, bun pentru cabinete care lucrează cu copii.",
        imagine: { url: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22800%22%20height%3D%22500%22%3E%0A%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%23F1F5FD%22/%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22772%22%20height%3D%22472%22%20fill%3D%22none%22%20stroke%3D%22%235E2976%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%20opacity%3D%220.55%22/%3E%0A%3Ccircle%20cx%3D%2270%22%20cy%3D%2286%22%20r%3D%227%22%20fill%3D%22%235E2976%22/%3E%0A%3Crect%20x%3D%2294%22%20y%3D%2279%22%20width%3D%22150%22%20height%3D%2213%22%20rx%3D%226%22%20fill%3D%22%235E2976%22%20opacity%3D%220.5%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22196%22%20font-family%3D%22Inter%2C%20sans-serif%22%20font-size%3D%2262%22%20font-weight%3D%22700%22%20fill%3D%22%231D1230%22%3ELumin%C4%83%3C/text%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22232%22%20width%3D%22520%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231D1230%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22262%22%20width%3D%22430%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231D1230%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22292%22%20width%3D%22470%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%231D1230%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22344%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22%235E2976%22/%3E%0A%3Crect%20x%3D%22266%22%20y%3D%22344%22%20width%3D%22150%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%231D1230%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22452%22%20font-family%3D%22Inter%2C%20sans-serif%22%20font-size%3D%2219%22%20fill%3D%22%231D1230%22%20opacity%3D%220.5%22%3Eexemplu%20%E2%80%94%20aici%20va%20veni%20o%20captur%C4%83%20adev%C4%83rat%C4%83%3C/text%3E%0A%3C/svg%3E", altText: "Șablonul Lumină" },
      },
      {
        titlu: "Apropiere",
        descriere: "Crem și verde, cu accente scrise de mână. Cald și apropiat, fără formalism.",
        imagine: { url: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22800%22%20height%3D%22500%22%3E%0A%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%23F4EDE2%22/%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22772%22%20height%3D%22472%22%20fill%3D%22none%22%20stroke%3D%22%23456B3F%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%20opacity%3D%220.55%22/%3E%0A%3Ccircle%20cx%3D%2270%22%20cy%3D%2286%22%20r%3D%227%22%20fill%3D%22%23456B3F%22/%3E%0A%3Crect%20x%3D%2294%22%20y%3D%2279%22%20width%3D%22150%22%20height%3D%2213%22%20rx%3D%226%22%20fill%3D%22%23456B3F%22%20opacity%3D%220.5%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22196%22%20font-family%3D%22Nunito%2C%20sans-serif%22%20font-size%3D%2262%22%20font-weight%3D%22700%22%20fill%3D%22%233D3527%22%3EApropiere%3C/text%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22232%22%20width%3D%22520%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%233D3527%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22262%22%20width%3D%22430%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%233D3527%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22292%22%20width%3D%22470%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%233D3527%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22344%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22%23456B3F%22/%3E%0A%3Crect%20x%3D%22266%22%20y%3D%22344%22%20width%3D%22150%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%233D3527%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22452%22%20font-family%3D%22Nunito%2C%20sans-serif%22%20font-size%3D%2219%22%20fill%3D%22%233D3527%22%20opacity%3D%220.5%22%3Eexemplu%20%E2%80%94%20aici%20va%20veni%20o%20captur%C4%83%20adev%C4%83rat%C4%83%3C/text%3E%0A%3C/svg%3E", altText: "Șablonul Apropiere" },
      },
      {
        titlu: "Claritate",
        descriere: "Alb curat și albastru sobru. Pentru evaluare, expertize, psihologia muncii.",
        imagine: { url: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%20800%20500%22%20width%3D%22800%22%20height%3D%22500%22%3E%0A%3Crect%20width%3D%22800%22%20height%3D%22500%22%20fill%3D%22%23FFFFFF%22/%3E%0A%3Crect%20x%3D%2214%22%20y%3D%2214%22%20width%3D%22772%22%20height%3D%22472%22%20fill%3D%22none%22%20stroke%3D%22%231B4D7E%22%20stroke-width%3D%222%22%20stroke-dasharray%3D%2210%208%22%20opacity%3D%220.55%22/%3E%0A%3Ccircle%20cx%3D%2270%22%20cy%3D%2286%22%20r%3D%227%22%20fill%3D%22%231B4D7E%22/%3E%0A%3Crect%20x%3D%2294%22%20y%3D%2279%22%20width%3D%22150%22%20height%3D%2213%22%20rx%3D%226%22%20fill%3D%22%231B4D7E%22%20opacity%3D%220.5%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22196%22%20font-family%3D%22Inter%2C%20sans-serif%22%20font-size%3D%2262%22%20font-weight%3D%22700%22%20fill%3D%22%23111820%22%3EClaritate%3C/text%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22232%22%20width%3D%22520%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%23111820%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22262%22%20width%3D%22430%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%23111820%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22292%22%20width%3D%22470%22%20height%3D%2214%22%20rx%3D%227%22%20fill%3D%22%23111820%22%20opacity%3D%220.22%22/%3E%0A%3Crect%20x%3D%2270%22%20y%3D%22344%22%20width%3D%22180%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22%231B4D7E%22/%3E%0A%3Crect%20x%3D%22266%22%20y%3D%22344%22%20width%3D%22150%22%20height%3D%2252%22%20rx%3D%2210%22%20fill%3D%22none%22%20stroke%3D%22%23111820%22%20stroke-width%3D%222%22%20opacity%3D%220.35%22/%3E%0A%3Ctext%20x%3D%2270%22%20y%3D%22452%22%20font-family%3D%22Inter%2C%20sans-serif%22%20font-size%3D%2219%22%20fill%3D%22%23111820%22%20opacity%3D%220.5%22%3Eexemplu%20%E2%80%94%20aici%20va%20veni%20o%20captur%C4%83%20adev%C4%83rat%C4%83%3C/text%3E%0A%3C/svg%3E", altText: "Șablonul Claritate" },
      },
      ],
    },
  },
  {
    id: "pareri",
    key: "testimonials",
    variant: null,
    tone: "nuantat",
    data: {
      eyebrow: "Păreri",
      titlu: "Ce spun cabinetele",
      titluAccent: "care lucrează deja cu el",
      marturii: [
        {
          text: "[Aici vine părerea unui client adevărat — două-trei rânduri, cu cuvintele lui. Se adaugă din panou, pe măsură ce oamenii îți scriu.]",
          autor: "[Numele]",
          context: "[Cabinetul, orașul]",
        },
        {
          text: "[A doua părere. Cel mai bine merg cele care spun ce se temea omul înainte și ce s-a întâmplat de fapt.]",
          autor: "[Numele]",
          context: "[Cabinetul, orașul]",
        },
        {
          text: "[A treia. Secțiunea arată bine cu trei; cu una singură pare că n-ai decât un client.]",
          autor: "[Numele]",
          context: "[Cabinetul, orașul]",
        },
      ],
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
