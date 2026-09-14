"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getProprietarOptional } from "@/lib/proprietar";

/** Ieșirea din panoul de proprietar. */
export async function signOutProprietar() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/proprietar/login");
}

/** Ce află apelantul: ori adresa de deschis, ori de ce n-a mers. */
export type RezultatIntrare =
  | { ok: true; url: string }
  | { ok: false; eroare: "neautentificat" | "lipsa-site" | "fara-cont" | "link" };

/**
 * „Intră în panoul acestui site" — partea delicată.
 *
 * Nu schimbăm nimic la pereții dintre clienți. Pur și simplu îți facem o sesiune
 * a contului cabinetului, pe care o consumi PE HOST-ul lui (cookie-urile nu trec
 * între subdomenii), prin același mecanism ca la resetarea parolei:
 * `generateLink` scoate un token, iar `verifyOtp` (în `/proprietar/intra`, pe
 * host-ul țintă) îl preschimbă în sesiune. De acolo, panoul e exact panoul
 * clientului — RLS îl scopază pe contul cu care ai intrat, nimic în plus.
 *
 * Paznicul „ești proprietarul?" stă AICI, în acțiune, nu pe seama proxy-ului: un
 * Server Action e un POST pe ruta lui, iar o mutare a ei l-ar putea scoate tăcut
 * de sub proxy (ghidul Next, „Execution order"). `generateLink` pe un cont
 * arbitrar e o putere mare — deci se verifică lângă ea, nu departe.
 *
 * ÎNTOARCE adresa, nu mai face `redirect`. Motivul e cererea proprietarului:
 * apăsând „Intră", panoul cu toate site-urile îi era înlocuit în aceeași filă și
 * îl pierdea. Acum butonul (client) deschide ținta într-o filă nouă și lasă
 * lista deschisă în cea veche. Tokenul se generează tot aici, DUPĂ paznic — pe
 * client ajunge doar adresa gata făcută, aceeași care mergea și prin redirect.
 */
export async function intraInPanou(siteId: string): Promise<RezultatIntrare> {
  const proprietar = await getProprietarOptional();
  if (!proprietar) return { ok: false, eroare: "neautentificat" };

  if (!siteId) return { ok: false, eroare: "lipsa-site" };

  const service = createServiceClient();

  const { data: site } = await service
    .from("sites")
    .select("domain")
    .eq("id", siteId)
    .maybeSingle();

  const { data: cont } = await service
    .from("users")
    .select("email")
    .eq("site_id", siteId)
    .maybeSingle();

  // Un site fără cont legat n-are panou în care să intri. Îi spunem, nu-l
  // lăsăm să apese într-un gol.
  if (!site?.domain || !cont?.email) {
    return { ok: false, eroare: "fara-cont" };
  }

  // Generat, NU trimis pe email: `generateLink` doar întoarce dovada.
  const { data: link, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: cont.email,
  });

  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[proprietar] generateLink:", error?.message);
    return { ok: false, eroare: "link" };
  }

  // Consumat pe host-ul site-ului țintă, unde se poate scrie cookie-ul lui.
  const tinta = new URL("/proprietar/intra", `https://${site.domain}`);
  tinta.searchParams.set("token_hash", tokenHash);
  return { ok: true, url: tinta.toString() };
}
