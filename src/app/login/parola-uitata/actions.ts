"use server";

import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/dal";

export type StareResetare = { trimis?: boolean; eroare?: string } | undefined;

/**
 * Cere lui Supabase să trimită linkul de resetare. Codul nostru nu vede și nu
 * ține parola — o gestionează Supabase Auth. Aici doar dăm comanda „trimite-i
 * omului ăstuia un link".
 *
 * NU spunem niciodată dacă adresa are cont sau nu. Un mesaj diferit („nu există
 * cont") ar transforma formularul într-o unealtă de aflat ce emailuri sunt
 * înregistrate. De asta răspunsul e mereu același, iar o eroare (de obicei
 * plafonul de trimitere al expeditorului) se scrie doar în jurnal.
 */
export async function cereResetareParola(
  _prev: StareResetare,
  formData: FormData,
): Promise<StareResetare> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { eroare: "Scrie adresa de email." };

  const { domain } = await getTenant();
  const supabase = await createClient();

  // Linkul se întoarce pe domeniul ACESTUI client — cel rezolvat de proxy, nu
  // antetul brut al cererii. Adresa trebuie trecută în lista permisă din
  // Supabase (Auth → URL Configuration). Vezi sabloane/email-resetare-parola.md.
  const redirectTo = `https://${domain}/login/confirma-resetare`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    console.error("[resetare] resetPasswordForEmail:", error.message);
  }

  return { trimis: true };
}
