import { normalizeazaHex } from "./culoare";
import { ROLURI_MANUALE, type AspectCulori, type RolManual } from "./culori";

/**
 * Salvarea culorilor alese în meniul „Aspect": ce se acceptă de la browser și cum se pune
 * în `site_settings.brand`. Fișier fără „use server" și fără `server-only`, ca să-l poată
 * citi și panoul (lista de culori gata alese), și acțiunea, și probele din Node.
 */

/**
 * Culorile gata alese, de unde clientul poate porni. Toate sunt destul de închise ca să se
 * citească pe fundalul deschis al oricărui șablon, deci panoul nu trebuie să-i spună niciodată
 * „am întunecat-o". Pe „Căldură" (fundal de relief mai închis) unele ies cu 1–3 trepte pe
 * canal mai închise decât aici — nu se vede, iar proba `aspect-culori` o măsoară pe toate cinci.
 */
export const PRESETURI_CULOARE = [
  { nume: "Teracotă", hex: "#904D39" },
  { nume: "Cărămiziu", hex: "#A8312F" },
  { nume: "Roz prăfuit", hex: "#9C3F65" },
  { nume: "Prună", hex: "#8E3B5F" },
  { nume: "Violet", hex: "#6B4FA0" },
  { nume: "Bleumarin", hex: "#1D3557" },
  { nume: "Albastru", hex: "#1D5C99" },
  { nume: "Turcoaz", hex: "#0F6B6B" },
  { nume: "Verde", hex: "#2F6B4E" },
  { nume: "Oliv", hex: "#576515" },
  { nume: "Maro", hex: "#7A5230" },
  { nume: "Gri-albăstrui", hex: "#4A6070" },
] as const;

export type RezultatValidare = { ok: true; culori: AspectCulori } | { ok: false; mesaj: string };

const MESAJ_STRICAT = "Ce am primit nu arată a culori. Reîncarcă pagina și încearcă din nou.";
const FORMA = "Scrie-o ca #RRGGBB, de pildă #2E7D5B.";

const lipseste = (valoare: unknown) => valoare === undefined || valoare === null || valoare === "";

/**
 * Ce trimite browserul, verificat de la zero. Spre deosebire de `citesteAspectCulori`
 * (care citește din bază și ignoră în tăcere ce nu e valid), aici o greșeală se SPUNE:
 * omul a scris ceva, iar ce n-am înțeles nu dispare pe nesimțite.
 *
 * Se păstrează doar cele opt culori ale modului manual; orice altă cheie se aruncă.
 */
export function valideazaCulori(brut: unknown): RezultatValidare {
  if (typeof brut !== "object" || brut === null || Array.isArray(brut)) {
    return { ok: false, mesaj: MESAJ_STRICAT };
  }

  const sursa = brut as Record<string, unknown>;
  if (sursa.mod !== "auto" && sursa.mod !== "manual") return { ok: false, mesaj: MESAJ_STRICAT };

  let principala: string | null = null;
  if (!lipseste(sursa.principala)) {
    principala = normalizeazaHex(sursa.principala);
    if (!principala) return { ok: false, mesaj: `Culoarea principală nu e o culoare validă. ${FORMA}` };
  }

  if (sursa.mod === "auto") {
    if (!principala) return { ok: false, mesaj: "Alege o culoare principală." };
    return { ok: true, culori: { mod: "auto", principala, manual: {}, asumat: false } };
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

  return { ok: true, culori: { mod: "manual", principala, manual, asumat: sursa.asumat === true } };
}

const esteObiect = (valoare: unknown): valoare is Record<string, unknown> =>
  typeof valoare === "object" && valoare !== null && !Array.isArray(valoare);

/**
 * `brand`-ul cu culorile puse (sau scoase, la `null`), fără să atingă nimic altceva.
 *
 * `brand` ține și datele cabinetului din Setări, iar `brand.aspect` va ține în curând și
 * fonturile: scrierea culorilor trebuie să lase neatinse și una, și cealaltă. La `null` cheia
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
