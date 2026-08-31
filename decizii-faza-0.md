# Decizii Faza 0 — confirmate

**Data:** 25 august 2026
**Status:** Faza 0 completă. Următorul pas: Faza 1 (fundația multi-tenant).
**Referință:** [`plan-implementare-cms.md`](./plan-implementare-cms.md) §„Faza 0 — Decizii înainte de cod".

Acest document înlocuiește checklist-ul `- [ ]` din planul de implementare cu deciziile efective, plus implicațiile tehnice pentru Faza 1. Unde o decizie schimbă ceva față de varianta implicită descrisă în plan, e semnalat explicit.

---

## 1. Numele platformei

**Decizie: `sitepsihologi.ro`**

**Implicație de reținut:** numele ancorează platforma explicit pe nișa psihologilor. Planul (§„Faza 7") prevede extindere pe alte profesii (avocat, stomatolog) via wizard de onboarding cu template-uri per profesie. Cele două nu se exclud tehnic — platforma poate servi orice profesie sub acest nume — dar dacă intenția e să rămâi vertical pe psihologi ca poziționare de piață, merită o decizie conștientă la Faza 7, nu presupusă implicit. Nu blochează Faza 1: numele intră ca `NEXT_PUBLIC_PLATFORM_DOMAIN` (sau echivalent), o singură variabilă de schimbat oricând.

---

## 2. Strategie de domenii per tenant

**Decizie: domeniu propriu din prima fază** — *diferit față de varianta implicită din plan* (care propunea subdomeniu platformă întâi, domeniu propriu abia în Faza 7).

Fiecare tenant vine cu domeniul lui propriu (ex. `rodicacotenescu.ro`) încă din Faza 1. Nu există etapă intermediară de subdomeniu `client.sitepsihologi.ro`.

**Precizare importantă (clarificat 25 aug. 2026):** „domeniu propriu" descrie doar unde locuiește site-ul, nu cine face munca. Clientul nu vine cu nimic — nici site, nici conținut. Site-ul e construit 100% de operator (tu), în CMS. Domeniul e o chestiune separată de proprietate/înregistrare: clientul poate avea deja unul, sau operatorul îl cumpără/înregistrează în numele lui ca parte din serviciu — oricum ar fi, conectarea lui la platformă (Vercel + rândul din `sites`) rămâne un pas manual făcut de operator în Fazele 1–6 (vezi „SSL/DNS" mai jos), nu ceva ce clientul configurează singur.

**Implicații tehnice pentru Faza 1 (middleware + schema):**
- `sites.domain` (unique, not null) devine cheia principală de rezolvare a tenantului — `host` din request se caută direct în acest câmp, fără parsare de subdomeniu/wildcard.
- **Canonicalizare www vs. apex:** originalul avea exact acest bug (canonical pe `www.rodicacotenescu.ro`, servit de pe alt domeniu). Faza 1 trebuie să decidă per-site dacă `www` redirecționează spre apex sau invers, nu implicit.
- **Mediu de dezvoltare:** fără subdomeniu platformă, nu există un domeniu „gratuit" pe care să testezi local. Faza 1 are nevoie de un fallback explicit (ex. un rând `sites.domain = 'localhost:3000'` pentru un tenant de test, sau o variabilă `DEV_SITE_ID` care ocolește rezolvarea prin domeniu). De adăugat la task-urile Fazei 1.
- **Preview-uri Vercel (`*.vercel.app`):** nu vor rezolva niciun tenant prin lookup de domeniu. Are nevoie de un comportament explicit (pagină generică sau tenant de „demo”), altfel orice preview deployment arată o eroare 404 de tenant.
- **SSL/DNS:** pentru MVP cu puțini clienți, adăugarea domeniului se face manual din dashboard-ul Vercel (Vercel provizionează automat certificatul după ce DNS-ul e îndreptat corect) + un rând inserat manual în `sites`. Faza 7 („Flux de conectare domeniu propriu") nu mai introduce o funcționalitate nouă — **automatizează** acest pas manual prin Vercel Domains API, pentru signup self-serve.

**Risc moștenit din plan, acum mai relevant:** fără subdomeniu-fallback, un tenant nou e „offline” din prima zi până când DNS-ul lui propriu propagă. De comunicat clientului la onboarding manual (Fazele 1–6).

---

## 3. Autentificare

**Decizie: doar parolă** (email + parolă, fără magic link).

**Implicație:** deși login-ul nu depinde de email, tot e nevoie de un flux de resetare parolă prin email (Supabase Auth îl oferă din start, prin SMTP-ul configurat în proiectul Supabase — separat de Resend, care rămâne pentru notificări de contact + confirmări programări, conform deciziei deja confirmate în `CONTEXT.md`). De configurat în Faza 1: SMTP pentru Supabase Auth (reset parolă) + Resend pentru emailurile aplicației.

Un user aparține unui singur `site_id` (neschimbat față de plan).

---

## 4. Storage

**Decizie: un singur bucket, prefix `site_id/`** (varianta recomandată din plan).

Scalează fără limită de bucket-uri la mii de tenanți. Izolarea între tenanți se face prin politici Supabase Storage pe path (`site_id/...`), în oglindă cu RLS de pe Postgres — același model de izolare, doar aplicat la storage. De implementat în Faza 1 odată cu RLS-ul din schema principală, nu separat.

---

## 5. Resend + casetă anti-spam

- **Resend** pentru email tranzacțional (notificări contact + confirmări programări).
- **hCaptcha** pentru anti-spam pe formularele publice.

**Schimbat pe 31 aug. 2026.** Alesesem Cloudflare Turnstile, tot în locul
reCAPTCHA și tot pentru GDPR. Turnstile acceptă însă cel mult 10 domenii pe cheie
și 20 de chei pe cont — 200 de domenii cu totul — iar peste ele urmează un plan
de la 2.000 $/lună. Pentru o platformă cu un site per cabinet, ăla e un capăt de
drum, nu o factură mai mare. hCaptcha n-are plafonul: o cheie merge implicit pe
oricâte domenii. Motivul GDPR pentru care respinsesem reCAPTCHA rămâne satisfăcut
— hCaptcha e al Intuition Machines, nu al Google.

Alegerea e o variabilă de mediu (`NEXT_PUBLIC_CAPTCHA_FURNIZOR`), nu cod: vezi
`src/lib/captcha.ts` și §„Anti-spam” din `CONTEXT.md`.

Rămâne pe lista „ce rămâne pe tine” din plan: crearea conturilor + obținerea
cheilor API, înainte ca Faza 1 să le poată folosi efectiv.

---

## 6. Secțiunile paginii principale — denumiri în română

**Confirmat 25 aug. 2026.** Cheile din DB rămân cele originale (camelCase, ca în auditul dashboard-ului) — se schimbă doar eticheta afișată clientului. Vocabularul e al clientului, nu al developerului: „Hero" devine „Prima secțiune", „CTA" devine „Invitație la programare".

| # | Cheie (DB) | Etichetă originală | **Etichetă în panou** | Notă |
|---|---|---|---|---|
| 1 | `hero` | Hero | **Prima secțiune** | — |
| 2 | `logos` | Logos | **Bandă servicii** | ⚠️ **repurposat** — nu mai e bandă de logo-uri (parteneri/presă), ci bandă de servicii. Schimbă forma datelor, vezi §6.1 |
| 3 | `stats` | Stats | **Experiență** | — |
| 4 | `aboutTeaser` | About teaser | **Despre mine (pe prima pagină)** | denumirea spune explicit *unde* apare — evită confuzia cu pagina „Despre mine" |
| 5 | `problem` | Problem | **Situații frecvente** | — |
| 6 | `solution` | Solution | **Cum lucrez** | — |
| 7 | `features` | Features | **Serviciile mele** | — |
| 8 | `showcase` | Showcase | **Cabinetul** | — |
| 9 | `howItWorks` | How it works | **Cum decurge colaborarea** | mai larg decât „o programare" — acoperă tot parcursul, nu doar prima ședință |
| 10 | `useCases` | Use cases | **Cui mă adresez** | — |
| 11 | `portfolio` | „Templates" | **Programe și materiale (opțional)** | ⚠️ **păstrat și repurposat** — nu se elimină, cum se propusese. Vezi §6.1 |
| 12 | `testimonials` | Testimonials | **Păreri** | rămâne cu bifa „acord scris obținut" (guardrail deontologic, Faza 6) |
| 13 | `pricing` | Pricing | **Tarife** | — |
| 14 | `faq` | FAQ | **Întrebări frecvente** | — |
| 15 | `cta` | CTA | **Invitație la programare** | — |
| 16 | `contact` | Contact | **Contact** | — |
| 17 | `footer` | Footer | **Subsol** | posibil de mutat conceptual sub Setări în Faza 5 |

### 6.1 Consecințe ale repurposării — confirmate 25 aug. 2026

**`logos` → „Bandă servicii":** bandă subțire, doar numele serviciilor, pentru scanare rapidă („Terapie individuală · Terapie de cuplu · Consiliere adolescenți"). Text scurt per element, fără imagini încărcate. Delimitarea față de `features` („Serviciile mele") e clară: banda = listă rapidă de nume; „Serviciile mele" = secțiunea detaliată, cu descrieri și imagini.

*Consecință:* forma datelor se simplifică față de original (era listă de imagini + alt text) → devine listă de șiruri de text. Componenta e mult mai ieftină decât un RepeaterList cu ImageField.

**`pricing` → blocul de pachete se PĂSTREAZĂ**, contrar propunerii de eliminare. Motivul dat: pachete reale de tip „5 ședințe la preț redus".

*Observație importantă:* asta **nu** înseamnă resuscitarea codului „Tiers (legacy)" din original — acela era un bloc de abonamente SaaS (Basic/Pro/Enterprise), rămășiță de template, afișat clientului fără sens (audit-dashboard.md §9 #2). Se construiește un bloc **nou**, în limbajul clientului: „Pachete" — titlu, număr de ședințe, preț, valabilitate. Cheia veche `tiers` din JSON nu se refolosește, ca să nu moștenim forma greșită.

**`portfolio` → „Programe și materiale":** păstrat, cu **trei tipuri de element** confirmate — workshop/grup cu dată, material descărcabil, program pe termen lung.

*Consecință majoră de arhitectură:* asta depășește ce încape într-o secțiune de pagină principală (un rând JSON în `site_content`). Cele trei tipuri cer, respectiv: dată + locuri + înscriere (leagă de modulul Programări, Faza 6); fișier non-imagine în Storage (azi se încarcă doar imagini); descriere lungă + preț + pagină proprie cu SEO.

Recomandarea de structură — **modul propriu, nu secțiune**, în oglindă cu `services`:
- tabel nou `programs` (analog cu `services`: slug, titlu, descriere, preț, tip, status, seo)
- pagini publice proprii `/programe/[slug]`, ca să fie indexabile individual
- secțiunea `portfolio` de pe prima pagină rămâne, dar devine un **teaser** care afișează câteva programe din tabel — sursă unică de adevăr, exact ca la servicii

*Efort suplimentar față de plan:* nu era bugetat. Realist +3–5 zile, distribuite între Faza 2 (componente), Faza 4 (pagini publice + SEO) și Faza 6 (înscriere la workshop-uri).

**Decis (25 aug. 2026): incremental.** Se construiește întâi **doar „program pe termen lung"** — titlu, descriere, preț, pagină proprie cu SEO; zero dependențe noi, intră în tiparul deja existent al `services`. Celelalte două tipuri se adaugă când costul lor devine marginal:
- **workshop cu dată** → în Faza 6, odată cu modulul Programări (are oricum nevoie de calendar + înscriere + email)
- **material descărcabil** → când se decide politica de fișiere non-imagine în Storage (tipuri acceptate, limită de mărime, acces public vs. protejat)

Tabelul `programs` se proiectează de la început cu o coloană `type`, ca adăugarea celorlalte două tipuri să fie o migrare aditivă, nu o restructurare.

**Rămâne eliminat:** modulul separat `/dashboard/portfolio` („Case studies") din original — distinct de secțiunea de mai sus, nefolosit pe site-ul sursă (audit-dashboard.md §9, inconsistența #3).

---

## 7. Direcția vizuală a site-ului public

> **DEPĂȘIT PARȚIAL (26 aug. 2026).** Clientul a furnizat patru șabloane concrete,
> care înlocuiesc direcțiile propuse aici. Tonul confirmat mai jos („cald și
> liniștitor") se verifică în toate patru, deci rămâne valabil; ce se schimbă e că
> **nu mai proiectăm de la zero**. Specificația reală: [`design/sabloane/README.md`](./design/sabloane/README.md).
>
> Consecințe: cele 17 secțiuni din §6 devin **21** (lipsesc bandă cu citat,
> articole recente, newsletter; plus `logos` se desparte în două), iar stratul de
> „șablon" se mută din Faza 7 în Faza 3.

### Ce rămâne valabil din decizia inițială (25 aug. 2026)

Răspunde la riscul lăsat deschis în `plan-implementare-cms.md` §Faza 4 („fidelitatea vizuală a variantelor față de original — se decide: replicăm exact site-ul Rodi, sau redesenăm mai curat").

**Decizie: redesenăm curat, NU replicăm site-ul original.** Variantele A/B/C ale originalului nu mai sunt o referință de urmat pixel cu pixel; auditul rămâne specificație pentru *ce conține* fiecare secțiune, nu pentru cum arată.

**Ton: cald și liniștitor.** Publicul-țintă e cineva anxios, care ezită să sune. Designul trebuie să reducă bariera, nu să impresioneze: culori blânde, spațiu liber generos, colțuri rotunjite, contrast moderat. Nu clinic, nu corporatist.

**Fotografii: calitate mixtă — și profesionale, și slabe.** E cea mai constrângătoare decizie de aici, fiindcă exclude cele două soluții simple:
- Un layout construit în jurul unor imagini mari (tipar obișnuit la site-uri de prezentare) arată jalnic la un client cu poze făcute cu telefonul.
- Un layout care ignoră imaginile irosește pozele clientului care a plătit un fotograf.

Deci: **imaginile sunt un plus, niciodată o cerință structurală.** Fiecare secțiune trebuie să arate complet și intenționat și fără nicio imagine — ierarhia se ține pe tipografie, spațiere și culoare. Când există o imagine bună, secțiunea o folosește vizibil, dar fără ca absența ei să lase o gaură. De verificat la fiecare variantă construită în Faza 4: *arată bine cu zero poze?*

**Culori: propuse de mine**, verificate pentru contrast (WCAG) și funcționale pe ambele teme. Sunt doar punctul de plecare — „branding ca date" din Faza 7 le face schimbabile per client din panou, fără fork de cod. Tokenurile semantice din `src/app/globals.css` sunt deja construite pentru asta.

---

## Următorul pas

Faza 1 — Fundația multi-tenant: schema Postgres cu `site_id` + RLS din prima migrare, `sites.domain` ca rezolvare de tenant (vezi §2 mai sus pentru implicații), Auth cu parolă, App shell.
