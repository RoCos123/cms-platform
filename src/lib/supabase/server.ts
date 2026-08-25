import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pentru Server Components / Server Actions — respectă sesiunea
 * userului curent din cookies, deci RLS se aplică ca `authenticated`, scopat de
 * `current_site_id()`. Aceasta e granița reală de izolare între tenanți, nu
 * verificările din proxy.ts (care sunt doar optimistice).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Apelat dintr-un Server Component — proxy.ts reîmprospătează deja
            // sesiunea la fiecare request, deci poate fi ignorat în siguranță.
          }
        },
      },
    },
  );
}
