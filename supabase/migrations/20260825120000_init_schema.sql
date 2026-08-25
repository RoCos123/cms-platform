-- ============================================================================
-- Faza 1 — schema multi-tenant + RLS (o singură migrare, RLS din prima zi).
-- Vezi decizii-faza-0.md pentru deciziile de arhitectură din spatele acesteia.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- sites: rădăcina tenantului. domain = cheia de rezolvare (host -> site_id),
-- e chiar domeniul propriu al clientului (decizii-faza-0.md §2), nu un slug de
-- subdomeniu. Canonicalizarea www/apex se face redirectând spre valoarea
-- exactă stocată aici (vezi src/lib/tenant.ts).
-- ----------------------------------------------------------------------------
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- users: mapare auth.users -> site_id. Un user = un site. Provisionare manuală
-- (operator) în Faza 1-6, nu self-service — vezi decizii-faza-0.md §2.
-- ----------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  site_id uuid not null references public.sites (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now()
);

create index users_site_id_idx on public.users (site_id);

-- ----------------------------------------------------------------------------
-- Helper: site_id-ul userului autentificat curent, folosit în toate politicile
-- de mai jos. security definer ca să ocolească RLS-ul propriu al public.users
-- (altfel recursivitate); search_path gol + nume complet calificate ca
-- protecție împotriva search_path hijacking.
-- ----------------------------------------------------------------------------
create function public.current_site_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select site_id from public.users where id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- site_content: cele 17 secțiuni ale paginii principale (decizii-faza-0.md §6)
-- ----------------------------------------------------------------------------
create table public.site_content (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  key text not null,
  variant text,
  visible boolean not null default true,
  position integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, key)
);

-- ----------------------------------------------------------------------------
-- site_settings: un singur rând per site, 4 grupuri independente (Faza 5)
-- ----------------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  brand jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  social jsonb not null default '{}'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (site_id)
);

-- ----------------------------------------------------------------------------
-- pages: pagini libere, publicate la /<slug>. Model de publicare unificat
-- (3 stări, ca la blog) — vezi audit-dashboard.md §10 recomandarea #5.
-- ----------------------------------------------------------------------------
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  slug text not null,
  title text not null,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

-- ----------------------------------------------------------------------------
-- services: /servicii + /servicii/[slug] cu SEO propriu (Faza 4) — normalizat
-- separat de site_content pentru că fiecare serviciu are pagină proprie.
-- ----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  slug text not null,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  price_label text,
  duration_label text,
  cover_upload_id uuid,
  visible boolean not null default true,
  position integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

-- ----------------------------------------------------------------------------
-- blog_categories / blog_articles. Autorul e FK către users, nu text liber
-- (audit-dashboard.md §10 recomandarea #6).
-- ----------------------------------------------------------------------------
create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  unique (site_id, slug)
);

create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  title text not null,
  slug text not null,
  excerpt text not null default '',
  author_id uuid references public.users (id) on delete set null,
  category_id uuid references public.blog_categories (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'unpublished')),
  cover_upload_id uuid,
  cover_alt text,
  content text not null default '',
  seo jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, slug)
);

-- ----------------------------------------------------------------------------
-- uploads: catalogul/metadata fișierelor din Supabase Storage (bucket unic,
-- prefix site_id/ — decizii-faza-0.md §4). storage_path = calea completă în
-- bucket, ex. "<site_id>/2026/08/poza.webp".
-- ----------------------------------------------------------------------------
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  alt_text text,
  created_at timestamptz not null default now()
);

create index uploads_site_id_idx on public.uploads (site_id);

-- FK-uri amânate pentru cover_upload_id (uploads nu exista încă mai sus)
alter table public.services
  add constraint services_cover_upload_id_fkey
  foreign key (cover_upload_id) references public.uploads (id) on delete set null;

alter table public.blog_articles
  add constraint blog_articles_cover_upload_id_fkey
  foreign key (cover_upload_id) references public.uploads (id) on delete set null;

-- ----------------------------------------------------------------------------
-- contact_messages: formular public de contact, soft delete (read_at/deleted_at,
-- nu boolean — permite și „când", nu doar „dacă").
-- ----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  email text not null,
  message text not null,
  consent boolean not null default false,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index contact_messages_site_id_idx on public.contact_messages (site_id);

-- ----------------------------------------------------------------------------
-- appointments: modul nou (Faza 6) — programări din formularul public.
-- Stările exacte de status se rafinează în Faza 6; 'pending' e default sigur.
-- ----------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  service text,
  starts_at timestamptz not null,
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create index appointments_site_id_idx on public.appointments (site_id);

-- ----------------------------------------------------------------------------
-- audit_log: append-only, o intrare per mutație. action/entity_type = seturile
-- observate direct în audit-dashboard.md §6, extinse cu entitățile noi
-- (Page, Service, Appointment) față de original.
-- ----------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.sites (id) on delete cascade,
  actor_id uuid references public.users (id) on delete set null,
  action text not null check (action in ('create', 'update', 'delete', 'publish', 'unpublish', 'login', 'logout')),
  entity_type text not null check (entity_type in (
    'Page', 'Service', 'Appointment', 'BlogArticle', 'BlogCategory',
    'SiteContent', 'SiteSettings', 'Upload', 'ContactSubmission', 'Session'
  )),
  entity_id text,
  diff jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_site_id_created_at_idx on public.audit_log (site_id, created_at desc);

-- ============================================================================
-- Row Level Security — activat pe fiecare tabel din prima migrare, nu retrofit.
-- ============================================================================

alter table public.sites enable row level security;
alter table public.users enable row level security;
alter table public.site_content enable row level security;
alter table public.site_settings enable row level security;
alter table public.pages enable row level security;
alter table public.services enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;
alter table public.uploads enable row level security;
alter table public.contact_messages enable row level security;
alter table public.appointments enable row level security;
alter table public.audit_log enable row level security;

-- ----------------------------------------------------------------------------
-- sites: citire publică (rezolvare tenant pe domeniu, înainte de autentificare
-- — vezi src/proxy.ts). Scriere deloc prin app în Faza 1: provisionare manuală
-- (SQL editor), consecvent cu „clienții nu vin cu nimic" din decizii-faza-0.md.
-- ----------------------------------------------------------------------------
create policy "sites: oricine poate rezolva domeniul unui tenant"
  on public.sites for select
  to anon, authenticated
  using (true);

create policy "sites: userul autentificat își poate actualiza propriul site"
  on public.sites for update
  to authenticated
  using (id = public.current_site_id())
  with check (id = public.current_site_id());

-- ----------------------------------------------------------------------------
-- users: fiecare user își vede doar propriul rând (folosit pt. UI de cont).
-- Fără insert/update/delete prin RLS — mapare provisionată manual (operator).
-- ----------------------------------------------------------------------------
create policy "users: userul își vede propriul rând"
  on public.users for select
  to authenticated
  using (id = auth.uid());

-- ----------------------------------------------------------------------------
-- Tabele tenant-scoped standard: CRUD complet pentru proprietarul site-ului
-- (site_id = current_site_id() — granița reală de izolare între clienți),
-- citire publică doar a conținutului vizibil/publicat pentru vizitatori anonimi.
-- ----------------------------------------------------------------------------

create policy "site_content: CRUD propriul site"
  on public.site_content for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "site_content: public vede doar secțiunile vizibile"
  on public.site_content for select
  to anon
  using (visible = true);

create policy "site_settings: CRUD propriul site"
  on public.site_settings for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "site_settings: public poate citi (brand/SEO afișate pe site)"
  on public.site_settings for select
  to anon
  using (true);

create policy "pages: CRUD propriul site"
  on public.pages for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "pages: public vede doar paginile publicate"
  on public.pages for select
  to anon
  using (status = 'published');

create policy "services: CRUD propriul site"
  on public.services for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "services: public vede doar serviciile publicate"
  on public.services for select
  to anon
  using (status = 'published' and visible = true);

create policy "blog_categories: CRUD propriul site"
  on public.blog_categories for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "blog_categories: public poate citi"
  on public.blog_categories for select
  to anon
  using (true);

create policy "blog_articles: CRUD propriul site"
  on public.blog_articles for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "blog_articles: public vede doar articolele publicate"
  on public.blog_articles for select
  to anon
  using (status = 'published');

create policy "uploads: CRUD propriul site"
  on public.uploads for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "uploads: public poate citi metadata (imagini afișate pe site)"
  on public.uploads for select
  to anon
  using (true);

-- ----------------------------------------------------------------------------
-- contact_messages: doar proprietarul site-ului le vede/gestionează. Publicul
-- poate DOAR insera (formularul de contact), niciodată citi mesaje existente.
-- ----------------------------------------------------------------------------
create policy "contact_messages: proprietarul site-ului citește/gestionează"
  on public.contact_messages for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "contact_messages: oricine poate trimite un mesaj"
  on public.contact_messages for insert
  to anon
  with check (true);

-- ----------------------------------------------------------------------------
-- appointments: la fel ca la contact_messages — public doar inserează.
-- ----------------------------------------------------------------------------
create policy "appointments: proprietarul site-ului citește/gestionează"
  on public.appointments for all
  to authenticated
  using (site_id = public.current_site_id())
  with check (site_id = public.current_site_id());

create policy "appointments: oricine poate cere o programare"
  on public.appointments for insert
  to anon
  with check (true);

-- ----------------------------------------------------------------------------
-- audit_log: append-only. Proprietarul site-ului citește + inserează pentru
-- propriul site; niciun update/delete pentru nimeni (nici pentru authenticated).
-- ----------------------------------------------------------------------------
create policy "audit_log: proprietarul site-ului citește propriul jurnal"
  on public.audit_log for select
  to authenticated
  using (site_id = public.current_site_id());

create policy "audit_log: proprietarul site-ului scrie în propriul jurnal"
  on public.audit_log for insert
  to authenticated
  with check (site_id = public.current_site_id());

-- ============================================================================
-- Supabase Storage — bucket unic, prefix site_id/ (decizii-faza-0.md §4).
-- Politicile citesc primul segment al path-ului ca site_id.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "media: citire publică"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media');

create policy "media: proprietarul site-ului încarcă în propriul folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = public.current_site_id()::text
  );

create policy "media: proprietarul site-ului actualizează propriul folder"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = public.current_site_id()::text
  );

create policy "media: proprietarul site-ului șterge din propriul folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = public.current_site_id()::text
  );
