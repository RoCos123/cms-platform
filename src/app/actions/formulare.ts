"use server";

import { tenantTable } from "@/lib/supabase/admin";
import { capcanaDeclansata, verificaTurnstile } from "@/lib/antispam";
import { LIMITE, citesteText, esteEmailValid, type StareFormular } from "@/lib/formulare";

/**
 * Formularele publice: contact și abonare la newsletter.
 *
 * Regula care ține izolarea între clienți: `site_id` NU vine niciodată din
 * formular. Vine din tenantul rezolvat de proxy.ts pentru domeniul cererii, prin
 * `tenantTable`. Un câmp ascuns cu `site_id` ar fi permis oricui să scrie în
 * cutia poștală a altui cabinet.
 *
 * Rolul `anon` nu mai poate insera direct (migrarea de întărire RLS), tocmai ca
 * să nu existe altă cale în afară de asta.
 */

const SUCCES_CONTACT = "Mulțumim pentru mesaj. Vei primi un răspuns cât de curând.";
const SUCCES_NEWSLETTER = "Gata. Dacă adresa e nouă, vei primi un email de confirmare.";
const EROARE_TEHNICA =
  "Mesajul nu a putut fi trimis din cauza unei probleme tehnice. Te rugăm să încerci din nou peste câteva minute.";

/**
 * Câte mesaje acceptăm de la un site într-o oră.
 *
 * Nu e un rate limiter adevărat (ăla cere un store per IP, în afara bazei) —
 * e un plafon care mărginește paguba: un flux automat nu poate îneca nici
 * căsuța clientului, nici tabelul. Pragul e mult peste ce produce un cabinet
 * real într-o oră.
 */
const PLAFON_MESAJE_PE_ORA = 20;

/** Fereastra în care două mesaje identice de la aceeași adresă se consideră dublu-click. */
const FEREASTRA_DUBLARE_MS = 60_000;

export async function trimiteMesajContact(
  stareAnterioara: StareFormular,
  formData: FormData,
): Promise<StareFormular> {
  const rezultat = await proceseazaContact(formData);
  return { ...rezultat, incercari: stareAnterioara.incercari + 1 };
}

async function proceseazaContact(formData: FormData): Promise<Omit<StareFormular, "incercari">> {
  // Capcana se verifică prima și răspunde cu SUCCES, nu cu eroare: un bot care
  // primește eroare încearcă imediat altă formă a cererii, unul care primește
  // „gata" pleacă mai departe.
  if (capcanaDeclansata(formData)) {
    return { status: "succes", mesaj: SUCCES_CONTACT };
  }

  const nume = citesteText(formData, "nume", LIMITE.nume);
  const email = citesteText(formData, "email", LIMITE.email);
  const mesaj = citesteText(formData, "mesaj", LIMITE.mesaj);
  const acord = formData.get("acord") === "da";
  const valori = { nume, email, mesaj };

  const erori: Record<string, string> = {};

  if (nume.length < 2) erori.nume = "Te rugăm să scrii numele tău.";
  if (!esteEmailValid(email)) erori.email = "Adresa de email nu pare completă.";
  if (mesaj.length < 10) erori.mesaj = "Scrie câteva cuvinte despre ce te aduce aici.";
  // Consimțământul e obligatoriu prin GDPR și trebuie să fie o acțiune, nu o
  // bifă pusă din start — de asta se verifică aici, nu doar prin `required`.
  if (!acord) erori.acord = "Avem nevoie de acordul tău ca să îți putem răspunde.";

  if (Object.keys(erori).length > 0) {
    return { status: "eroare", erori, valori, mesaj: "Mai lipsește ceva mai jos." };
  }

  const verdict = await verificaTurnstile(
    typeof formData.get("cf-turnstile-response") === "string"
      ? (formData.get("cf-turnstile-response") as string)
      : null,
  );

  if (!verdict.ok) {
    return { status: "eroare", mesaj: verdict.motiv, valori };
  }

  try {
    const tabel = await tenantTable("contact_messages");

    const de_cand = new Date(Date.now() - FEREASTRA_DUBLARE_MS).toISOString();
    const { data: recent } = await tabel
      .select("id")
      .eq("email", email)
      .gte("created_at", de_cand)
      .limit(1);

    // Dublu-click sau reîncărcare a paginii: răspundem ca la un succes, dar nu
    // scriem a doua oară. Altfel clientul primește același mesaj de două ori și
    // nu știe dacă sunt două persoane sau una.
    if (recent && recent.length > 0) {
      return { status: "succes", mesaj: SUCCES_CONTACT };
    }

    const o_ora_in_urma = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await tabel
      .select("id", { head: true, count: "exact" })
      .gte("created_at", o_ora_in_urma);

    if ((count ?? 0) >= PLAFON_MESAJE_PE_ORA) {
      return {
        status: "eroare",
        valori,
        mesaj:
          "Am primit prea multe mesaje în ultima oră. Te rugăm să încerci mai târziu sau să suni direct.",
      };
    }

    const { error } = await tabel.insert({
      name: nume,
      email,
      message: mesaj,
      consent: acord,
    });

    if (error) {
      console.error("Inserare mesaj de contact eșuată:", error);
      return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
    }
  } catch (eroare) {
    console.error("Formularul de contact a eșuat:", eroare);
    return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
  }

  // TODO (Faza 6): notificare pe email către cabinet, prin Resend. Până atunci
  // mesajele se citesc din panou — de spus clientului la predarea site-ului.
  return { status: "succes", mesaj: SUCCES_CONTACT };
}

export async function aboneazaLaNewsletter(
  stareAnterioara: StareFormular,
  formData: FormData,
): Promise<StareFormular> {
  const rezultat = await proceseazaAbonare(formData);
  return { ...rezultat, incercari: stareAnterioara.incercari + 1 };
}

async function proceseazaAbonare(formData: FormData): Promise<Omit<StareFormular, "incercari">> {
  if (capcanaDeclansata(formData)) {
    return { status: "succes", mesaj: SUCCES_NEWSLETTER };
  }

  const email = citesteText(formData, "email", LIMITE.email);
  const valori = { email };

  if (!esteEmailValid(email)) {
    return {
      status: "eroare",
      valori,
      erori: { email: "Adresa de email nu pare completă." },
    };
  }

  const verdict = await verificaTurnstile(
    typeof formData.get("cf-turnstile-response") === "string"
      ? (formData.get("cf-turnstile-response") as string)
      : null,
  );

  if (!verdict.ok) {
    return { status: "eroare", mesaj: verdict.motiv, valori };
  }

  try {
    const tabel = await tenantTable("newsletter_subscribers");

    const { data: existent } = await tabel
      .select("id, unsubscribed_at")
      .eq("email", email)
      .limit(1);

    // Dublul cast, din același motiv ca în `src/app/page.tsx`: `tenantTable`
    // primește numele tabelului ca `string`, deci supabase-js nu poate deduce
    // forma rândului. Dispare când generăm tipurile schemei.
    const abonat = (existent ?? [])[0] as unknown as
      | { id: string; unsubscribed_at: string | null }
      | undefined;

    if (abonat) {
      // Reabonare tăcută. Cineva care s-a dezabonat și revine nu trebuie să
      // primească „ești deja pe listă" — răspunsul e identic în toate cazurile,
      // ca formularul să nu poată fi folosit ca să afli dacă o adresă e abonată.
      if (abonat.unsubscribed_at) {
        const { error } = await tabel.update({ unsubscribed_at: null }).eq("id", abonat.id);
        if (error) {
          console.error("Reabonare eșuată:", error);
          return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
        }
      }

      return { status: "succes", mesaj: SUCCES_NEWSLETTER };
    }

    const { error } = await tabel.insert({ email });

    // 23505 = încălcare de unicitate: două cereri simultane pentru aceeași
    // adresă. Rezultatul dorit s-a obținut oricum, deci nu e o eroare de arătat.
    if (error && error.code !== "23505") {
      console.error("Abonare la newsletter eșuată:", error);
      return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
    }
  } catch (eroare) {
    console.error("Formularul de newsletter a eșuat:", eroare);
    return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
  }

  // `confirmed_at` rămâne null: dovada consimțământului pentru marketing e
  // confirmarea prin email (double opt-in), care se face în Faza 6, când există
  // Resend. Până atunci exportul din panou trebuie să filtreze pe `confirmed_at`.
  return { status: "succes", mesaj: SUCCES_NEWSLETTER };
}
