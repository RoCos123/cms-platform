import assert from "node:assert/strict";
import test from "node:test";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

/**
 * O funcție nouă din `public` se naște DESCHISĂ, iar cine nu hotărăște o lasă așa.
 *
 * Pe Supabase, proiectul are `alter default privileges ... grant all on functions
 * to anon, authenticated, service_role`, deci fiecare funcție primește granturi
 * explicite pe rol chiar la creare. Un `revoke ... from public` scoate doar
 * dreptul pseudo-rolului PUBLIC și le lasă pe celelalte în picioare. Iar
 * funcțiile din `public` sunt expuse ca RPC, cu rolul luat din cheia cererii —
 * și cheia `anon` stă în pachetul trimis browserului.
 *
 * Asta ne-a scăpat o dată, pe 9 sept. 2026: `creeaza_client` și
 * `inregistreaza_afisarea` erau chemabile de oricine, deși migrările lor scriau
 * negru pe alb că n-au ce căuta acolo. Reparația de atunci e o migrare; proba
 * asta e ce împiedică a doua oară, la a șaptea funcție.
 *
 * Nu cere nicio bază de date: se uită la ce SCRIU migrările.
 */

const MIGRARI = path.join(process.cwd(), "supabase", "migrations");

/**
 * Funcțiile pe care oricine are voie să le cheme, cu motivul scris lângă.
 *
 * A fi aici e o HOTĂRÂRE, nu o scutire: cine adaugă un rând scrie de ce e
 * nevătămător ca un vizitator anonim s-o cheme cu ce argumente vrea.
 */
const DESCHISE_DINADINS = {
  current_site_id:
    "o cheamă politicile RLS, sub rolul clientului. Revocată, s-ar închide tot panoul.",
  set_updated_at:
    "funcție de declanșator — Postgres refuză apelul direct al unei funcții `returns trigger`.",
  adauga_sectiunea_programare:
    "funcție de declanșator — la fel, nu poate fi chemată direct.",
  textul_de_pornire:
    "întoarce un text de pornire pentru o cheie de secțiune. Nu citește și nu scrie nimic.",
};

function textulMigrarilor() {
  return readdirSync(MIGRARI)
    .filter((n) => n.endsWith(".sql"))
    .sort()
    .map((n) => readFileSync(path.join(MIGRARI, n), "utf8"))
    .join("\n")
    .replace(/\s+/g, " ");
}

/** Numele funcțiilor definite în `public`, o dată fiecare. */
function functiiDefinite(text) {
  const gasite = new Set();
  for (const m of text.matchAll(/create (?:or replace )?function public\.(\w+)\s*\(/gi)) {
    gasite.add(m[1]);
  }
  return [...gasite].sort();
}

/** De la ce roluri i se ia dreptul de execuție, oriunde ar fi scris. */
function revocateDeLa(text, nume) {
  const roluri = new Set();
  const tipar = new RegExp(
    `revoke (?:execute|all) on function public\\.${nume}\\s*\\([^)]*\\) from ([^;]+);`,
    "gi",
  );
  for (const m of text.matchAll(tipar)) {
    for (const rol of m[1].split(",")) roluri.add(rol.trim().toLowerCase());
  }
  return roluri;
}

const TEXT = textulMigrarilor();
const FUNCTII = functiiDefinite(TEXT);

test("migrările chiar definesc funcții în public", () => {
  assert.ok(FUNCTII.length >= 6, `găsite doar ${FUNCTII.length} funcții — s-a rupt citirea?`);
});

test("fiecare funcție din public e ori închisă pe roluri, ori trecută dinadins ca deschisă", () => {
  const nehotarate = [];

  for (const nume of FUNCTII) {
    if (nume in DESCHISE_DINADINS) continue;

    const roluri = revocateDeLa(TEXT, nume);
    const lipsesc = ["anon", "authenticated"].filter((r) => !roluri.has(r));

    if (lipsesc.length > 0) {
      nehotarate.push(
        `public.${nume} — nu i se ia execuția de la ${lipsesc.join(" și ")}` +
          (roluri.has("public")
            ? ". Are `revoke ... from public`, care pe Supabase NU e de ajuns:" +
              " granturile pe rol sunt explicite și rămân în picioare."
            : "."),
      );
    }
  }

  assert.deepEqual(
    nehotarate,
    [],
    "Funcții din `public` pe care le poate chema oricine cu cheia din browser:\n  " +
      nehotarate.join("\n  ") +
      "\n\nOri scrii în migrare `revoke execute on function public.<nume>(<argumente>)" +
      " from anon, authenticated;`, ori o treci în `DESCHISE_DINADINS` cu motivul.\n",
  );
});

test("lista celor deschise dinadins n-are rânduri rămase fără funcție", () => {
  const orfane = Object.keys(DESCHISE_DINADINS).filter((n) => !FUNCTII.includes(n));
  assert.deepEqual(orfane, [], `funcții trecute ca deschise, dar care nu mai există: ${orfane}`);
});

test("fiecare scutire are un motiv scris", () => {
  for (const [nume, motiv] of Object.entries(DESCHISE_DINADINS)) {
    assert.ok(motiv && motiv.length > 30, `motivul pentru ${nume} e prea scurt ca să fie o hotărâre`);
  }
});
