"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export type LoginProprietarState = { error?: string } | undefined;

/**
 * Conectarea în panoul de proprietar. Ca la login-ul de client
 * (`src/app/login/actions.ts`), dar cu un pas în plus: după parolă, verificăm că
 * e chiar cont de proprietar al platformei. Un cont de cabinet care nimerește
 * aici e deconectat la loc — nu-l lăsăm logat degeaba pe o ușă care nu e a lui.
 */
export async function loginProprietar(
  _prevState: LoginProprietarState,
  formData: FormData,
): Promise<LoginProprietarState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Completează email și parolă." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Email sau parolă greșite." };
  }

  const service = createServiceClient();
  const { data: owner } = await service
    .from("platform_owners")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  if (!owner) {
    await supabase.auth.signOut();
    return { error: "Contul acesta nu e cont de proprietar al platformei." };
  }

  redirect("/proprietar");
}
