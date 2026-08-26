-- ============================================================================
-- `updated_at` se actualizează singur.
--
-- Coloana exista din prima migrare, cu `default now()` — dar un default se
-- aplică doar la INSERT. La UPDATE rămânea neatinsă, deci arăta momentul
-- creării, nu al ultimei modificări. Adică exact opusul a ce spune numele ei.
--
-- Alternativa era ca fiecare loc care scrie să pună `updated_at: new Date()`.
-- Ar fi mers până la primul apel care uită — iar coloana ar fi devenit un
-- lucru în care nu poți avea încredere, ceea ce e mai rău decât să nu existe.
-- Un trigger nu poate fi uitat.
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
-- `search_path` gol: funcția rulează cu drepturile apelantului, dar tot nu
-- vrem să poată fi păcălită cu un `now()` pus într-o schemă din calea de
-- căutare a userului. Aceeași regulă ca la `current_site_id()`.
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tabel text;
begin
  foreach tabel in array array[
    'site_content', 'site_settings', 'pages', 'services', 'blog_articles'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', tabel);
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()',
      tabel
    );
  end loop;
end;
$$;
