"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type StareParolaNoua = { eroare?: string } | undefined;

/**
 * Salvează parola nouă. Cere o sesiune de recuperare — pusă de ruta
 * `confirma-resetare` din tokenul emailului. Fără ea, Supabase ar refuza, dar
 * verificăm noi întâi ca să dăm un mesaj limpede, nu unul tehnic.
 */
export async function schimbaParola(
  _prev: StareParolaNoua,
  formData: FormData,
): Promise<StareParolaNoua> {
  const parola = String(formData.get("parola") ?? "");
  const confirma = String(formData.get("confirma") ?? "");

  if (parola.length < 8) {
    return { eroare: "Parola trebuie să aibă cel puțin 8 caractere." };
  }
  if (parola !== confirma) {
    return { eroare: "Cele două parole nu se potrivesc." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { eroare: "Sesiunea de resetare a expirat. Cere un link nou și încearcă din nou." };
  }

  const { error } = await supabase.auth.updateUser({ password: parola });

  if (error) {
    const m = error.message.toLowerCase();
    if (m.includes("different")) {
      return { eroare: "Alege o parolă diferită de cea veche." };
    }
    console.error("[resetare] updateUser:", error.message);
    return { eroare: "Nu am putut schimba parola. Cere un link nou și încearcă din nou." };
  }

  // Sesiunea de recuperare e deja o sesiune validă, deci omul intră direct în panou.
  redirect("/dashboard");
}
