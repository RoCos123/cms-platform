/**
 * Biblioteca de imagini: unde e folosită fiecare imagine și cum se rescrie.
 *
 * Fișierul e neutru (nici „use client", nici „use server"): aceleași funcții
 * rulează pe server, când se șterge o imagine din toate secțiunile care o
 * folosesc, și în browser, unde ecranul arată în ce locuri e pusă.
 *
 * O imagine e ținută în conținutul unei secțiuni ca `{ uploadId, url, altText }`
 * — aceeași formă pe care o produce încărcarea. `url` stă lângă `uploadId`
 * intenționat: site-ul public randează imaginile fără să mai întrebe biblioteca,
 * deci o pagină de client nu depinde de un al doilea tabel ca să afișeze o poză.
 */

import { metaSectiune } from "@/lib/sectiuni";
import { cereDe } from "@/lib/numerale";
import type { PunctFocal } from "@/lib/punct-focal";

/**
 * Cât poate fi de lungă descrierea unei imagini.
 *
 * Aici, ca aceeași limită să oprească scrisul în câmp (unde se vede) și să taie
 * pe server (unde contează). Două numere scrise separat ar fi ajuns să difere,
 * iar clientul ar fi pierdut ultimele cuvinte fără să afle de ce.
 */
export const MAXIM_DESCRIERE_IMAGINE = 300;

/** Un loc din panou în care e pusă imaginea. */
export type FolosireImagine = {
  /** Ecranul care o folosește — devine linkul „Deschide …". */
  href: string;
  /** Cum îi spune clientul locului („Despre mine", titlul unui articol). */
  nume: string;
};

/** O imagine așa cum o vede panoul. */
export type ImagineBiblioteca = {
  id: string;
  url: string;
  numeFisier: string;
  /** Textul citit de cine nu vede imaginea. Gol = încă nedescrisă. */
  descriere: string;
  marimeOcteti: number;
  latime: number | null;
  inaltime: number | null;
  /** Poziția aleasă a pozei (punctul care rămâne în cadru). Lipsă = centru. */
  pozitie?: PunctFocal;
  /** Dată ISO; se formatează abia la afișare, în fusul cititorului. */
  incarcataLa: string;
  folosiri: FolosireImagine[];
};

function esteObiect(valoare: unknown): valoare is Record<string, unknown> {
  return typeof valoare === "object" && valoare !== null && !Array.isArray(valoare);
}

/**
 * Recunoaștem o imagine după `uploadId`, nu după numele câmpului.
 *
 * Numele diferă de la o secțiune la alta („imagine", „poza", „coperta"), dar
 * forma e mereu aceeași. Căutând forma, o secțiune adăugată mâine intră automat
 * în socoteală — nimeni nu trebuie să-și amintească să treacă un nume nou
 * printr-o listă de aici.
 */
function esteImagine(valoare: unknown): valoare is Record<string, unknown> {
  return esteObiect(valoare) && typeof valoare.uploadId === "string" && valoare.uploadId !== "";
}

/** Recunoaștem un material după `fisierId` — aceeași idee ca la imagini, altă cheie. */
function esteFisier(valoare: unknown): valoare is Record<string, unknown> {
  return esteObiect(valoare) && typeof valoare.fisierId === "string" && valoare.fisierId !== "";
}

/**
 * Rescrie adresa de descărcare a fiecărui material dintr-un conținut, derivată
 * din `fisierId`.
 *
 * Perechea lui `rescrieAdresele`, dar pentru documente: ruta e `/fisiere/…`, nu
 * `/imagini/…`, iar recunoașterea se face după `fisierId`, nu `uploadId`, tocmai
 * ca cele două să nu se calce (un material și o poză n-ar trebui să ajungă pe
 * aceeași rută). Se cheamă alături de `rescrieAdresele`, la randare.
 */
export function rescrieAdreseleFisiere(
  valoare: unknown,
  adresa: (fisierId: string) => string,
): unknown {
  if (esteFisier(valoare)) {
    return { ...valoare, url: adresa(valoare.fisierId as string) };
  }

  if (Array.isArray(valoare)) {
    return valoare.map((element) => rescrieAdreseleFisiere(element, adresa));
  }

  if (esteObiect(valoare)) {
    const rezultat: Record<string, unknown> = {};
    for (const [cheie, camp] of Object.entries(valoare)) {
      rezultat[cheie] = rescrieAdreseleFisiere(camp, adresa);
    }
    return rezultat;
  }

  return valoare;
}

/** Toate imaginile dintr-un conținut de secțiune, oricât de adânc ar sta. */
export function idurileImaginilor(valoare: unknown, gasite = new Set<string>()): Set<string> {
  if (esteImagine(valoare)) {
    gasite.add(valoare.uploadId as string);
    return gasite;
  }

  if (Array.isArray(valoare)) {
    for (const element of valoare) idurileImaginilor(element, gasite);
    return gasite;
  }

  if (esteObiect(valoare)) {
    for (const camp of Object.values(valoare)) idurileImaginilor(camp, gasite);
  }

  return gasite;
}

/** Măsurile unei poze, în pixeli — perechea trebuie întreagă ca să dea un raport. */
export type MasuriImagine = { latime: number; inaltime: number };

function areMasuri(valoare: Record<string, unknown>): boolean {
  return (
    typeof valoare.latime === "number" &&
    valoare.latime > 0 &&
    typeof valoare.inaltime === "number" &&
    valoare.inaltime > 0
  );
}

/**
 * Imaginile dintr-un conținut care NU își știu măsurile (`latime`/`inaltime`).
 *
 * Există fiindcă măsurile s-au adăugat în `ImageValue` abia pe 22 sept. 2026:
 * pozele puse în secțiuni înainte de asta le au în tabelul `uploads` (se
 * măsurau de la început), dar nu și în conținutul secțiunii, de unde le
 * citește site-ul public. Perechea lui `completeazaMasurileImaginilor`: asta
 * spune CE lipsește, aia scrie ce s-a găsit.
 */
export function imaginileFaraMasuri(valoare: unknown, gasite = new Set<string>()): Set<string> {
  if (esteImagine(valoare)) {
    if (!areMasuri(valoare)) gasite.add(valoare.uploadId as string);
    return gasite;
  }

  if (Array.isArray(valoare)) {
    for (const element of valoare) imaginileFaraMasuri(element, gasite);
    return gasite;
  }

  if (esteObiect(valoare)) {
    for (const camp of Object.values(valoare)) imaginileFaraMasuri(camp, gasite);
  }

  return gasite;
}

/**
 * Scrie măsurile în fiecare imagine care nu le are, după `uploadId`.
 *
 * Se cheamă LA SALVAREA secțiunii, pe server — nu la randare. Locul e ales pe
 * aceeași regulă ca la `url` și la descrieri (`rescrieInSectiuni`): site-ul
 * public citește conținutul de-a gata, fără să întrebe `uploads`, deci tot ce
 * trebuie să știe o pagină se scrie în conținut ATUNCI CÂND SE SCHIMBĂ, nu se
 * caută la fiecare afișare.
 *
 * A existat întâi o variantă în care omul trebuia să-și RE-ALEAGĂ poza din
 * bibliotecă, ca să-i aducă măsurile. N-a mers: pasul manual s-a dovedit exact
 * genul de instrucțiune care se pierde pe drum, iar nereușita lui era tăcută —
 * cartonașul cădea pe raportul de rezervă și arăta „la fel ca înainte". De-aia
 * completarea e acum treaba serverului, la orice salvare.
 *
 * O imagine care își are deja măsurile rămâne neatinsă; una al cărei id nu e
 * în hartă, la fel — nu se inventează nimic.
 */
export function completeazaMasurileImaginilor(
  valoare: unknown,
  masuri: ReadonlyMap<string, MasuriImagine>,
): unknown {
  if (esteImagine(valoare)) {
    if (areMasuri(valoare)) return valoare;
    const gasite = masuri.get(valoare.uploadId as string);
    return gasite ? { ...valoare, latime: gasite.latime, inaltime: gasite.inaltime } : valoare;
  }

  if (Array.isArray(valoare)) {
    return valoare.map((element) => completeazaMasurileImaginilor(element, masuri));
  }

  if (esteObiect(valoare)) {
    const rezultat: Record<string, unknown> = {};
    for (const [cheie, camp] of Object.entries(valoare)) {
      rezultat[cheie] = completeazaMasurileImaginilor(camp, masuri);
    }
    return rezultat;
  }

  return valoare;
}

export type RandSectiune = { id: string; key: string; data: unknown };

/** Un articol de blog, cât ne trebuie ca să știm dacă folosește o imagine. */
export type RandArticolCoperta = { id: string; title: string; cover_upload_id: string | null };

/**
 * Pentru fiecare imagine, în ce locuri din panou e pusă.
 *
 * Două surse, fiindcă imaginile ajung pe site pe două căi: în conținutul unei
 * secțiuni (ca obiect în JSON) și ca „copertă" a unui articol (ca cheie externă
 * într-o coloană). Ecranul Imagini nu trebuie să știe de diferența asta —
 * întrebarea clientului e aceeași, „unde e pusă poza".
 *
 * Un loc care folosește aceeași imagine de două ori (în două rânduri ale unei
 * liste) apare o singură dată: întrebarea e „unde", nu „de câte ori".
 */
export function folosirileImaginilor(surse: {
  sectiuni: RandSectiune[];
  articole: RandArticolCoperta[];
}): Map<string, FolosireImagine[]> {
  const folosiri = new Map<string, FolosireImagine[]>();

  function adauga(uploadId: string, folosire: FolosireImagine) {
    const lista = folosiri.get(uploadId) ?? [];
    lista.push(folosire);
    folosiri.set(uploadId, lista);
  }

  for (const rand of surse.sectiuni) {
    // O cheie necunoscută (secțiune scoasă din cod, rând rămas dintr-o versiune
    // veche) tot trebuie numită cumva: fără nume, imaginea ar părea nefolosită
    // și clientul ar șterge-o liniștit.
    const nume = metaSectiune(rand.key)?.nume ?? rand.key;

    for (const id of idurileImaginilor(rand.data)) {
      adauga(id, { href: `/dashboard/sectiuni/${rand.id}`, nume });
    }
  }

  for (const articol of surse.articole) {
    if (!articol.cover_upload_id) continue;
    adauga(articol.cover_upload_id, {
      href: `/dashboard/blog/${articol.id}`,
      nume: articol.title || "Articol fără titlu",
    });
  }

  return folosiri;
}

/**
 * Înlocuiește sau scoate o imagine dintr-un conținut de secțiune.
 *
 * `inlocuitor` primește imaginea găsită și întoarce ce trebuie pus în locul ei;
 * `undefined` înseamnă „scoate câmpul cu totul", ceea ce e exact ce trebuie la
 * ștergere: componentele de pe site verifică `{imagine && …}`, deci un câmp
 * absent nu randează nimic, pe când unul rămas cu un `url` mort ar randa o
 * imagine ruptă în fața vizitatorilor.
 *
 * Întoarce și `schimbat`, ca apelantul să nu scrie în baza de date rânduri pe
 * care nu le-a atins.
 */
export function rescrieImaginea(
  valoare: unknown,
  uploadId: string,
  inlocuitor: (imagine: Record<string, unknown>) => Record<string, unknown> | undefined,
): { valoare: unknown; schimbat: boolean } {
  let schimbat = false;

  function mergi(nod: unknown): unknown {
    if (Array.isArray(nod)) {
      const rezultat: unknown[] = [];
      for (const element of nod) {
        if (esteImagine(element) && element.uploadId === uploadId) {
          const nou = inlocuitor(element);
          schimbat = true;
          // Într-o listă, „scoate" înseamnă că elementul dispare de tot: n-are
          // un câmp în care să rămână o gaură.
          if (nou !== undefined) rezultat.push(nou);
          continue;
        }
        rezultat.push(mergi(element));
      }
      return rezultat;
    }

    if (esteObiect(nod)) {
      const rezultat: Record<string, unknown> = {};
      for (const [cheie, camp] of Object.entries(nod)) {
        if (esteImagine(camp) && camp.uploadId === uploadId) {
          const nou = inlocuitor(camp);
          schimbat = true;
          if (nou !== undefined) rezultat[cheie] = nou;
          continue;
        }
        rezultat[cheie] = mergi(camp);
      }
      return rezultat;
    }

    return nod;
  }

  const noua = mergi(valoare);
  return { valoare: schimbat ? noua : valoare, schimbat };
}

/**
 * Perechea lui `rescrieImaginea`, dar pentru MATERIALE: găsește obiectele de
 * material după `fisierId` și le trece prin `inlocuitor`. La ștergere,
 * `inlocuitor` întoarce `undefined`, deci referința dispare — altfel un buton ar
 * rămâne legat de un fișier care nu mai există și ar da eroare la descărcare.
 *
 * Scoaterea câmpului `fisier` lasă materialul fără document (nu se mai randează
 * niciun buton pentru el), nu șterge tot rândul: intenția clientului — textul
 * butonului — rămâne, ca să poată doar realege documentul.
 */
export function rescrieFisierul(
  valoare: unknown,
  fisierId: string,
  inlocuitor: (fisier: Record<string, unknown>) => Record<string, unknown> | undefined,
): { valoare: unknown; schimbat: boolean } {
  let schimbat = false;

  function mergi(nod: unknown): unknown {
    if (Array.isArray(nod)) {
      const rezultat: unknown[] = [];
      for (const element of nod) {
        if (esteFisier(element) && element.fisierId === fisierId) {
          const nou = inlocuitor(element);
          schimbat = true;
          if (nou !== undefined) rezultat.push(nou);
          continue;
        }
        rezultat.push(mergi(element));
      }
      return rezultat;
    }

    if (esteObiect(nod)) {
      const rezultat: Record<string, unknown> = {};
      for (const [cheie, camp] of Object.entries(nod)) {
        if (esteFisier(camp) && camp.fisierId === fisierId) {
          const nou = inlocuitor(camp);
          schimbat = true;
          if (nou !== undefined) rezultat[cheie] = nou;
          continue;
        }
        rezultat[cheie] = mergi(camp);
      }
      return rezultat;
    }

    return nod;
  }

  const noua = mergi(valoare);
  return { valoare: schimbat ? noua : valoare, schimbat };
}

/**
 * Scoate o încărcare din conținutul unei secțiuni, la ștergere — fie că e folosită
 * ca POZĂ (`uploadId`), fie ca MATERIAL (`fisierId`). Un id e ori una, ori alta,
 * deci una dintre treceri nu găsește nimic; amândouă sunt sigure.
 */
export function scoateIncarcarea(
  valoare: unknown,
  id: string,
): { valoare: unknown; schimbat: boolean } {
  const dupaImagini = rescrieImaginea(valoare, id, () => undefined);
  const dupaFisiere = rescrieFisierul(dupaImagini.valoare, id, () => undefined);
  return {
    valoare: dupaFisiere.valoare,
    schimbat: dupaImagini.schimbat || dupaFisiere.schimbat,
  };
}

/**
 * Rescrie adresa fiecărei imagini dintr-un conținut, derivând-o din `uploadId`.
 *
 * DE CE E NEVOIE. Adresa unei imagini stă în JSON-ul secțiunii, lângă
 * `uploadId`, de pe vremea când depozitul era public și adresa era un link
 * direct la Supabase. Acum depozitul e privat, iar acele adrese vechi nu mai
 * duc nicăieri. Puteam rescrie o dată datele tuturor clienților cu o migrare —
 * dar o migrare care umblă în conținutul oamenilor e exact felul de operație
 * care, greșită, nu se mai poate da înapoi.
 *
 * Rescrierea la CITIRE nu are riscul ăsta: nu atinge nimic în bază, merge
 * deopotrivă pe rândurile vechi și pe cele noi, și — partea care contează —
 * face ca o adresă absolută rămasă în conținut să nu mai poată fi randată
 * NICIODATĂ. Chiar dacă cineva ar scrie de mână în JSON adresa unui fișier al
 * altui cabinet, ea se pierde aici, înlocuită cu adresa derivată din `uploadId`.
 *
 * Imaginile fără `uploadId` se lasă neatinse: sunt adrese puse de client către
 * alt site, deci nu sunt fișierele noastre și n-avem ce semna la ele.
 *
 * `adresa` se primește ca argument, nu se importă: semnarea are nevoie de
 * `node:crypto` și de cheia de serviciu, iar fișierul ăsta se încarcă și în
 * browser (ecranul Imagini arată unde e pusă fiecare poză).
 */
export function rescrieAdresele(valoare: unknown, adresa: (uploadId: string) => string): unknown {
  if (esteImagine(valoare)) {
    return { ...valoare, url: adresa(valoare.uploadId as string) };
  }

  if (Array.isArray(valoare)) {
    return valoare.map((element) => rescrieAdresele(element, adresa));
  }

  if (esteObiect(valoare)) {
    const rezultat: Record<string, unknown> = {};
    for (const [cheie, camp] of Object.entries(valoare)) {
      rezultat[cheie] = rescrieAdresele(camp, adresa);
    }
    return rezultat;
  }

  return valoare;
}

// ----------------------------------------------------------------------------
// Formatări. Stau aici, nu în componenta care le folosește prima, fiindcă
// aceleași imagini se văd în două locuri — ecranul Imagini și fereastra de
// alegere din formulare — iar două copii ar începe identice și ar diverge.
// ----------------------------------------------------------------------------

const KILOOCTET = 1024;
const MEGAOCTET = KILOOCTET * KILOOCTET;

const cuZecimala = new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 1 });
const caData = new Intl.DateTimeFormat("ro-RO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Mărimea în unitatea pe care o recunoaște oricine, nu în octeți. */
export function formateazaMarimea(octeti: number): string {
  if (!Number.isFinite(octeti) || octeti <= 0) return "necunoscută";
  if (octeti >= MEGAOCTET) return `${cuZecimala.format(octeti / MEGAOCTET)} MB`;
  // Sub 1 KB rotunjirea ar da „0 KB", care arată a fișier stricat.
  return `${cuZecimala.format(Math.max(1, Math.round(octeti / KILOOCTET)))} KB`;
}

export function formateazaData(iso: string): string | null {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? null : caData.format(data);
}

/**
 * Căutarea ignoră diacriticele și literele mari: cine scrie „poza cabinet"
 * trebuie să găsească „Poză-Cabinet.JPG", altfel căutarea pare stricată.
 */
export function normalizeazaPentruCautare(valoare: string): string {
  return valoare
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** „21 de locuri". Pentru 1 se scrie altfel („într-un loc"), la apelant. */
export function formateazaLocuri(numar: number): string {
  return `${numar}${cereDe(numar) ? " de" : ""} locuri`;
}

/** „Folosită în Despre mine și Contact" — locurile pe nume, nu un număr. */
export function descrieFolosirile(folosiri: FolosireImagine[]): string {
  const nume = [...new Set(folosiri.map((folosire) => folosire.nume))];

  if (nume.length === 0) return "Nu e folosită nicăieri pe site.";
  if (nume.length === 1) return `Folosită în ${nume[0]}.`;
  if (nume.length === 2) return `Folosită în ${nume[0]} și ${nume[1]}.`;

  return `Folosită în ${nume.slice(0, -1).join(", ")} și ${nume[nume.length - 1]}.`;
}
