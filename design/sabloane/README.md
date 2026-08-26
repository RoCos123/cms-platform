# Șabloane — specificația vizuală a site-urilor publice

Analiza celor patru șabloane furnizate de client (26 aug. 2026). Înlocuiește
direcțiile propuse anterior în `decizii-faza-0.md` §7: nu mai proiectăm de la
zero, ci pornim de la aceste patru.

## Cele patru

| Șablon | Font principal | Font secundar | Fundal | Accent | Înălțime | Secțiuni |
|---|---|---|---|---|---|---|
| **Renata Iancu** | Manrope | Cormorant Garamond | `#F8F1EA` | `#B8654D` terracotta | 13070 px | 14 |
| Dragoș Geamănă | DM Sans | serif italic | `#F3EDE2` | `#1F2A24` verde închis | 8693 px | 9 |
| Gina Dafinoiu | Inter | — | `#F1F5FD` lavandă | `#5E2976` mov | 7594 px | 8 |
| Ana Rădulescu | Nunito | — | `#F4EDE2` | verde discret | 7157 px | 8 |

**Renata e superset-ul** — verificat, nu presupus: fiecare secțiune din celelalte
trei există și la ea. De aceea se construiește prima, integral, iar celelalte trei
se adaugă după (vezi „Ordinea de lucru" mai jos).

Toate patru împart aceeași familie: fundal crem/cald deschis, text brun-închis (nu
negru), un singur accent saturat, colțuri rotunjite, mult spațiu. Confirmă tonul
„cald și liniștitor" decis anterior.

## Structura Renata, secțiune cu secțiune

Extrasă din randarea reală, nu din citirea codului (`renata-spec.json` are datele
brute, `renata-pagina-intreaga.png` captura completă).

| # | Secțiune | Fundal | Elemente repetate | Cheia noastră |
|---|---|---|---|---|
| 1 | Hero — „Sunt Renata, psiholog clinician" | transparent | — | `hero` |
| 2 | Despre — „Câteva cuvinte despre drumul…" | `#FCF8F5` | — | `aboutTeaser` |
| 3 | **Bandă cu citat** | `#F8F1EA` | — | ⚠️ **lipsește** |
| 4 | Servicii — „Cum te pot însoți" | transparent | 6 | `features` |
| 5 | Proces — „Cum decurge colaborarea" | `#2A1F1A` închis | 4 pași | `howItWorks` |
| 6 | **Bandă cu citat** (a doua oară) | `#2A1F1A` închis | — | ⚠️ **lipsește** |
| 7 | Apariții TV & podcast | `#FCF8F5` | 2 | ⚠️ vezi `logos` mai jos |
| 8 | Testimoniale — „Povești ale celor care au început" | `#DFD8D1` | — | `testimonials` |
| 9 | Experiențe de grup (retreat, workshop) | `#FCF8F5` | 2 | `portfolio` |
| 10 | **Articole recente** | transparent | 3 | ⚠️ **lipsește** |
| 11 | Întrebări frecvente | transparent | — | `faq` |
| 12 | **Newsletter — „Scrisori din cabinet"** | `#2A1F1A` închis | — | ⚠️ **lipsește** |
| 13 | Contact — „Hai să vorbim, fără presiune" | `#DFD8D1` | — | `contact` |
| 14 | Subsol | `#2A1F1A` închis | — | `footer` |

## Ce lipsește din cele 17 secțiuni definite în `decizii-faza-0.md` §6

1. **Bandă cu citat** — la Renata apare de două ori, la Dragoș tot de două ori. E
   un element vizual recurent, nu un accident. Cheie propusă: `quote`.
2. **Articole recente** — apare în **toate patru** șabloanele. Avem tabelul
   `blog_articles`, dar nicio secțiune de pagină principală care să afișeze
   ultimele N articole. Cea mai clară scăpare. Cheie propusă: `latestPosts`.
3. **Newsletter / abonare** — Renata („Scrisori din cabinet"). Cheie propusă:
   `newsletter`. Necesită și stocarea adreselor, deci un tabel nou.

**Corecție la o decizie anterioară:** `logos` a fost repurposat în „Bandă servicii"
(decizii-faza-0.md §6.1) pe baza marquee-ului lui Gina. Dar Renata are „Apariții TV
& podcast" — exact scopul original al lui `logos` (recunoaștere, presă). Sunt două
lucruri diferite și amândouă apar în șabloane, deci trebuie două chei:
- `logos` → **„Apariții și acreditări"** (imagini/logo-uri, scopul original)
- `serviceBand` → **„Bandă servicii"** (text derulant, ca la Gina)

**Total: 17 → 21 de secțiuni.**

## Consecința de arhitectură: stratul de șablon

Cele patru **nu sunt patru variante ale aceluiași layout** — sunt patru sisteme de
design. Diferă perechea de fonturi, paleta, rotunjimile, densitatea.

Asta cere un nivel peste variantele de secțiune:

```
Șablon (ales o dată per site)  →  fonturi + paletă + rotunjimi + ritm de fundal
  └─ Secțiune (una din 21)     →  ce conține
       └─ Variantă             →  cum e aranjată în interior
```

Planul prevedea asta în Faza 7 („branding ca date"). Se mută în Faza 3: dacă
Fazele 3–4 se construiesc presupunând un singur stil, adăugarea celorlalte trei
înseamnă refacere, nu adăugare.

**Ritmul de fundal** merită tratat ca parte din șablon, nu hardcodat per secțiune.
La Renata alternanța e deliberată: transparent → `#FCF8F5` → transparent → închis
→ `#FCF8F5` → `#DFD8D1`. Fiecare secțiune primește un *ton* (`deschis`, `nuanțat`,
`închis`), iar șablonul decide ce culoare înseamnă fiecare ton. Așa, un șablon nou
= un set de valori, nu rescrierea secțiunilor.

Fundația de tokenuri semantice din Faza 2 (`src/app/globals.css`) e exact
mecanismul care face asta ieftin.

## Ordinea de lucru

1. **Renata, integral** — de la editarea în panou până la site-ul public randat.
   Superset-ul: dacă merge ea, structura e validată pentru toate.
2. Abia apoi celelalte trei, care devin seturi de valori peste aceeași structură.

Motivul ordinii: dacă se construiesc toate patru odată și definiția de „șablon" e
greșită, greșeala se multiplică de patru ori înainte să fie vizibilă.

## Note

- Capturile s-au făcut din fișierele HTML locale; overlay-ul roșu de eroare din
  ele e al bundler-ului (imaginile nu se încarcă de pe `file://`), nu un defect de
  design.
- Copy-ul din șabloane e al autorilor lor și servește doar ca referință de ton și
  lungime — conținutul real vine de la fiecare client.
