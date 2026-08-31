# Context — Platformă CMS multi-tenant (site-builder pentru nișă)

Acest document e punctul de plecare pentru orice sesiune nouă (locală sau cloud) pe acest proiect. Citește-l primul.

---

## Ce e proiectul

O rescriere/produs bazat pe `rodi-cotenescu.vercel.app` — un CMS pentru site-uri de prezentare profesională (psiholog, la origine), cu blog. Ținta: **platformă multi-tenant** — un dashboard + un site public per client, la suprafață, dar **o singură bază de date și un singur cod** dedesubt, ca să se poată scala la mii de clienți fără deployment separat per client.

Reperul de efort: originalul (single-tenant, un client, cu bug-uri de configurare) a fost construit în **2 săptămâni** de un dezvoltator. Asta a recalibrat toate estimările din acest document în jos.

---

## Documente în acest folder

- [`audit-dashboard.md`](./audit-dashboard.md) — analiză completă a panoului de administrare original (rute, componente, model de date, fluxuri).
- [`audit-site-public.md`](./audit-site-public.md) — audit SEO/QA al site-ului public original. **Nu e documentație de arhitectură vizuală** — nu descrie pixel-cu-pixel cum arată variantele Hero A/B/C. Acelea se extrag direct de pe site-ul live la momentul construirii.
- [`plan-implementare-cms.md`](./plan-implementare-cms.md) — planul pe faze (Faza 0–8), cu estimări, dependențe și riscuri per fază.
- [`decizii-faza-0.md`](./decizii-faza-0.md) — deciziile confirmate ale Fazei 0 (domeniu, auth, storage, denumiri secțiuni) și implicațiile lor tehnice pentru Faza 1.

---

## Decizii confirmate

- **Stack:** Next.js App Router (RSC + Server Actions, **nu REST**), Supabase (Postgres + Auth + Storage + RLS), Tailwind, TypeScript, Vercel. Confirmat din trafic: originalul nu face niciun apel `/api/` — totul server-rendered + Server Actions.
- **Multi-tenant din prima migrare:** `site_id` pe fiecare tabel + RLS de la început, nu retrofit ulterior (retrofitarea e dureroasă și riscantă pe date reale).
- **Rezolvare tenant:** domeniul cererii → `site_id`, printr-un tabel `sites` + middleware.
- **API-uri externe obligatorii pentru MVP:** Supabase; email tranzacțional (Resend recomandat) pentru notificări contact + confirmări programări; anti-spam (Cloudflare Turnstile — GDPR-friendly, spre deosebire de reCAPTCHA) pe formularele publice.
- **Emailul tranzacțional se face ULTIMUL** (confirmat 26 aug. 2026, la cererea proprietarului: „nu am ce email să fac acum”). Contul de trimitere nu există încă. Până atunci, mesajele din formular se văd doar în panou, cu numărul de necitite lângă „Mesaje” — vezi `TODO` din `src/app/actions/formulare.ts`. **Nu propune Resend ca următorul pas**; e ultimul de pe listă, indiferent cât de mult ar ajuta.
- **Pentru scalare (fazele ulterioare):** Vercel Domains API (conectare automată domeniu propriu per client), Stripe (billing).
- **Opționale:** Google Analytics — DOUĂ integrări distincte (tag `gtag` care colectează pe site-ul public vs. GA4 Data API cu service account care citește datele înapoi în dashboard — originalul confundă asta, de evitat); Google Calendar API / Cal.com pentru sincronizare programări; Search Console API.

## Decizii luate în timpul construirii (fazele 2–5)

Ce s-a hotărât pe parcurs, ca să nu fie redeschis din senin:

- **Serviciile au O SINGURĂ pagină detaliată** (`/servicii`), nu câte o pagină
  fiecare. Șase servicii ar fi însemnat șase pagini de scris, multe rămase cu
  trei rânduri — șase pagini slabe arată mai rău decât una bună. Fiecare serviciu
  are totuși ancoră proprie (`/servicii#consiliere`).
- **Comutatorul blogului stinge TOT blogul** — pagina, articolele și secțiunea de
  pe prima pagină. Spre deosebire de servicii, unde cartonașul se citește întreg
  și fără pagina lui, un cartonaș de articol fără pagina articolului n-ar avea
  unde duce.
- **Paginile au trei locuri**: meniul de sus, subsolul, nicăieri. Implicit
  subsolul — o pagină nouă apare undeva, chiar dacă discret. Adresele rutelor din
  cod (`blog`, `servicii`, `admin`…) sunt refuzate din formular.
- **Fără buton de „înapoi” pe site.** Browserul are deja unul, iar al nostru n-ar
  ști unde duce pe cineva venit din Google direct pe o pagină interioară. Ce
  lipsea de fapt era un meniu care funcționează de pe orice pagină — reparat.
- **Limite în cuvinte, nu în caractere**, la textele lungi: 3.000 la articol, 600
  la descrierea completă a serviciului, 5.000 la o pagină. Opresc scrisul, ca
  cele în caractere. Caracterele rămân doar ca plasă, mult deasupra.
- **Categoriile de blog: amânate.** Un cabinet cu opt articole n-are ce sorta.
- **Numele cabinetului și numele omului sunt două câmpuri, nu unul.** Cabinetul
  se cheamă prin lege „Cabinet Individual de Psihologie <nume>”. Câmpul se
  chema „Numele tău SAU al cabinetului”, iar acel „sau” făcea imposibil de
  spus motoarelor de căutare cine e cine: un `Person` numit „Cabinet Individual
  de Psihologie Maria Ionescu” e o afirmație falsă, iar Google aruncă atunci
  tot blocul, nu doar rândul. Numele omului NU se deduce tăind prefixul —
  merge la cine scrie exact forma aia și iese aiurea la „C.I.P. Maria Ionescu”.
  Acum sunt „Numele cabinetului” și „Numele tău”, iar al doilea e singurul câmp
  din formular care nu se vede pe site (hint-ul o spune din prima).
- **Paginile puse pe „Nicăieri” nu se indexează.** Eticheta din panou îi promite
  clientului „Se ajunge doar cu adresa dată de tine”. Lăsate indexabile,
  promisiunea era falsă: cineva le-ar fi găsit din Google fără ca adresa să-i fi
  fost dată. Lipsesc din sitemap ȘI primesc `noindex` — cele două locuri se
  schimbă împreună.
- **Politica de confidențialitate**: șablon în `sabloane/`, potrivit pe ce face
  chiar site-ul ăsta (formular, Turnstile, fonturi Google, zero cookie-uri la
  vizitatori, zero urmărire). Nu e text juridic verificat.

## Ce lipsește și nu era în niciun plan

Găsite căutând în cod, la întrebarea „cât mai e până terminăm”:

- ~~**Nimic nu rulează probele automat**~~ — făcut (28 aug. 2026):
  `.github/workflows/verificari.yml` rulează lint, tipuri, cele 117 probe de
  logică și build-ul, la fiecare push pe `master` și la fiecare pull request.
  Pași separați, ca X-ul roșu să spună CE a picat. Build-ul nu cere niciun
  secret — verificat rulându-l cu `.env.local` mutat deoparte.

  **Prima rulare a picat, și a picat pe bună dreptate**: `tsc` singur nu găsea
  `LayoutProps`, un tip GENERAT de Next în `.next/types/`. Pe mașina de lucru
  exista din build-urile anterioare; pe o clonă curată, nu. Verificarea trecea
  local de săptămâni și ar fi picat la primul om care clona depozitul.
  `typecheck` cheamă acum `next typegen` întâi. Prima zi de CI, primul lucru
  prins — exact ce nu se putea vedea de aici.

  **Nu acoperă**: cum arată site-ul (rămâne verificarea vizuală cu capturi) și
  migrările SQL. `supabase/proba-locala.sh` își pornește singur un Postgres;
  merită adăugat ca al doilea job, dar abia după ce e probat pe runner — un
  workflow stricat care dă roșu pe cod bun strică încrederea în CI din prima zi.
- **Resetarea parolei nu există.** `/login` are doar email + parolă. Un client
  care își uită parola trebuie deblocat manual din Supabase.
- ~~**Provizionarea unui client e SQL scris de mână**~~ — făcut (28 aug. 2026):
  `public.creeaza_client(domeniu, nume, email, sablon, cu_programari)`, o linie
  în SQL Editor. Face rândul din `sites`, leagă contul de login (îl caută după
  email și refuză dacă nu-l găsește), pune cele 13 secțiuni ale paginii
  principale, setările goale și politica de confidențialitate ca ciornă. Ori
  toate, ori niciuna.

  **Doar `hero` și `contact` pornesc vizibile**, restul ascunse. Dinadins:
  site-ul e public din clipa în care domeniul rezolvă, iar un cabinet cu
  paisprezece secțiuni goale arată a defect. Clientul aprinde fiecare secțiune
  pe măsură ce o scrie. Asta acoperă jumătate din golul „site public prea
  devreme” de mai jos, fără ecranul de lansare.

  Refuză: domeniu care există deja, cont inexistent sau deja legat de alt site,
  șablon scris greșit, adresă cu `https://`. `/admin` rămâne o redirectare, iar
  un ecran de administrare tot nu există — vezi mai jos de ce.
- **Domeniul clientului se conectează manual în Vercel.**
- **Un ecran de administrare al platformei nu există.** Modulele plătite se
  pornesc bifând o coloană în editorul Supabase. Ca să fie un buton în aplicație
  trebuie întâi hotărât cum se autentifică proprietarul platformei: azi orice
  cont aparține unui singur site, deci nu există noțiunea de „administrator peste
  toți clienții".
- ~~**Din Faza 4 lipsesc garanțiile SEO**~~ — făcute (27 aug. 2026):
  `sitemap.xml` și `robots.txt` generate din bază per client, `metadataBase` pe
  domeniul clientului, date structurate `LocalBusiness` + `Person` + `FAQPage` +
  `BlogPosting`, cartonaș social desenat din Setări.
- ~~**Din Faza 5, Setările au 2 grupuri din 4**~~ — Social e făcut (27 aug.
  2026): Facebook, Instagram, LinkedIn, YouTube, cu linkuri în subsol și
  `sameAs` în datele structurate. Analytics NU e un grup de setări, ci ecranul
  Vizite — vezi mai jos de ce.

## Ordinea de lansare, hotărâtă de proprietar (27 aug. 2026)

1. **Site-ul proprietarului** — primul, făcut de mână. E primul drum complet
   cap la cap, deci scoate la iveală ce e incomod, pe un site care nu e al unui
   client care plătește.
2. **Site-ul firmei de web design** pe care o deschide — al doilea, pe același
   calapod. După ăsta se știe ce se repetă, deci ce merită automatizat.
3. **Clienții** — abia atunci.

**Vor exista 3-4 șabloane** (`caldura`, `spatiu`, și încă unul-două), iar
clientul ALEGE dintre ele. Nu e nevoie de niciun ecran de ales: omul se uită la
demo-uri, spune care îi place, iar proprietarul scrie cheia în linia de
provizionare. Fiecare șablon nou e un fișier de valori — culori, fonturi,
forme — nu cod de secțiuni.

Toate site-urile rulează din **același repo, același proiect Vercel, aceeași
bază**. Fără clonare per client: asta e chiar diferența față de „template
clonat", iar `site_id` + RLS de la prima migrare există exact ca să nu fie
nevoie.

## Ce se predă clientului (28 aug. 2026)

Hotărât de proprietar: **se predă un site GOL, iar clientul își pune singur
textele și pozele.** Proprietarul face doar instructajul. Nu scrie conținut în
locul lui, nici la primul client.

Consecința, care schimbă ce merită construit: **panoul E produsul.** Nu e o
unealtă secundară lângă un site făcut manual — e singurul lucru prin care
clientul își face site-ul. Orice loc în care se împotmolește devine un telefon
la proprietar, iar la 40 de clienți asta e diferența dintre o afacere și o
slujbă de suport.

De aici, trei lucruri urcă în prioritate față de cum erau socotite:

1. **Ecranul „Pregătit de lansare”** nu mai e doar argument de vânzare. E
   lucrul care îi spune clientului *„gata, ai terminat”* fără să te întrebe pe
   tine. Fără el, fiecare client te sună să te întrebe dacă mai are ceva de
   făcut.
2. **Textele din panou** trebuie să fie de sine stătătoare. Regula „descriu ce
   SE VEDE, nu cum se cheamă” din CONVENTII.md devine obligatorie, nu
   preferabilă: nu mai există cineva lângă client care să traducă.
3. **Resetarea parolei** e obligatorie înainte de primul client. Un om care își
   scrie singur site-ul intră în panou de zeci de ori în prima lună.

**Site-ul pornește cu TOATE secțiunile aprinse**, iar clientul le scoate pe cele
care nu i se potrivesc. Hotărât de proprietar, corectând o alegere de-a mea:
funcția de provizionare pornește azi doar `hero` și `contact` vizibile, restul
stinse. **De schimbat.**

Motivul lui e bun: un client care vede o listă de secțiuni stinse nu știe ce-i
oferă produsul, mai ales fără cineva lângă el. Văzându-le pe toate, înțelege ce
poate avea și taie ce nu-i trebuie.

**Dar asta face comutatorul „încă nu e lansat” obligatoriu, nu opțional.**
Site-ul e public din clipa în care domeniul rezolvă. Cu toate secțiunile
aprinse și goale, un vizitator — sau Google — poate nimeri peste un cabinet
care arată neterminat. Cât timp secțiunile porneau stinse, lipsa comutatorului
era doar neplăcută; acum e o gaură. Ordinea corectă e: întâi comutatorul, apoi
aprinderea tuturor secțiunilor.

**Instructajul e un videoclip**, trimis clientului, nu o ședință. Sună doar
dacă nu se descurcă cu el. Două lucruri decurg de aici:

1. **Textele din panou sunt singurul ajutor din momentul acela.** Nu mai există
   cineva de întrebat la mijloc.
2. **Videoclipul se învechește la fiecare schimbare de panou.** Deci nu se
   înregistrează până nu ne oprim din schimbat ecranele — altfel se refilmează
   sau, mai rău, arată altceva decât vede clientul.

Ordinea de lucru convenită: resetarea parolei, apoi adresa temporară de
platformă (ca să nu stea blocat pe dinafară cât se răspândește DNS-ul). Cu
observația de mai sus, comutatorul de lansare le devine tovarăș.

## Fără câmpuri de text liber pe formularele publice (28 aug. 2026)

Hotărât de proprietar, după ce a văzut că trei dintre riscurile mari sunt
legale și țin toate de același lucru: **produsul ÎNTREABĂ oamenii ce-i doare.**

Se scot amândouă câmpurile de text liber:

- `mesaj` din formularul de contact — care devine „lasă-mi numele și numărul,
  te sun”;
- `note` din formularul de programare („Vrei să adaugi ceva?”).

Formularul scurt de pe prima pagină e deja așa: doar nume și telefon.

**Ce se câștigă, exact.** Contractul de prelucrare rămâne obligatoriu —
numele și telefonul sunt tot date personale. Ce se schimbă e CATEGORIA: datele
despre sănătate devin întâmplare, nu proiectare. Cineva tot poate scrie „am
depresie" în câmpul de nume, dar asta e altceva decât un produs care întreabă.
Scade mult paguba la o eventuală scurgere, iar păstrarea și ștergerea devin
simple.

**Ce se pierde, și proprietarul a acceptat conștient.** Publicul final sunt
exact oamenii pentru care e mai ușor să scrie decât să sune. Cineva cu
anxietate socială poate să nu dea niciun telefon, dar ar fi scris trei rânduri.
E o alegere de produs, nu una juridică, iar el a ales curățenia.

**De ținut minte la implementare:** coloanele rămân în bază (`contact_messages.
message`, `appointments.notes`), pentru mesajele deja primite. Se scot doar din
formulare și din acțiuni. Ștergerea coloanelor e altă discuție, cu backup
înainte.

## Estimare de efort (corectată)

Lucrând activ cu Claude generând codul (nu un dev scriind manual):

| Bloc | Estimare |
|---|---|
| Nucleu CMS + site public (ca originalul, single-tenant) | ~1–1,5 săpt. |
| + Multi-tenant / RLS | +2–4 zile |
| + Guardrail-uri SEO + Launch Readiness | +3–5 zile |
| + Programări | +3–5 zile |
| + Onboarding self-serve | ~1 săpt. |
| **Total MVP multi-tenant** | **~3–4 săpt.** |
| **Total cu onboarding self-serve** | **~5–6 săpt.** |

Important: e timp de lucru concentrat, nu calendaristic. Bottleneck-ul real nu e viteza de scris cod — e disponibilitatea pentru decizii, review, testare, și furnizarea de conținut/designuri.

## Propunerea de produs — ce facem diferit față de original

**Diferențiator central:** editare cu **previzualizare live** (split-screen: formular stânga, site real dreapta, actualizat live) — nu „completezi câmpuri → Save → View live” ca în original.

**7 fixuri de usabilitate:** limbaj de client nu jargon de dev (Hero → „Prima secțiune”); selector de variantă cu **miniaturi vizuale**, nu descrieri text; gardă de modificări nesalvate; ConfirmDialog + avertisment „imagine folosită în N locuri”; cod mort scos (Tiers legacy, Portfolio nefolosit); model de publicare unificat (inclusiv About); reordonare + vizibilitate secțiuni dintr-un ecran vizual.

**3 module noi:** Programări (calendar + booking public + email — numit în ambele audituri „singurul lucru care schimbă produsul”); wizard de onboarding cu template-uri per profesie; branding ca date (culori/fonturi/logo per client, fără fork de cod).

**Moat față de „template clonat per client”:** guardrail-urile din audit devin **imposibil de greșit prin design**, nu un checklist manual:
- `metadataBase`/canonical/sitemap/robots derivă automat din domeniul tenantului (originalul avea totul pe `localhost` → carduri sociale rupte + zero indexare Google).
- Sitemap + slug-uri generate din DB, sursă unică (originalul avea 3 surse de adevăr desincronizate → 404-uri interne).
- Conținut demo (`is_demo`) **blochează publicarea**, nu doar afișează un avertisment.
- Date de contact placeholder detectate automat, blochează publicarea.
- Testimoniale cer bifă „acord scris obținut” înainte de a fi vizibile (problemă deontologică reală în original: mărturii fabricate sub numele unui psiholog acreditat).
- Toate imaginile prin `next/image` (originalul servea Unsplash la 1600px pe mobil).
- Date structurate `LocalBusiness`+`Person`+`FAQPage` auto-generate.

**Ecran nou: „Pregătit de lansare”** — semafor per site; butonul „Publică” e blocat până toate condițiile de mai sus sunt verzi. Ăsta e argumentul central de vânzare.

## Următorul pas planificat

**Stare la 26 aug. 2026.** Panoul e complet pe partea de conținut: Pagina
principală (secțiuni cu previzualizare vie), Servicii, Blog, Pagini, Mesaje,
Imagini, Setări. Site-ul public are prima pagină, `/servicii`, `/blog`,
`/blog/<articol>` și paginile proprii ale clientului la `/<adresă>`.

Ordinea de mai jos e cea confirmată de proprietar, nu o preferință tehnică.

**1. Două verificări înainte de primul client real.** Amândouă cer acces la
Vercel și Supabase, deci le face proprietarul, nu sesiunea de dezvoltare:

- `DEV_TENANT_DOMAIN` NU trebuie să existe în variabilele de Production. E o
  scurtătură de dezvoltare: setată acolo, orice cerere către gazda platformei
  (`*.vercel.app`) se rezolvă la un singur client — vezi `src/proxy.ts`.
- Izolarea între clienți trebuie dovedită, nu presupusă. `e2e/tenant-rls.spec.ts`
  n-a rulat niciodată (mediul de dezvoltare nu ajunge la Supabase). Aceeași
  verificare există acum și ca SQL de lipit în SQL Editor:
  `supabase/verificare-izolare.sql`. Rulat pe baza reală la 26 aug. 2026 — trecut.
  Verifică toate cele 12 tabele per client, nu doar `site_content`.

**Bancul de probă local.** `supabase/proba-locala.sh` pornește un Postgres gol,
rulează migrările în ordine, seedează doi clienți și rulează verificarea. Există
fiindcă mediul de dezvoltare nu ajunge la Supabase, iar fără el au plecat de
două ori scripturi SQL netestate. Orice migrare nouă trece pe aici întâi.

**2. ~~Programări~~** — făcut (27 aug. 2026), ca **modul opțional, contra
cost**. Rezerva din audit rămâne valabilă și e chiar motivul pentru care e
opțional: multe cabinete mici preferă telefonul, fiindcă vor să audă omul
înainte de prima ședință. Cine nu-l cumpără vede în panou doar ce face și cum
se pornește.

Ce s-a construit: programul de lucru per zi (`/dashboard/programari`), lista de
cereri cu confirmă/refuză, pagina publică `/programare` unde vizitatorul își
alege o oră liberă dintr-un **calendar pe luni** (prima variantă înșira zilele
ca butoane cu data scrisă în fiecare — la treizeci de zile ieșea un zid de text
din care nu se vedea nici ziua săptămânii, nici de ce lipsesc unele; zilele fără
ore rămân acum scrise, doar stinse), și **secțiunea „Programare online”** de pus
pe prima pagină, lângă Contact.

Secțiunea nu mai e o vitrină cu link: **ora se cere de acolo, din același
calendar.** Se deschide în trepte — calendar, orele zilei alese, iar formularul
scurt (numele și telefonul) abia după ce s-a ales o oră. Asta e și ordinea în
care se hotărăște omul; cerut de la început, numele ar fi făcut secțiunea să
arate a formular de completat, nu a oră de ales. Pagina întreagă rămâne pentru
cine intră direct pe ea din meniu sau vrea să scrie mai mult.

Pe prima pagină se cer **numele și telefonul**, amândouă. Prima variantă cerea
doar numele; telefonul a devenit obligatoriu la a doua trecere, când s-a văzut
ce înseamnă altfel — o cerere care blochează o oră fără să lase pe nimeni de
sunat.

Regula care leagă cele două formulare e una singură: **fiecare cerere pleacă cu
măcar o cale prin care psihologul poate răspunde.** CARE anume depinde de
formular — pe `/programare` emailul (telefonul e în plus), pe prima pagină
telefonul (email nu există acolo). Stă în `eroriDeContact`, rupt de acțiune ca
să poată fi probat, fiindcă e exact ce se uită prima când se mai adaugă un
formular. Ce cere serverul se și scrie lângă câmp: o etichetă „obligatoriu” pe
care serverul n-o susține e o minciună care se descoperă abia la trimitere.

Se uită la PREZENȚA câmpului (`formData.has("email")`), nu la valoarea lui:
câmpul gol și câmpul lipsă sunt lucruri diferite. Coloana `appointments.email` a
rămas fără `not null` din același motiv — un șir gol ar fi devenit în panou un
`mailto:` care nu duce nicăieri.

Linkul intră în meniul site-ului doar dacă modulul e pornit
ȘI clientul a bifat măcar o zi — un cabinet care tocmai a cumpărat modulul n-are
ce oferi până nu-și scrie programul.

**Fără email, prin decizia despre Resend.** Cererea apare în panou, cu emailul și
telefonul omului ca linkuri pe care se apasă; clientul răspunde el. Când vine
Resend, aici se leagă confirmarea automată.

Până atunci, singurul lucru care spune că a venit ceva e **numărul de lângă
„Programări” în meniu** — aceeași mecanică folosită de „Mesaje”, cu aceleași
două condiții ca pe ecran: cerere fără răspuns ȘI ora încă n-a trecut. Un număr
care n-are cum să ajungă la zero ar fi învățat clientul să-l ignore. Rămâne
totuși ceva ce se vede doar dacă psihologul deschide panoul; emailul e singurul
care ajunge la el fără să caute.

**Motivul programării** e o listă închisă cu două intrări — „Evaluări
psihologice" și „Altceva” — și e opțional (hotărât de proprietar, 27 aug. 2026).
Înainte se umplea din serviciile publicate ale cabinetului, dar cine cere o
primă ședință n-are de unde ști ce fel de ședință îi trebuie. Lista e verificată
și pe server: un `select` cu două intrări e altfel un câmp liber deghizat, iar
ce s-ar scrie acolo ar ajunge neatins în panou. De ținut minte că e aceeași
listă pentru toți clienții platformei: al doilea cabinet care nu face evaluări
va cere s-o poată schimba, iar atunci locul ei e în Setări.

Orele libere se calculează în `src/lib/programari.ts`, rupt de bază ca să poată
fi probat: durata plus pauza dau pasul, ultima ședință trebuie să se TERMINE
până la ora de închidere, preavizul taie ce e prea aproape, iar o oră ocupată
scoate tot ce se SUPRAPUNE cu ea, nu doar ora identică. Peste schimbarea orei de
vară, „luni la 10” rămâne 10 pe ceas — are teste pe ambele treceri din 2026.

**Două plafoane** (28 aug. 2026), fiindcă opresc lucruri diferite: cel pe oră
(10 per cabinet) mărginește volumul, cel pe persoană (2 cereri nerezolvate de la
același număr) mărginește ce poate ține blocat cineva anume. Fără ele, oricine
putea cere una după alta toate orele libere pe o lună — nu furt de date,
sabotaj, și ieftin. Dinadins NU există plafon pe totalul cererilor nerezolvate
ale unui cabinet: ar fi pedepsit pacienți adevărați pentru neatenția
psihologului, care fără emailuri poate strânge zece cereri necitite fără să fie
nimeni de vină.

Două cereri venite în aceeași secundă pentru aceeași oră: verificarea din
aplicație le lasă pe amândouă să treacă, fiindcă niciuna nu e încă scrisă.
Indexul unic `(site_id, starts_at)` pe cererile vii e singurul loc unde „ocupat”
chiar înseamnă ocupat.

**3. ~~Activitate~~** — făcut (27 aug. 2026), `/dashboard/activitate`. Rândurile
sunt grupate pe zile („Azi”, „Ieri”, apoi data), cu ora în fusul României — nu
timp relativ, fiindcă un „acum două ore” calculat pe server minte după ce pagina
stă deschisă o oră. Numele celui care a făcut modificarea apare doar când NU e
cel care se uită: pe un cabinet cu un singur cont, altfel fiecare rând ar repeta
același email. Aproape toate acțiunile își scriu singure rezumatul; pentru cele
care nu, propoziția se compune din acțiune și entitate, cu acordul corect
(`descrieIntrarea` din `src/lib/activitate.ts`).

**4. Fonturile, mutate de la Google pe serverul nostru** — de discutat cu
proprietarul (cerut 27 aug. 2026). Azi fiecare site public cere fonturile de la
`fonts.googleapis.com`, deci **Google apare în politica de confidențialitate a
fiecărui client**, iar prima afișare așteaptă o cerere externă.

Aici suntem în urma site-ului auditat: originalul își găzduia fonturile la el,
prin `next/font`, iar auditul public îl laudă explicit pentru asta — „fără
cerere externă către Google Fonts — bun și pentru GDPR" (audit-site-public.md
§6.3, §7.1). E singurul loc găsit până acum unde originalul face ceva mai bine
decât noi.

De discutat: `next/font/google` descarcă fonturile la build și le servește de pe
domeniul clientului — deci se rezolvă fără să schimbăm șabloanele, doar felul în
care sunt cerute (`templateFontsHref` din `src/lib/templates/index.ts`).

**5. Alte restanțe mici**: imagine per serviciu; categorii de blog (de făcut
abia când un cabinet chiar are atâtea articole încât să nu le mai găsească).

**6. Emailul cu Resend** — ultimul, prin decizie explicită. Vezi „Decizii
confirmate".

## Plăți cu cardul (Netopia) — de luat în calcul din timp

Ridicat de proprietar pe 27 aug. 2026, ca lucru sigur, nu ca ipoteză. Nu se
construiește nimic acum; se scrie aici ca să nu luăm între timp decizii care
îl blochează.

**Sunt DOUĂ cazuri, complet diferite, iar confundarea lor e capcana:**

**A. Psihologul încasează de la pacienții lui** — plata ședinței în avans, pe
site-ul lui. Aici **fiecare client are nevoie de contractul LUI cu Netopia**:
firmă, cont bancar, aprobare de la ei. Nu e o bifă, e o procedură comercială de
zile, nu de minute. Adică exact opusul promisiunii „dintr-un clic” de la
modulul Programări — de spus asta la vânzare, nu de descoperit după.

Tehnic, cazul ăsta cere ceva ce azi nu avem deloc: **secrete per client în
bază** (cheile de comerciant ale fiecărui cabinet). Ele nu pot fi citite de
sesiunea clientului, nu pot ajunge în pachetul de browser, și trebuie
criptate. Azi singurele secrete sunt ale platformei și stau în variabile de
mediu. E o clasă nouă de risc, nu o coloană în plus.

**B. Noi încasăm de la clienți** — abonamentul pentru site și pentru modulele
plătite. Aici e **un singur cont Netopia, al nostru**, cu cheile în variabile de
mediu. Zero configurare per client. Ăsta e cazul care face afacerea să meargă
și e mult mai simplu decât A.

**Ce e comun amândurora**, și unde se greșește de obicei: plata se face prin
redirectare către pagina lor, iar confirmarea vine înapoi ca un apel de la
Netopia către un URL public al nostru. **Acel apel trebuie verificat prin
semnătură.** Fără verificare, oricine îi știe adresa poate spune „s-a plătit”.
URL-ul e unul singur, al platformei, și află din datele plății la ce site și la
ce comandă se referă — asta se potrivește cu modelul nostru.

De pregătit oricum, indiferent de caz: un tabel de plăți cu `site_id`, cu
stările prin care trece o comandă (inițiată → plătită → eșuată → rambursată).
Cererile de programare au deja o coloană de stare, deci „plătită” se adaugă
acolo fără să se rescrie nimic.

**Stare: AMÂNAT (27 aug. 2026).** Proprietarul s-a gândit la cazul A — plata
pe site-ul clienților care o cer — apoi a lăsat-o pentru altă dată: „mi se pare
că ne-am complica mult dacă am oferi și asta". Judecată bună, iar complicația e
aproape toată în afara codului. **Nu propune plățile ca următorul pas.** Analiza
de mai jos rămâne scrisă pentru când se reia discuția.

Ce ar însemna cazul A, dacă se reia:

- **Banii merg direct la client, nu prin noi.** Bine așa: dacă ar trece prin
  conturile noastre, am fi intermediar de plată, adică altă categorie legală cu
  totul.
- **Nu e „dintr-un clic”.** Clientul își face singur contractul cu Netopia
  (firmă, cont bancar, aprobarea lor). Noi primim cheile lui și le punem.
  Promisiunea corectă e „îmi trimiți cheile, ți-l pornesc”, nu „îl bifez”.
- **Cheile lui sunt secrete care ating bani.** Azi n-avem niciun secret în bază.
  Astea cer criptare, imposibilitate de citire din sesiunea clientului, și zero
  prezență în pachetul de browser. Se face o dată, dar cu grijă.

**Întrebările de răspuns înainte de cod, care nu sunt tehnice:** plata e
obligatorie ca să se poată programa, sau opțională? Ce se întâmplă la anulare —
se returnează, integral sau parțial? Cine emite documentul fiscal (clientul, dar
trebuie să știe că trebuie)? Iar pentru un cabinet de psihologie: plata în avans
schimbă relația cu cineva la prima ședință, deci unii o vor și alții nu — de-aia
e modul, nu regulă.

Detaliile de protocol se citesc din documentația lor la momentul construirii,
nu din memorie.

## Module plătite: cum se pornesc, și de ce așa

Un modul care se vinde nu poate fi pornit de cel care ar trebui să-l plătească.
Comutatoarele din `site_settings.pagini` (blog, servicii) sunt ale clientului;
astea sunt ale noastre.

Stau ca **o coloană booleană pe `sites`** (`appointments_enabled`), nu ca un
`jsonb`, din două motive practice:

1. **Se apasă.** În editorul de tabele din Supabase, un boolean e o bifă. Un
   `jsonb` ar cere scris JSON de mână la fiecare client, adică exact ce NU e
   „dintr-un clic”.
2. **Se apără singură.** `sites` are deja drept de scriere pe coloane, nu pe
   tabel — `grant update (name)` din migrarea de întărire. Orice coloană nouă
   de acolo e, prin construcție, inaccesibilă clientului. N-avem de scris nicio
   politică nouă, deci n-avem nici unde greși.

Prețul: un modul nou e un `alter table` de un rând.

Implicit OPRIT — pe dos față de `pagini`, unde lipsa valorii înseamnă pornit.

**Cum pornești un modul:** Supabase → Table editor → `sites` → bifezi
`appointments_enabled` pe rândul clientului. Un ecran de administrare al
platformei nu există încă (`/admin` e doar un alias pentru client), fiindcă
n-am hotărât cum se autentifică proprietarul platformei — vezi „ce lipsește”.

**Cele patru șabloane sunt construite** (28 aug. 2026): `caldura`, `liniste`,
`lumina`, `apropiere`. Clientul alege în discuție, iar cheia se scrie în coloana
`sites.template` — nu există (și nu trebuie) niciun ecran de ales șabloane.
Contrastul fiecăruia e verificat automat; detaliile în
`design/sabloane/README.md`.

Bifa aceea face singură și restul: un trigger pe `sites` adaugă rândul secțiunii
„Programare online” în `site_content`, la coada paginii principale. A trebuit,
fiindcă panoul n-are flux de „adaugă secțiune” — rândurile vin seedate la
provizionare, așa că un tip nou de secțiune n-avea cum să ajungă pe un site care
există deja. Clientul o găsește apoi în „Secțiuni”, de mutat unde vrea. Cât timp
n-are nicio zi bifată în program, secțiunea nu se randează pe site: o invitație
la programare fără nicio oră liberă e mai rea decât nimic.

## Turnstile: limita de 10 domenii pe cheie

Găsit pe 28 aug. 2026, verificând de ce nu apare caseta anti-spam pe site.
Cloudflare leagă o pereche de chei de o listă de domenii, iar lista are
**maximum 10 intrări pe planul obișnuit**. Metacaracterele NU sunt acceptate,
deci `*.platformata.ro` nu ține loc de nimic. Ridicarea limitei cere Enterprise,
sau o funcție în alfa pentru care trebuie vorbit cu ei.

**Consecința pentru noi:** o singură pereche de chei acoperă primii ~8 clienți
(plus site-ul proprietarului și cel al firmei). La al nouălea, caseta pur și
simplu nu se mai randează pe domeniul nou — iar dacă cheia secretă e pusă,
formularele acelui client se închid complet.

**Nu e urgent, dar trebuie hotărât înainte de al optulea client.** Variantele,
în ordinea în care le-aș încerca:

1. **Cerut Cloudflare ridicarea limitei** sau funcția din alfa. Gratis dacă
   acceptă; o discuție, nu cod.
2. **Mai multe perechi de chei, câte una la zece clienți.** Cheia publică se
   poate ține pe rândul site-ului — e publică prin definiție, o vede oricine
   deschide pagina. Cheile secrete stau în variabile de mediu, una per grup:
   zece variabile la o sută de clienți. Urât, dar merge, și NU înseamnă secrete
   per client în bază.
3. **Alt furnizor** (hCaptcha, reCAPTCHA), la care verificarea de domeniu se
   poate opri. De evaluat abia dacă primele două cad.

De reținut și partea bună: de când formularele nu mai adună text liber și au
plafoane, spamul costă mai puțin decât înainte. Turnstile rămâne prima linie,
dar nu mai e singura.

## Analytics: de ce numărăm noi, și de ce nu numărăm oameni

Hotărât 27 aug. 2026, la cererea proprietarului: trebuie să meargă la sute de
clienți, fără configurare per client.

Asta a eliminat singură celelalte variante. Google Analytics ar fi cerut câte o
proprietate și un ID de măsurare per cabinet — sute de configurări manuale — plus
un banner de cookie-uri pe fiecare site. Vercel Analytics și Plausible amestecă
toți clienții într-un singur proiect și se plătesc pe trafic cumulat.

Numărăm în baza proprie: paginile se randează deja pe server la fiecare cerere,
`site_id` e știut din tenant, iar RLS-ul care izolează clienții e deja scris.
Un client nou are cifre din prima zi, fără ca cineva să atingă ceva.

**NU numărăm vizitatori unici.** Ar cere o amprentă din IP și browser, adică fix
urmărirea pe care șablonul de politică o exclude în numele clientului („nu pun
niciun cookie", „nu folosesc niciun program de urmărire”). Afișările pe pagină
răspund oricum la întrebarea pentru care se uită omul acolo: se citește ce scriu?
Politica de confidențialitate rămâne adevărată cuvânt cu cuvânt.

Vizitele proprietarului, când e conectat, nu se socotesc — altfel un psiholog
care își verifică pagina de zece ori seara ar vedea a doua zi zece „vizite” care
sunt el.

Ecranul e `/dashboard/vizite`. Migrarea `20260827100000_vizite.sql` TREBUIE
rulată în Supabase înainte ca ecranul să arate ceva.
