"use server";

import { createServiceClient } from "@/lib/supabase/admin";
import { getProprietarOptional } from "@/lib/proprietar";
import { isTemplateId } from "@/lib/templates";

export type ClientNouState =
  | { ok: { domeniu: string; pasi: string[] } }
  | { error: string }
  | undefined;

/**
 * Face un client nou dintr-un formular, nu din SQL. Două lucruri, în ordinea
 * asta:
 *
 *   1. Contul de login (`admin.createUser`). `creeaza_client` NU-l face dinadins —
 *      scrisul direct în `auth.users` e fragil între versiunile Supabase — dar
 *      admin-ul, server-side, îl poate face o dată, aici.
 *   2. Provizionarea propriu-zisă: cheamă `public.creeaza_client`, funcția
 *      existentă. UN SINGUR loc pentru toată logica (cele 14 secțiuni, ciorna de
 *      politică, verificările) — n-o rescriem, o refolosim. `service_role` are
 *      execuția pe ea (Supabase i-o dă implicit; migrarea de drepturi a revocat
 *      doar `anon`/`authenticated`).
 *
 * Paznicul „ești proprietarul?" e AICI, în acțiune. Iar dacă provizionarea pică
 * DUPĂ ce tocmai am făcut contul, ștergem contul la loc: fără cont orfan în urmă.
 */
export async function creeazaClientNou(
  _prevState: ClientNouState,
  formData: FormData,
): Promise<ClientNouState> {
  const proprietar = await getProprietarOptional();
  if (!proprietar) return { error: "Trebuie să fii conectat ca proprietar al platformei." };

  const nume = String(formData.get("nume") ?? "").trim();
  const domeniu = String(formData.get("domeniu") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parola = String(formData.get("parola") ?? "");
  const sablon = String(formData.get("sablon") ?? "caldura");
  const cuProgramari = formData.get("programari") === "on";

  if (!nume || !domeniu || !email || !parola) {
    return { error: "Numele, domeniul, emailul și parola inițială sunt toate obligatorii." };
  }
  if (parola.length < 8) {
    return { error: "Parola inițială: cel puțin 8 caractere." };
  }
  if (!isTemplateId(sablon)) {
    return { error: "Șablon necunoscut." };
  }

  const service = createServiceClient();

  // 1. Contul de login.
  const { data: creat, error: eCreat } = await service.auth.admin.createUser({
    email,
    password: parola,
    email_confirm: true,
  });

  const amCreatCont = !eCreat && Boolean(creat?.user);
  const userId = creat?.user?.id ?? null;

  // Un cont care există deja nu e o eroare — mergem mai departe, iar
  // `creeaza_client` îl leagă (sau refuză clar, dacă e deja al altui cabinet).
  // Orice altă eroare (email invalid etc.) o oprim aici.
  if (eCreat && !/regist|exist|already|dupl/i.test(eCreat.message)) {
    return { error: `Nu am putut crea contul de login: ${eCreat.message}` };
  }

  // 2. Provizionarea.
  const { data: rez, error: eRpc } = await service.rpc("creeaza_client", {
    p_domeniu: domeniu,
    p_nume: nume,
    p_email: email,
    p_sablon: sablon,
    p_cu_programari: cuProgramari,
  });

  if (eRpc) {
    if (amCreatCont && userId) {
      // Contul l-am făcut noi acum, iar site-ul n-a ieșit: nu-l lăsăm orfan.
      await service.auth.admin.deleteUser(userId);
    }
    return { error: eRpc.message };
  }

  const rezultat = rez as { urmatorii_pasi?: unknown } | null;
  const pasi = Array.isArray(rezultat?.urmatorii_pasi)
    ? (rezultat.urmatorii_pasi as string[])
    : [];

  return { ok: { domeniu, pasi } };
}
