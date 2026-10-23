import { normalizeazaHex } from "./culoare";
import { ROLURI_MANUALE, type AspectCulori, type RolManual } from "./culori";
import { fontText, fontTitlu, type AspectFonturi } from "./fonturi";

/**
 * Salvarea culorilor și fonturilor alese în meniul „Aspect": ce se acceptă de la browser și cum
 * se pune în `site_settings.brand`. Fișier fără „use server" și fără `server-only`, ca să-l poată
 * citi și panoul (lista de culori gata alese), și acțiunea, și probele din Node.
 */

/**
 * Culorile gata alese, colecția „Mătăsos & Radiant" — „Silk & Velvet" (a treia rundă, 19 oct.
 * 2026): pigment pur, saturat și adânc, după referințele vizuale ale proprietarului. Numele și
 * codurile sunt exact cele date de el. Fiind toate închise, apar pe butoane exact așa (proba
 * `aspect-culori` o verifică pe toate cinci șabloanele); linkurile, banda și mătasea lor se
 * calculează din ele.
 */
export const PRESETURI_MATASOASE = [
  { nume: "Rosewood", hex: "#5C1D24", matasos: true },
  { nume: "Bordeaux", hex: "#4F0D1A", matasos: true },
  { nume: "Aubergine", hex: "#3A0A26", matasos: true },
  { nume: "Plum", hex: "#42163B", matasos: true },
  { nume: "Indigo", hex: "#1F1646", matasos: true },
  { nume: "Bleumarin", hex: "#0D1B38", matasos: true },
  { nume: "Safir", hex: "#0A3463", matasos: true },
  { nume: "Teal", hex: "#0A3D44", matasos: true },
  { nume: "Smarald", hex: "#083D27", matasos: true },
  { nume: "Eucalipt", hex: "#3A4637", matasos: true },
  { nume: "Oliv", hex: "#3B3E19", matasos: true },
  { nume: "Espresso", hex: "#2E1D14", matasos: true },
] as const;

/**
 * Colecția „Mat & Mineral" (23 oct. 2026, cerută de proprietar): aceleași culori de statut, cu o
 * cromă mai calmă, pentru un aspect plat, mat, mineral — fără luciu pe benzi și butoane. Numele și
 * codurile sunt exact cele date de el; banda și linkurile lor ies din `REGULI_MATE`.
 */
export const PRESETURI_MATE = [
  { nume: "Rosewood Mat", hex: "#54282C", matasos: false },
  { nume: "Bordeaux Mat", hex: "#4A1822", matasos: false },
  { nume: "Aubergine Mat", hex: "#361529", matasos: false },
  { nume: "Plum Mat", hex: "#3D2038", matasos: false },
  { nume: "Indigo Mat", hex: "#252040", matasos: false },
  { nume: "Bleumarin Mat", hex: "#162238", matasos: false },
  { nume: "Safir Mat", hex: "#163659", matasos: false },
  { nume: "Teal Mat", hex: "#1B3B3E", matasos: false },
  { nume: "Smarald Mat", hex: "#163628", matasos: false },
  { nume: "Eucalipt Mat", hex: "#3A4637", matasos: false },
  { nume: "Oliv Mat", hex: "#3B3C26", matasos: false },
  { nume: "Espresso Mat", hex: "#30231C", matasos: false },
] as const;

/**
 * Cele două colecții, cum le arată ecranul „Aspect": fiecare cu finisajul ei. Butonul colecției ESTE
 * alegerea finisajului — se aplică și unei culori alese cu pipeta, nu doar mostrelor.
 */
export const COLECTII_CULOARE = [
  {
    finisaj: "matasos",
    nume: "Mătăsos & Radiant",
    descriere: "Banda închisă și butoanele au o patină de mătase: o lumină fină care trece peste culoare.",
    preseturi: PRESETURI_MATASOASE,
  },
  {
    finisaj: "mat",
    nume: "Mat & Mineral",
    descriere: "Aceleași culori de statut, mai calme: banda și butoanele sunt culoare plină, plată, fără luciu.",
    preseturi: PRESETURI_MATE,
  },
] as const;

/**
 * Culoarea arătată în selector cât timp clientul n-a ales nimic (Safir). E DOAR o propunere
 * în câmp: nu se salvează și nu schimbă site-ul până nu apasă omul pe ceva. Șablonul Claritate
 * își păstrează propria culoare (`#1B5C99`), deci site-urile fără culori alese rămân neatinse.
 */
export const CULOARE_PROPUSA = "#0A3463";

export type RezultatValidare = { ok: true; culori: AspectCulori } | { ok: false; mesaj: string };

const MESAJ_STRICAT = "Ce am primit nu arată a culori. Reîncarcă pagina și încearcă din nou.";
const FORMA = "Scrie-o ca #RRGGBB, de pildă #2E7D5B.";

const lipseste = (valoare: unknown) => valoare === undefined || valoare === null || valoare === "";

/**
 * Ce trimite browserul, verificat de la zero. Spre deosebire de `citesteAspectCulori`
 * (care citește din bază și ignoră în tăcere ce nu e valid), aici o greșeală se SPUNE:
 * omul a scris ceva, iar ce n-am înțeles nu dispare pe nesimțite.
 *
 * Se păstrează doar culorile modului manual și finisajul (doar „mat"; mătăsosul nu se scrie, e
 * implicit); orice altă cheie se aruncă.
 */
export function valideazaCulori(brut: unknown): RezultatValidare {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    return { ok: false, mesaj: MESAJ_STRICAT };
  }

  const sursa = brut as Record<string, unknown>;
  if (sursa.mod !== "auto" && sursa.mod !== "manual") return { ok: false, mesaj: MESAJ_STRICAT };

  // Finisajul: „mat" sau nimic (= mătăsos). Altceva nu vine dintr-un ecran al nostru.
  if (!lipseste(sursa.finisaj) && sursa.finisaj !== "mat" && sursa.finisaj !== "matasos") {
    return { ok: false, mesaj: MESAJ_STRICAT };
  }
  const finisaj = sursa.finisaj === "mat" ? { finisaj: "mat" as const } : {};

  let principala: string | null = null;
  if (!lipseste(sursa.principala)) {
    principala = normalizeazaHex(sursa.principala);
    if (!principala) return { ok: false, mesaj: `Culoarea principală nu e o culoare validă. ${FORMA}` };
  }

  if (sursa.mod === "auto") {
    if (!principala) return { ok: false, mesaj: "Alege o culoare principală." };
    return { ok: true, culori: { mod: "auto", principala, manual: {}, asumat: false, ...finisaj } };
  }

  const manual: Partial<Record<RolManual, string>> = {};
  const sursaManual =
    typeof sursa.manual === "object" && sursa.manual !== null && !Array.isArray(sursa.manual)
      ? (sursa.manual as Record<string, unknown>)
      : {};

  for (const rol of ROLURI_MANUALE) {
    const valoare = sursaManual[rol.cheie];
    if (lipseste(valoare)) continue;

    const hex = normalizeazaHex(valoare);
    if (!hex) return { ok: false, mesaj: `„${rol.nume}” nu e o culoare validă. ${FORMA}` };
    manual[rol.cheie] = hex;
  }

  if (!principala && Object.keys(manual).length === 0) {
    return { ok: false, mesaj: "Nu ai schimbat nicio culoare." };
  }

  return { ok: true, culori: { mod: "manual", principala, manual, asumat: sursa.asumat === true, ...finisaj } };
}

const esteObiect = (valoare: unknown): valoare is Record<string, unknown> =>
  typeof valoare === "object" && valoare !== null && !Array.isArray(valoare);

/**
 * `brand`-ul cu culorile puse (sau scoase, la `null`), fără să atingă nimic altceva.
 *
 * `brand` ține și datele cabinetului din Setări, iar `brand.aspect` ține și fonturile:
 * scrierea culorilor trebuie să lase neatinse și una, și cealaltă. La `null` cheia
 * `culori` dispare (nu rămâne un `null` în bază), iar un `aspect` rămas gol dispare și el.
 */
export function brandCuCulori(brand: unknown, culori: AspectCulori | null): Record<string, unknown> {
  const rezultat: Record<string, unknown> = esteObiect(brand) ? { ...brand } : {};
  const aspect: Record<string, unknown> = esteObiect(rezultat.aspect) ? { ...rezultat.aspect } : {};

  if (culori) aspect.culori = culori;
  else delete aspect.culori;

  if (Object.keys(aspect).length === 0) delete rezultat.aspect;
  else rezultat.aspect = aspect;

  return rezultat;
}

export type RezultatValidareFonturi = { ok: true; fonturi: AspectFonturi | null } | { ok: false; mesaj: string };

/**
 * Fonturile trimise de browser, verificate de la zero. Doar nume din liste: un font necunoscut
 * nu e descărcat la build, deci pe site ar ieși fontul de rezervă — se SPUNE, nu se salvează.
 * `null` (sau ambele goale) = fonturile șablonului.
 */
export function valideazaFonturi(brut: unknown): RezultatValidareFonturi {
  if (brut === null) return { ok: true, fonturi: null };
  if (typeof brut !== "object" || Array.isArray(brut)) return { ok: false, mesaj: MESAJ_FONTURI_STRICAT };

  const sursa = brut as Record<string, unknown>;
  const titluri = lipseste(sursa.titluri) ? null : fontTitlu(sursa.titluri)?.nume;
  const text = lipseste(sursa.text) ? null : fontText(sursa.text)?.nume;
  if (titluri === undefined) return { ok: false, mesaj: "Fontul ales pentru titluri nu e în listă. Alege unul de acolo." };
  if (text === undefined) return { ok: false, mesaj: "Fontul ales pentru text nu e în listă. Alege unul de acolo." };

  return { ok: true, fonturi: titluri || text ? { titluri, text } : null };
}

const MESAJ_FONTURI_STRICAT = "Ce am primit nu arată a fonturi. Reîncarcă pagina și încearcă din nou.";

/** `brand`-ul cu fonturile puse (sau scoase, la `null`) — aceeași regulă ca la culori. */
export function brandCuFonturi(brand: unknown, fonturi: AspectFonturi | null): Record<string, unknown> {
  const rezultat: Record<string, unknown> = esteObiect(brand) ? { ...brand } : {};
  const aspect: Record<string, unknown> = esteObiect(rezultat.aspect) ? { ...rezultat.aspect } : {};

  if (fonturi) aspect.fonturi = fonturi;
  else delete aspect.fonturi;

  if (Object.keys(aspect).length === 0) delete rezultat.aspect;
  else rezultat.aspect = aspect;

  return rezultat;
}
