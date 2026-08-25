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

## 5. Resend + Turnstile

Reconfirmate — deciziile din `CONTEXT.md` (§„Decizii confirmate") rămân valabile:
- **Resend** pentru email tranzacțional (notificări contact + confirmări programări).
- **Cloudflare Turnstile** pentru anti-spam pe formularele publice (ales explicit în locul reCAPTCHA, pentru GDPR).

Nimic de schimbat aici. Rămâne pe lista „ce rămâne pe tine" din plan: crearea conturilor + obținerea cheilor API, înainte ca Faza 1 să le poată folosi efectiv.

---

## 6. Secțiunile paginii principale — denumiri în română

**Propunere**, nu decizie confirmată explicit — de revizuit și ajustat. Pornește de la cele 4 denumiri deja stabilite în `audit-dashboard.md` (Hero, Features, Showcase, CTA) și le extinde consecvent pe restul de 13, plus semnalează 2 candidați la eliminare completă (cod mort, deja documentat în audit).

| Cheie (DB) | Etichetă originală | Propunere RO | Notă |
|---|---|---|---|
| `hero` | Hero | **Prima secțiune** | confirmat în audit |
| `logos` | Logos | **Recunoaștere** | candidat la eliminare — un cabinet solo, fără parteneri/presă, poate n-are ce pune aici; de confirmat cu conținut real |
| `stats` | Stats | **Cifre cheie** | — |
| `aboutTeaser` | About teaser | **Despre mine (rezumat)** | — |
| `problem` | Problem | **Provocarea** | — |
| `solution` | Solution | **Cum te pot ajuta** | — |
| `features` | Features | **Servicii** | confirmat în audit |
| `showcase` | Showcase | **Cabinetul** | confirmat în audit |
| `howItWorks` | How it works | **Cum decurge o programare** | — |
| `useCases` | Use cases | **Pentru cine e potrivit** | — |
| `portfolio` | „Templates" (etichetă greșită, rutează spre `portfolio`) | — | **propun eliminare** — cod mort confirmat în audit (§9), plus modulul separat `/dashboard/portfolio` „Case studies", niciunul folosit pe site-ul sursă |
| `testimonials` | Testimonials | **Testimoniale** | rămâne cu bifa „acord scris obținut" (guardrail deontologic, Faza 6) |
| `pricing` | Pricing | **Tarife** | blocul intern „Tiers (legacy)" — **propun eliminare** |
| `faq` | FAQ | **Întrebări frecvente** | — |
| `cta` | CTA | **Invitație la programare** | confirmat în audit |
| `contact` | Contact | **Contact** | deja clar, fără schimbare |
| `footer` | Footer | **Subsol** | posibil de mutat conceptual sub Setări în Faza 5, nu o decizie de Faza 0 |

**De confirmat înainte sau în timpul Fazei 2** (nu blochează Faza 1): denumirile exacte de mai sus, și dacă `logos`/`portfolio` chiar se elimină sau rămân opționale.

---

## Următorul pas

Faza 1 — Fundația multi-tenant: schema Postgres cu `site_id` + RLS din prima migrare, `sites.domain` ca rezolvare de tenant (vezi §2 mai sus pentru implicații), Auth cu parolă, App shell.
