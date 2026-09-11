import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Cine e proprietarul PLATFORMEI — tu, cel care vede toate site-urile.
 *
 * Complet separat de „proprietarul unui site" (clientul, recunoscut prin
 * `users.site_id` în `dal.ts`). Un cont de proprietar nu e legat de niciun
 * cabinet; apartenența lui stă în tabela `platform_owners`, semănată cu SQL
 * (vezi migrarea `panou_proprietar`).
 *
 * Verificarea e în DOI pași care nu se pot păcăli unul pe altul:
 *   1. `getUser()` validează sesiunea cu Supabase → un `user.id` de încredere
 *      (nu `getSession()`, care ar crede un cookie pe cuvânt).
 *   2. căutăm acel id în `platform_owners` cu CHEIA SECRETĂ, peste RLS.
 *
 * Un client nu-și poate fabrica apartenența: n-are cum să scrie în schema
 * `auth`, iar tabela `platform_owners` nu e nici citibilă, nici scriibilă de
 * rolul lui (RLS pornit, fără politici, drepturi revocate).
 *
 * `react.cache`: o singură verificare pe cerere, chiar dacă o cheamă și layoutul,
 * și pagina, și o acțiune.
 */
export const getProprietarOptional = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const service = createServiceClient();
  const { data } = await service
    .from("platform_owners")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return { userId: user.id, email: user.email ?? "" };
});

/**
 * Paznicul rutelor de sub `/proprietar`: ori ești proprietarul platformei, ori
 * ești trimis la conectare. Se cheamă la începutul fiecărei pagini ȘI al
 * fiecărei acțiuni de server — niciodată lăsat pe seama proxy-ului.
 *
 * De ce nu doar în proxy: un Server Action e un POST pe ruta lui, iar un matcher
 * sau o mutare a acțiunii poate scoate tăcut ruta de sub proxy (vezi ghidul Next,
 * „Execution order"). Granița reală stă aici, în cod, lângă datele pe care le
 * apără.
 */
export async function verificaProprietar() {
  const proprietar = await getProprietarOptional();
  if (!proprietar) redirect("/proprietar/login");
  return proprietar;
}
