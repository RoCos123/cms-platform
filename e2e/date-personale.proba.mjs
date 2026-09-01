import assert from "node:assert/strict";
import test from "node:test";
import {
  albesteRezumatul,
  cifreleTelefonului,
  citesteCautarea,
  esteAlPersoanei,
} from "@/lib/date-personale";

/**
 * Proba ștergerii datelor unei persoane. `pnpm test:logica`.
 *
 * Miza: o potrivire care ratează jumătate din rânduri arată exact ca una care
 * merge. Psihologul apasă „Șterge", vede „gata", și rămâne convins că a
 * răspuns cererii — până când îl întreabă cineva de ce încă are datele lui.
 */

test("același număr, scris în toate felurile, e același om", () => {
  const forme = [
    "0721123456",
    "0721 123 456",
    "0721-123-456",
    "+40721123456",
    "+40 721 123 456",
    "0040721123456",
    "(0721) 123.456",
    " 0721123456 ",
  ];

  const asteptat = "721123456";
  for (const forma of forme) {
    assert.equal(cifreleTelefonului(forma), asteptat, `nu s-a potrivit: ${forma}`);
  }
});

test("numere diferite rămân diferite", () => {
  assert.notEqual(cifreleTelefonului("0721123456"), cifreleTelefonului("0721123457"));
  // Fix cifra dinaintea celor nouă semnificative nu trebuie să conteze, dar
  // ultimele nouă, da.
  assert.notEqual(cifreleTelefonului("0722123456"), cifreleTelefonului("0721123456"));
});

test("căutarea știe singură ce i s-a dat", () => {
  assert.deepEqual(citesteCautarea("ion@exemplu.ro"), { fel: "email", cheie: "ion@exemplu.ro" });
  assert.deepEqual(citesteCautarea("  IoN@Exemplu.RO "), { fel: "email", cheie: "ion@exemplu.ro" });
  assert.deepEqual(citesteCautarea("0721 123 456"), { fel: "telefon", cheie: "721123456" });
  assert.equal(citesteCautarea("").fel, "necunoscut");
  assert.equal(citesteCautarea("Ion Popescu").fel, "necunoscut");
  // Prea puține cifre ca să însemne un telefon.
  assert.equal(citesteCautarea("123").fel, "necunoscut");
});

test("o căutare goală nu mătură toate rândurile", () => {
  /*
   * Cea mai periculoasă greșeală posibilă aici: o cheie goală care se potrivește
   * cu orice ar șterge datele TUTUROR pacienților unui cabinet, dintr-o apăsare.
   */
  const goala = citesteCautarea("");
  for (const rand of [
    { phone: "0721123456", email: "ion@exemplu.ro" },
    { phone: null, email: null },
    { phone: "", email: "" },
  ]) {
    assert.equal(esteAlPersoanei(rand, goala), false);
  }
});

test("un rând fără telefon nu se potrivește cu o căutare după telefon", () => {
  const cautare = citesteCautarea("0721123456");
  assert.equal(esteAlPersoanei({ phone: null, email: "ion@exemplu.ro" }, cautare), false);
  assert.equal(esteAlPersoanei({ phone: "", email: null }, cautare), false);
});

test("se caută în ambele câmpuri, fiindcă e același om", () => {
  // Telefonul lăsat la programare, emailul la newsletter.
  const dupaEmail = citesteCautarea("ion@exemplu.ro");
  assert.ok(esteAlPersoanei({ phone: null, email: "Ion@Exemplu.ro" }, dupaEmail));

  const dupaTelefon = citesteCautarea("+40 721 123 456");
  assert.ok(esteAlPersoanei({ phone: "0721123456", email: null }, dupaTelefon));
  assert.equal(esteAlPersoanei({ phone: "0721999999", email: null }, dupaTelefon), false);
});

test("numele dispare din jurnal, fapta rămâne", () => {
  const rezumat = "Programarea lui Ion Popescu a fost confirmată.";
  const albit = albesteRezumatul(rezumat, "Ion Popescu");

  assert.equal(albit.includes("Ion Popescu"), false, "numele trebuia să dispară");
  assert.ok(albit.includes("a fost confirmată"), "fapta trebuia să rămână");
});

test("un nume cu semne nu strică albirea", () => {
  // Construit ca expresie regulată, „Ion (Ionuț)" ar fi aruncat sau ar fi prins
  // altceva. De asta albirea taie pe text, nu pe tipar.
  const rezumat = "Programarea lui Ion (Ionuț) a fost refuzată.";
  assert.equal(albesteRezumatul(rezumat, "Ion (Ionuț)").includes("Ionuț"), false);
  // Iar un nume gol nu are voie să albească tot rezumatul.
  assert.equal(albesteRezumatul(rezumat, "   "), rezumat);
});
