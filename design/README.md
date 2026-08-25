# Design — surse

Fișierele-sursă ale propunerilor vizuale. Nu sunt cod de producție: sunt macheta din care se decide cum arată site-ul public, înainte să fie construit în React (Faza 4).

## `pagina-principala/`

Trei direcții vizuale pentru pagina principală a unui cabinet de psihologie, plus testul cu/fără fotografie cerut de constrângerea din [`decizii-faza-0.md`](../decizii-faza-0.md) §7 (clienții vor avea poze de calitate mixtă, deci layoutul nu se poate sprijini pe imagini).

| Fișier | Ce e |
|---|---|
| `Main.dc.html` | Direcția A — Editorial cald (candidatul principal) |
| `DirectiaB.dc.html` | Direcția B — Structurat și limpede |
| `DirectiaC.dc.html` | Direcția C — Spațiu și liniște |
| `CuPoza.dc.html` | Secțiunea de deschidere, cu fotografie profesională |
| `FaraPoza.dc.html` | Aceeași secțiune, fără nicio fotografie |
| `canvas.json` | Aranjarea pe pânză + notițele explicative |

Textele sunt propuneri, nu conținut final. Ce apare în paranteze drepte (`[NUME PSIHOLOG]`, `[TELEFON]`) sunt locuri de completat — datele reale nu se inventează. Portretele sunt desene provizorii, nu fotografii.

**Fișierul `.html` generat nu se comite** (2+ MB, conține editorul împachetat) — e regenerabil oricând din fișierele de mai sus, prin skill-ul `design`.
