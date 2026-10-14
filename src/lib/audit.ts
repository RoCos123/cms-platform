import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

/**
 * Jurnalul de activitate — cine, ce și când.
 *
 * Amânat din Faza 1 fiindcă nu exista nicio modificare de înregistrat. Acum
 * există: reordonarea și ascunderea secțiunilor sunt primele.
 */

export type ActiuneAudit =
  | "create"
  | "update"
  | "delete"
  | "publish"
  | "unpublish"
  | "login"
  | "logout";

export type EntitateAudit =
  | "Page"
  | "Service"
  | "Appointment"
  | "BlogArticle"
  | "BlogCategory"
  | "SiteContent"
  | "SiteSettings"
  // Site-ul ca întreg: deocamdată doar publicarea și retragerea lui.
  | "Site"
  // Ștergerea datelor cuiva, la cererea lui. Nu e un mesaj și nu e o
  // programare — de obicei sunt mai multe deodată, din tabele diferite.
  | "DatePersonale"
  | "Upload"
  | "ContactSubmission"
  | "Session";

/**
 * Scrie o intrare în jurnal.
 *
 * **Nu aruncă niciodată.** Când ajunge aici, modificarea s-a produs deja: dacă
 * jurnalul pică, a nu putea nota ce s-a întâmplat e o problemă a noastră, nu a
 * clientului. Un mesaj de eroare l-ar face să creadă că salvarea a eșuat și să
 * o repete — adică exact paguba pe care jurnalul ar trebui s-o poată explica.
 *
 * Scrie cu clientul userului, nu cu cheia secretă: RLS impune deja
 * `site_id = current_site_id()` și `actor_id = auth.uid()`, deci o intrare
 * falsificată nu poate ajunge în jurnalul altui site nici din greșeală.
 */
export async function scrieInJurnal(intrare: {
  siteId: string;
  actorId: string;
  actiune: ActiuneAudit;
  entitate: EntitateAudit;
  entitateId?: string | null;
  /** Ce s-a schimbat. Scurt și citibil — jurnalul se citește de om, nu de mașină. */
  diff?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("audit_log").insert({
      site_id: intrare.siteId,
      actor_id: intrare.actorId,
      action: intrare.actiune,
      entity_type: intrare.entitate,
      entity_id: intrare.entitateId ?? null,
      diff: intrare.diff ?? null,
    });

    if (error) console.error("Jurnalul de activitate n-a putut fi scris:", error);
  } catch (eroare) {
    console.error("Jurnalul de activitate n-a putut fi scris:", eroare);
  }
}

/**
 * O intrare în jurnalul unui client, scrisă de PROPRIETARUL PLATFORMEI (nu de un
 * cont al cabinetului).
 *
 * `scrieInJurnal` de mai sus nu merge aici: scrie cu clientul userului, iar RLS
 * cere `site_id = current_site_id()` și `actor_id = auth.uid()`; proprietarul
 * platformei nu e legat de niciun cabinet. Deci se scrie cu cheia secretă, fără
 * autor (`actor_id` gol — coloana îl și permite, iar cheia externă duce la
 * `users`, unde proprietarul platformei nu are rând). Ecranul „Activitate"
 * arată o intrare fără autor ca pe oricare altă modificare, doar fără nume.
 *
 * Entitatea trebuie să fie una dintre cele zece din constrângerea bazei
 * (`audit_log_entity_type_check`). „Site" și „DatePersonale", deși apar în
 * tipul de mai sus, NU sunt printre ele: scrierile cu ele pică la bază, iar
 * `scrieInJurnal` înghite eroarea. Aici se folosește „SiteSettings".
 *
 * Nu aruncă niciodată, din același motiv ca `scrieInJurnal`.
 */
export async function scrieInJurnalDePlatforma(intrare: {
  siteId: string;
  actiune: ActiuneAudit;
  entitate: EntitateAudit;
  /** Ce s-a schimbat, pe înțelesul clientului care citește jurnalul. */
  rezumat: string;
}): Promise<void> {
  try {
    const { error } = await createServiceClient()
      .from("audit_log")
      .insert({
        site_id: intrare.siteId,
        actor_id: null,
        action: intrare.actiune,
        entity_type: intrare.entitate,
        entity_id: null,
        diff: { rezumat: intrare.rezumat },
      });

    if (error) console.error("Jurnalul de activitate n-a putut fi scris:", error);
  } catch (eroare) {
    console.error("Jurnalul de activitate n-a putut fi scris:", eroare);
  }
}
