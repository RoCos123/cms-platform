# Audit site public — rodi-cotenescu.vercel.app

**Data:** 28 iulie 2026
**Metodă:** navigare directă în browser, inspecția arborelui de accesibilitate, citirea traficului de rețea, verificarea `robots.txt` și `sitemap.xml`, testarea rutelor și verificarea indexării în motoarele de căutare.
**Notă:** conexiunea cu extensia de browser a căzut de două ori spre finalul sesiunii. Rutele neverificate sunt listate explicit în secțiunea 9. Nu am completat și nu am trimis niciun formular.

**Concluzie scurtă:** structura, arhitectura de informație și fundația tehnică sunt solide. Site-ul e blocat însă de patru probleme de configurare care, împreună, îl fac invizibil pentru Google și rup complet previzualizările pe rețele sociale. Separat, conținutul e încă demonstrativ în proporție mare, iar o parte din el n-ar trebui publicat sub numele unui psiholog acreditat.

---

## 1. Verdict pe categorii

| Categorie | Stare | Gravitate |
|---|---|---|
| Arhitectură tehnică | Solidă | — |
| Indexare / SEO tehnic | **Nefuncțional** | Critic |
| Carduri sociale (OG) | **Rupte** | Critic |
| Legături interne | 2 legături moarte confirmate | Ridicat |
| Consistență slug-uri | Trei denumiri diferite pentru aceleași servicii | Ridicat |
| Conținut real vs. demonstrativ | Majoritar demonstrativ | Ridicat |
| Conformitate deontologică | Probleme reale (mărturii, fotografii) | Ridicat |
| GDPR / cookie-uri | Implementat corect ca principiu | Scăzut |
| Performanță imagini | Neoptimizate în afara hero-ului | Mediu |
| Încărcare fonturi | 13 fișiere pe prima pagină | Mediu |
| Accesibilitate | Bună la nivel de alt text | Scăzut |
| Funcție de programare | **Inexistentă** | Ridicat (produs) |

---

## 2. Arhitectură tehnică

**Stack observat:** Next.js App Router, compilat cu Turbopack, găzduit pe Vercel.

**Confirmat din trafic:** la încărcarea oricărei pagini nu pleacă niciun apel către `/api/`. Totul e randat pe server (React Server Components), datele vin din baza de date la randare. Nu există hidratare de date pe client. E arhitectura corectă pentru un site de conținut și explică de ce paginile publice se încarcă rapid, spre deosebire de panoul de administrare.

**Prezente:** `manifest.webmanifest`, `icon.svg`, generator de imagini OG la ruta `/og`, textură de zgomot livrată ca data-URI SVG (fără cerere de rețea suplimentară — detaliu bine făcut).

**Rute publice identificate:**

```
/                                    pagina principală
/servicii                            listă servicii
/servicii/<slug>                     pagină per serviciu
/blog                                listă articole
/blog/<slug>                         articol
/despre-mine                         (în sitemap; neverificată)
/workshop                            (în sitemap; neverificată)
/retreat                             (în sitemap; neverificată)
/termeni-si-conditii
/politica-de-confidentialitate
/politica-de-cookies
/og                                  generator imagini social
```

---

## 3. SEO tehnic — patru probleme care se compun

Acestea nu sunt patru probleme separate. Sunt aceeași problemă, manifestată în patru locuri: **site-ul e configurat pentru un domeniu care nu e live.**

### 3.1 `metadataBase` nesetat — carduri sociale rupte

Meta-tag-urile Open Graph și Twitter conțin:

```
og:image      → http://localhost:3000/og?title=Rodica%20Cotenescu&...
twitter:image → http://localhost:3000/og?title=Rodica%20Cotenescu&...
```

`localhost:3000` e mediul de dezvoltare. Pentru orice vizitator, acel URL nu există.

**Consecință concretă:** orice link partajat pe Facebook, WhatsApp, Instagram sau LinkedIn apare ca text gol, fără imagine. Pentru un cabinet care se promovează prin recomandare și social media, e exact canalul care contează cel mai mult.

**Cauză:** lipsește `metadataBase` în `app/layout.tsx` sau variabila `NEXT_PUBLIC_SITE_URL` în mediul Vercel. Next.js rezolvă URL-urile relative față de `metadataBase`; când lipsește, cade pe `localhost`.

**Reparare:** o linie în layout plus o variabilă de mediu. Sub 10 minute.

### 3.2 Canonical către un domeniu care nu răspunde

```
canonical: https://www.rodicacotenescu.ro
```

Site-ul rulează pe subdomeniul Vercel. Canonical-ul îi spune lui Google: „pagina reală e la adresa asta, indexeaz-o pe aia, nu pe mine". Dacă domeniul `.ro` nu e încă activ, Google urmează indicația, nu găsește nimic, și nu indexează nici pagina originală.

### 3.3 Sitemap complet greșit ca domeniu

`sitemap.xml` conține 22 de URL-uri, **toate** pe `www.rodicacotenescu.ro`. Un sitemap servit de pe un domeniu, dar care listează exclusiv URL-uri de pe alt domeniu, e ignorat de motoarele de căutare (cross-domain submission).

Structura în sine e bine făcută: `lastmod`, `changefreq` și `priority` diferențiate corect (1.0 pentru pagina principală, 0.8 blog, 0.6 articole, 0.5 pagini secundare). Doar domeniul e greșit.

### 3.4 `robots.txt`

```
User-Agent: *
Allow: /
Disallow: /dashboard
Disallow: /api
Disallow: /og

Sitemap: https://www.rodicacotenescu.ro/sitemap.xml
```

Blocarea `/dashboard`, `/api` și `/og` e **corectă și bine gândită** — panoul de administrare nu ajunge în index. Singura problemă e, din nou, domeniul din linia `Sitemap:`.

### 3.5 Rezultatul cumulat: zero indexare

Am căutat site-ul în motoarele de căutare. Nu apare niciun rezultat, nici pentru domeniul `.ro`, nici pentru subdomeniul Vercel. Coerent cu cele de mai sus: în acest moment site-ul nu e vizibil în căutare.

### 3.6 Titluri duplicate

```
/servicii                      → "Servicii psihologice București | Rodica Cotenescu | Rodica Cotenescu"
/servicii/consiliere-de-cuplu  → "Consiliere de cuplu București | Rodica Cotenescu | Rodica Cotenescu"
```

Brandul apare de două ori. Cauza: câmpul „Meta title" al paginii conține deja numele, iar `titleTemplate` din Settings (`%s | Rodica Cotenescu`) îl adaugă a doua oară.

**Reparare:** scoate „| Rodica Cotenescu" din meta title-urile individuale, sau golește `titleTemplate`. Nu ambele.

Detaliu care contează: titlurile depășesc astfel ~60 de caractere și Google le trunchiază exact pe partea informativă.

### 3.7 Ce e bine făcut la SEO

- Meta description prezente, scrise pentru om, cu apel la acțiune, sub 160 de caractere.
- `og:locale: ro_RO` corect.
- `twitter:card: summary_large_image` corect.
- `robots: index,follow` explicit.
- Dimensiuni OG declarate (1200×630).
- Generator OG dinamic la `/og` — infrastructura există, doar URL-ul de bază e greșit.
- Cuvintele-cheie acoperă intenția reală de căutare: „psiholog bucurești", „terapie de cuplu", „aviz psihologic".

---

## 4. Legături moarte și inconsistență de slug-uri

### 4.1 Confirmat: două legături 404 pe pagina principală

Secțiunea „Resurse" de pe prima pagină conține două carduri care duc în gol:

| Card | Legătură | Rezultat |
|---|---|---|
| „Program: 6 săptămâni fără anxietate în exces" | `/servicii/managementul-anxietatii` | **404** |
| „Workshop: echilibru și relaxare" | `/servicii/workshop-retreat` | **404** |

Ambele servicii **există** în listarea de pe `/servicii` — doar la alte adrese.

### 4.2 Trei surse de adevăr care nu se potrivesc

| Serviciu | Pe `/servicii` | În sitemap | Legat de pe prima pagină |
|---|---|---|---|
| Consiliere individuală adulți | da | `consiliere-psihologica-individuala-adulti` | da, funcțional |
| Consiliere de cuplu | da | `consiliere-de-cuplu` | da, funcțional |
| Consiliere parentală | da | `consiliere-parentala` | da, funcțional |
| Consiliere copii și adolescenți | da | `consiliere-psihologica-copii` | — |
| Managementul anxietății | da | **absent** | `managementul-anxietatii` → 404 |
| Evaluare psihologică clinică | da | `evaluare-psihologica-adulti` + `evaluare-psihologica-complexa` (două intrări) | — |
| Aviz psihologic angajare | da | `aviz-psihologic-angajare` | — |
| Workshop-uri și retreat-uri | da | `/workshop` + `/retreat` (rute separate, nu sub `/servicii`) | `servicii/workshop-retreat` → 404 |
| Ședințe online | **absent din listare** | `servicii/sedinte-online` | — |

Sitemap-ul, listarea de servicii și legăturile din secțiunea Resurse au fost scrise în momente diferite și nu s-au sincronizat niciodată.

**Reparare structurală:** slug-urile trebuie să provină dintr-o singură sursă — tabelul de servicii din baza de date — iar sitemap-ul să se genereze din aceeași sursă, nu dintr-o listă scrisă de mână. Altfel problema reapare la fiecare serviciu adăugat.

### 4.3 Pagina 404

Bine făcută: în română, mesaj clar („Pagina pe care o cauți a fost mutată sau nu mai există"), legătură explicită înapoi la pagina principală, titlu corect în tab („Not found | Rodica Cotenescu"). Nu e o pagină generică Next.js.

---

## 5. Conținut — ce e real și ce nu

### 5.1 Conținut care se auto-declară demonstrativ

Site-ul spune singur, în text public vizibil, că datele nu sunt reale:

| Secțiune | Text publicat |
|---|---|
| Cifre / Stats | „Cifre demonstrative, de înlocuit cu datele reale ale cabinetului." |
| Testimoniale | „Mărturii demonstrative, publicate cu acordul persoanelor implicate." |
| Resurse | „Conținut demonstrativ — urmează să fie completat." |

Prima frază pe care o citește un vizitator în secțiunea de cifre îi spune că cifrele sunt inventate. Al doilea rând al testimonialelor îi spune același lucru despre mărturii.

### 5.2 Date de contact placeholder

| Câmp | Valoare publicată |
|---|---|
| Telefon | +40 700 000 000 |
| WhatsApp | wa.me/40700000000 |
| Adresă | Str. Exemplu nr. 1, Sector 1, București |
| Email | contact@rodicacotenescu.ro (pe domeniul care nu e live) |

Site-ul are patru apeluri la acțiune de tip „Programează o ședință". Toate duc, în final, la un număr de telefon care nu există.

### 5.3 Fotografii

**Toate** imaginile sunt de pe Unsplash, inclusiv cea etichetată `alt="Rodica Cotenescu, psiholog clinician"` din hero și cea din secțiunea „Despre mine" (`alt="Rodica Cotenescu în cabinetul de psihologie"`).

Pentru un site de prezentare oarecare, poze de stock sunt acceptabile ca placeholder. Pentru un cabinet de psihologie, o fotografie de stock prezentată drept portretul terapeutului e o problemă distinctă: relația terapeutică se construiește pe încredere, iar prima informație pe care o dă site-ul despre persoană e falsă. Trebuie înlocuită înainte de lansare, fără excepție.

### 5.4 Testimoniale — problemă deontologică, nu doar editorială

Site-ul publică patru mărturii semnate „Andreea M.", „Radu și Ioana", „Mihai T.", „Elena D.", cu tipul de serviciu atașat, sub un titlu de secțiune care spune „Ce spun oamenii cu care am lucrat".

Sunt inventate — textul o spune. Publicate sub numele unui psiholog clinician acreditat, mărturii fabricate de la pacienți inexistenți nu sunt doar conținut demo: intră în zona de publicitate înșelătoare într-o profesie reglementată, cu cod deontologic propriu și cu reguli specifice privind confidențialitatea și mărturiile pacienților.

**Recomandare fermă:** secțiunea de testimoniale se ascunde complet (comutatorul „Visible" din panou face exact asta) până când există mărturii reale, cu acord scris. E o comutare de zece secunde, nu o rescriere.

### 5.5 Text reciclat între pagini

Pagina `/servicii` folosește, cuvânt cu cuvânt, textul secțiunii de pe prima pagină:

- Supratitlu: „Câteva dintre" — pe o pagină care le listează pe **toate**.
- Descriere: „Pe pagina de servicii găsești fiecare serviciu în parte, cu durata și tariful aferent." — text care trimite utilizatorul către pagina pe care se află deja.

Se rezolvă în panou, în două câmpuri.

### 5.6 Rețele sociale

Legături către `facebook.com/rodicacotenescu`, `instagram.com/rodicacotenescu`, `tiktok.com/@rodicacotenescu`. Neverificate. Dacă nu există conturile, sunt încă patru legături moarte, plus semnal de neglijență în subsol, pe fiecare pagină.

### 5.7 Ce e scris bine

Merită spus, pentru că e partea greu de făcut:

- **FAQ-ul acoperă obiecțiile reale** ale cuiva care ezită să meargă la psiholog: cât durează, de câte ședințe e nevoie, e la fel de eficient online, ce se întâmplă cu confidențialitatea, cum plătesc, pot anula. Astea sunt exact întrebările care blochează prima programare.
- **Secțiunea „Problem"** descrie stări, nu diagnostice: „gânduri în buclă", „funcționezi pe pilot automat", „aceleași discuții, aceleași reproșuri". Cineva se recunoaște acolo. E scris de cineva care înțelege subiectul.
- **Ședința gratuită de intercunoaștere de 15 minute** e cel mai bun element de conversie de pe site: elimină riscul primului pas.
- **Tabelul de tarife e transparent**, cu diferențiere fizic/online și justificarea diferenței („pentru cei din alte orașe").
- **Procesul în patru pași** reduce anxietatea de anticipare — cineva știe exact ce urmează.
- **Segmentarea „Cui se adresează"** e inteligentă: include companii și români din diaspora, două segmente cu buget și cu nevoie reală, pe care majoritatea cabinetelor le ignoră.

---

## 6. Performanță

### 6.1 Imagini neoptimizate — problema principală

Din traficul paginii principale:

- **O singură imagine** trece prin `/_next/image` (hero-ul), servită redimensionat la `w=1080&q=75`. Corect.
- **Restul imaginilor** se încarcă direct de la `images.unsplash.com`, la `w=1600`, fără redimensionare pentru viewport și fără conversie de format.

Adică majoritatea imaginilor folosesc `<img>` în loc de `next/image`. Pe mobil, pe conexiune slabă — exact publicul care caută „psiholog București" de pe telefon — se descarcă imagini de 1600px pentru un ecran de 390px.

**Reparare:** înlocuirea cu `next/image` și adăugarea `images.unsplash.com` (ulterior, domeniul de storage propriu) în `next.config`. Diferență măsurabilă la LCP.

### 6.2 Treisprezece fișiere de font

Pagina principală descarcă **13 fișiere `.woff2`**. E mult chiar și pentru un site cu două familii tipografice. Probabil se încarcă mai multe greutăți și mai multe subseturi decât se folosesc efectiv.

**Verificare:** ce greutăți se folosesc real în CSS. Cel mai probabil se poate ajunge la 4-6 fișiere, cu `subsets: ['latin-ext']` pentru diacriticele românești și fără greutăți nefolosite.

### 6.3 Ce e bine

Randare pe server, zero apeluri API la încărcare, textură livrată ca data-URI, fonturi self-hosted prin `next/font` (fără cerere externă către Google Fonts — bun și pentru GDPR).

---

## 7. GDPR și conformitate legală

### 7.1 Implementat corect

- **Banner de cookie-uri** cu două butoane explicite: **Accept** și **Refuz**. Refuzul e o opțiune reală, la același nivel vizual cu acceptarea — cerință a GDPR pe care majoritatea site-urilor românești n-o respectă.
- Banner-ul conține legătură directă către Politica de Cookies.
- **Tag-ul Google Analytics se încarcă doar după acceptare** — declarat explicit în panoul de administrare și corect ca implementare.
- **Formularul de contact are consimțământ explicit**, bifă separată, cu trimitere la politica de confidențialitate. Nu e prebifat.
- Trei pagini legale prezente și legate din subsol: Termeni și Condiții, Politica de Confidențialitate, Politica de Cookies.
- Fonturi self-hosted, fără apeluri către Google Fonts.

### 7.2 De verificat

**Persistența refuzului.** În testul meu, banner-ul a rămas afișat după apăsarea butonului „Refuz". N-am putut confirma dacă e o problemă reală sau un artefact al instrumentului de automatizare, pentru că extensia a căzut imediat după. **De testat manual:** apasă „Refuz", reîncarcă pagina, vezi dacă banner-ul revine. Dacă revine, alegerea nu se salvează — și asta e o neconformitate reală, nu cosmetică.

**Conținutul politicilor.** N-am citit textul celor trei pagini legale. De verificat că nu sunt șabloane generice și că menționează concret: operatorul de date (numele și CUI-ul cabinetului), temeiul legal al prelucrării datelor din formular, durata de stocare, drepturile persoanei vizate. Pentru date de sănătate — iar un mesaj către un psiholog e, în practică, o categorie specială de date — cerințele sunt mai stricte decât pentru un site obișnuit.

**Formularul de contact ca vector de date sensibile.** Câmpul „Câteva rânduri despre tine" invită oamenii să scrie despre problemele lor psihologice. Aceste mesaje ajung în baza de date și rămân acolo. De clarificat în politica de confidențialitate cât timp se păstrează și cine are acces. De verificat separat dacă mesajele se transmit și pe email, și dacă da, către ce adresă.

---

## 8. Accesibilitate

**Bine:**
- Text alternativ prezent și descriptiv pe toate imaginile verificate („Interiorul cabinetului, cu lumină naturală la fereastră", nu „imagine1.jpg"). Panoul de administrare impune alt text la fiecare încărcare, ceea ce explică de ce e consecvent.
- Structură semantică: `<main>`, `<banner>`, liste marcate corect.
- Ierarhie de titluri coerentă pe paginile verificate.
- Formularul are etichete asociate câmpurilor.

**De verificat:**
- **Banner-ul de cookie-uri pare să blocheze restul paginii pentru tehnologiile asistive.** Când era deschis, arborele de accesibilitate expunea exclusiv cele trei elemente ale banner-ului. Dacă e implementat ca dialog modal care face restul paginii inertă, un utilizator de cititor de ecran nu poate accesa nimic până nu ia o decizie — și, dacă alegerea nu se salvează (vezi 7.2), rămâne blocat la fiecare navigare.
- Contrastul de culoare pe textul secundar (gri pe fundal deschis) — nemăsurat.
- Navigarea completă cu tastatura și vizibilitatea indicatorului de focus — netestate.
- Marcajul carusel al testimonialelor (butoanele ‹ ›) — accesibilitatea netestată.

---

## 9. Ce n-a putut fi verificat

Extensia de browser a devenit nefuncțională înainte de finalul inspecției. Următoarele rămân neauditate:

- `/blog` — pagina de listare
- `/blog/<slug>` — randarea unui articol, structura de titluri, datele structurate
- `/despre-mine` — există în sitemap, nelegată din meniul principal
- `/workshop` și `/retreat` — existența și conținutul
- `/servicii/sedinte-online` — apare doar în sitemap
- Conținutul efectiv al celor trei pagini legale
- Randarea pe mobil și punctele de rupere responsive
- Validarea formularului de contact (mesaje de eroare, câmpuri obligatorii) — nu am trimis nimic, intenționat
- Metrici Core Web Vitals măsurate
- Existența datelor structurate `LocalBusiness` / `Person` (schema.org) — **probabil absente**, ceea ce ar fi o pierdere reală: pentru un cabinet cu locație fizică, marcajul `LocalBusiness` influențează direct apariția în rezultatele locale
- Existența conturilor de social media legate din subsol

---

## 10. Plan de acțiune, în ordinea impactului

### Blocante pentru lansare (câteva ore în total)

1. **Setează `metadataBase` / `NEXT_PUBLIC_SITE_URL`.** Repară toate cardurile sociale simultan. ~10 minute.
2. **Decide domeniul.** Ori activezi `www.rodicacotenescu.ro` și faci deployment-ul pe el, ori schimbi canonical-ul, sitemap-ul și `robots.txt` pe subdomeniul Vercel. Situația actuală — configurat pentru un domeniu, servit de pe altul — e cea mai proastă dintre cele trei.
3. **Repară cele două legături 404** din secțiunea Resurse.
4. **Elimină duplicarea din titluri.** Un singur loc care adaugă brandul.
5. **Înlocuiește datele de contact placeholder.** Telefon, WhatsApp, adresă, email.
6. **Ascunde secțiunea de testimoniale** până există mărturii reale cu acord scris. Comutator, nu rescriere.
7. **Înlocuiește fotografia de portret.** Nu se lansează un site de psihologie cu o poză de stock prezentată drept terapeutul.

### Săptămâna următoare

8. Înlocuiește cifrele demonstrative cu date reale, sau ascunde secțiunea.
9. Completează sau ascunde secțiunea Resurse.
10. Rescrie textul introductiv de pe `/servicii`.
11. Unifică slug-urile serviciilor într-o singură sursă și generează sitemap-ul din ea.
12. Testează manual persistența refuzului la cookie-uri.
13. Verifică existența conturilor de social media legate din subsol.

### Luna următoare

14. Treci toate imaginile pe `next/image`.
15. Redu numărul de fonturi încărcate.
16. Adaugă date structurate `LocalBusiness` + `Person` + `FAQPage`. FAQ-ul existent e deja scris — marcajul îl poate scoate direct în rezultatele Google.
17. Verifică și completează conținutul paginilor legale, cu accent pe categoria specială de date.
18. Audit de accesibilitate: contrast, focus, navigare cu tastatura, comportamentul modalului de cookie-uri.
19. **Adaugă un sistem de programare.** E singurul lucru din listă care schimbă produsul, nu doar îl repară.

---

## 11. Observație pentru business-ul de web design

Site-ul ăsta e, ca structură, un șablon bun pentru nișa de psihologie: secțiunile sunt corect alese, FAQ-ul acoperă obiecțiile reale, tabelul de tarife e transparent, procesul în patru pași reduce anxietatea, iar ședința gratuită de intercunoaștere e un element de conversie care funcționează. Partea grea — ce secțiuni trebuie să existe și ce trebuie să scrie în ele — e deja rezolvată.

Ce lipsește e disciplina de lansare. Toate problemele critice de mai sus sunt de configurare sau de conținut, niciuna de arhitectură. Asta înseamnă că se rezolvă cu o **listă de verificare pre-lansare**, nu cu rescriere de cod. Dacă productizezi serviciul, lista aia e livrabilul care face diferența între un site care arată bine și unul care aduce clienți:

- `metadataBase` setat și carduri sociale verificate cu un validator
- domeniu unic, coerent între canonical, sitemap și robots
- zero legături interne 404
- zero conținut demonstrativ rămas publicat
- date de contact reale și testate
- fotografii proprii, nu stock
- date structurate pentru business local
- testul de refuz al cookie-urilor trecut
- imagini prin `next/image`
- verificare finală pe mobil, pe conexiune lentă

Nouă puncte, verificabile în sub o oră per site. Diferența dintre un livrabil de amator și unul de profesionist.
