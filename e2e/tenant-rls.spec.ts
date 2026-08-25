import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Livrabilul central al Fazei 1 (plan-implementare-cms.md): un tenant de test
 * nu poate vedea datele altui tenant. Testează direct la nivel de RLS, prin
 * REST-ul Supabase (exact ce face @supabase/supabase-js sub capotă) — nu prin
 * UI, ca să fie izolat de logica de rezolvare a domeniului din proxy.ts.
 *
 * Cere TEST_TENANT_A_EMAIL/PASSWORD + TEST_TENANT_B_EMAIL/PASSWORD în mediu
 * (vezi .env.local.example) și cele două site-uri seedate — vezi
 * supabase/seed-test-tenants.sql.
 */

const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_KEY = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");

const TENANT_A = {
  email: requireEnv("TEST_TENANT_A_EMAIL"),
  password: requireEnv("TEST_TENANT_A_PASSWORD"),
};
const TENANT_B = {
  email: requireEnv("TEST_TENANT_B_EMAIL"),
  password: requireEnv("TEST_TENANT_B_PASSWORD"),
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Lipsește variabila de mediu ${name} (vezi .env.local.example).`);
  }
  return value;
}

async function signInAndReadSiteContent(credentials: { email: string; password: string }) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword(credentials);
  if (authError || !authData.session) {
    throw new Error(`Login eșuat pentru ${credentials.email}: ${authError?.message}`);
  }

  // Interogare FĂRĂ filtru pe site_id — dacă RLS-ul e greșit, ar întoarce
  // rândurile ambelor tenanți. Dacă e corect, doar rândurile tenantului logat.
  const { data: rows, error } = await supabase.from("site_content").select("site_id, key");
  if (error) {
    throw new Error(`Query site_content eșuat pentru ${credentials.email}: ${error.message}`);
  }

  await supabase.auth.signOut();
  return rows ?? [];
}

test("un tenant nu poate vedea datele altui tenant (RLS)", async () => {
  const contentA = await signInAndReadSiteContent(TENANT_A);
  const contentB = await signInAndReadSiteContent(TENANT_B);

  // Fiecare tenant de test trebuie să aibă cel puțin un rând seedat — altfel
  // testul ar trece "din greșeală" (liste goale, nimic de comparat).
  expect(contentA.length, "tenant A n-a returnat niciun rând — seed lipsă?").toBeGreaterThan(0);
  expect(contentB.length, "tenant B n-a returnat niciun rând — seed lipsă?").toBeGreaterThan(0);

  const siteIdsSeenByA = new Set(contentA.map((row) => row.site_id));
  const siteIdsSeenByB = new Set(contentB.map((row) => row.site_id));

  expect(siteIdsSeenByA.size, "A vede mai mult de un site_id — RLS scurge date").toBe(1);
  expect(siteIdsSeenByB.size, "B vede mai mult de un site_id — RLS scurge date").toBe(1);
  expect([...siteIdsSeenByA][0]).not.toBe([...siteIdsSeenByB][0]);
});
