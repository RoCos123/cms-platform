# Șabloane — specificația vizuală a site-urilor publice

Analiza celor patru șabloane furnizate de client (26 aug. 2026). Înlocuiește
direcțiile propuse anterior în `decizii-faza-0.md` §7: nu mai proiectăm de la
zero, ci pornim de la acestea patru.

**Notă de atribuire:** șabloanele-sursă sunt site-uri ale unor practicieni reali.
Aici sunt referite prin denumirile pe care le va vedea clientul la alegerea
stilului, nu prin numele autorilor. Din ele s-au reținut doar structura, culorile
și spațierile — datele măsurabile; textele lor nu au fost păstrate nicăieri în
proiect.

Denumirile sunt **stări pe care un cabinet le poate transmite**, nu descrieri
tehnice: numele apare în panou lângă miniatură, deci trebuie să fie ceva ce un
client e mulțumit să spună că a ales — iar niciunul nu trebuie să pară varianta
mai slabă.

## Cele patru

| Șablon | Cod | Font principal | Font secundar | Fundal | Accent | Înălțime | Secțiuni |
|---|---|---|---|---|---|---|---|
| **Căldură** | `caldura` | Manrope | Cormorant Garamond | `#F8F1EA` | `#B8654D` terracotta | 13070 px | 14 |
| Liniște | `liniste` | DM Sans | serif italic | `#F3EDE2` | `#1F2A24` verde închis | 8693 px | 9 |
| Lumină | `lumina` | Inter | — | `#F1F5FD` lavandă | `#5E2976` mov | 7594 px | 8 |
| Apropiere | `apropiere` | Nunito | — | `#F4EDE2` | verde discret | 7157 px | 8 |

**„Căldură” e superset-ul** — verificat, nu presupus: fiecare secțiune din
celelalte trei există și la el. De aceea se construiește primul, integral, iar
celelalte trei se adaugă după (vezi „Ordinea de lucru” mai jos).

Toate patru împart aceeași familie: fundal crem/cald deschis, text brun-închis (nu
negru), un singur accent saturat, colțuri rotunjite, mult spațiu. Confirmă tonul
„cald și liniștitor” decis anterior.

## Structura șablonului „Căldură”, secțiune cu secțiune

Extrasă din randarea reală, nu din citirea codului
(`sablon-caldura-spec.json` are datele brute).

| # | Secțiune | Fundal | Elemente repetate | Cheia noastră |
|---|---|---|---|---|
| 1 | Hero | transparent | — | `hero` ✅ |
| 2 | Despre mine | `#FCF8F5` | — | `aboutTeaser` ✅ |
| 3 | **Bandă cu citat** | `#F8F1EA` | — | `quote` ✅ |
| 4 | Servicii | transparent | 6 | `features` ✅ |
| 5 | Cum decurge colaborarea | `#2A1F1A` închis | 4 pași | `howItWorks` ✅ |
| 6 | **Bandă cu citat** (a doua oară) | `#2A1F1A` închis | — | `quote` ✅ |
| 7 | Apariții TV & podcast | `#FCF8F5` | 2 | `logos` ✅ |
| 8 | Testimoniale | `#DFD8D1` | — | `testimonials` ✅ |
| 9 | Experiențe de grup (retreat, workshop) | `#FCF8F5` | 2 | `portfolio` ✅ |
| 10 | **Articole recente** | transparent | 3 | `latestPosts` ✅ |
| 11 | Întrebări frecvente | transparent | — | `faq` ✅ |
| 12 | **Newsletter** | `#2A1F1A` închis | — | `newsletter` ✅ |
| 13 | Contact | `#DFD8D1` | — | `contact` ✅ |
| 14 | Subsol | `#2A1F1A` închis | — | `footer` ✅ |

**Stare: toate cele 13 secțiuni de conținut ale șablonului „Căldură” sunt
construite** (bifele din tabel). Rândul 14 e cadrul paginii, nu o secțiune.
Ce urmează e editarea lor din panou, nu randarea.

## Ce lipsește din cele 17 secțiuni definite în `decizii-faza-0.md` §6

1. **Bandă cu citat** — în „Căldură” apare de două ori, în „Liniște”
   tot de două ori. E un element vizual recurent, nu un accident. Cheie propusă:
   `quote`.
2. **Articole recente** — apare în **toate patru** șabloanele. Avem tabelul
   `blog_articles`, dar nicio secțiune de pagină principală care să afișeze
   ultimele N articole. Cea mai clară scăpare. Cheie propusă: `latestPosts`.
3. **Newsletter / abonare** — prezent în „Căldură”. Cheie propusă:
   `newsletter`. Necesită și stocarea adreselor, deci un tabel nou.

**Corecție la o decizie anterioară:** `logos` a fost repurposat în „Bandă servicii”
(decizii-faza-0.md §6.1) pe baza benzii derulante din „Lumină”. Dar „Căldură”
are „Apariții TV & podcast” — exact scopul original al lui `logos`
(recunoaștere, presă). Sunt două lucruri diferite și amândouă apar în șabloane,
deci trebuie două chei:
- `logos` → **„Apariții și acreditări”** (imagini/logo-uri, scopul original)
- `serviceBand` → **„Bandă servicii”** (text derulant)

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

Planul prevedea asta în Faza 7 („branding ca date”). Se mută în Faza 3: dacă
Fazele 3–4 se construiesc presupunând un singur stil, adăugarea celorlalte trei
înseamnă refacere, nu adăugare.

**Ritmul de fundal** merită tratat ca parte din șablon, nu hardcodat per secțiune.
În „Căldură” alternanța e deliberată: transparent → `#FCF8F5` → transparent
→ închis → `#FCF8F5` → `#DFD8D1`. Fiecare secțiune primește un *ton* (`deschis`,
`nuantat`, `inchis`), iar șablonul decide ce culoare înseamnă fiecare ton. Așa, un
șablon nou = un set de valori, nu rescrierea secțiunilor.

Fundația de tokenuri semantice din Faza 2 (`src/app/globals.css`) e exact
mecanismul care face asta ieftin.

### Corecție găsită la construirea benzilor închise

Un singur accent per șablon nu ajunge. Terracotta `#904D39`, ales să fie lizibil
pe crem, dă **2,53:1** pe fundalul închis `#2A1F1A` — sub orice prag WCAG,
inclusiv cel de 3:1 pentru text mare. Se vedea la cifrele pașilor din „Cum
decurge colaborarea" și la ghilimelele mari de pe a doua bandă cu citat, ambele
pe fundal închis.

Paleta are de acum `accentPeInchis` (5,97:1), plus `eroare` / `eroarePeInchis`
pentru formulare. Tonul secțiunii alege varianta, prin variabile `--s-*` pe care
`Section` le publică. Regula pentru cine scrie o secțiune nouă:

- ce stă **direct pe fundalul secțiunii** → `--s-accent`, `--s-eroare`,
  `--s-buton-fundal`, `--s-text-secundar`;
- ce stă **într-un card cu fundal propriu** (mereu deschis) → `--t-accent` etc.

Un buton plin primește același tratament: pe fundal închis se inversează în
crem, fiindcă terracotta pe maro-închis e o pată care abia se distinge.

## Așezarea: o hotărăște ȘABLONUL, nu clientul (28 aug. 2026)

Proprietarul a observat că șabloanele-sursă pun pozele în locuri diferite — nu
diferă doar culoarea. Întrebat cine decide așezarea, a ales: **șablonul**.

Consecința e o simplificare, nu o complicație. Dacă alegerea ar fi fost a
clientului, așezarea ar fi trebuit să stea per rând, în `site_content.variant`,
cu selector legat în fiecare editor și cu o valoare implicită pusă la
provizionare. Așa, **așezarea stă în obiectul șablonului**, lângă paletă și
fonturi:

```
asezari: { hero: "pozaStanga", aboutTeaser: "pozaDreapta", … }
```

Adică regula „un șablon nou = un fișier de valori” rămâne adevărată. Fără date
per client, fără migrare, fără interfață nouă.

`site_content.variant` și `VariantPicker` (construit, stă în galeria de
componente) NU se șterg — rămân pentru o eventuală alegere per secțiune a
clientului — dar nu ele sunt mecanismul de aici.

**Restanță înainte de a construi:** analiza de mai sus a măsurat fonturile,
culorile, înălțimile și ce secțiuni are fiecare șablon — **dar nu și așezarea.**
Cele patru se re-randează, iar pentru fiecare secțiune se notează unde stă poza
și cum e împărțit rândul, exact cum s-au notat culorile prima dată. Lista de
așezări de construit iese din datele alea, nu din presupuneri.

## Ordinea de lucru

1. **„Căldură”, integral** — de la editarea în panou până la site-ul public
   randat. Superset-ul: dacă merge el, structura e validată pentru toate.
2. Abia apoi celelalte trei, care devin seturi de valori peste aceeași structură.

Motivul ordinii: dacă se construiesc toate patru odată și definiția de „șablon” e
greșită, greșeala se multiplică de patru ori înainte să fie vizibilă.

## Notă tehnică

Trei din cele patru șabloane sunt aplicații React împachetate (~2 MB), în care
conținutul nu există în HTML — structura s-a extras randându-le în Chromium, nu
citind fișierele. Overlay-ul roșu de eroare vizibil la randare aparține
bundler-ului lor (imaginile nu se încarcă de pe `file://`), nu e un defect de
design.
