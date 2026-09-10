import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormularParolaNoua } from "./form";

/**
 * Se ajunge aici DUPĂ ce ruta `confirma-resetare` a pus sesiunea de recuperare.
 * Dacă cineva nimerește direct, fără sesiune, nu-l lăsăm pe o pagină care pare
 * că merge: îl trimitem să ceară un link nou.
 */
export default async function ParolaNouaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/parola-uitata?eroare=link-invalid");
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <FormularParolaNoua />
    </div>
  );
}
