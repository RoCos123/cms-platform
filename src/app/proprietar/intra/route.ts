import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Capătul pe care intri, ca proprietar, în panoul unui cabinet.
 *
 * Rulează pe HOST-ul site-ului țintă (proprietarul a fost trimis aici de
 * `intraInPanou`), fiindcă doar aici cookie-ul de sesiune al contului se poate
 * scrie — cookie-urile nu trec între subdomenii. Preschimbă linkul magic într-o
 * sesiune, apoi te duce în panou. E o rută, nu o pagină: doar pe drumul cererii
 * se pot SCRIE cookie-urile. Același tipar ca `login/confirma-resetare`.
 *
 * Proxy-ul lasă `/proprietar/intra` să treacă fără rezolvare de tenant; după
 * `verifyOtp` redirectăm la `/dashboard`, unde tenantul se rezolvă normal din
 * host, iar `verifySession` confirmă că ești contul cabinetului.
 */
export async function GET(request: NextRequest) {
  const tokenHash = new URL(request.url).searchParams.get("token_hash");

  if (!tokenHash) {
    return NextResponse.redirect(new URL("/proprietar/login", request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: tokenHash });

  if (error) {
    console.error("[proprietar] verifyOtp:", error.message);
    return NextResponse.redirect(new URL("/login?error=impersonare", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
