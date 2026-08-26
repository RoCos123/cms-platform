import type { CampSchema } from "@/lib/sectiuni";
import { numaraCuvinte } from "@/lib/blocuri-text";
import { numara } from "@/lib/numerale";
import { esteEmailValid } from "@/lib/formulare";

/**
 * Traducerea între cum arată o secțiune în baza de date și cum îi trebuie
 * formularului de editare.
 *
 * De ce e nevoie de traducere: listele din JSON n-au identitate. `["primul",
 * "al doilea"]` sunt două șiruri, iar React are nevoie de o cheie stabilă per
 * rând — altfel, la reordonare, refolosește câmpul altui rând și textul tastat
 * sare pe alt element. Așa că, la intrarea în editor, fiecare element de listă
 * primește o cheie, iar la ieșire o pierde.
 *
 * Alternativa ar fi fost să stocăm cheile în baza de date. Ar fi însemnat să
 * ducem în conținutul clientului un detaliu care există doar din cauza felului
 * în care React randează liste.
 */

export type ElementListaEditor = { _cheie: string } & Record<string, unknown>;
export type ValoareEditor = Record<string, unknown>;

function cheieNoua(): string {
  return crypto.randomUUID();
}

function esteObiect(valoare: unknown): valoare is Record<string, unknown> {
  return typeof valoare === "object" && valoare !== null && !Array.isArray(valoare);
}

const MESAJ_ADRESA =
  "Nu pare o adresă. Începe cu / pentru o pagină din site, cu # pentru un loc din pagina asta, sau cu https:// pentru un site din afară.";

/**
 * O adresă către care poate duce un link.
 *
 * Verificarea există fiindcă un text oarecare scris într-un asemenea câmp
 * produce un link care nu duce nicăieri, iar pe pagină arată exact ca unul bun:
 * omul apasă și nu se întâmplă nimic. E genul de defect pe care nici cel care
 * l-a scris nu-l observă.
 */
/**
 * Forma unei adrese scurte: doar litere mici fără diacritice, cifre și cratime.
 * Orice altceva ajunge codificat procentual în bara de adrese — „consiliere
 * parentală" devine „consiliere%20parental%C4%83", imposibil de dictat la
 * telefon și de recunoscut într-un link.
 */
export function esteSlugValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

export function esteAdresaValida(adresa: string): boolean {
  const curat = adresa.trim();
  if (curat === "") return true;

  return (
    curat.startsWith("/") ||
    curat.startsWith("#") ||
    curat.startsWith("https://") ||
    curat.startsWith("http://") ||
    curat.startsWith("mailto:") ||
    curat.startsWith("tel:")
  );
}

/** Din baza de date către formular. */
export function catreEditor(brut: unknown, campuri: CampSchema[]): ValoareEditor {
  const sursa = esteObiect(brut) ? brut : {};
  const rezultat: ValoareEditor = {};

  for (const camp of campuri) {
    const valoare = sursa[camp.cheie];

    switch (camp.tip) {
      case "listaText": {
        // Rămâne un simplu vector de șiruri: se editează într-o singură casetă,
        // câte un rând per element, deci n-are nevoie de identitate per rând.
        const lista = Array.isArray(valoare) ? valoare : [];
        rezultat[camp.cheie] = lista.map((text) => String(text ?? ""));
        break;
      }
      case "lista": {
        const lista = Array.isArray(valoare) ? valoare : [];
        rezultat[camp.cheie] = lista.map((element) => ({
          _cheie: cheieNoua(),
          ...catreEditor(element, camp.campuri),
        }));
        break;
      }
      case "link": {
        const link = esteObiect(valoare) ? valoare : {};
        rezultat[camp.cheie] = { text: String(link.text ?? ""), href: String(link.href ?? "") };
        break;
      }
      case "imagine": {
        rezultat[camp.cheie] = esteObiect(valoare) ? valoare : null;
        break;
      }
      case "numar": {
        rezultat[camp.cheie] = typeof valoare === "number" ? String(valoare) : "";
        break;
      }
      default: {
        rezultat[camp.cheie] = typeof valoare === "string" ? valoare : "";
      }
    }
  }

  return rezultat;
}

/**
 * Din formular către baza de date.
 *
 * Câmpurile opționale rămase goale NU se scriu. Un `{"eyebrow": ""}` ar fi
 * funcționat la randare (șirul gol e fals), dar ar fi umplut conținutul
 * clientului cu chei fără valoare — greu de citit când te uiți în date ca să
 * înțelegi ce s-a stricat.
 */
export function catreStocare(valoare: ValoareEditor, campuri: CampSchema[]): Record<string, unknown> {
  const rezultat: Record<string, unknown> = {};

  for (const camp of campuri) {
    const brut = valoare[camp.cheie];

    switch (camp.tip) {
      case "listaText": {
        const lista = Array.isArray(brut) ? brut : [];
        // Rândurile goale dispar la salvare: cine lasă un rând liber între două
        // paragrafe nu vrea un paragraf gol pe site.
        const texte = lista.map((text) => String(text ?? "").trim()).filter((text) => text !== "");
        if (texte.length > 0) rezultat[camp.cheie] = texte;
        break;
      }
      case "lista": {
        const lista = Array.isArray(brut) ? (brut as ElementListaEditor[]) : [];
        const elemente = lista.map((element) => catreStocare(element, camp.campuri));
        if (elemente.length > 0) rezultat[camp.cheie] = elemente;
        break;
      }
      case "link": {
        const link = esteObiect(brut) ? brut : {};
        const text = String(link.text ?? "").trim();
        const href = String(link.href ?? "").trim();
        // Un buton fără text n-are ce căuta pe pagină, chiar dacă are adresă.
        if (text !== "") rezultat[camp.cheie] = { text, href };
        break;
      }
      case "imagine": {
        if (esteObiect(brut) && typeof brut.url === "string" && brut.url !== "") {
          rezultat[camp.cheie] = brut;
        }
        break;
      }
      case "numar": {
        const numar = Number(String(brut ?? "").trim());
        if (Number.isFinite(numar) && String(brut ?? "").trim() !== "") {
          rezultat[camp.cheie] = numar;
        }
        break;
      }
      default: {
        const text = String(brut ?? "").trim();
        if (text !== "") rezultat[camp.cheie] = text;
      }
    }
  }

  return rezultat;
}

/**
 * Erorile, cu cheia = drumul până la câmp („titlu", „servicii.0.descriere").
 * Drumul, nu doar numele: aceeași cheie apare în fiecare element al unei liste,
 * iar fără index eroarea de la al treilea serviciu s-ar afișa la primul.
 */
export function valideaza(
  valoare: ValoareEditor,
  campuri: CampSchema[],
  prefix = "",
): Record<string, string> {
  const erori: Record<string, string> = {};

  for (const camp of campuri) {
    const drum = prefix ? `${prefix}.${camp.cheie}` : camp.cheie;
    const brut = valoare[camp.cheie];

    if (camp.tip === "lista" || camp.tip === "listaText") {
      const lista = Array.isArray(brut) ? (brut as (ElementListaEditor | string)[]) : [];

      const areContinut =
        camp.tip === "listaText"
          ? lista.some((text) => String(text ?? "").trim() !== "")
          : lista.length > 0;

      if (camp.obligatoriu && !areContinut) {
        erori[drum] = "Adaugă cel puțin un element.";
      }

      if (camp.tip === "listaText" && camp.max && lista.length > camp.max) {
        erori[drum] = `Cel mult ${camp.max} rânduri. Acum sunt ${lista.length}.`;
      }

      if (camp.tip === "lista") {
        (lista as ElementListaEditor[]).forEach((element, i) => {
          Object.assign(erori, valideaza(element, camp.campuri, `${drum}.${i}`));
        });
      }
      continue;
    }

    if (camp.tip === "link") {
      const link = esteObiect(brut) ? brut : {};
      const href = String(link.href ?? "").trim();
      // Eroarea se pune pe subcâmp, nu pe grup: formularul are două casete
      // acolo, iar un mesaj pe grup n-ar spune care dintre ele e de reparat.
      if (!esteAdresaValida(href)) erori[`${drum}.href`] = MESAJ_ADRESA;
      continue;
    }

    if (camp.tip === "imagine" || camp.tip === "numar") continue;

    const text = String(brut ?? "").trim();

    if (camp.obligatoriu && text === "") {
      erori[drum] = "Câmpul acesta nu poate rămâne gol.";
    } else if (
      camp.tip === "textLung" &&
      camp.maxCuvinte &&
      numaraCuvinte(text) > camp.maxCuvinte
    ) {
      // Înaintea limitei în caractere: acolo unde există amândouă, cea în
      // cuvinte e cea despre care i s-a spus omului, iar cealaltă e doar o plasă
      // pusă mult mai sus.
      erori[drum] =
        `Cel mult ${numara(camp.maxCuvinte, "cuvânt", "cuvinte")}. ` +
        `Acum sunt ${numara(numaraCuvinte(text), "cuvânt", "cuvinte")}.`;
    } else if (camp.max && text.length > camp.max) {
      erori[drum] = `Maximum ${camp.max} de caractere. Acum sunt ${text.length}.`;
    } else if (camp.tip === "slug" && text !== "" && !esteSlugValid(text)) {
      erori[drum] =
        "Doar litere mici fără diacritice, cifre și cratime. Apasă butonul de lângă câmp ca să se completeze singură din nume.";
    } else if (camp.tip === "slug" && camp.slugInterzise?.includes(text)) {
      // Adresa e a unei rute scrise în cod, care câștigă mereu. Pagina n-ar da
      // vreo eroare — ar rămâne pur și simplu invizibilă, iar clientul ar reciti
      // adresa de zece ori întrebându-se ce a greșit.
      erori[drum] = `Adresa „${text}” e folosită deja de site. Alege alta.`;
    } else if (camp.tip === "adresa" && !esteAdresaValida(text)) {
      erori[drum] = MESAJ_ADRESA;
    } else if (camp.tip === "email" && text !== "" && !esteEmailValid(text)) {
      // Aceeași verificare ca la formularul public de contact, din același
      // fișier: două reguli scrise separat ar ajunge să nu mai fie aceeași.
      erori[drum] = "Adresa de email nu pare completă.";
    }
  }

  return erori;
}
