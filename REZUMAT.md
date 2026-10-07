# Rezumat — CONTEXT.md într-o pagină (la 7 oct. 2026)

Făcut citind tot CONTEXT.md (3550 de rânduri) și CONVENTII.md. Nu înlocuiește
CONTEXT.md: acolo sunt motivele și istoricul. Aici e doar ce trebuie știut ca să
se poată continua. Unde starea nu se vede din cod, scrie „nu știu".

## Ce e proiectul

Platformă multi-tenant pentru site-uri de prezentare ale psihologilor (panou +
site public per client). Un singur cod și o singură bază Supabase pentru toți
clienții, izolați prin `site_id` și RLS. Stack: Next.js (App Router, Server
Actions), Supabase, Tailwind, Vercel.

## Unde suntem

- Platforma e în esență terminată: 13 ecrane în panou, 5 șabloane (Căldură,
  Liniște, Lumină, Apropiere, Claritate), prima pagină, servicii, blog, pagini
  proprii și programări (modul opțional).
- Izolarea între clienți a fost verificată pe baza reală (10 sept.).
- Provizionarea unui client e o linie de SQL (`creeaza_client`), iar migrările
  trec prin CI.
- Tot codul e pe master (`cb3cfe2`), CI verde. Pe branch-ul de lucru există în
  plus două commit-uri de documentație.
- Ultimele lucrări (1–7 oct.): rama de poziționare a pozelor, mărirea pozei,
  cartonașele de servicii, bulinele plutitoare, mutarea articolelor de blog prin
  tragere, mărimea potrivită a pozelor scrisă în panou, demo-urile redenumite în
  `model-<șablon>.vercel.app`, capturile pentru galerie.

## Ce blochează primul client plătitor

1. **Contract + acord de prelucrare (GDPR), cu avocat.** Durează săptămâni și e
   cel mai lent punct. Se începe primul, în paralel cu restul.
2. **Backup / PITR verificat în Supabase.** Minute, proprietarul. Nu știu dacă
   e făcut.
3. **Resetarea parolei.** Codul e gata, dar vezi „Tensiuni" mai jos: varianta
   completă depinde de domeniu și email.
4. **Email tranzacțional** (mesaj nou, confirmare de programare). Ultimul, prin
   decizia proprietarului din 26 aug.; nu se propune Resend ca următor pas.
5. **Videoclipul de instructaj.** Ultimul de tot, fiindcă se învechește la
   fiecare schimbare de ecran.

Făcute: cheile hCaptcha (17 sept.), izolarea dovedită, provizionarea, CI cu probe.

## Ce blochează ARĂTAREA produsului (`sitepsihologi`)

- Domeniul `sitepsihologi.ro` (acum e pe `sitepsihologi.vercel.app`, nelistat).
- Textele proprietarului: „Cine ești?" și în câte zile se livrează.
- Păreri: trei locuri goale, dinadins. Nu se inventează recenzii.
- Galeria de șabloane: capturile sunt făcute. De verificat că fiecare cartonaș
  duce la adresa `model-…` și că adresele vechi `cosmin-…` au fost scoase din
  Vercel.
- Comutatorul de publicare: ultimul pas.
- Ordinea hotărâtă pe 27 aug.: site-ul proprietarului, apoi site-ul firmei de web
  design, apoi clienții.

## Marketing (adăugat 7 oct.)

Contactarea Rodicăi, a Emei și a lui Alex, apoi alți psihologi. Nu există note
despre cine sunt sau ce șablon li s-ar potrivi; le completează proprietarul.

## Tensiuni și lucruri de verificat

- **Resetarea parolei.** La lista de sarcini scrie „rămân 3 setări în Supabase".
  Corectarea din 10 sept. spune că puntea merge doar în același browser, iar
  varianta de pe orice dispozitiv cere șablon de email, deci SMTP propriu,
  deci domeniu și Resend. Cele două afirmații trebuie reconciliate.
- **Migrări posibil nerulate pe baza reală:**
  `20260915120000_curata_incarcarile_la_clonare.sql` (fără ea, o clonă arată
  pozele sursei) și `20260916120000_banda_servicii.sql` (fără ea, banda nu apare
  la site-urile vechi). Documentul nu spune că s-au rulat. Verificare:
  `supabase/verificare-schema.sql`.
- **`DEV_TENANT_DOMAIN` pe Production.** Scoasă pe 8 sept., dovedit. Rămâne pe
  Preview și Development.
- **Nedovedit pe aparate sau pagini reale:** tragerea articolelor cu degetul pe
  telefon, derularea automată la marginea ecranului, pâlpâitul previzualizării în
  Edge (cauza exactă neconfirmată), textul cu dimensiunile pozei din editorul de
  articole.

## Lucruri deschise, fără cerere de la proprietar (nu începe fără el)

- Culori proprii per site (paletă pe `site_settings.brand`, începând cu accentul).
- Textul „Fără ore" la zilele din preaviz; săgeți de săptămână în grila Apropiere.
- Banda de citat pe „relief" la Liniște (cere o mostră de culoare).
- Amânate în cunoștință de cauză: plățile cu cardul (Netopia), categoriile de
  blog, semnul din panou pentru secțiunile aprinse dar goale.

## Reguli care contează (din CONVENTII.md)

- Lansarea se face fără grabă; nimic nu pleacă neverificat. Ce n-a putut fi
  verificat se scrie ca nedovedit.
- Totul în română. Ghilimelele românești se scriu `„…”`.
- Orice schimbare vizibilă se verifică cu o captură, nu cu codul 200. La probe
  vizuale se folosesc placeholder-e gri.
- Liste din `data` se iau cu `?? []`. Căi se compară pe segmente, nu pe prefix.
  Ce se cheamă din `after()` primește valori, nu citește cererea.
- Funcțiile noi din `public` se revocă de la `anon` și `authenticated`, pe nume,
  și se verifică pe urmă. O probă care scrie se anulează prin construcție.
- Orice schimbare a ce pleacă din browserul vizitatorului schimbă și șablonul
  politicii de confidențialitate, în același commit.
- Regula de business: se vând funcții și opțiuni, nu personalizări per client.
  Cerere de client: conținut atinge doar site-ul lui, piele doar șablonul lui,
  funcție nouă e disponibilă tuturor.

## Cum se lucrează cu proprietarul

- Nu e programator și folosește Edge. Merg pașii puțini, fiecare cu rezultat
  vizibil, nu liste lungi.
- Nu-i place „clar, concret, direct" când nu e. Când ceva nu merge la el, se
  întreabă ce vede sau se oferă să facem noi partea.
- Orice merge pe master abia după un „da, fă merge pe master" explicit.
- SQL-ul se dă și în chat, nu doar ca fișier, scos dintr-un script din fișier, nu
  rescris.
- Ce cere „cu ochii lui" bate ce am dedus eu: o captură a site-ului viu bate
  citirea din cod. Pentru un lucru vizual, întâi se întreabă ce trebuie să se vadă.
