import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  curataEmail,
  mesajSchimbare,
  rezumatJurnal,
  schimbaEmailulContului,
  verificaAdresaNoua,
} from "@/lib/schimba-email-cont";

/**
 * Proba butonului „Schimbă emailul" din `/proprietar`. `pnpm test:logica`.
 *
 * Adresa cu care intră un client stă în DOUĂ locuri (conturile Supabase și o
 * copie în `public.users`), iar „Intră în panou" o citește din copie. Cele două
 * trebuie să rămână la fel; asta păzesc probele de aici.
 *
 * Pașii se încearcă pe înlocuitori simpli. Pe un Supabase adevărat — GoTrue și
 * PostgREST, cu schimbarea, cu intrarea clientului pe adresa nouă, cu „Intră în
 * panou" — s-a încercat pe 14 oct. 2026, la scrierea ei; de acolo vin și cele
 * două lecții din comentariile de mai jos.
 */

/** O „lume" mică: conturile Supabase, copia, jurnalul și un jurnal al apelurilor. */
function lume({ copieEsueaza = false, inapoiEsueaza = false, raspunsPierdut = false, altCont = false } = {}) {
  const stare = {
    conturi: "ana@abc.test",
    copia: "ana@abc.test",
    jurnal: [],
    apeluri: [],
  };

  const dep = {
    async citesteContul(siteId) {
      return siteId === "site-ana" ? { id: "u-ana", email: stare.copia } : null;
    },
    async adresaDeAltCont() {
      stare.apeluri.push("verificare");
      return altCont;
    },
    async emailulDinConturi() {
      stare.apeluri.push("citire-conturi");
      return stare.conturi;
    },
    async schimbaInConturi(_id, email) {
      stare.apeluri.push(`conturi:${email}`);
      const esteInapoi = email === "ana@abc.test";
      if (esteInapoi && inapoiEsueaza) return "esuat";
      stare.conturi = email;
      return raspunsPierdut && !esteInapoi ? "esuat" : "ok";
    },
    async schimbaCopia(_id, email) {
      stare.apeluri.push(`copia:${email}`);
      if (copieEsueaza) return false;
      stare.copia = email;
      return true;
    },
    async noteaza(siteId, vechi, nou) {
      stare.apeluri.push("jurnal");
      stare.jurnal.push([siteId, vechi, nou]);
    },
  };

  return { stare, dep };
}

test("adresa se curăță ca la creare: fără spații la capete, cu litere mici", () => {
  assert.equal(curataEmail("  Ana@Exemplu.RO "), "ana@exemplu.ro");
  for (const nu_e_text of [undefined, null, 7, {}, []]) assert.equal(curataEmail(nu_e_text), "");
});

test("adresa nouă: trebuie să arate a adresă și să fie alta decât cea de acum", () => {
  assert.deepEqual(verificaAdresaNoua(" NOUA@abc.test ", "ana@abc.test"), { ok: true, email: "noua@abc.test" });
  assert.deepEqual(verificaAdresaNoua("ANA@abc.test", "ana@abc.test"), { ok: false, eroare: "acelasi-email" });
  for (const rea of ["", "   ", "ana", "ana@", "@abc.test", "ana@abc", "a b@abc.test", undefined, null, 5]) {
    assert.deepEqual(verificaAdresaNoua(rea, "ana@abc.test"), { ok: false, eroare: "email-invalid" }, String(rea));
  }
});

test("reușita: întâi conturile, apoi copia, apoi nota în jurnal — o singură dată", async () => {
  const { stare, dep } = lume();
  const r = await schimbaEmailulContului("site-ana", "  Noua@ABC.test ", dep);

  assert.deepEqual(r, { ok: true, vechi: "ana@abc.test", nou: "noua@abc.test" });
  assert.deepEqual(stare.apeluri, ["verificare", "conturi:noua@abc.test", "copia:noua@abc.test", "jurnal"]);
  assert.equal(stare.conturi, "noua@abc.test");
  assert.equal(stare.copia, "noua@abc.test");
  assert.deepEqual(stare.jurnal, [["site-ana", "ana@abc.test", "noua@abc.test"]]);
});

test("adresa unui alt cabinet: refuzată ÎNAINTE de orice scriere", async () => {
  const { stare, dep } = lume({ altCont: true });
  assert.deepEqual(await schimbaEmailulContului("site-ana", "alt@abc.test", dep), { ok: false, eroare: "email-folosit" });
  assert.deepEqual(stare.apeluri, ["verificare"], "nu are voie să atingă nimic");
  assert.equal(stare.conturi, "ana@abc.test");
  assert.equal(stare.copia, "ana@abc.test");
});

test("adresă greșită, aceeași, site necunoscut sau lipsă: nimic nu se scrie", async () => {
  for (const [site, adresa, eroare] of [
    ["site-ana", "nu-e-adresa", "email-invalid"],
    ["site-ana", "ANA@abc.test", "acelasi-email"],
    ["site-fara-cont", "x@abc.test", "fara-cont"],
    ["", "x@abc.test", "lipsa-site"],
    [undefined, "x@abc.test", "lipsa-site"],
  ]) {
    const { stare, dep } = lume();
    assert.deepEqual(await schimbaEmailulContului(site, adresa, dep), { ok: false, eroare });
    assert.ok(!stare.apeluri.some((a) => a.startsWith("conturi:") || a.startsWith("copia:") || a === "jurnal"), `${site}/${adresa}`);
  }
});

test("dacă scrierea copiei pică, conturile se dau înapoi și nu rămâne nicio notă", async () => {
  const { stare, dep } = lume({ copieEsueaza: true });
  assert.deepEqual(await schimbaEmailulContului("site-ana", "noua@abc.test", dep), { ok: false, eroare: "nu-merge" });
  assert.deepEqual(stare.apeluri, ["verificare", "conturi:noua@abc.test", "copia:noua@abc.test", "conturi:ana@abc.test"]);
  assert.equal(stare.conturi, "ana@abc.test");
  assert.equal(stare.copia, "ana@abc.test");
  assert.deepEqual(stare.jurnal, []);
});

test("dacă nici înapoi nu merge, se spune cinstit cu ambele adrese", async () => {
  const { stare, dep } = lume({ copieEsueaza: true, inapoiEsueaza: true });
  const r = await schimbaEmailulContului("site-ana", "noua@abc.test", dep);

  assert.deepEqual(r, { ok: false, eroare: "copie-nesincronizata", vechi: "ana@abc.test", nou: "noua@abc.test" });
  assert.equal(stare.conturi, "noua@abc.test", "starea chiar e nepotrivită, deci mesajul nu minte");
  const mesaj = mesajSchimbare(r.eroare, r.vechi, r.nou);
  assert.ok(mesaj.includes("ana@abc.test") && mesaj.includes("noua@abc.test"), "omul trebuie să afle ambele adrese");
  assert.deepEqual(stare.jurnal, []);
});

test("un răspuns pierdut după o schimbare REUȘITĂ se recunoaște: nu se lasă jumătate de schimbare", async () => {
  // Cădere de rețea: Supabase a făcut schimbarea, dar noi n-am primit răspunsul.
  const { stare, dep } = lume({ raspunsPierdut: true });
  const r = await schimbaEmailulContului("site-ana", "noua@abc.test", dep);

  assert.deepEqual(r, { ok: true, vechi: "ana@abc.test", nou: "noua@abc.test" });
  assert.ok(stare.apeluri.includes("citire-conturi"), "trebuie întrebat ce adresă are contul acum");
  assert.equal(stare.copia, "noua@abc.test", "altfel copia rămânea pe adresa veche, iar „Intră în panou” ar crea un cont gol");
});

test("un eșec adevărat în conturi: „nu-merge”, copia nu se atinge", async () => {
  const { stare, dep } = lume();
  dep.schimbaInConturi = async () => "esuat";
  assert.deepEqual(await schimbaEmailulContului("site-ana", "noua@abc.test", dep), { ok: false, eroare: "nu-merge" });
  assert.ok(!stare.apeluri.some((a) => a.startsWith("copia:")));
});

test("fiecare eroare are un mesaj pe înțelesul omului", () => {
  for (const eroare of [
    "email-invalid", "acelasi-email", "lipsa-site", "fara-cont", "email-folosit", "nu-merge", "copie-nesincronizata",
  ]) {
    assert.ok(mesajSchimbare(eroare).length > 10, eroare);
  }
  // Mesajul pentru „nu-merge” nu pretinde că știe cauza: Supabase răspunde la fel la o adresă
  // a altui cont din afara cabinetelor și la o cădere de rețea.
  assert.ok(/poate|sau/.test(mesajSchimbare("nu-merge")));
});

test("nota din jurnal spune ce s-a întâmplat, pe înțelesul clientului", () => {
  assert.equal(
    rezumatJurnal("ana@abc.test", "noua@abc.test"),
    "Adresa de intrare în panou a fost schimbată de administratorul platformei: ana@abc.test → noua@abc.test.",
  );
});

/*
 * De aici: legăturile dintre bucăți. Citesc codul sursă, ca la restul probelor de
 * acest fel — o mutare a unei linii din altă parte nu trebuie să scoată tăcut o apărare.
 */

const citeste = (cale) => readFileSync(cale, "utf8");

test("acțiunea verifică ÎNTÂI că ești proprietarul platformei, înainte de orice altceva", () => {
  const actiuni = citeste("src/app/proprietar/actions.ts");
  const start = actiuni.indexOf("export async function schimbaEmailul(");
  assert.ok(start > 0, "acțiunea a dispărut");
  const corp = actiuni.slice(start);

  const paznic = corp.indexOf("getProprietarOptional()");
  assert.ok(paznic > 0, "lipsește paznicul „ești proprietarul?”");
  assert.ok(corp.indexOf('eroare: "neautentificat"') > paznic);
  assert.ok(corp.indexOf("createServiceClient()") > paznic, "cheia secretă nu se atinge înainte de paznic");
  assert.ok(corp.indexOf("schimbaEmailulContului(") > paznic);
});

test("acțiunea nu primește un id de cont din browser: contul se găsește pe server, după site", () => {
  const actiuni = citeste("src/app/proprietar/actions.ts");
  assert.ok(actiuni.includes("schimbaEmail" + "ul(\n  siteId: string,\n  emailNou: string,"), "semnătura s-a schimbat");
  const lib = citeste("src/lib/schimba-email-cont.ts");
  assert.ok(lib.includes('.eq("site_id", siteId)'), "contul se caută după site");
});

test("schimbarea în conturi marchează adresa confirmată; schimbarea copiei verifică EXACT un rând", () => {
  const lib = citeste("src/lib/schimba-email-cont.ts");
  // Apelul însuși, nu doar cuvintele: „email_confirm: true” apare și într-un comentariu.
  assert.ok(
    /updateUserById\(userId, \{\s*email,\s*email_confirm: true,?\s*\}\)/.test(lib),
    "fără asta, un cont cu adresa neconfirmată n-ar mai putea intra după schimbare",
  );
  assert.ok(lib.includes('.select("id");') && lib.includes("data?.length ?? 0) === 1"), "un update care nu atinge niciun rând ar trece drept reușită");
});

test("nota din jurnal se scrie fără autor și cu o entitate pe care o acceptă baza", () => {
  const audit = citeste("src/lib/audit.ts");
  const start = audit.indexOf("export async function scrieInJurnalDePlatforma(");
  assert.ok(start > 0);
  const corp = audit.slice(start);
  assert.ok(corp.includes("createServiceClient()"), "proprietarul platformei n-are cum să treacă de RLS al clientului");
  assert.ok(corp.includes("actor_id: null"), "proprietarul platformei nu are rând în `users`, deci nu poate fi autor");

  // Entitatea folosită de acțiune trebuie să fie în constrângerea bazei — altfel nota se pierde tăcut.
  const actiuni = citeste("src/app/proprietar/actions.ts");
  const entitate = /entitate: "(\w+)"/.exec(actiuni.slice(actiuni.indexOf("export async function schimbaEmailul(")))?.[1];
  assert.ok(entitate, "acțiunea nu spune ce entitate scrie în jurnal");
  const schema = citeste("supabase/verificare-schema.sql");
  const constrangere = schema.split("\n").find((l) => l.includes("audit_log_entity_type_check"));
  assert.ok(constrangere?.includes(`''${entitate}''`), `„${entitate}” nu e printre entitățile acceptate de baza de date`);
});

test("lista arată butonul doar pentru un site cu cont, iar fereastra folosește aceeași verificare ca serverul", () => {
  const tabel = citeste("src/app/proprietar/tabel-site-uri.tsx");
  assert.equal(tabel.split("<SchimbaEmail").length - 1, 2, "butonul trebuie și pe telefon, și pe calculator");
  assert.equal(tabel.split("{site.email && (\n").length - 1 >= 2, true, "doar cu cont legat");

  const fereastra = citeste("src/app/proprietar/schimba-email.tsx");
  assert.ok(fereastra.includes("verificaAdresaNoua(adresa, emailCurent)"));
  assert.ok(fereastra.includes("schimbaEmailul(siteId, adresa)"));
  assert.ok(fereastra.includes("router.refresh()"), "fără asta lista ar arăta mai departe adresa veche");
});
