import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Capătul pe care se întoarce linkul din email. Preschimbă dovada din link
 * într-o sesiune de recuperare (cookie), apoi trimite omul la pagina de parolă
 * nouă. E o rută (nu o pagină) fiindcă doar aici, pe drumul cererii, se pot
 * SCRIE cookie-urile de sesiune.
 *
 * Acceptă DOUĂ forme de link, dinadins:
 *
 * - `token_hash` + `type=recovery` — forma pe care o pune șablonul nostru de
 *   email (sabloane/email-resetare-parola.md). Merge și dacă omul deschide
 *   emailul pe ALT dispozitiv decât cel de pe care a cerut resetarea, fiindcă
 *   dovada e întreagă în link.
 * - `code` — forma implicită a lui Supabase (PKCE). Merge fără să atingem
 *   șablonul de email, dar numai în același browser: verificatorul stă
 *   într-un cookie pus la cerere. E plasa până se lipește șablonul nostru.
 *
 * Orice link fără vreuna dintre ele, ori respins, duce înapoi la „cere alt link"
 * — niciodată la o pagină care pare că merge dar n-are sesiune.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();

  const reusit = new URL("/login/parola-noua", request.url);
  const esuat = new URL("/login/parola-uitata?eroare=link-invalid", request.url);

  if (tokenHash && type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
    if (!error) return NextResponse.redirect(reusit);
    console.error("[resetare] verifyOtp:", error.message);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(reusit);
    console.error("[resetare] exchangeCodeForSession:", error.message);
  }

  return NextResponse.redirect(esuat);
}
