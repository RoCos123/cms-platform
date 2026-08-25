"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  // Fără verificare, o deconectare eșuată arăta ca un succes: userul ajungea pe
  // /login cu sesiunea încă validă în cookie — și era trimis înapoi în dashboard.
  if (error) {
    throw new Error(`Deconectare eșuată: ${error.message}`);
  }

  redirect("/login");
}
