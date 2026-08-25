# sitepsihologi.ro — platformă CMS multi-tenant

Citește [`CONTEXT.md`](./CONTEXT.md) primul — e punctul de plecare pentru orice sesiune de lucru pe acest proiect (audituri, plan pe faze, decizii confirmate).

## Stack

Next.js 16 (App Router, RSC + Server Actions), Supabase (Postgres + Auth + Storage + RLS), Tailwind 4, TypeScript, pnpm.

Notă: planul original menționează "Next.js 14"; am scafoldat cu ultima versiune stabilă (16) — arhitectura App Router/RSC/Server Actions e neschimbată, dar unele convenții diferă de ce ai putea ști din versiuni mai vechi (de ex. `middleware.ts` s-a redenumit `proxy.ts` — funcționalitate identică, doar nume nou).

## Pornire locală

```bash
pnpm install
cp .env.local.example .env.local   # completează cu valorile din proiectul tău Supabase
pnpm dev
```

Ai nevoie de un proiect Supabase (vezi `.env.local.example` pentru variabilele exacte) și de schema din `supabase/migrations/` rulată pe el — cel mai simplu, prin SQL Editor din dashboard-ul Supabase (copiezi conținutul fișierului `.sql`, Run). Dacă preferi CLI-ul Supabase, fișierul e deja în formatul așteptat de `supabase db push`.

Fără un domeniu real la îndemână pentru dev local, setează `DEV_TENANT_DOMAIN` în `.env.local` cu domeniul unui site seedat manual în tabelul `sites` — vezi `decizii-faza-0.md` §2 pentru raționament.

## Deploy pe Vercel

Producția (`master`) e goală până la primul merge — tot ce există acum e pe branch-uri de feature, deployate ca Preview. Variabile de mediu necesare în Project Settings → Environment Variables (Preview, măcar):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `DEV_TENANT_DOMAIN` — obligatoriu ca să poți ajunge la `/login` pe un URL `*.vercel.app`, altfel proxy.ts nu are niciun domeniu propriu de rezolvat (vezi `src/proxy.ts`).

## Structură

- `src/proxy.ts` — rezolvarea tenantului (domeniu → `site_id`) + verificări optimistice de autentificare. Rulează pe fiecare cerere.
- `src/lib/dal.ts` — Data Access Layer: `verifySession()` (autentificare + potrivire tenant) și `getTenant()`, folosite din Server Components/Actions.
- `src/lib/supabase/` — clienți Supabase (server, browser).
- `src/lib/tenant.ts` — logica pură de rezolvare domeniu → tenant (folosită din `proxy.ts`).
- `supabase/migrations/` — schema SQL + RLS, o migrare per pas.

## Comenzi

```bash
pnpm dev      # server de dezvoltare
pnpm build    # build de producție
pnpm lint     # ESLint
```
