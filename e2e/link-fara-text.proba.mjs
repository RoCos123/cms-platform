import assert from "node:assert/strict";
import test from "node:test";
import { catreStocare, catreEditor } from "@/lib/sectiuni-editare";

/**
 * Proba linkurilor salvate fără text de buton. Se rulează cu `pnpm test:logica`.
 *
 * DE CE EXISTĂ. `catreStocare` a aruncat o vreme tot linkul când textul
 * butonului era gol — „un buton fără text n-are ce căuta pe pagină". Regula
 * era adevărată cât timp din `buton` se citeau mereu ȘI textul, ȘI adresa.
 *
 * A încetat să fie, când cartonașul „vitrina" din galeria de șabloane a
 * început să folosească DOAR `href`, ca să facă tot cartonașul clicabil fără
 * niciun buton scris. Proprietarul a pus adresele demo-urilor, a lăsat textul
 * gol (firesc — nu se vede nicăieri) și cartonașele n-au dus nicăieri.
 * Pierderea se petrecea LA SALVARE, în tăcere: panoul arăta adresa scrisă,
 * baza n-o primea. Genul de defect pe care nu-l vezi decât apăsând.
 *
 * REGULA DE ACUM, în două jumătăți care trebuie să rămână împreună:
 *   1. datele păstrează ce-a scris omul — link cu text, cu adresă, sau cu
 *      amândouă;
 *   2. componentele care DESENEAZĂ un buton se uită la `buton?.text`, nu la
 *      existența lui `buton`, ca un link fără text să nu producă un buton gol.
 *
 * Proba de aici ține prima jumătate. A doua o ține `butoane-cu-text`, mai jos.
 */

const CAMPURI = [{ tip: "link", cheie: "buton", eticheta: "Buton" }];

test("linkul cu adresă și fără text se salvează", () => {
  const stocat = catreStocare(
    { buton: { text: "", href: "https://cosmin-liniste.vercel.app" } },
    CAMPURI,
  );

  assert.deepEqual(stocat.buton, { text: "", href: "https://cosmin-liniste.vercel.app" });
});

test("linkul cu text și fără adresă se salvează", () => {
  const stocat = catreStocare({ buton: { text: "Scrie-mi", href: "" } }, CAMPURI);

  assert.deepEqual(stocat.buton, { text: "Scrie-mi", href: "" });
});

test("linkul gol de tot nu se salvează", () => {
  const stocat = catreStocare({ buton: { text: "  ", href: "" } }, CAMPURI);

  assert.equal("buton" in stocat, false);
});

test("dus-întors: adresa fără text se citește înapoi neschimbată", () => {
  const stocat = catreStocare(
    { buton: { text: "", href: "https://cosmin-caldura.vercel.app" } },
    CAMPURI,
  );
  const inapoiInFormular = catreEditor(stocat, CAMPURI);

  assert.deepEqual(inapoiInFormular.buton, {
    text: "",
    href: "https://cosmin-caldura.vercel.app",
  });
});

/*
 * A doua jumătate a regulii: nicio componentă de secțiune nu păzește un buton
 * pe EXISTENȚA lui `buton`, ci pe `buton?.text`. Altfel un link salvat doar cu
 * adresa (acum permis, vezi mai sus) ar desena o pastilă colorată fără nicio
 * literă în ea.
 *
 * Probă pe sursă, nu pe randare: aici nu se caută un defect anume, ci se ține
 * o regulă care trebuie să rămână adevărată în toate secțiunile, inclusiv în
 * cele care se vor scrie mâine.
 */
const PAZA_GRESITA = /\{\s*(?:data|element|pachet|serviciu)\.(?:buton|butonPrincipal|butonSecundar)\s*&&/g;

test("butoanele se desenează după text, nu după existența linkului", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const path = await import("node:path");

  const radacina = "src/components/site/sections";
  const vinovate = [];

  for (const nume of readdirSync(radacina)) {
    if (!nume.endsWith(".tsx")) continue;

    const sursa = readFileSync(path.join(radacina, nume), "utf8");
    for (const potrivire of sursa.matchAll(PAZA_GRESITA)) {
      vinovate.push(`${nume}: ${potrivire[0].trim()}`);
    }
  }

  assert.deepEqual(
    vinovate,
    [],
    `Pază pe existența linkului, nu pe text. Scrie \`?.text &&\`:\n${vinovate.join("\n")}`,
  );
});
