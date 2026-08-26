import "server-only";

import { headers } from "next/headers";
import { CAMP_CAPCANA } from "@/lib/formulare";

export function capcanaDeclansata(formData: FormData): boolean {
  const valoare = formData.get(CAMP_CAPCANA);
  return typeof valoare === "string" && valoare.trim() !== "";
}

const URL_VERIFICARE = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 5000;

export type VerdictAntispam = { ok: true } | { ok: false; motiv: string };

/**
 * Verifică tokenul Turnstile.
 *
 * Două decizii care se văd în comportament:
 *
 * 1. **Fără `TURNSTILE_SECRET_KEY`, verificarea se sare.** Serverul e autoritatea:
 *    dacă platforma n-a fost configurată cu Turnstile, formularele trebuie totuși
 *    să funcționeze. Capcana și plafoanele din baza de date rămân active.
 *
 * 2. **La eroare de rețea răspundem „trece", nu „pică".** Un verificator
 *    inaccesibil nu e o dovadă că cine trimite e bot. Alternativa — să blocăm
 *    tot cât timp Cloudflare are probleme — ar însemna că un om care caută un
 *    psiholog nu poate lua legătura deloc. Un verdict explicit de „invalid" de
 *    la Cloudflare, în schimb, se respectă.
 */
export async function verificaTurnstile(token: string | null): Promise<VerdictAntispam> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };

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
    const raspuns = await fetch(URL_VERIFICARE, {
      method: "POST",
      body: corp,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!raspuns.ok) {
      console.warn(`Turnstile a răspuns cu ${raspuns.status}; las cererea să treacă.`);
      return { ok: true };
    }

    const rezultat = (await raspuns.json()) as { success?: boolean };

    if (rezultat.success) return { ok: true };

    return {
      ok: false,
      motiv: "Verificarea anti-spam nu a trecut. Bifează caseta de verificare și încearcă din nou.",
    };
  } catch (eroare) {
    console.warn("Turnstile inaccesibil; las cererea să treacă.", eroare);
    return { ok: true };
  }
}

/**
 * IP-ul clientului, atât cât se poate ști în spatele unui proxy. Se trimite doar
 * mai departe la Cloudflare, ca semnal suplimentar — nu se stochează și nu se
 * ia nicio decizie pe baza lui aici, fiindcă anteturile astea sunt falsificabile.
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
