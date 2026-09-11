import assert from "node:assert/strict";
import test from "node:test";
import { linkWhatsApp } from "@/lib/whatsapp";

/**
 * Proba traducătorului de număr WhatsApp. `pnpm test:logica`.
 *
 * Numărul ajunge în `wa.me` doar dacă e cifre curate, cu prefix de țară. O
 * greșeală aici înseamnă un buton care duce la un număr greșit sau nicăieri —
 * exact ce nu vrei pe un site pe care se apasă ca să ceară ajutor.
 */

test("număr național românesc primește prefixul 40", () => {
  assert.equal(linkWhatsApp("0722 333 444"), "https://wa.me/40722333444");
  assert.equal(linkWhatsApp("0722333444"), "https://wa.me/40722333444");
  // Fix (021…) la fel: începe cu 0, deci e național.
  assert.equal(linkWhatsApp("021 123 4567"), "https://wa.me/40211234567");
});

test("prefixul de țară scris de om se respectă, nu se dublează", () => {
  assert.equal(linkWhatsApp("+40 722 333 444"), "https://wa.me/40722333444");
  assert.equal(linkWhatsApp("0040722333444"), "https://wa.me/40722333444");
  assert.equal(linkWhatsApp("40722333444"), "https://wa.me/40722333444");
  // Alt prefix de țară, cu +, rămâne al lui.
  assert.equal(linkWhatsApp("+1 555 123 4567"), "https://wa.me/15551234567");
});

test("gol sau prea scurt → null (butonul nu se arată)", () => {
  assert.equal(linkWhatsApp(""), null);
  assert.equal(linkWhatsApp("   "), null);
  assert.equal(linkWhatsApp(null), null);
  assert.equal(linkWhatsApp(undefined), null);
  assert.equal(linkWhatsApp("072233"), null); // câteva cifre, nu un număr întreg
  assert.equal(linkWhatsApp("nu e număr"), null);
});

test("mesajul dinainte-completat se codează în adresă", () => {
  assert.equal(
    linkWhatsApp("0722333444", "Bună ziua, aș dori o programare."),
    "https://wa.me/40722333444?text=Bun%C4%83%20ziua%2C%20a%C8%99%20dori%20o%20programare.",
  );
});
