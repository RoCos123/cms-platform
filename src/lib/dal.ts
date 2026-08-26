import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Tenantul rezolvat de proxy.ts pentru cererea curentă (vezi src/proxy.ts). */
export const getTenant = cache(async () => {
  const headerList = await headers();
  const siteId = headerList.get("x-site-id");
  const domain = headerList.get("x-site-domain");

  if (!siteId || !domain) {
    throw new Error(
      "Tenant nerezolvat — proxy.ts ar fi trebuit să intercepteze cererea înainte de a ajunge aici.",
    );
  }

  return { siteId, domain };
});

/**
 * Sesiunea, dacă există — fără redirect.
 *
 * Perechea lui `verifySession()`: aceleași verificări (autentificat ȘI aparține
 * tenantului acestui domeniu), dar întoarce `null` în loc să trimită la /login.
 * E ce-i trebuie site-ului public, unde absența unei sesiuni e cazul normal, nu
 * o eroare.
 *
 * Pentru un vizitator obișnuit nu costă nimic: fără cookie de sesiune,
 * `getUser()` întoarce `null` fără să iasă în rețea, iar interogarea următoare
 * nici nu se mai face.
 *
 * ATENȚIE la memorare: citirea cookie-urilor scoate ruta din randarea statică,
 * deci pagina publică rămâne dinamică. Dacă cineva adaugă vreodată `revalidate`
 * sau cache public pe pagina principală, bara de administrare ar putea ajunge
 * în răspunsul servit vizitatorilor. Nu adăuga cache fără să muți întâi bara.
 */
export const getSesiuneOptionala = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const tenant = await getTenant();

  const { data: profile } = await supabase
    .from("users")
    .select("site_id")
    .eq("id", user.id)
    .maybeSingle();

  // Un cont valid pe alt domeniu nu e proprietarul acestui site. Fără
  // verificarea asta, pe un domeniu de preview unde cookie-urile sunt comune,
  // clientul A ar vedea bara de administrare pe site-ul clientului B.
  if (!profile || profile.site_id !== tenant.siteId) return null;

  return { userId: user.id, email: user.email ?? "", siteId: tenant.siteId };
});

/**
 * Data Access Layer pentru rutele din /dashboard — verifică sesiunea Supabase
 * ȘI că userul autentificat chiar aparține tenantului rezolvat pentru acest
 * domeniu (nu doar că e autentificat undeva). Fără asta, un user logat pe
 * domeniul lui ar putea, teoretic, ajunge cu sesiunea validă pe /dashboard al
 * altui tenant — RLS tot i-ar bloca datele, dar aici respingem explicit
 * mismatch-ul înainte de a randa orice.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const tenant = await getTenant();

  const { data: profile } = await supabase
    .from("users")
    .select("site_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.site_id !== tenant.siteId) {
    redirect("/login?error=cont-gresit");
  }

  return { userId: user.id, email: user.email ?? "", siteId: tenant.siteId };
});
