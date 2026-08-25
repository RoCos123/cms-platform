# Plan de implementare — Platformă CMS multi-tenant (site-builder pentru nișă)

**Data:** 28 iulie 2026
**Bază:** auditul dashboard-ului + auditul site-ului public `rodi-cotenescu.vercel.app`
**Model:** multi-tenant (o bază de date, un cod, `site_id` + RLS peste tot din prima migrare). La suprafață: un dashboard + un site per client, pe domeniul lui.
**Stack:** Next.js 14 App Router (RSC + Server Actions), Supabase (Postgres + Auth + Storage), Tailwind 4, TypeScript, Playwright, Vercel.

---

## Convenții ale planului

- Estimările sunt în **săptămâni de lucru concentrat, un singur dezvoltator + AI**, nu calendaristic.
- „MVP vandabil" = sfârșitul Fazei 6 (~14 săpt.): un client are dashboard + site public complet, corect SEO, cu programări, imposibil de lansat stricat. Onboarding-ul automat (Faza 7) e ce transformă produsul în SaaS self-serve.
- Fiecare fază are: livrabil verificabil, dependențe, riscuri.
- Cross-cutting pe tot parcursul: teste Playwright pe fluxurile critice, interfață în română, fiecare mutație scrie în `audit_log` și cheamă `revalidatePath`.

---

## Faza 0 — Decizii înainte de cod (0,5 săpt.)

Nu e cod, dar blochează tot ce urmează.

- [ ] **Strategie de domenii.** Cum primește fiecare tenant domeniul lui: subdomeniu platformă (`client.platforma.ro`) la început + domeniu propriu (`cabinet.ro`) mai târziu prin Vercel Domains API. Auditul arată că domeniul greșit = zero indexare Google; aici se rezolvă din arhitectură.
- [ ] **Auth:** Supabase Auth (email + magic link / parolă). Un user aparține unui `site_id`.
- [ ] **Storage:** Supabase Storage pentru imagini, bucket per tenant sau prefix `site_id/`.
- [ ] **Confirmă lista de secțiuni și denumirile în limba clientului** (Hero → „Prima secțiune" etc.).

**Risc:** dacă strategia de domenii nu e clară acum, guardrail-urile SEO din Faza 4 trebuie refăcute.

---

## Faza 1 — Fundația multi-tenant (Săpt. 1–2)

Partea fără surprize, dar cea pe care se sprijină totul.

- Proiect Supabase; schema completă cu `site_id` pe **fiecare** tabel; **RLS din prima migrare** (nu retrofit).
- Tabelele: `sites`, `users`, `site_content`, `site_settings`, `pages`, `services`, `blog_categories`, `blog_articles`, `uploads`, `contact_messages`, `appointments`, `audit_log`.
- Auth + mapare user → `site_id`.
- **Rezolvarea tenantului**: middleware care mapează domeniul cererii → `site_id` (tabelul `sites`).
- App shell: sidebar cu grupuri pliabile, topbar, layout, temă light/dark.
- Infrastructura de audit: un helper prin care trec toate mutațiile și scriu automat în `audit_log`.

**Livrabil:** te loghezi, vezi dashboard-ul gol al unui tenant; un al doilea tenant de test **nu** poate vedea datele primului (RLS verificat cu test automat).
**Dependențe:** Faza 0.
**Risc:** RLS greșit = scurgere de date între clienți. Se testează cu Playwright de la început, nu la final.

---

## Faza 2 — Design system / componente reutilizabile (Săpt. 3–4)

Componentele care se folosesc în tot restul. Construite o dată, corect.

- **ImageField** (gol/plin, drop, alt text obligatoriu, Replace/Library/Remove) + upload în Supabase Storage + optimizare.
- **MediaLibrary** (grilă, detalii, „folosită în N locuri" — referințe inverse).
- **RepeaterList** (drag-to-reorder, add, remove, cu ConfirmDialog la ștergere).
- **VariantPicker** cu **miniaturi vizuale** (nu descrieri text).
- RichTextEditor, SlugField (cu regenerare + validare unicitate), FormSection cu Save, **SaveBar cu gardă de modificări nesalvate**, ConfirmDialog, Toast, StatusBadge, EmptyState, **DataTable** (sortare + filtrare + paginare + căutare), DiffViewer.

**Livrabil:** o pagină-galerie cu toate componentele funcționale.
**Dependențe:** Faza 1 (storage, shell).
**Risc:** e cea mai subestimată fază. ImageField + MediaLibrary + RepeaterList consumă timpul real (documentul original le semnalează ca „cel mai mare raport valoare/efort").

---

## Faza 3 — Editor de conținut cu previzualizare live (Săpt. 5–7)

Diferențiatorul central: editezi cu site-ul vizibil lângă tine.

- Schema JSON per secțiune (arhetipurile A simplu-cu-variante / B listă / C tabelar).
- **Split-screen:** formular stânga, preview real dreapta, actualizat pe măsură ce scrii.
- Ecran **„Pagina principală"**: reordonezi secțiunile prin drag, le ascunzi/afișezi vizual.
- Server Actions: `saveSection`, `toggleSectionVisibility`, `reorderSections`.
- **Guardrail:** conținut seed marcat `is_demo`; blochează publicarea (vezi Faza 6).

**Livrabil:** editezi Hero-ul cu preview live, alegi varianta din miniaturi, salvezi.
**Dependențe:** Faza 2.
**Risc:** preview-ul live cere ca site-ul public (Faza 4) să existe măcar parțial ca set de componente. În practică, Faza 3 și Faza 4 se întrepătrund — componentele de secțiune sunt aceleași. **Variantele vizuale se extrag de pe site-ul live** `rodi-cotenescu.vercel.app`.

---

## Faza 4 — Site public + guardrail-uri SEO (Săpt. 8–10)

Jumătatea care aduce valoare. Aici auditul devine specificație.

- Randare RSC a tuturor secțiunilor + variante.
- Rute: `/`, `/servicii`, `/servicii/[slug]`, `/blog`, `/blog/[slug]`, `/despre-mine`, pagini legale, `/og`.
- **Guardrail-uri care fac imposibile bug-urile din audit:**
  - `metadataBase` / canonical / OG **derivă din domeniul tenantului** — niciun câmp de greșit (rezolvă cardurile sociale rupte + canonical greșit).
  - **Sitemap + slug-uri generate din DB**, o singură sursă (rezolvă 404-urile interne + slug-urile desincronizate).
  - `robots.txt` generat per tenant.
  - **Date structurate** `LocalBusiness` + `Person` + `FAQPage` auto-generate din datele deja introduse.
  - Toate imaginile prin **`next/image`** (rezolvă Unsplash 1600px pe mobil).
  - Titluri fără brand dublat.

**Livrabil:** site public live pentru un tenant, cu SEO corect prin construcție — validat cu un validator de carduri sociale.
**Dependențe:** Faza 3.
**Risc:** fidelitatea vizuală a variantelor față de original. Se decide: replicăm exact site-ul Rodi, sau redesenăm mai curat.

---

## Faza 5 — Blog, Pagini, Media, Mesaje, Setări (Săpt. 11–12)

Muncă directă, fără surprize (documentul o confirmă).

- Blog: articole (editor + 3 stări explicate: Draft/Publicat/Retras) + categorii.
- Pagini libere.
- Media library (UI complet).
- Mesaje: inbox, citite/necitite, soft delete + coș.
- Setări: 4 formulare independente (Brand, SEO, Social, Analytics), fiecare cu Save propriu.
- Fix inconsistențele din audit: cod mort scos, model de publicare unificat (inclusiv About), autor ca entitate nu text liber.

**Livrabil:** CMS complet funcțional per tenant.
**Dependențe:** Faza 2 (DataTable, editor).

---

## Faza 6 — Launch Readiness + Programări (Săpt. 13–14) → **MVP vandabil**

Cele două lucruri care transformă produsul din „încă un CMS" în ceva de vândut.

- **Ecran „Pregătit de lansare"**: semafor per site. Verde doar când: domeniu real conectat, zero conținut `is_demo`, date de contact reale (detectează `+40 700 000 000`), poze proprii încărcate, OG validat, zero 404-uri interne. **Butonul „Publică site-ul" e blocat până e verde.**
- Guardrail deontologic: testimonialele cer bifă „acord scris obținut" înainte să fie vizibile.
- **Programări**: calendar în dashboard + formular public de programare + notificare pe email. (Numit în ambele audituri „singurul lucru care schimbă produsul, nu doar îl repară".)

**Livrabil:** un client nu poate lansa un site stricat și poate primi programări online.
**Dependențe:** Fazele 3–5.

---

## Faza 7 — Onboarding self-serve + template-uri de nișă (Săpt. 15–16)

Ce face saltul de la „un client" la „mii de clienți".

- Signup self-serve.
- **Wizard de onboarding**: client nou alege o temă pentru profesia lui (psiholog / avocat / stomatolog) → primește conținut pre-completat → personalizează.
- **Branding ca date**: culori, fonturi, logo per client, din panou — fără fork de cod.
- Flux de conectare domeniu propriu.

**Livrabil:** un client nou se onboardează singur, fără intervenția ta.
**Dependențe:** Fazele 1–6.

---

## Faza 8 — Scalare SaaS (viitor, proiect separat)

Nu e în MVP. De estimat separat când validezi produsul.

- Billing (Stripe), abonamente.
- Provisioning automat de domeniu (Vercel Domains API).
- Monitoring, izolare de performanță per tenant, backup-uri.
- Panou de super-admin (tu, peste toți tenanții).

---

## Rezumat efort

| Fază | Conținut | Durată |
|---|---|---|
| 0 | Decizii | 0,5 săpt. |
| 1 | Fundație multi-tenant | 2 săpt. |
| 2 | Design system | 2 săpt. |
| 3 | Editor cu preview live | 3 săpt. |
| 4 | Site public + SEO guardrails | 3 săpt. |
| 5 | Blog / Pagini / Media / Mesaje / Setări | 2 săpt. |
| 6 | Launch Readiness + Programări | 2 săpt. |
| **MVP vandabil** | **până aici** | **~14,5 săpt.** |
| 7 | Onboarding self-serve | 2 săpt. |
| 8 | Scalare SaaS | de estimat separat |

**Total până la SaaS self-serve: ~16–17 săptămâni** de lucru concentrat, un dezvoltator + AI.

## Ce rămâne pe tine (nu pot face eu)

- Decizii de produs (denumiri, cum arată variantele, ce profesii țintești).
- Crearea proiectului Supabase, secrete, cont Vercel, cumpărarea domeniilor.
- Design vizual al variantelor (dacă nu replicăm exact originalul).
- Conținut real, poze proprii, QA final în producție.
- Stripe/billing setup (cont, produse).
