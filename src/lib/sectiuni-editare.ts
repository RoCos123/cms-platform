import type { CampSchema } from "@/lib/sectiuni";

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

    if (camp.tip === "link" || camp.tip === "imagine" || camp.tip === "numar") continue;

    const text = String(brut ?? "").trim();

    if (camp.obligatoriu && text === "") {
      erori[drum] = "Câmpul acesta nu poate rămâne gol.";
    } else if (camp.max && text.length > camp.max) {
      erori[drum] = `Maximum ${camp.max} de caractere. Acum sunt ${text.length}.`;
    }
  }

  return erori;
}
