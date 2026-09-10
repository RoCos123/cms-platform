import { blocuriText } from "@/lib/blocuri-text";

/**
 * Textul lung al unui articol sau al unui serviciu, transformat în paragrafe și
 * subtitluri.
 *
 * O singură componentă pentru amândouă, ca regula de scriere să fie una singură
 * în tot panoul: dacă Enter ar face paragraf nou la blog și altceva la servicii,
 * clientul ar învăța de două ori.
 *
 * Subtitlurile sunt `<h2>` (sau ce i se cere): pe pagina unui articol, titlul e
 * `<h1>`, deci nivelul următor e 2 — iar cine navighează cu un cititor de ecran
 * sare din subtitlu în subtitlu ca printr-un cuprins.
 */
export function CorpText({
  text,
  nivelSubtitlu: Subtitlu = "h2",
  subtitluri = true,
  maxWidth,
}: {
  text: string;
  nivelSubtitlu?: "h2" | "h3";
  /** Oprit la servicii: acolo `##` nu e o notație pe care clientul s-o învețe. */
  subtitluri?: boolean;
  /** Lungimea rândului. ~34em e măsura la care ochiul găsește ușor rândul următor. */
  maxWidth?: string;
}) {
  const blocuri = blocuriText(text, { subtitluri });
  if (blocuri.length === 0) return null;

  return (
    <div style={{ maxWidth }}>
      {blocuri.map((bloc, i) =>
        bloc.tip === "subtitlu" ? (
          <Subtitlu
            key={i}
            style={{
              // Mai mult spațiu deasupra decât dedesubt: subtitlul aparține
              // textului care urmează, nu celui pe care tocmai l-ai terminat.
              margin: i === 0 ? "0 0 16px" : "44px 0 16px",
              fontSize: "clamp(21px, 2.3vw, 26px)",
              lineHeight: 1.25,
              letterSpacing: "-0.015em",
              fontWeight: 700,
              textWrap: "balance",
            }}
          >
            {bloc.text}
          </Subtitlu>
        ) : (
          <p
            key={i}
            style={{
              margin: i === 0 ? 0 : "18px 0 0",
              fontSize: "17px",
              lineHeight: 1.75,
              color: "var(--s-text-secundar)",
              textWrap: "pretty",
            }}
          >
            {bloc.text}
          </p>
        ),
      )}
    </div>
  );
}
