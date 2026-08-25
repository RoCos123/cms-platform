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
