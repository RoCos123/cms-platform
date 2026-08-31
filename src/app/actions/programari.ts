"use server";

import { revalidatePath } from "next/cache";
import { getTenant } from "@/lib/dal";
import { tenantTable } from "@/lib/supabase/admin";
import { capcanaDeclansata, verificaCaptcha } from "@/lib/antispam";
import { LIMITE, citesteText, esteEmailValid, type StareFormular } from "@/lib/formulare";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { eroriDeContact, motivValid, opresteCererea, oraEsteLibera } from "@/lib/programari";
import { oreleOcupate, programulSiteului } from "@/lib/programari-publice";
import { createServiceClient } from "@/lib/supabase/admin";
import { momentLa, ziuaScrisa, oraLa } from "@/lib/zile";

/**
 * Cererea de programare, trimisă de pe site.
 *
 * Aceeași regulă ca la formularul de contact: `site_id` nu vine niciodată din
 * formular, ci din tenantul rezolvat pentru domeniul cererii.
 */

const SUCCES = "Cererea a ajuns. Vei fi contactat pentru confirmare.";
const EROARE_TEHNICA =
  "Cererea nu a putut fi trimisă din cauza unei probleme tehnice. Te rugăm să încerci din nou peste câteva minute.";
const ORA_LUATA =
  "Ora aceasta tocmai a fost luată. Alege alta din listă — s-a actualizat.";

export async function cereProgramare(
  stareAnterioara: StareFormular,
  formData: FormData,
): Promise<StareFormular> {
  const rezultat = await proceseaza(formData);
  return { ...rezultat, incercari: stareAnterioara.incercari + 1 };
}

async function proceseaza(formData: FormData): Promise<Omit<StareFormular, "incercari">> {
  // Ca la contact: capcana răspunde cu SUCCES, nu cu eroare. Un bot care
  // primește eroare încearcă imediat altă formă a cererii.
  if (capcanaDeclansata(formData)) return { status: "succes", mesaj: SUCCES };

  const { siteId } = await getTenant();

  /*
   * Modulul se verifică ȘI aici, nu doar la desenarea paginii. O acțiune de
   * server e o adresă publică: cine îi știe numele o poate chema direct pe un
   * site care n-a cumpărat niciodată Programări.
   */
  const { data: site } = await createServiceClient()
    .from("sites")
    .select(COLOANE_MODULE)
    .eq("id", siteId)
    .single();

  if (!moduleleSiteului(site).programari) {
    return { status: "eroare", mesaj: EROARE_TEHNICA };
  }

  const nume = citesteText(formData, "nume", LIMITE.nume);
  const email = citesteText(formData, "email", LIMITE.email);
  const telefon = citesteText(formData, "telefon", 40);
  // Lista are două intrări; orice altceva vine dintr-o cerere scrisă de mână,
  // nu de la cineva care apasă. Se aruncă în tăcere, nu se respinge: câmpul e
  // opțional, iar o pagină rămasă deschisă peste o schimbare de listă n-are de
  // ce să pice.
  const motiv = motivValid(citesteText(formData, "motiv", 120));
  const zi = citesteText(formData, "zi", 10);
  const ora = citesteText(formData, "ora", 5);
  const valori = { nume, email, telefon, motiv: motiv ?? "", zi, ora };

  // Regula de contact stă în `src/lib/programari.ts`, cu motivul scris acolo:
  // fiecare cerere pleacă cu măcar o cale prin care psihologul poate răspunde,
  // dar CARE e cerută depinde de formularul care a trimis-o.
  const erori: Record<string, string> = eroriDeContact(
    formData.has("email"),
    email,
    telefon,
    esteEmailValid,
  );

  if (!nume) erori.nume = "Scrie-ți numele, ca să știe cine vine.";
  if (!zi || !ora) erori.ora = "Alege o oră din listă.";

  if (Object.keys(erori).length > 0) {
    return { status: "eroare", mesaj: "Mai lipsește ceva.", erori, valori };
  }

  const antispam = await verificaCaptcha(formData);
  if (!antispam.ok) {
    return { status: "eroare", mesaj: antispam.motiv || EROARE_TEHNICA, valori };
  }

  const cerut = momentLa(zi, ora);

  /*
   * Ora se verifică pe server, nu doar în lista desenată. Între momentul în care
   * cineva deschide pagina și cel în care apasă butonul, ora poate fi luată de
   * altcineva — iar o cerere trimisă de mână poate conține orice.
   */
  const [program, ocupate] = await Promise.all([programulSiteului(siteId), oreleOcupate(siteId)]);

  if (!oraEsteLibera(program, ocupate, new Date(), cerut)) {
    return { status: "eroare", mesaj: ORA_LUATA, valori };
  }

  /*
   * Plafoanele. Se numără DUPĂ verificarea orei, ca cineva care nimerește o oră
   * deja luată să afle asta, nu să fie oprit de plafon pentru o cerere care
   * oricum n-ar fi trecut.
   *
   * `tenantTable` mărginește amândouă numărătorile la cabinetul curent, deci un
   * cabinet aglomerat nu poate închide ușa altuia.
   */
  const tabel = await tenantTable("appointments");
  const acumOOra = new Date(Date.now() - 3_600_000).toISOString();

  const [{ count: ultimaOra }, { count: inAsteptare }] = await Promise.all([
    tabel.select("id", { head: true, count: "exact" }).gte("created_at", acumOOra),
    // Doar cererile VII: una refuzată sau anulată nu mai ține nimic blocat,
    // deci n-are de ce să-l oprească pe om să ceară din nou.
    telefon
      ? tabel
          .select("id", { head: true, count: "exact" })
          .eq("phone", telefon)
          .eq("status", "ceruta")
      : Promise.resolve({ count: 0 }),
  ]);

  const oprit = opresteCererea(ultimaOra ?? 0, inAsteptare ?? 0);
  if (oprit) {
    return { status: "eroare", mesaj: oprit, valori };
  }

  const { error } = await tabel.insert({
    name: nume,
    // `null`, nu șir gol: formularul scurt de pe prima pagină n-are câmp de
    // email, iar „" în panou ar fi devenit un link `mailto:` gol.
    email: email || null,
    phone: telefon || null,
    // Coloana și-a păstrat numele din vremea când câmpul era „Pentru ce” și se
    // umplea din serviciile cabinetului. O redenumire ar fi cerut încă o migrare
    // rulată de mână, pentru zero câștig la client; traducerea se face aici și
    // în ecranul din panou, în câte o linie.
    service: motiv,
    // Nu se mai adună (vezi `contact_fara_mesaj`). Coloana rămâne, cu
    // cererile primite până acum.
    notes: null,
    starts_at: cerut.toISOString(),
    status: "ceruta",
  });

  if (error) {
    /*
     * `23505` = indexul unic pe (site_id, starts_at) a respins ora.
     *
     * Aici ajung două cereri venite în aceeași secundă pentru aceeași oră:
     * amândouă au trecut de verificarea de mai sus, fiindcă niciuna nu era
     * încă scrisă. Baza e singurul loc unde „ocupat” chiar înseamnă ocupat.
     */
    if (error.code === "23505") {
      return { status: "eroare", mesaj: ORA_LUATA, valori };
    }
    console.error("Salvarea programării a eșuat:", error);
    return { status: "eroare", mesaj: EROARE_TEHNICA, valori };
  }

  // Lista de ore de pe site trebuie să nu mai conțină ora tocmai luată.
  revalidatePath("/programare");

  return {
    status: "succes",
    mesaj: `${SUCCES} Ai cerut ${ziuaScrisa(cerut)}, ora ${oraLa(cerut)}.`,
  };
}
