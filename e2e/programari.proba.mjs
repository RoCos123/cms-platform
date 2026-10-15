import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  PROGRAM_GOL,
  citesteProgramul,
  eroriDeContact,
  motivValid,
  opresteCererea,
  oraEsteLibera,
  oreLibere,
  primesteProgramari,
} from "@/lib/programari";
import { momentLa } from "@/lib/zile";

/**
 * Proba programului de lucru. Se rulează cu `pnpm test:logica`.
 *
 * Miza: o oră liberă calculată greșit înseamnă un om care se prezintă la
 * cabinet degeaba, sau doi oameni în același interval.
 */

// Luni, 6 iulie 2026, ora 09:00 în România.
const ACUM = momentLa("2026-07-06", "09:00");

const PROGRAM = {
  ...PROGRAM_GOL,
  durataMinute: 50,
  pauzaMinute: 10,
  preavizOre: 24,
  orizontZile: 3,
  // Marți și miercuri, 10:00–13:00.
  zile: { "2": [{ de: "10:00", pana: "13:00" }], "3": [{ de: "10:00", pana: "13:00" }] },
};

test("un cabinet fără niciun interval nu primește programări", () => {
  assert.equal(primesteProgramari(PROGRAM_GOL), false);
  assert.deepEqual(oreLibere(PROGRAM_GOL, [], ACUM), []);
});

test("orele se generează la pas de durată plus pauză", () => {
  // 10:00, 11:00, 12:00 — a patra ar fi 13:00 și s-ar termina la 13:50.
  const marti = oreLibere(PROGRAM, [], ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00", "12:00"]);
});

test("ultima ședință trebuie să se TERMINE până la închidere", () => {
  // Un cabinet care lucrează până la 13:00 nu oferă o ședință la 12:30.
  const scurt = { ...PROGRAM, zile: { "2": [{ de: "10:00", pana: "12:30" }] } };
  const marti = oreLibere(scurt, [], ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00"]);
});

test("preavizul taie orele prea apropiate", () => {
  // ACUM e luni 09:00; cu preaviz de 24 de ore, marți înainte de 09:00 e tăiat.
  // Programul începe oricum la 10:00, deci creștem preavizul ca să se vadă.
  const cuPreavizMare = { ...PROGRAM, preavizOre: 26 };
  const marti = oreLibere(cuPreavizMare, [], ACUM).find((z) => z.zi === "2026-07-07");

  // 26 de ore de luni 09:00 = marți 11:00. 10:00 pică.
  assert.deepEqual(marti.ore, ["11:00", "12:00"]);
});

test("orizontul mărginește cât de departe se poate cere", () => {
  const zile = oreLibere(PROGRAM, [], ACUM).map((z) => z.zi);

  // Orizont de 3 zile de luni: luni, marți, miercuri. Luni n-are program.
  assert.deepEqual(zile, ["2026-07-07", "2026-07-08"]);
});

test("o oră ocupată dispare din listă", () => {
  const ocupate = [momentLa("2026-07-07", "11:00")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "12:00"]);
});

test("suprapunerea contează, nu doar începutul identic", () => {
  /*
   * Cu ședințe de 50 de minute și pas de o oră, o programare la 10:30 nu începe
   * fix la nicio oră oferită — dar se suprapune și cu 10:00, și cu 11:00. Dacă
   * s-ar compara doar începuturile, clientul ar primi doi oameni deodată.
   */
  const ocupate = [momentLa("2026-07-07", "10:30")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["12:00"]);
});

test("o programare din altă zi nu blochează nimic", () => {
  const ocupate = [momentLa("2026-07-08", "11:00")];
  const marti = oreLibere(PROGRAM, ocupate, ACUM).find((z) => z.zi === "2026-07-07");

  assert.deepEqual(marti.ore, ["10:00", "11:00", "12:00"]);
});

test("zilele se leagă de ziua săptămânii, nu de poziția în listă", () => {
  // „2” e marți. Un program doar de duminică nu trebuie să apară marțea.
  const doarDuminica = { ...PROGRAM, orizontZile: 8, zile: { "7": [{ de: "10:00", pana: "12:00" }] } };
  const zile = oreLibere(doarDuminica, [], ACUM).map((z) => z.zi);

  assert.deepEqual(zile, ["2026-07-12"]); // duminica următoare
});

test("peste schimbarea orei, ședințele rămân la ora scrisă", () => {
  // Ultima duminică din octombrie 2026: ceasul dă înapoi în noaptea de sâmbătă
  // spre duminică. O ședință de luni de la 10:00 rămâne 10:00 pe ceas.
  const inainteaSchimbarii = momentLa("2026-10-23", "09:00"); // vineri
  const luni = { ...PROGRAM, orizontZile: 5, zile: { "1": [{ de: "10:00", pana: "12:00" }] } };

  const gasit = oreLibere(luni, [], inainteaSchimbarii).find((z) => z.zi === "2026-10-26");

  assert.deepEqual(gasit.ore, ["10:00", "11:00"]);
  // Și chiar e ora de iarnă: 10:00 local = 08:00 UTC.
  assert.equal(momentLa("2026-10-26", "10:00").toISOString(), "2026-10-26T08:00:00.000Z");
});

test("o oră care n-a fost oferită e respinsă", () => {
  // Cineva trimite de mână o oră din afara programului.
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "15:00")), false);
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "10:30")), false);
  assert.equal(oraEsteLibera(PROGRAM, [], ACUM, momentLa("2026-07-07", "10:00")), true);
});

test("o oră luată între timp e respinsă la trimitere", () => {
  const ocupate = [momentLa("2026-07-07", "10:00")];
  assert.equal(oraEsteLibera(PROGRAM, ocupate, ACUM, momentLa("2026-07-07", "10:00")), false);
});

test("programul stricat din bază se citește cu valori de rezervă", () => {
  const citit = citesteProgramul({
    durataMinute: "nu e număr",
    orizontZile: 9999,
    zile: { "2": [{ de: "10:00", pana: "09:00" }, { de: "25:00", pana: "26:00" }, { de: "10:00", pana: "12:00" }] },
  });

  assert.equal(citit.durataMinute, 50, "cade pe valoarea implicită");
  assert.equal(citit.orizontZile, 30, "peste maxim, cade pe implicit");
  // Intervalul întors pe dos și cel cu ore inexistente se aruncă.
  assert.deepEqual(citit.zile["2"], [{ de: "10:00", pana: "12:00" }]);
});

test("un program citit din nimic e cel gol", () => {
  assert.deepEqual(citesteProgramul(null).zile, {});
  assert.equal(primesteProgramari(citesteProgramul(undefined)), false);
});

/**
 * Motivul programării: listă închisă, verificată și pe server.
 *
 * Câmpul e un `select` cu două intrări, deci orice altă valoare vine dintr-o
 * cerere scrisă de mână. Fără verificarea asta, textul ar ajunge neatins în
 * panoul psihologului — un câmp liber deghizat în listă.
 */
test("motivul trece doar dacă e unul dintre cele oferite", () => {
  assert.equal(motivValid("Evaluări psihologice"), "Evaluări psihologice");
  assert.equal(motivValid("Altceva"), "Altceva");
});

test("orice altceva se aruncă, nu se salvează", () => {
  assert.equal(motivValid(""), null);
  assert.equal(motivValid("Sună-mă la 07xx, ofertă"), null);
  // Fără diacritice nu e același lucru: se scrie dintr-o listă, nu de mână.
  assert.equal(motivValid("Evaluari psihologice"), null);
  // Nici cu spații în plus — ar deschide ușa pentru variante aproape identice.
  assert.equal(motivValid(" Altceva"), null);
});

/**
 * Regula de contact. Două formulare, aceeași acțiune, reguli diferite — iar
 * asta e exact ce se uită prima când se mai adaugă un formular.
 */
const EMAIL_OK = (e) => e.includes("@") && e.includes(".");
const TELEFON_OK = (t) => /^\+?\d{6,15}$/.test(t.replace(/[\s().-]/g, ""));
const MESAJ_TELEFON = "Numărul de telefon nu pare complet.";
const contact = (email, telefon = "") => eroriDeContact(email, EMAIL_OK, telefon, TELEFON_OK, MESAJ_TELEFON);

test("se cere emailul, la fel pe amândouă formularele", () => {
  // Emailul e singura cale de răspuns pentru oricine, deci rămâne obligatoriu (din
  // 18 sept. 2026), iar regula e aceeași pe prima pagină și pe pagina întreagă.
  assert.deepEqual(contact("ana@exemplu.ro"), {});
  assert.deepEqual(Object.keys(contact("")), ["email"]);
});

test("un email scris greșit e prins", () => {
  assert.deepEqual(Object.keys(contact("ana la exemplu")), ["email"]);
});

test("telefonul e opțional (15 oct. 2026): gol trece, bun trece, scris prost e prins", () => {
  assert.deepEqual(contact("ana@exemplu.ro", ""), {}, "fără telefon e în regulă");
  assert.deepEqual(contact("ana@exemplu.ro", "0722 123 456"), {});
  assert.deepEqual(contact("ana@exemplu.ro", "+40 722 123 456"), {});
  assert.deepEqual(contact("ana@exemplu.ro", "nu am"), { telefon: MESAJ_TELEFON });
  assert.deepEqual(contact("ana@exemplu.ro", "123"), { telefon: MESAJ_TELEFON });
});

test("un telefon bun nu ține loc de email: emailul rămâne cerut", () => {
  assert.deepEqual(Object.keys(contact("", "0722 123 456")), ["email"]);
  assert.deepEqual(Object.keys(contact("", "nu am")).sort(), ["email", "telefon"]);
});

/**
 * Plafoanele de la programări. `pnpm test:logica`.
 *
 * Formularul de contact avea de mult un plafon; programările, niciunul. Adică
 * oricine putea cere, una după alta, toate orele libere ale unui cabinet pe o
 * lună înainte. Probele astea țin pragurile pe loc — o judecată scrisă doar în
 * cod se schimbă într-o zi fără să observe nimeni.
 */

test("o cerere obișnuită trece", () => {
  assert.equal(opresteCererea(0, 0), null);
  // Un cabinet care a primit deja trei cereri azi tot primește.
  assert.equal(opresteCererea(3, 0), null);
});

test("o persoană ține un singur slot deodată", () => {
  /*
   * Regula proprietarului, din 31 aug. 2026: „o persoană să poată rezerva doar
   * un singur slot din calendar, atât.”
   *
   * Scrisă ca probă fiindcă e o judecată, nu o consecință tehnică — iar
   * pragurile scrise doar în cod se schimbă într-o zi fără să observe nimeni.
   * S-a și întâmplat: l-am urcat o dată la cinci de capul meu. A doua oară,
   * pică aici.
   */
  assert.equal(opresteCererea(0, 0), null, "prima oră se rezervă");

  const mesaj = opresteCererea(0, 1);
  assert.ok(mesaj, "a doua trebuia oprită");
  assert.match(mesaj, /o oră rezervată/i);
});

test("peste zece cereri într-o oră, cabinetul se închide temporar", () => {
  assert.equal(opresteCererea(9, 0), null);
  const mesaj = opresteCererea(10, 0);
  assert.ok(mesaj, "trebuia oprită");
  assert.match(mesaj, /ultima oră/i);
});

test("plafonul pe persoană bate plafonul pe oră", () => {
  // Amândouă depășite: omul trebuie să afle că are deja o oră rezervată, nu că
  // „e aglomerat" — al doilea mesaj l-ar face să încerce din nou peste o oră.
  assert.match(opresteCererea(50, 3), /o oră rezervată/i);
});

test("mesajele trimit omul către telefon, nu îl acuză", () => {
  // Cineva oprit de un plafon e aproape sigur un om cinstit care a apăsat de
  // două ori. Nu i se spune că e bot, i se spune ce poate face.
  for (const mesaj of [opresteCererea(0, 1), opresteCererea(99, 0)]) {
    assert.match(mesaj, /sun[ăa] direct la cabinet/i);
  }
});

/**
 * Telefonul la programări (15 oct. 2026) — ce se verifică în cod, nu doar în regulă.
 * Două formulare (prima pagină și `/programare`), o singură acțiune: dacă unul
 * dintre ele uită câmpul, omul îl completează pe celălalt și altul nu.
 */
const citeste = (cale) => readFileSync(cale, "utf8");
const FORMULARE = [
  ["pagina întreagă", "src/app/programare/formular.tsx", "prog-telefon"],
  ["formularul de pe prima pagină", "src/components/site/sections/programare-rapida.tsx", "prog-rapid-telefon"],
];

for (const [nume, cale, id] of FORMULARE) {
  test(`${nume}: câmpul de telefon e acolo, de tip „tel” și opțional`, () => {
    const text = citeste(cale);
    const inceput = text.indexOf(`id="${id}"`);
    assert.ok(inceput >= 0, `lipsește câmpul ${id}`);
    const camp = text.slice(text.lastIndexOf("<Camp", inceput), text.indexOf("/>", inceput));
    assert.ok(camp.includes('name="telefon"'));
    assert.ok(camp.includes('tip="tel"'));
    assert.ok(camp.includes("obligatoriu={false}"), "telefonul nu are voie să fie obligatoriu");
    assert.ok(camp.includes("stare.erori?.telefon"), "eroarea telefonului trebuie să se vadă lângă câmp");
    assert.ok(camp.includes("stare.valori?.telefon"), "ce a scris omul trebuie să rămână după o eroare");
  });

  test(`${nume}: emailul rămâne obligatoriu`, () => {
    const text = citeste(cale);
    const inceput = text.indexOf('name="email"');
    const camp = text.slice(text.lastIndexOf("<Camp", inceput), text.indexOf("/>", inceput));
    assert.ok(!camp.includes("obligatoriu={false}"));
  });
}

test("acțiunea citește telefonul, îl verifică prin regula comună și îl scrie ca null când e gol", () => {
  const actiune = citeste("src/app/actions/programari.ts");
  assert.ok(actiune.includes('const telefon = citesteText(formData, "telefon", LIMITE.telefon);'));
  assert.ok(actiune.includes("esteTelefonValid"), "telefonul scris trebuie verificat");
  assert.ok(/eroriDeContact\(\s*email,\s*esteEmailValid,\s*telefon,\s*esteTelefonValid,\s*EROARE_TELEFON,?\s*\)/.test(actiune));
  assert.ok(actiune.includes("phone: telefon || null,"), "gol trebuie să intre ca null, nu ca șir gol");
  assert.ok(!actiune.includes("phone: null,"), "cererile noi nu mai intră mereu fără telefon");
  assert.ok(actiune.includes("const valori = { nume, email, telefon,"), "telefonul trebuie să rămână în formular după o eroare");
});

test("limita pe persoană rămâne pe email — telefonul, fiind opțional, nu poate fi cheia", () => {
  const actiune = citeste("src/app/actions/programari.ts");
  assert.ok(/\.eq\("email", email\)/.test(actiune), "plafonul pe persoană trebuie să numere după email");
  assert.ok(!/\.eq\("phone"/.test(actiune), "plafonul nu are voie să numere după telefon (poate lipsi)");
});
