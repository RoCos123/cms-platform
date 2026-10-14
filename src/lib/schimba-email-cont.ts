import type { SupabaseClient } from "@supabase/supabase-js";
import { esteEmailValid } from "@/lib/formulare";

/**
 * „Schimbă emailul contului" — pentru proprietarul platformei, în `/proprietar`.
 *
 * Adresa cu care un client intră în panou stă în DOUĂ locuri: în conturile
 * Supabase (`auth.users`, de unde se loghează) și într-o copie în `public.users`,
 * pe care o citesc „Intră în panou" (`generateLink` pe adresa din copie), lista
 * din `/proprietar` și ecranul „Activitate". Dacă s-ar schimba doar una, intrarea
 * în panoul clientului ar înceta să meargă. De aceea cele două se schimbă
 * împreună, aici, într-o ordine și cu o plasă hotărâte dinainte.
 *
 * Fișier neutru (nici „use client", nici „use server", nimic `server-only`), ca
 * regulile să se poată proba în Node și ca fereastra din browser să folosească
 * ACEEAȘI verificare a adresei ca serverul. Acțiunea cu paznicul „ești
 * proprietarul?" e în `src/app/proprietar/actions.ts`; aici nu e nicio cheie.
 */

export type EroareSchimbare =
  | "email-invalid"
  | "acelasi-email"
  | "lipsa-site"
  | "fara-cont"
  | "email-folosit"
  | "nu-merge"
  | "copie-nesincronizata";

export type RezultatSchimbare =
  | { ok: true; vechi: string; nou: string }
  | { ok: false; eroare: EroareSchimbare; vechi?: string; nou?: string };

/**
 * Adresa, adusă la forma în care o stochează platforma: fără spații la capete și
 * cu litere mici — la fel face `creeaza_client` cu adresa contului. Altfel
 * „Ana@Exemplu.ro" ar fi o adresă diferită de „ana@exemplu.ro" pentru comparația
 * „e aceeași adresă?".
 */
export function curataEmail(brut: unknown): string {
  return typeof brut === "string" ? brut.trim().toLowerCase() : "";
}

/** Adresa nouă, față de cea de acum. Aceeași regulă în fereastră și pe server. */
export function verificaAdresaNoua(
  brut: unknown,
  emailCurent: string,
): { ok: true; email: string } | { ok: false; eroare: "email-invalid" | "acelasi-email" } {
  const email = curataEmail(brut);
  if (!esteEmailValid(email)) return { ok: false, eroare: "email-invalid" };
  if (email === curataEmail(emailCurent)) return { ok: false, eroare: "acelasi-email" };
  return { ok: true, email };
}

/**
 * Ce citește proprietarul când nu merge. `copie-nesincronizata` e singurul caz în
 * care rămâne ceva de reparat de mână, deci cere adresele în text.
 */
export function mesajSchimbare(eroare: EroareSchimbare, vechi?: string, nou?: string): string {
  switch (eroare) {
    case "email-invalid":
      return "Adresa nu pare completă.";
    case "acelasi-email":
      return "E aceeași adresă ca cea de acum.";
    case "lipsa-site":
      return "Nu găsesc site-ul. Reîncarcă pagina și încearcă din nou.";
    case "fara-cont":
      return "Site-ul ăsta n-are un cont legat.";
    case "email-folosit":
      return "Adresa asta e deja folosită de alt cont.";
    case "nu-merge":
      // Cauza nu se poate spune sigur: Supabase răspunde la fel (eroare generică, fără
      // cod) și când adresa e a altui cont din afara cabinetelor, și la o cădere de rețea.
      return (
        "N-am putut schimba adresa. Nimic nu s-a modificat. Poate adresa e deja folosită " +
        "de alt cont, sau a fost o problemă de rețea — încearcă din nou."
      );
    case "copie-nesincronizata":
      return (
        `Adresa s-a schimbat în conturi (${nou ?? "adresa nouă"}), dar copia din baza noastră ` +
        `a rămas pe ${vechi ?? "adresa veche"}. „Intră în panou" nu va merge pentru acest ` +
        "cabinet până nu se potrivesc. Cere ajutor și spune ambele adrese."
      );
  }
}

/** Nota din jurnalul de activitate al clientului. Vede exact ce s-a întâmplat cu adresa lui. */
export function rezumatJurnal(vechi: string, nou: string): string {
  return `Adresa de intrare în panou a fost schimbată de administratorul platformei: ${vechi} → ${nou}.`;
}

/**
 * Ce îi trebuie schimbării de la lumea de afară. Obiect cu funcții, nu un client
 * Supabase întreg: așa pașii se pot probă cu înlocuitori simpli (ce se întâmplă
 * dacă a doua scriere pică?), iar aceeași logică merge neschimbată pe un Supabase
 * adevărat (`dependinteDinSupabase`).
 */
export type Dependinte = {
  /** Contul legat de site: id-ul din conturi și adresa din copie. `null` = niciun cont. */
  citesteContul(siteId: string): Promise<{ id: string; email: string } | null>;
  /**
   * Are deja adresa ALT cont de cabinet (alt rând din copie)? Se întreabă ÎNAINTE de
   * orice schimbare, pentru că Supabase nu spune de încredere de ce refuză o adresă
   * dublă: la prima încercare pe un GoTrue adevărat a răspuns cu o eroare generică
   * (500, „Error updating user"), nu cu `email_exists`.
   */
  adresaDeAltCont(userId: string, email: string): Promise<boolean>;
  /** Adresa din conturile Supabase, ca să se poată verifica după o schimbare nesigură. */
  emailulDinConturi(userId: string): Promise<string | null>;
  /** „folosit" = Supabase a spus limpede că alt cont are adresa; „esuat" = orice altceva, inclusiv un răspuns pierdut. */
  schimbaInConturi(userId: string, email: string): Promise<"ok" | "folosit" | "esuat">;
  /** `true` doar dacă s-a schimbat EXACT un rând. */
  schimbaCopia(userId: string, email: string): Promise<boolean>;
  /** Nu aruncă niciodată: modificarea s-a produs deja când ajunge aici. */
  noteaza(siteId: string, vechi: string, nou: string): Promise<void>;
};

/**
 * Schimbă adresa contului unui site, în ambele locuri.
 *
 * ORDINEA: întâi conturile Supabase (de acolo se loghează clientul; e sursa de
 * adevăr), apoi copia. Dacă a doua scriere pică, prima se dă înapoi — și numai
 * dacă nici asta nu merge rămâne o nepotrivire, spusă omului cu ambele adrese.
 *
 * O schimbare în conturi care „a eșuat" poate fi, de fapt, una reușită al cărei
 * răspuns s-a pierdut pe drum (cădere de rețea). De aceea, după un eșec, se
 * întreabă ce adresă are contul ACUM: dacă e cea nouă, se merge mai departe ca
 * după o reușită, nu se lasă conturile pe adresa nouă și copia pe cea veche.
 */
export async function schimbaEmailulContului(
  siteId: string,
  emailBrut: unknown,
  dep: Dependinte,
): Promise<RezultatSchimbare> {
  if (typeof siteId !== "string" || siteId === "") return { ok: false, eroare: "lipsa-site" };

  const cont = await dep.citesteContul(siteId);
  if (!cont) return { ok: false, eroare: "fara-cont" };

  const verdict = verificaAdresaNoua(emailBrut, cont.email);
  if (!verdict.ok) return { ok: false, eroare: verdict.eroare };

  const vechi = cont.email;
  const nou = verdict.email;

  if (await dep.adresaDeAltCont(cont.id, nou)) return { ok: false, eroare: "email-folosit" };

  const inConturi = await dep.schimbaInConturi(cont.id, nou);
  if (inConturi === "folosit") return { ok: false, eroare: "email-folosit" };

  if (inConturi === "esuat") {
    const acum = await dep.emailulDinConturi(cont.id);
    if (curataEmail(acum) !== nou) return { ok: false, eroare: "nu-merge" };
    // A mers, doar că răspunsul s-a pierdut: continuăm cu copia.
  }

  if (!(await dep.schimbaCopia(cont.id, nou))) {
    const inapoi = await dep.schimbaInConturi(cont.id, vechi);
    const dupaInapoi = inapoi === "ok" ? vechi : await dep.emailulDinConturi(cont.id);

    if (curataEmail(dupaInapoi) === curataEmail(vechi)) return { ok: false, eroare: "nu-merge" };
    return { ok: false, eroare: "copie-nesincronizata", vechi, nou };
  }

  await dep.noteaza(siteId, vechi, nou);
  return { ok: true, vechi, nou };
}

/**
 * Legătura cu un client Supabase cu cheia secretă. Nimic de decis aici: doar
 * traducerea celor cinci întrebări de mai sus în apeluri.
 *
 * `email_confirm: true` — adresa nouă se consideră confirmată pe loc. Încercat pe un
 * GoTrue adevărat (14 oct. 2026): o schimbare făcută de administrator se aplică
 * imediat și NU trimite niciun email. Linia contează doar pentru un cont a cărui
 * adresă n-a fost confirmată niciodată: fără ea, după schimbare clientul ar primi
 * „Email not confirmed" la intrare.
 */
export function dependinteDinSupabase(
  service: SupabaseClient,
  noteaza: Dependinte["noteaza"],
): Dependinte {
  return {
    async citesteContul(siteId) {
      const { data } = await service
        .from("users")
        .select("id, email")
        .eq("site_id", siteId)
        .maybeSingle();
      return data?.id && data.email ? { id: data.id as string, email: data.email as string } : null;
    },

    async adresaDeAltCont(userId, email) {
      const { data, error } = await service
        .from("users")
        .select("id")
        .eq("email", email)
        .neq("id", userId)
        .limit(1);
      // O citire căzută nu trebuie să treacă drept „adresă liberă": mai bine refuzăm.
      if (error) {
        console.error("[proprietar] schimbaEmail (verificare):", error.message);
        return true;
      }
      return (data?.length ?? 0) > 0;
    },

    async emailulDinConturi(userId) {
      try {
        const { data } = await service.auth.admin.getUserById(userId);
        return data?.user?.email ?? null;
      } catch {
        return null;
      }
    },

    async schimbaInConturi(userId, email) {
      try {
        const { error } = await service.auth.admin.updateUserById(userId, {
          email,
          email_confirm: true,
        });
        if (!error) return "ok";

        // Unele versiuni de GoTrue răspund 422 cu `email_exists` când adresa e a altui
        // cont; cea încercată local (v2.197) răspunde generic. Le prindem pe cele clare,
        // dar nu ne bazăm pe ele — verificarea de dinainte (`adresaDeAltCont`) e cea sigură.
        const folosit =
          error.code === "email_exists" ||
          (error.status === 422 && /already|registered|exists/i.test(error.message));
        if (!folosit) console.error("[proprietar] schimbaEmail (conturi):", error.message);
        return folosit ? "folosit" : "esuat";
      } catch (eroare) {
        console.error("[proprietar] schimbaEmail (conturi):", eroare);
        return "esuat";
      }
    },

    async schimbaCopia(userId, email) {
      try {
        const { data, error } = await service
          .from("users")
          .update({ email })
          .eq("id", userId)
          .select("id");
        if (error) console.error("[proprietar] schimbaEmail (copia):", error.message);
        return !error && (data?.length ?? 0) === 1;
      } catch (eroare) {
        console.error("[proprietar] schimbaEmail (copia):", eroare);
        return false;
      }
    },

    noteaza,
  };
}
