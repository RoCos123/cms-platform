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
- **Emailul tranzacțional se face ULTIMUL** (confirmat 26 aug. 2026, la cererea proprietarului: „nu am ce email să fac acum"). Contul de trimitere nu există încă. Până atunci, mesajele din formular se văd doar în panou, cu numărul de necitite lângă „Mesaje" — vezi `TODO` din `src/app/actions/formulare.ts`. **Nu propune Resend ca următorul pas**; e ultimul de pe listă, indiferent cât de mult ar ajuta.
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
- **Fără buton de „înapoi" pe site.** Browserul are deja unul, iar al nostru n-ar
  ști unde duce pe cineva venit din Google direct pe o pagină interioară. Ce
  lipsea de fapt era un meniu care funcționează de pe orice pagină — reparat.
- **Limite în cuvinte, nu în caractere**, la textele lungi: 3.000 la articol, 600
  la descrierea completă a serviciului, 5.000 la o pagină. Opresc scrisul, ca
  cele în caractere. Caracterele rămân doar ca plasă, mult deasupra.
- **Categoriile de blog: amânate.** Un cabinet cu opt articole n-are ce sorta.
- **Politica de confidențialitate**: șablon în `sabloane/`, potrivit pe ce face
  chiar site-ul ăsta (formular, Turnstile, fonturi Google, zero cookie-uri la
  vizitatori, zero urmărire). Nu e text juridic verificat.

## Ce lipsește și nu era în niciun plan

Găsite căutând în cod, la întrebarea „cât mai e până terminăm":

- **Resetarea parolei nu există.** `/login` are doar email + parolă. Un client
  care își uită parola trebuie deblocat manual din Supabase.
- **Provizionarea unui client e SQL scris de mână.** `/admin` e doar o
  redirectare. Nu există script sau ecran pentru „fă-i site unui client nou".
- **Domeniul clientului se conectează manual în Vercel.**
- **Din Faza 4 lipsesc garanțiile SEO**: `sitemap.xml`, `robots.txt`, date
  structurate (`LocalBusiness`/`Person`/`FAQPage`), imaginea OG.
- **Din Faza 5, Setările au 2 grupuri din 4** — lipsesc Social și Analytics.

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

**Diferențiator central:** editare cu **previzualizare live** (split-screen: formular stânga, site real dreapta, actualizat live) — nu „completezi câmpuri → Save → View live" ca în original.

**7 fixuri de usabilitate:** limbaj de client nu jargon de dev (Hero → „Prima secțiune"); selector de variantă cu **miniaturi vizuale**, nu descrieri text; gardă de modificări nesalvate; ConfirmDialog + avertisment „imagine folosită în N locuri"; cod mort scos (Tiers legacy, Portfolio nefolosit); model de publicare unificat (inclusiv About); reordonare + vizibilitate secțiuni dintr-un ecran vizual.

**3 module noi:** Programări (calendar + booking public + email — numit în ambele audituri „singurul lucru care schimbă produsul"); wizard de onboarding cu template-uri per profesie; branding ca date (culori/fonturi/logo per client, fără fork de cod).

**Moat față de „template clonat per client":** guardrail-urile din audit devin **imposibil de greșit prin design**, nu un checklist manual:
- `metadataBase`/canonical/sitemap/robots derivă automat din domeniul tenantului (originalul avea totul pe `localhost` → carduri sociale rupte + zero indexare Google).
- Sitemap + slug-uri generate din DB, sursă unică (originalul avea 3 surse de adevăr desincronizate → 404-uri interne).
- Conținut demo (`is_demo`) **blochează publicarea**, nu doar afișează un avertisment.
- Date de contact placeholder detectate automat, blochează publicarea.
- Testimoniale cer bifă „acord scris obținut" înainte de a fi vizibile (problemă deontologică reală în original: mărturii fabricate sub numele unui psiholog acreditat).
- Toate imaginile prin `next/image` (originalul servea Unsplash la 1600px pe mobil).
- Date structurate `LocalBusiness`+`Person`+`FAQPage` auto-generate.

**Ecran nou: „Pregătit de lansare"** — semafor per site; butonul „Publică" e blocat până toate condițiile de mai sus sunt verzi. Ăsta e argumentul central de vânzare.

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

**2. Programări** — ultimul modul mare din meniu. De construit DOAR dacă se
confirmă că psihologii vor programare online; multe cabinete mici preferă
telefonul, fiindcă vor să audă omul înainte de prima ședință.

**3. Activitate** — jurnalul cine-ce-a-schimbat. Se scrie deja în `audit_log` la
fiecare modificare, deci nu se pierde nimic dacă ecranul apare mai târziu. Pe un
site cu un singur utilizator, îi arată clientului doar ce a făcut el însuși.

**4. Restanțe mici**, în ordinea valorii: fonturile mutate de la Google pe
serverul nostru (scoate Google din politica de confidențialitate și grăbește
prima afișare); imagine per serviciu; categorii de blog (de făcut abia când un
cabinet chiar are atâtea articole încât să nu le mai găsească).

**5. Emailul cu Resend** — ultimul, prin decizie explicită. Vezi „Decizii
confirmate".
