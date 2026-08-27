import assert from "node:assert/strict";
import test from "node:test";
import {
  caJsonLd,
  dateleArticolului,
  dateleCabinetului,
  dateleIntrebarilor,
  datelePsihologului,
} from "@/lib/date-structurate";

/**
 * Proba datelor structurate. Se rulează cu `pnpm test:logica`.
 *
 * Cel mai important test din fișier e ultimul grup: textul care ajunge în
 * `<script>` e scris de client în panou, deci trebuie să nu poată închide
 * blocul.
 */

const BAZA = new URL("https://cabinet-exemplu.ro");

const CABINET_COMPLET = {
  nume: "Cabinet Individual de Psihologie Maria Ionescu",
  numePersoana: "Maria Ionescu",
  subtitlu: "Psiholog clinician",
  telefon: "0722 000 000",
  email: "contact@cabinet-exemplu.ro",
  adresa: "Str. Exemplu 10, București",
  acreditare: "Membru al Colegiului Psihologilor din România",
  descriere: "Ședințe de psihoterapie pentru adulți.",
};

test("fără adresă nu se scrie niciun LocalBusiness", () => {
  // Un psiholog care lucrează doar online chiar n-are adresă. Google respinge
  // un LocalBusiness fără ea, deci mai bine niciunul decât unul invalid.
  const faraAdresa = { ...CABINET_COMPLET, adresa: undefined };

  assert.equal(dateleCabinetului(BAZA, faraAdresa), null);
  assert.equal(dateleCabinetului(BAZA, { ...CABINET_COMPLET, adresa: "   " }), null);
});

test("cabinetul complet se scrie cu tot ce s-a completat", () => {
  const date = dateleCabinetului(BAZA, CABINET_COMPLET);

  assert.equal(date["@type"], "LocalBusiness");
  assert.equal(date.name, "Cabinet Individual de Psihologie Maria Ionescu");
  assert.equal(date.address, "Str. Exemplu 10, București");
  assert.equal(date.url, "https://cabinet-exemplu.ro/");
  assert.equal(date.telephone, "0722 000 000");
  // Acreditarea NU mai stă aici: la Colegiu sunt membri oameni, nu clădiri.
  assert.ok(!("memberOf" in date), "acreditarea ar trebui mutată pe fișa omului");
  assert.deepEqual(date.founder, { "@id": "https://cabinet-exemplu.ro/#psiholog" });
});

test("fără numele omului, acreditarea rămâne pe firmă", () => {
  // Mai bine agățată de cabinet decât nescrisă nicăieri.
  const date = dateleCabinetului(BAZA, { ...CABINET_COMPLET, numePersoana: undefined });

  assert.equal(date.memberOf.name, "Membru al Colegiului Psihologilor din România");
  assert.equal(date.disambiguatingDescription, "Psiholog clinician");
  assert.ok(!("founder" in date), "n-avem pe cine da drept fondator");
});

test("fișa omului apare doar când i se știe numele", () => {
  assert.equal(datelePsihologului(BAZA, { ...CABINET_COMPLET, numePersoana: undefined }), null);
  assert.equal(datelePsihologului(BAZA, { ...CABINET_COMPLET, numePersoana: "  " }), null);
});

test("psihologul poartă numele lui, nu pe al cabinetului", () => {
  const om = datelePsihologului(BAZA, CABINET_COMPLET);

  assert.equal(om["@type"], "Person");
  assert.equal(om.name, "Maria Ionescu");
  assert.ok(
    !String(om.name).includes("Cabinet"),
    "numele firmei n-are ce căuta pe o fișă de om",
  );
  assert.equal(om.jobTitle, "Psiholog clinician");
  assert.equal(om.memberOf.name, "Membru al Colegiului Psihologilor din România");
});

test("cele două fișe se leagă una de alta", () => {
  const firma = dateleCabinetului(BAZA, CABINET_COMPLET);
  const om = datelePsihologului(BAZA, CABINET_COMPLET);

  assert.equal(firma.founder["@id"], om["@id"]);
  assert.equal(om.worksFor["@id"], firma["@id"]);
});

test("psihologul care lucrează doar online rămâne cu fișa lui", () => {
  // Fără adresă nu există firmă, dar omul nu dispare. Înainte, un cabinet
  // exclusiv online n-avea absolut nicio dată structurată.
  const doarOnline = { ...CABINET_COMPLET, adresa: undefined };

  assert.equal(dateleCabinetului(BAZA, doarOnline), null);

  const om = datelePsihologului(BAZA, doarOnline);
  assert.equal(om.name, "Maria Ionescu");
  assert.ok(!("worksFor" in om), "n-are unde lucra dacă n-avem cabinet");
});

test("câmpurile goale nu se scriu deloc", () => {
  // Un telephone gol nu e informație lipsă, e informație greșită: spune că
  // ăsta E numărul.
  const date = dateleCabinetului(BAZA, {
    nume: "Cabinet",
    adresa: "Str. Exemplu 10",
    telefon: "",
    email: "   ",
    acreditare: "",
  });

  assert.ok(!("telephone" in date), "telefonul gol n-ar trebui scris");
  assert.ok(!("email" in date), "emailul gol n-ar trebui scris");
  assert.ok(!("memberOf" in date), "acreditarea goală n-ar trebui scrisă");
});

test("fără întrebări nu se scrie niciun FAQPage", () => {
  assert.equal(dateleIntrebarilor([]), null);
  assert.equal(dateleIntrebarilor([{ intrebare: "  ", raspuns: "" }]), null);
});

test("întrebările incomplete se sar, restul rămân", () => {
  const date = dateleIntrebarilor([
    { intrebare: "Cât durează o ședință?", raspuns: "Cincizeci de minute." },
    { intrebare: "Rămasă pe jumătate", raspuns: "" },
    { intrebare: "Se dă bon?", raspuns: "Da, la fiecare ședință." },
  ]);

  assert.equal(date["@type"], "FAQPage");
  assert.equal(date.mainEntity.length, 2);
  assert.equal(date.mainEntity[0].name, "Cât durează o ședință?");
  assert.equal(date.mainEntity[0].acceptedAnswer.text, "Cincizeci de minute.");
});

test("articolul poartă data publicării, nu una inventată", () => {
  const date = dateleArticolului(CABINET_COMPLET, {
    titlu: "Anxietatea la adulți",
    extras: "Ce e și ce nu e.",
    publicatLa: "2026-08-25T09:00:00.000Z",
    imagine: null,
    adresa: "https://cabinet-exemplu.ro/blog/anxietatea-la-adulti",
  });

  assert.equal(date["@type"], "BlogPosting");
  assert.equal(date.datePublished, "2026-08-25T09:00:00.000Z");
  assert.ok(!("image" in date), "coperta lipsă n-ar trebui scrisă");
  assert.ok(!("dateModified" in date), "n-avem data modificării, deci n-o inventăm");
});

test("articolul e semnat de om când îi știm numele", () => {
  const date = dateleArticolului(CABINET_COMPLET, {
    titlu: "Anxietatea la adulți",
    adresa: "https://cabinet-exemplu.ro/blog/anxietatea-la-adulti",
  });

  assert.deepEqual(date.author, { "@type": "Person", name: "Maria Ionescu" });
  // Editorul rămâne cabinetul: el ține site-ul, indiferent cine scrie.
  assert.equal(date.publisher["@type"], "Organization");
  assert.equal(date.publisher.name, "Cabinet Individual de Psihologie Maria Ionescu");
});

test("fără numele omului, autorul e firma — niciodată un Person fals", () => {
  const date = dateleArticolului(
    { ...CABINET_COMPLET, numePersoana: undefined },
    { titlu: "Anxietatea la adulți", adresa: "https://cabinet-exemplu.ro/blog/x" },
  );

  assert.equal(date.author["@type"], "Organization");
  assert.ok(
    !JSON.stringify(date).includes('"@type":"Person"'),
    "niciun Person nu are voie să apară cu numele cabinetului",
  );
});

test("nimic de scris înseamnă niciun bloc", () => {
  assert.equal(caJsonLd([null, null]), null);
});

test("un răspuns cu </script> NU poate închide blocul", () => {
  // Ăsta e testul cu miză: oricine scrie în panou ar putea altfel să bage cod
  // în pagina publică a cabinetului.
  const otrava = '</script><script>alert("acasa la tine")</script>';
  const scris = caJsonLd([dateleIntrebarilor([{ intrebare: "Salut?", raspuns: otrava }])]);

  assert.ok(!scris.includes("</script>"), "blocul poate fi închis din conținut");
  assert.ok(!scris.includes("<"), "a rămas un < nescăpat");
});

test("textul scăpat se citește înapoi neschimbat", () => {
  // Scăparea nu are voie să strice datele: pentru cine le parsează trebuie să
  // fie exact ce a scris clientul.
  const otrava = '</script><b>îngroșat</b>';
  const scris = caJsonLd([dateleIntrebarilor([{ intrebare: "Salut?", raspuns: otrava }])]);

  assert.equal(JSON.parse(scris).mainEntity[0].acceptedAnswer.text, otrava);
});

test("mai multe blocuri se scriu ca listă, unul singur ca obiect", () => {
  const cabinet = dateleCabinetului(BAZA, CABINET_COMPLET);
  const intrebari = dateleIntrebarilor([{ intrebare: "Î?", raspuns: "R." }]);

  assert.ok(Array.isArray(JSON.parse(caJsonLd([cabinet, intrebari]))));
  assert.equal(JSON.parse(caJsonLd([cabinet, null]))["@type"], "LocalBusiness");
});
