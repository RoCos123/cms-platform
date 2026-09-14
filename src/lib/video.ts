/**
 * De la un link YouTube lipit de client la ce-i trebuie randării: id-ul,
 * adresa de încorporare și poza-afiș.
 *
 * Clientul lipește ce are — `youtube.com/watch?v=…`, `youtu.be/…`, un link de
 * `/embed/…`, un `/shorts/…`, cu sau fără parametri în coadă. Toate duc la
 * același id de 11 caractere. Ce nu e YouTube (sau e gol) → `null`, iar
 * secțiunea nu arată niciun video, exact ca la o poză lipsă — regula
 * proiectului e că o valoare neprevăzută în panou nu dărâmă pagina.
 */

// Id-ul de YouTube: 11 caractere, litere, cifre, `-` și `_`.
const ID_YOUTUBE = /^[A-Za-z0-9_-]{11}$/;

export function idYouTube(brut: string | null | undefined): string | null {
  const text = (brut ?? "").trim();
  if (!text) return null;

  // Id gol-goluț, lipit direct (nu tot omul lipește un link întreg).
  if (ID_YOUTUBE.test(text)) return text;

  let url: URL;
  try {
    url = new URL(text.includes("://") ? text : `https://${text}`);
  } catch {
    return null;
  }

  const gazda = url.hostname.replace(/^www\./, "").toLowerCase();

  // youtu.be/<id>
  if (gazda === "youtu.be") {
    return curata(url.pathname.split("/")[1]);
  }

  if (gazda === "youtube.com" || gazda === "youtube-nocookie.com" || gazda === "m.youtube.com") {
    // …/watch?v=<id>
    const v = url.searchParams.get("v");
    if (v) return curata(v);
    // …/embed/<id>, /shorts/<id>, /live/<id>, /v/<id>
    const parti = url.pathname.split("/").filter(Boolean);
    if (parti.length >= 2 && ["embed", "shorts", "live", "v"].includes(parti[0])) {
      return curata(parti[1]);
    }
  }

  return null;
}

function curata(bucata: string | undefined): string | null {
  const id = (bucata ?? "").trim();
  return ID_YOUTUBE.test(id) ? id : null;
}

export function embedYouTube(id: string): string {
  // `youtube-nocookie`: nu pune cookie-uri până nu apeși play — mai blând cu
  // vizitatorul și cu GDPR-ul, ceea ce contează pe un site de cabinet.
  // `autoplay=1` pornește la clic (gestul contează ca acord); `rel=0` ține
  // recomandările la același canal la final, nu videoclipuri străine.
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

export function posterYouTube(id: string): string {
  // `hqdefault` există la ORICE clip (spre deosebire de `maxresdefault`, care
  // lipsește la unele și ar lăsa un cadru gol). E 480×360, cu benzi negre sus și
  // jos la un clip 16:9 — dar afișul se taie „cover" în ramă, iar tăierea scoate
  // exact benzile.
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}
