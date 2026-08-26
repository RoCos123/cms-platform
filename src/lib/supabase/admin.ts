import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getTenant } from "@/lib/dal";

/**
 * Client cu cheia secretă — **ocolește complet RLS**. Nu-l folosi direct decât
 * acolo unde chiar ai nevoie de acces neîngrădit (rezolvarea tenantului în
 * proxy.ts, unde încă nu știm cine e tenantul).
 *
 * Pentru citirea datelor unui site public folosește `tenantTable()` de mai jos,
 * care impune filtrul pe `site_id` prin construcție.
 */
export function createServiceClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "Lipsește SUPABASE_SECRET_KEY. Necesară pentru citirea datelor site-urilor publice " +
        "(vezi supabase/migrations/20260825140000_harden_rls.sql).",
    );
  }

  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Punctul unic prin care site-urile publice citesc din baza de date.
 *
 * Rolul `anon` nu mai are acces la niciun tabel (migrarea de întărire), fiindcă
 * nu putea fi scopat pe tenant: cheia publishable e publică, deci orice
 * politică `to anon` fără predicat pe `site_id` expunea datele tuturor
 * clienților. Accesul se face acum server-side, cu cheia secretă — iar filtrul
 * pe tenant e aplicat aici, nu lăsat pe seama fiecărui apel.
 *
 * `site_id` vine din tenantul rezolvat de proxy.ts pentru cererea curentă,
 * niciodată din input de la client.
 */
export async function tenantTable(table: string) {
  const { siteId } = await getTenant();
  const supabase = createServiceClient();

  return {
    select(
      columns = "*",
      options?: { head?: boolean; count?: "exact" | "planned" | "estimated" },
    ) {
      return supabase.from(table).select(columns, options).eq("site_id", siteId);
    },
    insert(values: Record<string, unknown>) {
      return supabase.from(table).insert({ ...values, site_id: siteId });
    },
    /**
     * Filtrul pe `site_id` e deja aplicat, dar apelantul TREBUIE să adauge și
     * restul condițiilor (`.eq("id", …)`): altfel un update atinge tot tabelul
     * tenantului. Aici putem garanta doar că nu iese din tenant.
     */
    update(values: Record<string, unknown>) {
      return supabase.from(table).update(values).eq("site_id", siteId);
    },
  };
}
