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

## Cât mai e până se pot vinde site-uri (9 sept. 2026)

Răspuns la întrebarea proprietarului, verificat în cod, nu din memorie. **Ține
secțiunea asta la zi** — e prima pe care o va deschide, și data trecută listele
incomplete l-au costat timp.

**Platforma e, în esență, terminată.** Panoul are 13 ecrane. Site-ul public are
prima pagină, servicii, blog, pagini proprii, programări. Cinci șabloane.
Izolarea între clienți e dovedită pe 13 tabele, nu presupusă. Depozitul de
fișiere e privat. Ștergerea și exportul datelor există. Provizionarea e o linie
de SQL, iar migrările trec prin CI. Primul site a fost făcut cu ea cap la cap,
pe 8 sept.

### Ce blochează primul client PLĂTITOR

| # | Ce | Al cui | Cât ține |
|---|---|---|---|
| 1 | **Contract + acord de prelucrare (GDPR)** | proprietar + avocat | **săptămâni** |
| 2 | **Email tranzacțional** | proprietar (hotărârea), apoi cod | zile |
| 3 | **Resetarea parolei** | cod, după 2 | ~o zi |
| 4 | **Backup / PITR verificat în Supabase** | proprietar | minute |
| 5 | **Cele două chei hCaptcha** | proprietar | minute |
| 6 | **Videoclipul de instructaj** | proprietar, ULTIMUL | ore |

**1 are cel mai lung timp de așteptare din toată lista.** Se începe primul,
curge în paralel cu restul. Din clipa în care platforma ține numele și telefonul
pacienților altcuiva, actele nu sunt opționale.

**2 e nodul**, deși a fost amânat dinadins („nu am ce email să fac acum",
26 aug.). De el atârnă trei lucruri: resetarea parolei, anunțul că a venit un
mesaj, confirmarea unei programări. Deocamdată clientul află că i-a scris cineva
**doar dacă intră în panou și se uită** — pentru un cabinet cu două mesaje pe
săptămână, asta e o problemă reală, nu o comoditate.

**3 e trecută drept obligatorie chiar în documentul ăsta** (§„Ce se predă
clientului"), și nu există. Un om care își scrie singur site-ul intră în panou
de zeci de ori în prima lună; când își uită parola, singura cale e un telefon la
proprietar și o intrare manuală în Supabase.

**6 se filmează ultimul**, dinadins: se învechește la fiecare schimbare de ecran.

**De rulat în Supabase, separat de lista de mai sus:** migrarea
`20260909100000_drepturi_de_executie.sql`, din 9 sept. Două funcții erau
chemabile de oricine deschidea site-ul — vezi §„Verificarea că baza reală are ce
scriu migrările". E o singură comandă, dar până rulează, gaura e deschisă.

### Ce blochează ARĂTAREA produsului

Site-ul de vânzări e gata, dar nepublicat, pe o adresă temporară care nu se
indexează (vezi §„Site-ul de vânzări"). Mai trebuie: domeniul `sitepsihologi.ro`,
capturi adevărate de șabloane (cer un site completat, cu texte și poze reale),
textul „Cine ești?" și în câte zile se livrează. Apoi comutatorul de publicare.

### Amânate în cunoștință de cauză

Plățile cu cardul (Netopia — vezi capitolul lui), categoriile de blog, și semnul
din panou pentru secțiunile aprinse dar goale (proprietarul a amânat reparația
pe 8 sept., după ce i-am arătat costul).

## Decizii confirmate

- **Stack:** Next.js App Router (RSC + Server Actions, **nu REST**), Supabase (Postgres + Auth + Storage + RLS), Tailwind, TypeScript, Vercel. Confirmat din trafic: originalul nu face niciun apel `/api/` — totul server-rendered + Server Actions.
- **Multi-tenant din prima migrare:** `site_id` pe fiecare tabel + RLS de la început, nu retrofit ulterior (retrofitarea e dureroasă și riscantă pe date reale).
- **Rezolvare tenant:** domeniul cererii → `site_id`, printr-un tabel `sites` + middleware.
- **API-uri externe obligatorii pentru MVP:** Supabase; email tranzacțional (Resend recomandat) pentru notificări contact + confirmări programări; anti-spam (hCaptcha — GDPR-friendly ca și Turnstile, dar fără plafon de domenii; vezi §„Anti-spam”) pe formularele publice.
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
  chiar site-ul ăsta (formular, hCaptcha, fonturi servite de la noi, zero cookie-uri la
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

**Există cinci șabloane** (`caldura`, `liniste`, `lumina`, `apropiere`,
`claritate`), iar
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
care nu i se potrivesc. Hotărât de proprietar, corectând o alegere de-a mea.
**Făcut pe 1 sept. 2026**, împreună cu comutatorul de lansare — vezi secțiunea
lui mai jos.

Motivul lui e bun: un client care vede o listă de secțiuni stinse nu știe ce-i
oferă produsul, mai ales fără cineva lângă el. Văzându-le pe toate, înțelege ce
poate avea și taie ce nu-i trebuie.

**Dar asta face comutatorul „încă nu e lansat” obligatoriu, nu opțional.**
Site-ul e public din clipa în care domeniul rezolvă. Cu toate secțiunile
aprinse și goale, un vizitator — sau Google — poate nimeri peste un cabinet
care arată neterminat. Cât timp secțiunile porneau stinse, lipsa comutatorului
era doar neplăcută; acum e o gaură. Ordinea corectă e: întâi comutatorul, apoi
aprinderea tuturor secțiunilor. **Amândouă făcute pe 1 sept. 2026**, în același
commit, tocmai fiindcă nu se puteau despărți.

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

- ~~`DEV_TENANT_DOMAIN` NU trebuie să existe în variabilele de Production~~ —
  **scoasă de proprietar pe 8 sept. 2026**, cu redeploy, și dovedit: adresa
  `.vercel.app` a proiectului arată acum pagina „Platformă sitepsihologi.ro",
  varianta care apare DOAR când platforma s-a uitat la adresa venită așa cum a
  venit. Rămâne pusă pe Preview și Development, unde își face treaba.

  Era o scurtătură de dezvoltare: setată pe Production, orice cerere către gazda
  platformei (`*.vercel.app`) se rezolva la un singur client — vezi
  `src/proxy.ts`. Se bătea cap în cap și cu planul de a ține site-ul de vânzări
  pe o adresă `.vercel.app`.
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
proprietarul (cerut 27 aug. 2026). **REZOLVAT pe 1 sept. 2026.**

Era: fiecare site public cerea o foaie de stil de la `fonts.googleapis.com`, iar
aceea cerea fișierele de la `fonts.gstatic.com` — deci Google trebuia scris în
politica de confidențialitate a fiecărui client, iar prima afișare aștepta o
cerere externă. Fonturile PANOULUI erau deja curate (`next/font/google` din
`src/app/layout.tsx` descarcă la build); problema era doar la șabloane.

Acum toate șase fonturile șabloanelor (Manrope, DM Sans, Inter, Nunito,
Cormorant Garamond, Caveat) trec prin `next/font/google`, în
`src/lib/templates/fonturi.ts`. Verificat pe build: 45 de fișiere `.woff2`
servite de la noi, zero pomeniri de Google în ce ajunge la browser.

Trei lucruri care se puteau rata:

- **`latin-ext`.** Fără el, ă, â, î, ș și ț nu sunt în font și cad pe fontul de
  sistem — pe un site românesc, jumătate din cuvinte scrise cu alte litere decât
  cealaltă jumătate. În engleză totul ar fi arătat perfect. Verificat în CSS-ul
  construit că intervalul `U+100-2BA` (care conține Ă, Ș, Ț) chiar e acolo.
- **Opțiunile se repetă la fiecare font**, deși sunt aceleași. `next/font` le
  citește din cod la compilare: un obiect comun împrăștiat cu `...` oprește
  build-ul cu „Font loader values must be explicitly written literals”.
- **Cursivele pentru Cormorant Garamond** se cer explicit. Fără ele, browserul ar
  fi înclinat singur literele drepte — „faux italic”, care la o serifă se vede.

Previzualizarea din panou nu mai primește o adresă de fonturi: iframe-ul copiază
oricum toate foile de stil ale paginii, iar `next/font` pune `@font-face` chiar
în ele.

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

## Migrările intră în CI (8 sept. 2026)

Până azi, CI verifica lintul, tipurile, probele de logică și build-ul. **Nu
verifica migrările** — singura probă că o migrare se aplică era că-mi aminteam
eu s-o rulez pe bancul local. Scris ca lipsă chiar în fișa de riscuri: „proba aia
nu rulează automat, ci doar dacă mi-o cer eu."

Contează mai mult decât pare: migrările se rulează de MÂNĂ, pe baza reală a
tuturor clienților. E singura operație din tot sistemul care lovește pe toată
lumea deodată și nu se poate da înapoi. Chiar azi o migrare a plecat cu două
lucruri rupte — o constrângere de tabel scrisă în altă migrare și un mesaj de
eroare care mințea — găsite abia fiindcă am rulat-o.

Job separat, `migrari`, fără Node și fără build: rulează în paralel, iar X-ul
roșu spune limpede că problema e în SQL. Instalează Postgres doar dacă lipsește
din imaginea GitHub — de obicei pasul nu face nimic, dar în ziua în care imaginea
se schimbă salvează verificarea în loc s-o rupă.

**Schimbarea care contează cel mai mult e în banc, nu în CI.** `proba-locala.sh`
doar TIPĂREA tabelul de verificări și ieșea cu 0, chiar dacă una dădea PICAT.
Adică se sprijinea pe cineva care se uită atent la treisprezece rânduri — merge
când rulezi o dată, nu merge deloc într-un CI unde nimeni nu se uită dacă scrie
„verde". Acum iese cu 1 și numește verificarea căzută.

`NECONCLUDENT` cade la fel ca `PICAT`, dinadins: o verificare care n-a putut
decide nu e o verificare trecută. S-a întâmplat deja o dată — a zecea verificare
trecea fiindcă rula cu rolul greșit, nu fiindcă apărarea ținea.

Probat în ambele sensuri: cu totul în regulă iese cu 0; cu o migrare care
redeschide bucket-ul, iese cu 1 și scrie care verificare a picat.

## Al cincilea șablon: „Claritate" (8 sept. 2026)

Cerut de proprietar pentru site-ul de vânzări: fond alb, profesionist. Niciunul
dintre cele patru nu era — toate sunt portări fidele ale unor site-uri de
psihologi reali, și toate calde: crem `#F8F1EA`, nisip `#F3EDE2`, lavandă
`#F1F5FD`, crem `#F4EDE2`.

„Claritate" e primul care NU vine dintr-o sursă măsurată. Alb adevărat
(`#FFFFFF`), fiecare gri cu o urmă de albastru (un gri neutru lângă alb pur
arată murdar), colțuri de 6px în loc de 24, butoane drepte în loc de pastile.
Inter și pentru text, și pentru accente — două fonturi diferite ar fi adus
căldură pe ușa din dos; accentul se deosebește prin GREUTATE (titlu 700, cuvânt
accentuat 300), nu prin cursive, care într-un sans dau aer de scrisoare.

Folosește și clienților, nu doar nouă: cine face evaluare psihologică, expertize
sau psihologia muncii n-avea ce alege dintre patru fundaluri calde.

### Lecția: aceeași listă în TREI locuri, iar al treilea nu se vede

Un șablon nou trebuie trecut în:

1. `TemplateId` și `TEMPLATES`, în cod;
2. verificarea `p_sablon not in (…)` din `creeaza_client`;
3. **constrângerea `sites_template_check` din tabel** — scrisă în migrarea din
   26 aug. 2026 și invizibilă din primele două.

Plus mesajul de eroare al funcției, scris separat de lista pe care o verifică,
deci liber să mintă.

Le-am găsit pe ultimele două **rulând**, nu citind: funcția accepta deja
`claritate`, iar `insert`-ul pica pe constrângere. `e2e/sabloane-sql.proba.mjs`
verifică acum toate trei listele plus mesajul, față de cod.

## Site-ul de vânzări al platformei (1 sept. 2026)

Hotărât de proprietar: **`sitepsihologi.ro` se face CU panoul nostru**, ca orice
alt client. E și cea mai bună probă posibilă — dacă nu putem face site-ul nostru
cu el, nu-l putem vinde.

Prețurile se scriu pe față: **300 € o dată — primul an și domeniul incluse —
apoi 60 €/an, cu domeniul inclus în fiecare an.**

Corectat pe 8 sept. 2026, de proprietar. Nota de aici a rămas o săptămână la
varianta abandonată („apoi 200 lei/an"), în timp ce site-ul spunea deja 60 €.
Documentul ăsta e primul citit la fiecare sesiune nouă, deci o cifră greșită
aici nu stă degeaba: se repetă.

**Stare la 8 sept. 2026: site-ul EXISTĂ.** Provizionat cu `creeaza_client` pe
`sitepsihologi.vercel.app`, șablonul `claritate`, conținutul turnat din SQL
generat (vezi mai jos). Nepublicat — îl vede doar proprietarul, logat.

Adresa e temporară, până se cumpără domeniul. **Cât stă pe `.vercel.app`,
site-ul nu se indexează deloc**: `robots.ts` refuză orice gazdă a platformei, iar
`*.vercel.app` e una. Nu e o scăpare — regula există ca site-ul unui client să
nu ajungă în Google pe două adrese deodată, concurând cu sine. Consecința pentru
noi: e o vitrină pe care o ARĂȚI, nu una pe care o găsește lumea. Costul real e
zero: un site nou n-ar fi ajuns oricum în căutări în săptămânile astea, iar la
mutarea pe domeniul propriu indexarea pornește curat, fără adrese vechi agățate.
Proprietarul știe și a ales asta în cunoștință de cauză.

Ce lipsea din panou pentru asta, și s-a făcut: **secțiunea „Pachete"**. Era deja
pe listă din Faza 0 pentru pachete de ședințe (decizii-faza-0.md §6.1), deci
folosește și psihologilor, nu doar nouă. Prețul e un câmp de TEXT, nu un număr:
„de la 300 €" și „60 €/an, în jur de 300 de lei" sunt prețuri adevărate pe
care un câmp numeric
nu le-ar fi putut ține, iar cu nimic nu se calculează aici. Scoaterea în față a
unui pachet se face cu o etichetă scrisă („Cel mai ales"), nu cu o bifă:
eticheta spune și DE CE, o bifă doar l-ar fi colorat.

**Șabloanele se arată întâi ca poze**, iar demo-urile vii vin când există
domeniul — hotărât de proprietar. Pozele intră în secțiunea „Programe și
materiale", care există deja, deci galeria nu cere cod nou.

**Stare la 8 sept. 2026: galeria e pusă, dar cu desene, nu cu capturi.** Fiecare
dintre cele cinci cartonașe are un SVG construit din paleta ADEVĂRATĂ a
șablonului lui — fundal, accent, culoarea textului, fontul — cu chenar punctat
și scris pe el „exemplu — aici va veni o captură adevărată". Așa se vede
diferența dintre șabloane fără să mintă nimeni că e o poză finală.

Capturile adevărate cer un site COMPLETAT, cu texte și poze reale, din care să
se poată fotografia ceva care vinde. Nu există încă niciunul. La fel și
secțiunea de păreri: are trei locuri goale, în paranteze drepte, scrise ca să
nu poată fi luate drept recenzii. **Nu se inventează păreri**, nici măcar ca
probă — un site care vinde ceva nu are voie să pornească cu recenzii false.

## Prima provizionare adevărată (8 sept. 2026), și ce a scos la iveală

Proprietarul a făcut primul site cu `creeaza_client`, pe o adresă `.vercel.app`,
pentru `sitepsihologi.ro`. Toate cele patru probleme de mai jos existau de zile
sau săptămâni, în cod care trecea lint, tipuri, build și toate probele. Niciuna
nu se putea găsi citind. Se citesc ca o listă de lecții, nu ca un istoric.

**1. Baza reală poate rămâne în urma codului, fără ca nimic s-o spună.**
Migrarea cu al cincilea șablon intrase pe JUMĂTATE: constrângerea de pe tabel se
aplicase, funcția nu. `creeaza_client` a refuzat `claritate`, iar mesajul lui
suna a greșeală de scriere. În SQL Editor, cu text selectat se rulează doar
selecția — de aici jumătatea.

~~Ce lipsește, și rămâne deschis: **nimic nu compară baza reală cu codul.**~~ —
făcut (9 sept. 2026), vezi §„Verificarea că baza reală are ce scriu migrările".
Probele verificau fișierele între ele; bancul local rulează migrările în ordine,
pe o bază goală. Niciunul nu se uita la Supabase. Interogarea de mai jos, care
lămurea cazul ăsta anume în două secunde, a rămas ca punct de plecare al
verificării de acum:

```sql
select
  (select pg_get_functiondef(oid) like '%claritate%'
     from pg_proc where proname = 'creeaza_client') as functia_e_la_zi,
  (select pg_get_constraintdef(oid)
     from pg_constraint where conname = 'sites_template_check') as constrangerea;
```

**2. Un `catch` poate fi întins lângă gaură, nu peste ea.** Numărarea vizitelor
se cheamă din `after()` și citea `headers()` acolo. Next 16 aruncă, iar pagina
ÎNTREAGĂ cade cu 500 — deși funcția prindea eroarea și o scria cuminte în
jurnal, exact cum îi cerea comentariul ei („nu aruncă niciodată"). Next vede
greșeala înaintea lui `catch`. Vezi convenția din CONVENTII.md.

**3. Un site abia provizionat e o stare pe care n-o probase nimeni.** Toate cele
paisprezece secțiuni pornesc APRINSE și cu `{}` (hotărâre de la comutatorul de
lansare, corectă: un site nepublicat nu se vede oricum). Șase componente făceau
`data.ceva.map(...)` de-a dreptul — 500 pe tot site-ul public al clientului.
Două aveau chiar o pază, `data.ceva.length === 0`, scrisă pentru lista GOALĂ, nu
pentru lista LIPSĂ; pica la fel.

**4. Codul 200 nu e o verificare vizuală.** După reparația de mai sus am
verificat că pagina răspunde 200 și m-am oprit. Proprietarul s-a uitat la ea: o
ghilimea albastră singură, atârnând într-o bandă goală, și o bandă neagră cât
ecranul cu un câmp de email și niciun cuvânt lângă el.

### Hotărârea care a ieșit din asta: site-ul nou își arată scheletul

Cerută de proprietar, și mai bună decât ce făcusem. Ascunsul secțiunilor goale
repara urâțenia și făcea în schimb panoul să MINTĂ: acolo scria „vizibilă" la
toate paisprezece, pe site se vedeau două.

Acum fiecare secțiune pornește cu numele pe care îl poartă și în panou —
„Despre mine", „Serviciile mele", „Păreri". Site-ul arată ca un cuprins al lui
însuși: derulezi și vezi ce ai de scris și unde, iar ce apeși în panou
regăsești pe site sub aceeași etichetă. Textele stau în `textul_de_pornire`
(migrarea `schelet_la_provizionare`) — **al patrulea loc** unde trăiește lista
de secțiuni, după registrul de componente, `metaSectiune` și constrângerea din
tabel. Are probă, `e2e/schelet-sql.proba.mjs`, care și-a găsit prada din prima:
`programare` lipsea, fiindcă ea nu vine de la provizionare ci de la un
declanșator, când se pornește modulul plătit.

Regula de randare: **o secțiune se vede dacă are TITLU**, chiar cu lista de sub
el goală. Fără titlu ȘI fără conținut, tot nu randează nimic.

### Ce rămâne deschis

**Panoul încă nu spune tot adevărul.** Ecranul de secțiuni citește dacă e
bifată, nu și dacă are conținut, deci o secțiune golită de client apare
„vizibilă" fără să se vadă pe site. Cu scheletul pus, cazul e rar; rămâne
pentru clientul care își golește o secțiune. Proprietarul a amânat reparația,
în cunoștință de cauză.

### Conținutul site-ului de vânzări se GENEREAZĂ

Textele stau în `src/app/proba-vanzari/continut.ts`, fără JSX, iar
`scripts/sql-vanzari.mjs` scoate din ele SQL-ul care le toarnă în baza reală:

```
node --import ./e2e/alias.mjs scripts/sql-vanzari.mjs sitepsihologi.vercel.app
```

Nu de dragul curățeniei. Node rulează TypeScript direct, dar nu și JSX — iar
scris de mână, în paralel, SQL-ul ar fi ajuns să se contrazică cu previzualizarea
pe care proprietarul a aprobat-o, iar diferența s-ar fi văzut abia pe site.

Totul e legat de un singur `site_id`, luat o dată la început, iar dacă domeniul
nu există se oprește fără să atingă nimic. Rescrie secțiunile și șterge
serviciile, deci se rulează pe un site gol, nu peste unul la care s-a lucrat.

### Șablonul „Claritate" e argintiu, nu alb

Schimbat pe 8 sept., la cererea proprietarului: „vreau ca albul să fie spre
argintiu futurist curat". Nu e o nuanță schimbată, ci o inversare — pardoseala
e argintie (`#EEF2F7`), iar `fundalNuantat` e alb curat, iar cartonașele îl
folosesc pe ăla. Panourile albe plutesc peste argintiu în loc să se piardă în
el. **E invers față de celelalte patru șabloane**, unde `nuantat` e mai închis
decât `fundal`: singurul lucru din fișier care nu se poate copia orbește într-un
șablon nou.

### „Ce primești" stă pe o bandă orizontală

`features` are acum varianta `linie`, cerută pe coloana `variant` din
`site_content` — coloana exista de la prima migrare și n-o folosea nimeni.
Secțiunea NU s-a schimbat pentru toți: își ia conținutul din Servicii, iar la un
cabinet o linie ar fi greșită (nimeni nu ia terapia de cuplu DUPĂ evaluare).
Panoul scrie doar `data`, `position`, `visible` și `is_demo`, deci varianta pusă
din SQL supraviețuiește oricâtor editări.

## Verificarea că baza reală are ce scriu migrările (9 sept. 2026)

Golul rămas deschis pe 8 sept. — „nimic nu compară baza reală cu codul" — e
astupat. Se lipește un fișier în SQL Editor și scrie ori „TOTUL E LA FEL", ori
câte un rând per diferență.

**Cum e construit, fiindcă asta e partea care contează.** Amprenta schemei — 247
de lucruri: tabele, coloane, constrângeri, indecși, politici RLS, funcții cu
drepturile lor de execuție, declanșatori, drepturi pe tabel și pe coloană,
steagul de public al depozitului — se ia cu UN SINGUR `select`,
`supabase/amprenta-schema.sql`. Același `select` rulează în două locuri: o dată
pe bancul local (toate migrările, în ordine, pe un Postgres gol) și o dată pe
baza reală. Scrise separat, cele două părți ar fi putut devia una de alta —
adică exact greșeala pe care verificarea trebuie s-o prindă.

Rezultatul de pe banc se lipește ca listă de valori în
`supabase/verificare-schema.sql`, generat de `genereaza-verificare-schema.sh` la
coada bancului. **Comparația se face ÎN baza reală, nu aici:** mediul de
dezvoltare nu ajunge la Supabase, și nici nu vrem să ajungă — ar fi însemnat un
șir de conectare cu parolă ținut undeva. Lista de valori călătorește prin
fișier; comparația se mută la ea.

**Ce prinde, probat stricând dinadins fiecare:** o migrare care n-a rulat
(coloana lipsește), una intrată pe jumătate (constrângerea rămasă la patru
șabloane în loc de cinci — chiar cazul din 8 sept.), o funcție rămasă la o
versiune veche, o politică RLS ștearsă, RLS stins pe un tabel, un drept lărgit
pe tăcute, depozitul redeschis, și un tabel făcut de mână din tabloul de bord.

**Trei feluri de diferență, fiindcă se repară altfel:** LIPSEȘTE DIN BAZĂ
(migrarea n-a rulat), ALTFEL ÎN BAZĂ (există, dar spune altceva), ÎN PLUS ÎN
BAZĂ (nicio migrare nu-l creează — de obicei ceva făcut de mână). Ultima coloană
arată ultima migrare care pomenește numele: un indiciu, nu o dovadă, și doar
pentru numele distinctive. `sites` sau `name` apar în aproape fiecare migrare,
iar un indiciu care minte e mai rău decât niciunul.

**CI-ul ține fișierul la zi.** Bancul îl rescrie din baza pe care tocmai a
construit-o; dacă cel comis diferă, verificarea pică și spune ce să rulezi.
Comparația se sare dacă runner-ul e pe altă versiune majoră de Postgres decât
cea pe care s-a luat amprenta — o parte din amprentă e text pe care Postgres îl
recompune singur și îl poate scrie altfel, iar un CI care dă roșu pe cod bun se
ignoră în două săptămâni.

**Ce NU acoperă:** datele. Se uită la formă — tabele, drepturi, politici — nu la
ce e în ele. Câte rânduri are fiecare client, dacă un site are secțiunile care
trebuie, rămâne treaba verificării de izolare și a ochilor.

### Ce a găsit prima rulare pe baza reală (9 sept. 2026)

Douăzeci de rânduri, în două grupe. Una era zgomot, cealaltă nu.

**Zgomotul, paisprezece rânduri:** toate drepturile pe tabel aveau un `m` în plus
în baza reală. E MAINTAIN, privilegiu apărut în PostgreSQL 17 și cuprins în
`grant all`; bancul e pe 16, unde nu există. Nu spune nimic despre schema
noastră, deci se scoate acum din amprentă — altfel verificarea s-ar fi plâns la
fiecare rulare de ceva nestricat, iar în două săptămâni n-ar mai fi citit-o
nimeni. De aici știm și că baza reală e pe Postgres 17. Restul amprentei a trecut
fără nicio diferență — zero la constrângeri, indecși, politici, coloane și
declanșatori — deci textul pe care Postgres îl recompune singur iese la fel pe 16
și pe 17 pentru tot ce folosim noi.

**Cealaltă grupă nu era zgomot.** Șase funcții cu alte drepturi de execuție decât
cele așteptate, și două dintre ele contau:

| Funcția | Pe banc | În producție |
|---|---|---|
| `creeaza_client` | niciunul din cele trei roluri | `anon`, `authenticated`, `service_role` |
| `inregistreaza_afisarea` | doar `service_role` | `anon`, `authenticated`, `service_role` |

Cheia `anon` e publică prin construcție — stă în pachetul trimis browserului —
iar funcțiile din schema `public` sunt expuse ca RPC. Deci oricine putea chema
`inregistreaza_afisarea` cu orice `site_id` și umfla cifrele din panoul oricărui
cabinet. Iar `creeaza_client`, care e `security definer` și rulează cu drepturile
proprietarului bazei, era chemabilă de orice client conectat.

**De ce n-a văzut-o nimeni.** În Postgres simplu, o funcție nouă poate fi
executată de PUBLIC, iar `anon` și `authenticated` moștenesc de acolo — deci
`revoke ... from public` chiar e de ajuns. Pe Supabase nu: proiectul are `alter
default privileges ... grant all on functions` către cele trei roluri, așa că
fiecare funcție nouă primește granturi EXPLICITE, pe rol, la creare. Revocarea de
la PUBLIC nu le atinge. Bancul nu reproducea granturile alea, deci acolo apărarea
ținea. Verificarea de izolare avea chiar verificările potrivite — 6 („un vizitator
anonim nu poate umfla cifrele de trafic") și 11 („un client nu poate provizona
site-uri") — și treceau amândouă, din motivul greșit.

**Reparat în trei locuri, în același commit.** Bancul reproduce acum și
granturile implicite pe funcții și pe secvențe; migrarea
`20260909100000_drepturi_de_executie.sql` revocă execuția de la `anon` și
`authenticated` pe cele două funcții; iar cu bancul fidel, verificările 6 și 11
pică fără migrare și trec cu ea — probat în ambele feluri, nu presupus.

**Rămâne de văzut la a doua rulare** dacă cele șase cuprinsuri de funcții mai
diferă după normalizarea spațiilor. Dacă da, în producție stau versiuni mai vechi
ale funcțiilor, și se rulează migrările care le definesc.

### Revocarea a rulat și n-a schimbat nimic (9 sept. 2026)

A doua rulare pe baza reală, după migrarea de revocare. Două lucruri:

**Normalizarea spațiilor a fost bună.** Cinci din cele șase cuprinsuri de funcții
se potrivesc acum la virgulă, inclusiv ale celor două funcții cu pricina. Deci
textul lor din producție E cel din migrări; diferența de dinainte venea din
sfârșituri de rând, cum bănuiam. Rămâne unul singur —
`adauga_sectiunea_programare` — al cărui cuprins chiar diferă, deși migrarea care
îl scrie n-a fost atinsă din 27 aug. Se lămurește citind textul din bază.

**Drepturile n-au mișcat.** Amândouă funcțiile arată tot
`anon=X authenticated=X service_role=X`, deși migrarea a rulat.

Cauza, reprodusă pe banc, nu presupusă: **`REVOKE` scoate doar granturile date de
rolul care revocă.** Un grant dat de altcineva rămâne pe loc, iar comanda nu dă
eroare — pe bancul nostru n-a dat nici măcar avertizare, a răspuns „REVOKE" și a
schimbat nimic. Am făcut un rol străin să acorde `execute` lui `anon`, apoi am
revocat ca proprietar: dreptul a rămas.

**Amprenta n-a putut arăta de ce**, fiindcă tăia partea de după `/` din fiecare
drept — adică exact cine l-a dat. Acum o scrie, dar numai când acordantul NU e
proprietarul obiectului: în cazul obișnuit nu se vede nimic, deci nu face zgomot,
iar în cazul care contează sare în ochi (`anon=X/DAT DE altcineva`).

`supabase/diagnostic-drepturi.sql` întreabă baza reală cine rulează, cine a dat
fiecare drept, ce spune declarația de drepturi implicite a proiectului, și care e
cuprinsul funcției care diferă. Patru răspunsuri, o singură lipire.

### Ce a spus diagnosticul (9 sept. 2026)

**Ipoteza mea era greșită.** Acordantul drepturilor e chiar `postgres`, și tot
`postgres` rulează SQL Editor-ul — deci revocarea avea toate condițiile să
prindă. Nu e o poveste cu roluri străine; rămâne întrebarea dacă a rulat sau a
fost desfăcută, la care răspunde `supabase/repara-drepturi.sql`: revocă și se
uită imediat, în aceeași rulare, cu verdict scris.

**Un lucru s-a lămurit însă de tot:** drepturile implicite pentru schema `public`
sunt declarate de DOUĂ ori — o dată de `postgres`, o dată de `supabase_admin` —
și amândouă dau `execute` lui `anon` și `authenticated`. Deci **fiecare funcție
viitoare chiar se naște deschisă**, nu a fost ceva de o singură dată. Presupunerea
pe care stă `e2e/drepturi-functii.proba.mjs` e confirmată.

**Iar funcția cu cuprins diferit nu era o versiune veche.** Textul din producție
e identic cu migrarea, mai puțin COMENTARIILE. Adică ce s-a rulat pe 27 aug. a
fost o copie din discuție, nu fișierul. Comportamentul e același; se aliniază
rulând din nou blocul, care e idempotent.

### Ce a mai scos un audit pe unghiuri independente (9 sept. 2026)

Concluzia de mai sus a fost pusă la îndoială de trei verificări adversariale, ca
să nu plece o afirmație despre o gaură de securitate pe jumătate dovedită.
Niciuna n-a putut-o dărâma, iar una a adus dovada care lipsea: **`oricine` (adică
PUBLIC) lipsește exact și numai la cele două funcții care au `revoke ... from
public` în migrare.** Deci revocarea chiar a rulat — n-a fost o migrare intrată pe
jumătate — și pur și simplu n-a fost de ajuns. Restul de patru funcții au
`oricine=X`, cum se cuvine unora care n-au avut niciun revoke.

Ce a adus în plus, și e reparat:

- **Fiecare funcție VIITOARE se naște la fel de deschisă.** Reparația pe două
  funcții nu e o reparație pe clasă. De aceea există acum
  `e2e/drepturi-functii.proba.mjs`: cade dacă o migrare adaugă o funcție în
  `public` fără să-i ia execuția de la `anon` și `authenticated` — sau fără să o
  treacă, cu motivul scris, în lista celor deschise dinadins. Cele patru de acolo
  (`current_site_id`, `set_updated_at`, `adauga_sectiunea_programare`,
  `textul_de_pornire`) sunt acum o hotărâre scrisă, nu o scăpare.
- **Mesajele de eroare ale lui `creeaza_client` erau un oracol peste conturi.**
  „Nu există niciun cont cu emailul X" / „Contul X e deja legat de un site" /
  „Domeniul X are deja un site" spuneau, fără nicio autentificare, dacă o adresă
  are cont la noi. Se închide odată cu dreptul de execuție.
- **`page_views_daily` n-are dinadins nicio politică de scriere**, deci funcția
  `security definer` era SINGURA cale de scris în ea — și era deschisă. Cifrele
  puteau fi scrise cu orice `day`, inclusiv în afara ferestrei de 30 de zile pe
  care o citește panoul, deci fără să se vadă.
- **Trei capcane viitoare în amprentă**, astupate: `m` nu poate apărea niciodată
  la drepturile pe coloană (MAINTAIN e privilegiu de tabel), deci normalizarea de
  acolo era cod mort care promitea o apărare inexistentă; `contype = 'n'` face ca
  în PostgreSQL 18 fiecare `not null` să devină rând de catalog, adică un potop
  de „ÎN PLUS ÎN BAZĂ" în ziua în care Supabase trece pe 18; iar `search_path`
  hotărăște dacă textele recompuse de Postgres se scriu calificat sau nu — la
  prima rulare s-a potrivit din noroc, acum e pus pe față în fișierul generat.
- **Bancul își verifică singur fidelitatea.** `alter default privileges` se leagă
  de rolul care o scrie; devenită tăcut inertă, bancul ar fi redevenit orb exact
  pe apărarea asta. Acum se uită la un obiect adevărat creat de migrări și se
  oprește dacă granturile implicite lipsesc.

## Politica de confidențialitate se schimbă odată cu platforma

Cerut de proprietar, 1 sept. 2026, ca să nu se piardă printre altele.

**Ce trebuie ținut minte:** șablonul din `sabloane/` descrie ce face CHIAR
platforma. De fiecare dată când se schimbă ce pleacă din browserul unui
vizitator, șablonul trebuie schimbat în același commit — altfel textul minte, iar
minciuna ajunge la clienți sub semnătura lor, nu a noastră.

**Și, mai important, partea care NU se rezolvă singură:** șablonul actualizat
nu schimbă pagina niciunui client. Textul lui stă în tabelul `pages`, scris de
el, din ziua în care și-a făcut site-ul. Un client care și-a publicat politica
înainte de o schimbare rămâne cu textul vechi până i-l corectează cineva.

### Ce s-a schimbat până acum, și trebuie dus și la clienți

| Când | Ce s-a schimbat tehnic | Ce trebuie să scrie altfel |
|---|---|---|
| 30 aug. 2026 | Formularele nu mai au căsuță de mesaj; se cer nume + telefon, emailul opțional | Paragraful despre ce se strânge prin formular. Textul vechi spunea „nume, email și mesaj” și „nu îți cerem telefonul” — pe dos față de acum |
| 31 aug. 2026 | Anti-spamul a trecut de la Cloudflare Turnstile la hCaptcha | Numele furnizorului, în paragraful despre anti-spam ȘI în lista de firme care ating datele |
| 1 sept. 2026 | Fonturile se servesc de pe domeniul clientului | Paragraful despre Google Fonts SE SCOATE de tot |

Toate trei sunt deja făcute în șablon. **Niciuna nu e făcută în paginile deja
scrise de clienți** — deocamdată nu există niciun client care să-și fi publicat
politica, deci lista e curată. Dar din prima zi în care există unul, tabelul
ăsta devine o listă de treabă de făcut, nu un istoric.

### De verificat înainte de fiecare client nou

Că șablonul din `sabloane/politica-de-confidentialitate.md` descrie platforma
așa cum e ÎN ZIUA ACEEA. Lista scurtă: ce câmpuri au formularele, ce furnizor de
anti-spam e configurat, de unde se încarcă fonturile, unde e găzduită baza de
date, dacă se trimit emailuri. Cinci întrebări, două minute.

## Ștergerea și exportul datelor

1 sept. 2026. Două butoane pentru două nevoi care se confundă des, dar n-au
nimic în comun.

**Ștergerea** e pentru datele ALTOR oameni. Prin GDPR, cine a lăsat un număr pe
site poate cere oricând să nu mai fie păstrat. Până acum se făcea de mână, în
baza de date, de proprietarul platformei — adică psihologul nu putea răspunde
singur, iar nicăieri nu rămânea urma că a răspuns.

Partea grea nu e ștergerea, e POTRIVIREA. Același om își scrie numărul altfel de
fiecare dată: „0721 123 456”, „+40721123456”, „0040-721-123-456”. O căutare pe
text ar găsi o parte din cereri și le-ar lăsa pe celelalte, iar psihologul ar
rămâne convins că a șters tot. Se compară pe ultimele nouă cifre — atât are un
număr românesc fără prefix — și se caută în ambele câmpuri, telefon și email,
fiindcă cine lasă telefonul la o programare și emailul la newsletter e același
om. Probele din `e2e/date-personale.proba.mjs` țin asta pe loc, inclusiv cazul
cel mai periculos: o căutare goală care s-ar potrivi cu tot și ar mătura datele
tuturor pacienților dintr-o apăsare.

Ce nu era evident: **jurnalul de activitate conține nume.** Scrie propoziții ca
„Programarea lui Ion Popescu a fost confirmată”. O ștergere care lasă numele
acolo nu e o ștergere. Dar rândurile NU se șterg, se albesc: jurnalul e dovada
că nimeni n-a umblat pe ascuns în datele cabinetului, iar unul din care se pot
scoate rânduri nu mai dovedește nimic. Rămâne că s-a întâmplat ceva, dispare
cine. Albirea se face cu cheia de serviciu, fiindcă jurnalul e pentru client
doar de citit și de adăugat — și așa trebuie să rămână; excepția e o operație a
platformei, cerută de lege, și ea însăși lasă o intrare în jurnal.

Ștergerea e ADEVĂRATĂ, nu `deleted_at`. Mesajele au și un coș, de unde se pot
recupera — dar o cerere GDPR nu înseamnă „mută la coș”.

Ecranul nu caută după NUME, dinadins: doi oameni pot fi „Ion Popescu”, iar o
ștergere greșită nu se mai poate da înapoi. Numai că asta lăsa o gaură — cererea
vine la telefon, iar psihologul avea de umblat prin trei ecrane și un copy-paste
tocmai când are omul pe fir. De asta fiecare mesaj și fiecare cerere de
programare are un link „Șterge datele acestei persoane”, care duce la ecran cu
căutarea deja făcută. Link, nu buton cu ștergere pe loc: aceeași persoană poate
avea și mesaje, și programări, și o abonare, iar un buton pe un rând ar fi lăsat
impresia că s-a șters doar rândul acela. La programări linkul stă în afara
blocului cu „Confirmă/Refuză”, care se arată doar la cererile neapucate — o
cerere de ștergere vine de obicei pentru una veche.

**Exportul** e pentru datele CLIENTULUI: tot ce a scris el. Un JSON descărcat
dintr-o rută sub `/dashboard`, fiindcă un Server Action întoarce date către
pagină, nu un fișier către browser. Imaginile nu sunt în fișier — ar fi cerut un
arhivator și zeci de megaocteți — ci lista lor cu adresa fiecăreia.

De ce contează dincolo de lege: fără export, ce ține un client la noi nu e
calitatea produsului, ci faptul că n-are cum să-și scoată munca. Aia e o
legătură pe care n-o vrem.

Fișierul conține și datele primite de la oameni, într-o secțiune separată și cu
un avertisment scris în el: pe un laptop pierdut, e o scurgere de date pe care
legea o pune în seama cabinetului. Un export care le-ar fi omis în tăcere ar fi
fost însă mai rău — psihologul E operatorul lor și i se cuvin.

## Comutatorul de lansare, și de ce vine la pachet cu secțiunile aprinse

1 sept. 2026. Cele două nu se pot despărți, iar motivul e o consecință a
modelului de predare, nu o preferință.

Predarea e „site gol, clientul scrie tot, instructajul e un video”. Ca omul să
afle ce POATE avea pe site, toate secțiunile trebuie să pornească aprinse: ce nu
vede, nu știe că există, iar cineva care n-a mai lucrat cu un panou nu se duce
să caute secțiuni ascunse. E mai ușor să ștergi ce nu-ți trebuie decât să
ghicești ce ți-ar fi trebuit. Numai că un cabinet cu paisprezece secțiuni goale,
vizibil pe internet din clipa în care domeniul rezolvă, arată a site stricat —
și e primul lucru pe care l-ar vedea un pacient. Deci: comutator.

`sites.published_at` null = încă nu e lansat. Proxy-ul trimite vizitatorii la
`/nepublicat` — o pagină scurtă, cu numele cabinetului, fără glume cu șantiere;
poate fi primul lucru pe care îl vede un om care caută ajutor. Clientul logat
vede site-ul adevărat, cu o bandă deasupra care-i spune că doar el îl vede și pe
unde se publică. Publică singur, din Setări.

Ce trebuia gândit, nu doar scris:

- **Ce rămâne deschis pe un site nepublicat** stă în `src/lib/lansare.ts`, rupt
  de proxy ca să poată fi probat. Greșit într-o parte, clientul rămâne închis
  afară din propriul panou și nu-și mai poate publica site-ul fără să sune;
  greșit în cealaltă, un site nescris ajunge public. Amândouă tăcute.
  `/login`, `/dashboard`, `robots.txt` și `sitemap.xml` rămân; restul se ascunde.
- **`robots.txt` gol, `sitemap.xml` gol, `noindex` în layout** — toate trei, nu
  una. Un cabinet care intră prima dată în Google cu „pagina se pregătește”
  rămâne așa săptămâni: reindexarea nu se cere, se așteaptă.
- **Comutatorul e al clientului**, nu al nostru: `grant update (published_at)`
  lângă `name`, singurele două coloane pe care le poate scrie din panou.
  Verificarea 13 din `verificare-izolare.sql` ține dreptul ăsta viu — pierdut,
  butonul ar eșua tăcut.
- **Costul pe cerere e zero pe un site publicat.** `published_at` vine în
  aceeași interogare cu rezolvarea tenantului, iar verificarea „e proprietarul?”
  se face leneș, doar când site-ul chiar e nepublicat.
- **Politica de confidențialitate ciornă** dă un avertisment pe cardul de
  publicare, nu o piedică. Legea îi cere CLIENTULUI politica înainte să strângă
  date prin formulare, dar hotărârea când publică rămâne a lui.

Site-urile care existau la migrare rămân publicate: o migrare n-are voie să
stingă un site pe care îl vede lumea.

## Depozitul de fișiere e privat

1 sept. 2026. Bucket-ul `media` era public, iar politica de citire spunea
„oricine poate citi orice din el”, fără nicio despărțire pe cabinete. Nu doar că
un străin putea deschide o poză știindu-i adresa — putea cere **lista tuturor
fișierelor tuturor clienților**. Cerința proprietarului, fără nuanțe: un client
nu atinge niciodată fișierele altui client.

**Prima descoperire, din sursa serviciului de Storage** (supabase/storage,
`src/http/routes/object/`): `/object/public/…` rulează prin `asSuperUser()` și se
uită DOAR la steagul `public` al bucket-ului — nicio politică nu-l poate opri;
`/object/list/…` rulează sub rolul celui care cere, deci trece prin politici. Cu
alte cuvinte, cât timp steagul e aprins, strânsul politicilor nu apără citirea.
Trebuie stins steagul.

**A doua descoperire, care a hotărât forma soluției.** Prima idee a fost ca ruta
care servește pozele să citească tenantul din antetul pus de proxy și să verifice
acolo apartenența. Nu merge: optimizatorul de imagini din Next își cere singur
fișierul printr-o cerere construită în memorie, iar `fetchInternalImage` cheamă
`createRequestResponseMocks({ url, method, socket })` — **fără niciun antet**
(verificat în `node_modules/next/dist/server/image-optimizer.js` și
`lib/mock-request.js`). O rută care depinde de antetul de tenant s-ar fi rupt în
spatele optimizatorului — sau, mai rău, ar fi mers pe Vercel și ar fi căzut în
dezvoltare, adică exact felul de diferență care se descoperă în ziua lansării.

**Soluția: adresa se apără singură.** Bucket privat; pozele se servesc din
`/imagini/<uploadId>/<semnătură>`, o rută de-a noastră care descarcă fișierul cu
cheia de serviciu. Semnătura e un HMAC-SHA256 trunchiat la 16 octeți, cu cheia de
serviciu drept cheie — deci **nicio variabilă de mediu nouă**, adică nimic care
poate lipsi și nicio ispită de portiță „mergi și fără semnătură”. Nimeni din
afară nu poate fabrica adresa unei poze a altui cabinet.

Detaliile care nu se văd, dar contează:

- **SVG-ul.** Panoul acceptă SVG, iar un SVG poate conține `<script>`. Cât timp
  pozele veneau de pe supabase.co, un SVG rău intenționat rula pe domeniul LOR.
  Servite de noi, ar rula pe `cabinet.ro` — adică am fi mutat singuri o gaură de
  XSS pe domeniul clientului, tocmai prin schimbarea care trebuia să-l apere.
  Ruta trimite `Content-Security-Policy: default-src 'none'; sandbox` și
  `X-Content-Type-Options: nosniff`.
- **Adresele vechi** rămase în JSON-ul secțiunilor se rescriu la CITIRE, nu
  printr-o migrare de date: nu atingem conținutul oamenilor, merge deopotrivă pe
  rândurile vechi și noi, iar o adresă absolută rămasă acolo nu mai poate fi
  randată niciodată — se pierde, înlocuită cu cea derivată din `uploadId`.
- **`remotePatterns` e gol** în `next.config.ts`. Nu e curățenie, e încuietoare:
  cât timp gazda Supabase stătea acolo, o regresie care ar fi reintrodus adrese
  publice ar fi mers în tăcere.
- **Comparația semnăturii se face pe octeți**, nu pe caractere: `timingSafeEqual`
  aruncă pe lungimi diferite, iar un „ă” ocupă doi octeți — 22 de caractere pot
  însemna 23 de octeți. Fără paza asta, oricine putea face ruta să arunce.

**Ordinea la punere în producție:** întâi codul, abia apoi migrarea. Ruta nouă
merge și cu bucket public (descarcă tot cu cheia de serviciu), deci codul poate
sta liniștit înainte. Invers, migrarea ar stinge toate pozele de pe toate
site-urile până la deploy.

Verificările 11 și 12 din `supabase/verificare-izolare.sql` țin steagul stins și
politicile închise; probate că dau PICAT fără migrare.

## Anti-spam: de ce am plecat de la Turnstile la hCaptcha

Găsit pe 28 aug. 2026, verificând de ce nu apare caseta anti-spam pe site.
Cloudflare leagă o pereche de chei Turnstile de o listă de domenii, iar lista are
**maximum 10 intrări**. Metacaracterele NU sunt acceptate, deci
`*.platformata.ro` nu ține loc de nimic. Planul gratuit dă 20 de chei, adică
**200 de domenii cu totul**. Peste ele urmează Enterprise Bot Management, de la
**2.000 $/lună** — peste 108.000 lei pe an, adică mai mult decât tot venitul
recurent al unui produs cu 200 de clienți la 60 €/an (circa 60.000 lei). Nu e un
plan mai scump, e un capăt de drum.

(Cifra a fost recalculată pe 8 sept. 2026, odată cu prețul. Concluzia nu se
schimbă — se întărește.)

Am cântărit întâi un plan de ocolire: o pereche de chei la fiecare zece domenii,
douăzeci de variabile de mediu pentru două sute de clienți. **L-am aruncat pe
31 aug. 2026**, când s-a limpezit orizontul real — 200 de clienți în cel mult un
an, nu „peste ani”. Un ocol care se termină exact acolo unde ajungem oricum nu e
o soluție, e muncă făcută de două ori.

**Decizia: furnizorul implicit e hCaptcha.** La hCaptcha o cheie merge implicit
pe ORICE domeniu; lista de domenii e opțională și, când o pui, e nelimitată
(„some customers need to use many domains per sitekey”,
docs.hcaptcha.com/configuration). O singură pereche de chei ține toată platforma,
la 20 de cabinete ca și la 2.000, iar **un client nou nu se mai înregistrează
nicăieri** — ceea ce contează mai mult decât pare, fiindcă provizionarea unui
cabinet e o linie de SQL și trebuie să rămână așa. Gratis, cu aceeași poveste
GDPR pentru care alesesem Turnstile în locul reCAPTCHA (hCaptcha e al Intuition
Machines, nu al Google, și nu profilează pentru reclame).

**Lecția, care contează mai mult decât furnizorul:** anti-spamul e acum o
variabilă de mediu, nu cod. `src/lib/captcha.ts` ține tabelul celor doi
furnizori — adresa scriptului, obiectul global, numele câmpului ascuns, numele
opțiunii de limbă, endpointul de verificare — și e singurul fișier care se
atinge dacă vreunul schimbă regulile. `NEXT_PUBLIC_CAPTCHA_FURNIZOR` alege
(gol = hCaptcha); o valoare scrisă greșit cade pe implicit și lasă un avertisment
în jurnal, fiindcă un typo într-o variabilă de mediu n-are voie să închidă
formularele de pe toate site-urile. Probele din `e2e/captcha.proba.mjs` țin
implicitul și separarea câmpurilor pe loc.

Cheia publică ajunge oricum în pagină, deci n-are ce căuta ascunsă; secretul stă
într-o singură variabilă de mediu, `CAPTCHA_SECRET_KEY`. **Zero secrete per
client în bază** — n-are nicio legătură cu riscul discutat la plăți.

Ce NU verificăm: gazda din răspunsul furnizorului. Cheia publică fiind aceeași
pentru toate cabinetele, cineva ar putea teoretic s-o folosească de pe pagina
lui — dar tot ar trebui să rezolve o casetă la fiecare cerere, adică exact costul
pe care caseta îl impune oricum, iar plafoanele din bază mărginesc restul. O
comparație de gazde, în schimb, ar pica pe www vs. fără www, pe domenii cu
diacritice și în spatele proxy-urilor, blocând oameni adevărați. Câmpul
`hostname` există în răspuns dacă vreodată se schimbă socoteala.

De reținut și partea bună: de când formularele nu mai adună text liber și au
plafoane, spamul costă mai puțin decât înainte. Caseta e prima linie, dar nu mai
e singura.

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
