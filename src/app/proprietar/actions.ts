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
 */
export async function intraInPanou(formData: FormData) {
  const proprietar = await getProprietarOptional();
  if (!proprietar) redirect("/proprietar/login");

  const siteId = String(formData.get("siteId") ?? "");
  if (!siteId) redirect("/proprietar?eroare=lipsa-site");

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

  if (!site?.domain || !cont?.email) {
    // Un site fără cont legat n-are panou în care să intri. Îi spunem, nu-l
    // lăsăm să apese într-un gol.
    redirect("/proprietar?eroare=fara-cont");
  }

  // Generat, NU trimis pe email: `generateLink` doar întoarce dovada.
  const { data: link, error } = await service.auth.admin.generateLink({
    type: "magiclink",
    email: cont.email,
  });

  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) {
    console.error("[proprietar] generateLink:", error?.message);
    redirect("/proprietar?eroare=link");
  }

  // Consumat pe host-ul site-ului țintă, unde se poate scrie cookie-ul lui.
  const tinta = new URL("/proprietar/intra", `https://${site.domain}`);
  tinta.searchParams.set("token_hash", tokenHash);
  redirect(tinta.toString());
}
