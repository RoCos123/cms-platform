import assert from "node:assert/strict";
import test from "node:test";
import { idYouTube, embedYouTube, posterYouTube } from "@/lib/video";
import { valideaza } from "@/lib/sectiuni-editare";

/**
 * Proba traducătorului de link YouTube. `pnpm test:logica`.
 *
 * Clientul lipește ce are — un link de la bara de adrese, unul de „share", un
 * `youtu.be`. Toate trebuie să ducă la același id, altfel videoul din secțiunea
 * „Apariții" ori nu apare, ori apare altul.
 */

const ID = "dQw4w9WgXcQ"; // 11 caractere, un id valid ca formă

test("formele obișnuite de link duc la același id", () => {
  assert.equal(idYouTube(`https://www.youtube.com/watch?v=${ID}`), ID);
  assert.equal(idYouTube(`https://youtube.com/watch?v=${ID}`), ID);
  assert.equal(idYouTube(`https://youtu.be/${ID}`), ID);
  assert.equal(idYouTube(`https://www.youtube.com/embed/${ID}`), ID);
  assert.equal(idYouTube(`https://www.youtube.com/shorts/${ID}`), ID);
  assert.equal(idYouTube(`https://www.youtube.com/live/${ID}`), ID);
  assert.equal(idYouTube(`https://m.youtube.com/watch?v=${ID}`), ID);
  assert.equal(idYouTube(`https://www.youtube-nocookie.com/embed/${ID}`), ID);
});

test("parametrii din coadă nu strică id-ul", () => {
  assert.equal(idYouTube(`https://www.youtube.com/watch?v=${ID}&t=30s`), ID);
  assert.equal(idYouTube(`https://youtu.be/${ID}?si=abcd1234`), ID);
  assert.equal(idYouTube(`https://www.youtube.com/watch?list=PL123&v=${ID}`), ID);
});

test("link fără schemă și id gol-goluț merg și ele", () => {
  assert.equal(idYouTube(`youtu.be/${ID}`), ID);
  assert.equal(idYouTube(`www.youtube.com/watch?v=${ID}`), ID);
  assert.equal(idYouTube(ID), ID);
  // Spațiile din greșeală, la lipit, se taie.
  assert.equal(idYouTube(`  ${ID}  `), ID);
});

test("ce nu e YouTube sau e gol → null (videoul nu se arată)", () => {
  assert.equal(idYouTube(""), null);
  assert.equal(idYouTube("   "), null);
  assert.equal(idYouTube(null), null);
  assert.equal(idYouTube(undefined), null);
  assert.equal(idYouTube("nu e link"), null);
  assert.equal(idYouTube("https://vimeo.com/12345678"), null);
  assert.equal(idYouTube("https://example.com/watch?v=abc"), null);
  // Un id de lungime greșită nu e id.
  assert.equal(idYouTube("https://youtu.be/prea-scurt"), null);
  assert.equal(idYouTube("aaaa"), null);
});

test("adresa de încorporare și afișul se construiesc din id", () => {
  assert.equal(embedYouTube(ID), `https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0`);
  assert.equal(posterYouTube(ID), `https://i.ytimg.com/vi/${ID}/hqdefault.jpg`);
});

test("un câmp „doar YouTube” respinge un link care nu-i YouTube", () => {
  // Regula s-a născut dintr-un link de Bing lipit în câmpul de video: era un URL
  // valid, trecea, se salva, dar pe site nu apărea niciun video, iar clientul
  // n-avea niciun semn de ce. Acum câmpul îi spune.
  const camp = {
    tip: "adresa",
    cheie: "video",
    eticheta: "Link YouTube",
    obligatoriu: true,
    doarYouTube: true,
    max: 300,
  };

  const eBing = valideaza({ video: "https://www.bing.com/videos/riverview" }, [camp]);
  assert.match(eBing.video ?? "", /YouTube/);

  // Un link YouTube adevărat trece fără eroare.
  const eYouTube = valideaza({ video: `https://www.youtube.com/watch?v=${ID}` }, [camp]);
  assert.equal(eYouTube.video, undefined);
});
