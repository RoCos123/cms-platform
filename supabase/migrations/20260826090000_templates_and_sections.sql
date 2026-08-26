-- ============================================================================
-- Faza 3 — stratul de șablon + secțiunile lipsă găsite în cele patru șabloane
-- furnizate de client. Vezi design/sabloane/README.md pentru analiză.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Șablonul ales de fiecare site.
--
-- Cele patru șabloane nu sunt variante ale aceluiași layout — sunt sisteme de
-- design diferite (fonturi, paletă, rotunjimi, ritm de fundal). Alegerea se face
-- o dată per site și îmbracă toate secțiunile.
--
-- Stă în `sites`, nu în `site_settings`: e nevoie de el la randarea oricărei
-- pagini publice, imediat după rezolvarea tenantului, iar `sites` e oricum
-- rândul deja citit în acel moment.
-- ----------------------------------------------------------------------------
alter table public.sites
  add column template text not null default 'caldura'
  check (template in ('caldura', 'liniste', 'lumina', 'apropiere'));

comment on column public.sites.template is
  'Șablonul vizual al site-ului public. Valorile corespund fișierelor din src/lib/templates/.';

-- ----------------------------------------------------------------------------
-- 2. Tonul de fundal al fiecărei secțiuni.
--
-- În șablonul-sursă alternanța fundalurilor e deliberată: deschis → nuanțat →
-- închis → nuanțat. Dacă fiecare secțiune și-ar hardcoda culoarea, un șablon nou
-- ar însemna rescrierea tuturor secțiunilor. Așa, secțiunea declară doar un TON,
-- iar șablonul decide ce culoare înseamnă tonul acela.
-- ----------------------------------------------------------------------------
alter table public.site_content
  add column tone text not null default 'deschis'
  check (tone in ('deschis', 'nuantat', 'inchis'));

comment on column public.site_content.tone is
  'Rolul de fundal al secțiunii în ritmul paginii. Culoarea concretă vine din șablon.';

-- ----------------------------------------------------------------------------
-- 3. Marcajul de conținut demonstrativ.
--
-- Guardrail prevăzut în plan (Faza 3 → blochează publicarea în Faza 6): orice
-- rând semănat automat rămâne marcat până când clientul îl înlocuiește cu
-- conținut real. Ecranul „Pregătit de lansare" refuză verdele cât timp mai
-- există `is_demo = true`. Auditul semnalează exact problema pe care o previne:
-- site-uri lansate cu texte și numere de telefon de exemplu.
-- ----------------------------------------------------------------------------
alter table public.site_content
  add column is_demo boolean not null default false;

comment on column public.site_content.is_demo is
  'Conținut semănat automat, neînlocuit încă de client. Blochează publicarea.';

-- ----------------------------------------------------------------------------
-- 4. Abonații la newsletter.
--
-- Secțiunea de newsletter din șabloane colectează adrese. Tabel separat,
-- nu o coloană în `contact_messages`: sunt lucruri diferite (un abonat nu e un
-- mesaj) și au cicluri de viață diferite — dezabonarea trebuie să lase urmă.
-- ----------------------------------------------------------------------------
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  email text not null,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (site_id, email)
);

create index newsletter_subscribers_site_id_idx on public.newsletter_subscribers (site_id);

alter table public.newsletter_subscribers enable row level security;

-- Consecvent cu decizia din migrarea de întărire: rolul `anon` nu are acces la
-- date. Abonarea se face prin Server Action, care setează `site_id` din tenantul
-- rezolvat, nu din input.
create policy "newsletter_subscribers: proprietarul site-ului gestionează"
  on public.newsletter_subscribers for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());
