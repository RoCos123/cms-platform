import assert from "node:assert/strict";
import test from "node:test";
import { listTemplates } from "@/lib/templates";

/**
 * Contrastul fiecărui șablon, verificat automat. `pnpm test:logica`.
 *
 * Există fiindcă greșeala s-a întâmplat deja o dată: accentul terracotta al lui
 * „Căldură", ales să fie lizibil pe crem, dădea 2,51:1 pe fundalul închis — sub
 * orice prag, inclusiv cel de 3:1 pentru text mare. S-a văzut abia când cineva
 * s-a uitat la cifrele pașilor de pe banda închisă.
 *
 * Un șablon e un fișier de valori scris de om, iar culorile se copiază din
 * sursă. Sursele au ele însele probleme de contrast — trei din cele patru
 * folosesc text secundar sub prag. Proba asta e locul unde astea se opresc,
 * înainte să ajungă la un cabinet.
 *
 * Praguri WCAG 2.1 AA: 4,5:1 pentru text normal. Nu se coboară la 3:1 („text
 * mare") fiindcă rolurile de aici ajung și pe text mic — `textSecundar` e chiar
 * definiția textului mic.
 */

const PRAG = 4.5;

function canal(v) {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminanța relativă a unei culori scrise `#RRGGBB`. */
function luminanta(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  assert.ok(m, `culoare care nu e #RRGGBB: ${hex}`);
  const n = parseInt(m[1], 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

function contrast(a, b) {
  const [sus, jos] = [luminanta(a), luminanta(b)].sort((x, y) => y - x);
  return (sus + 0.05) / (jos + 0.05);
}

/** Perechile care chiar apar pe ecran, cu numele rolului în mesajul de eroare. */
function perechi(p) {
  const deschise = [
    ["fundal", p.fundal],
    ["fundalNuantat", p.fundalNuantat],
    ["fundalRelief", p.fundalRelief],
  ];

  const lista = [];

  for (const [numeFundal, fundal] of deschise) {
    for (const rol of ["text", "textSecundar", "accent", "eroare"]) {
      lista.push([`${rol} pe ${numeFundal}`, p[rol], fundal]);
    }
  }

  // Butonul plin de pe tonurile deschise: fundal = accentul, text = accentText.
  lista.push(["accentText pe accent (butonul plin)", p.accentText, p.accent]);

  for (const rol of ["textPeInchis", "textSecundarPeInchis", "accentPeInchis", "eroarePeInchis"]) {
    lista.push([`${rol} pe fundalInchis`, p[rol], p.fundalInchis]);
  }

  return lista;
}

for (const sablon of listTemplates()) {
  test(`„${sablon.nume}" — toate rolurile trec pragul de ${PRAG}:1`, () => {
    const slabe = perechi(sablon.paleta)
      .map(([nume, a, b]) => [nume, contrast(a, b), a, b])
      .filter(([, raport]) => raport < PRAG)
      .map(([nume, raport, a, b]) => `${nume}: ${raport.toFixed(2)}:1 (${a} pe ${b})`);

    assert.deepEqual(slabe, [], `\n  ${slabe.join("\n  ")}\n`);
  });
}

test("fundalul închis chiar e închis, iar cel deschis chiar e deschis", () => {
  // Fără asta, un șablon cu `fundalInchis` pus din greșeală deschis ar trece
  // toate probele de mai sus — textul „pe închis" fiind și el deschis.
  for (const s of listTemplates()) {
    assert.ok(
      luminanta(s.paleta.fundalInchis) < 0.15,
      `„${s.nume}": fundalInchis nu e închis (${s.paleta.fundalInchis})`,
    );
    assert.ok(
      luminanta(s.paleta.fundal) > 0.5,
      `„${s.nume}": fundal nu e deschis (${s.paleta.fundal})`,
    );
  }
});
