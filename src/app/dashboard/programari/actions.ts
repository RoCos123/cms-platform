"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { scrieInJurnal } from "@/lib/audit";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { citesteProgramul, esteOraValida, type Program } from "@/lib/programari";

export type Rezultat = { ok: true } | { ok: false; mesaj: string };

/**
 * Modulul e pornit pentru site-ul ăsta?
 *
 * Se verifică în FIECARE acțiune, nu doar când se desenează ecranul. O acțiune
 * de server e o adresă publică: cine știe cum se cheamă o poate chema direct,
 * fără să treacă prin pagina care i-ar fi ascuns butonul.
 */
async function areModulul(siteId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("sites").select(COLOANE_MODULE).eq("id", siteId).single();
  return moduleleSiteului(data).programari;
}

/** Programul de lucru, salvat din panou. */
export async function salveazaProgramul(program: Program): Promise<Rezultat> {
  const session = await verifySession();
  if (!(await areModulul(session.siteId))) {
    return { ok: false, mesaj: "Modulul Programări nu e pornit pe site-ul tău." };
  }

  // Curățat prin aceeași citire ca la afișare: ce vine din browser nu se scrie
  // ca atare, ci trece printr-o formă cunoscută. Un interval întors pe dos sau
  // o oră inexistentă se aruncă aici, nu ajung în bază.
  const curat = citesteProgramul(program);

  for (const intervale of Object.values(curat.zile)) {
    for (const interval of intervale) {
      if (!esteOraValida(interval.de) || !esteOraValida(interval.pana) || interval.de >= interval.pana) {
        return { ok: false, mesaj: "Verifică orele: ora de început trebuie să fie înaintea celei de sfârșit." };
      }
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .upsert({ site_id: session.siteId, programari: curat }, { onConflict: "site_id" });

  if (error) {
    console.error("Salvarea programului a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut salva programul. Încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "SiteSettings",
    diff: { rezumat: "Programul pentru programări a fost modificat." },
  });

  revalidatePath("/dashboard/programari");
  revalidatePath("/programare");
  return { ok: true };
}

/** Confirmă sau refuză o cerere. */
export async function schimbaStarea(
  id: string,
  stare: "confirmata" | "refuzata",
): Promise<Rezultat> {
  const session = await verifySession();
  if (!(await areModulul(session.siteId))) {
    return { ok: false, mesaj: "Modulul Programări nu e pornit pe site-ul tău." };
  }

  const supabase = await createClient();

  // `select` după `update` ca să știm pe cine am atins: fără el, o cerere a
  // altui client ar întoarce „ok” fără să fi schimbat nimic, iar panoul ar
  // arăta o confirmare care nu s-a întâmplat. Filtrul pe `site_id` e oricum
  // impus de RLS; aici e ce ne spune dacă a prins ceva.
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: stare })
    .eq("id", id)
    .eq("site_id", session.siteId)
    .select("name, starts_at")
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Schimbarea stării programării a eșuat:", error);
    return { ok: false, mesaj: "Nu am putut schimba cererea. Reîncarcă pagina și încearcă din nou." };
  }

  await scrieInJurnal({
    siteId: session.siteId,
    actorId: session.userId,
    actiune: "update",
    entitate: "Appointment",
    entitateId: id,
    diff: {
      rezumat: `Programarea lui ${data.name} a fost ${stare === "confirmata" ? "confirmată" : "refuzată"}.`,
    },
  });

  revalidatePath("/dashboard/programari");
  revalidatePath("/programare");
  return { ok: true };
}
