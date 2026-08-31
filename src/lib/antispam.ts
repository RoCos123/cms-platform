import "server-only";

import { headers } from "next/headers";
import { CAMP_CAPCANA } from "@/lib/formulare";
import { alegeFurnizor, tokenulDinFormular } from "@/lib/captcha";

export function capcanaDeclansata(formData: FormData): boolean {
  const valoare = formData.get(CAMP_CAPCANA);
  return typeof valoare === "string" && valoare.trim() !== "";
}

const TIMEOUT_MS = 5000;

export type VerdictAntispam = { ok: true } | { ok: false; motiv: string };

/**
 * Verifică tokenul casetei anti-spam, la furnizorul configurat (vezi
 * `src/lib/captcha.ts` — implicit hCaptcha, fiindcă e singurul fără plafon de
 * domenii).
 *
 * Primește `FormData` întreg, nu tokenul: numele câmpului ascuns diferă de la un
 * furnizor la altul, iar dacă îl citea fiecare acțiune în parte, o schimbare de
 * furnizor cerea umblat în trei locuri.
 *
 * Trei decizii care se văd în comportament:
 *
 * 1. **Fără `CAPTCHA_SECRET_KEY`, verificarea se sare.** Serverul e autoritatea:
 *    dacă platforma n-a fost configurată cu casetă, formularele trebuie totuși
 *    să funcționeze. Capcana și plafoanele din baza de date rămân active.
 *
 * 2. **La eroare de rețea răspundem „trece”, nu „pică”.** Un verificator
 *    inaccesibil nu e o dovadă că cine trimite e bot. Alternativa — să blocăm
 *    tot cât timp furnizorul are probleme — ar însemna că un om care caută un
 *    psiholog nu poate lua legătura deloc. Un verdict explicit de „invalid”, în
 *    schimb, se respectă.
 *
 * 3. **Hostname-ul din răspuns nu se verifică.** Cheia publică e aceeași pentru
 *    toate cabinetele, deci cineva ar putea, teoretic, s-o folosească de pe
 *    pagina lui. Numai că tot ar trebui să rezolve o casetă pentru fiecare
 *    cerere — adică exact costul pe care caseta îl impune oricum — iar
 *    plafoanele din `programari.ts` și `formulare.ts` mărginesc restul. În
 *    schimb, o comparație de gazde ar pica pe www vs. fără www, pe domenii cu
 *    diacritice și în spatele proxy-urilor, blocând oameni adevărați. Câmpul
 *    `hostname` există în răspuns dacă vreodată se schimbă socoteala.
 */
export async function verificaCaptcha(formData: FormData): Promise<VerdictAntispam> {
  const secret = process.env.CAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true };

  const furnizor = alegeFurnizor(process.env.NEXT_PUBLIC_CAPTCHA_FURNIZOR);
  const token = tokenulDinFormular(formData, furnizor);

  if (!token) {
    return {
      ok: false,
      motiv: "Verificarea anti-spam nu s-a încărcat. Reîncarcă pagina și încearcă din nou.",
    };
  }

  const corp = new URLSearchParams({ secret, response: token });

  const ip = await ipulClientului();
  if (ip) corp.set("remoteip", ip);

  try {
    const raspuns = await fetch(furnizor.verificare, {
      method: "POST",
      body: corp,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!raspuns.ok) {
      console.warn(`${furnizor.nume} a răspuns cu ${raspuns.status}; las cererea să treacă.`);
      return { ok: true };
    }

    const rezultat = (await raspuns.json()) as { success?: boolean };

    if (rezultat.success) return { ok: true };

    return {
      ok: false,
      motiv: "Verificarea anti-spam nu a trecut. Bifează caseta de verificare și încearcă din nou.",
    };
  } catch (eroare) {
    console.warn(`${furnizor.nume} inaccesibil; las cererea să treacă.`, eroare);
    return { ok: true };
  }
}

/**
 * IP-ul clientului, atât cât se poate ști în spatele unui proxy. Se trimite doar
 * mai departe la furnizor, ca semnal suplimentar — nu se stochează și nu se ia
 * nicio decizie pe baza lui aici, fiindcă anteturile astea sunt falsificabile.
 */
async function ipulClientului(): Promise<string | null> {
  const anteturi = await headers();

  const forwarded = anteturi.get("x-forwarded-for");
  if (forwarded) {
    const primul = forwarded.split(",")[0]?.trim();
    if (primul) return primul;
  }

  return anteturi.get("x-real-ip");
}
