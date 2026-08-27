-- ----------------------------------------------------------------------------
-- Programări: programul de lucru și starea unei cereri.
--
-- Tabelul `appointments` există din prima migrare, cu politicile lui. Aici se
-- adaugă doar ce lipsea ca să poată fi chiar folosit.
-- ----------------------------------------------------------------------------

-- Programul de lucru, lângă celelalte grupuri de setări ale site-ului.
alter table public.site_settings
  add column if not exists programari jsonb not null default '{}'::jsonb;

comment on column public.site_settings.programari is
  'Programul de lucru: durata ședinței, pauza, preavizul, orizontul și intervalele pe zile. Gol = nu se pot face programări, iar formularul public nici nu apare.';

-- ----------------------------------------------------------------------------
-- Starea unei cereri.
--
-- `status` era `text` fără nicio îngrădire, adică orice șir putea ajunge acolo.
-- Un „confirmat" scris cu diacritice altundeva în cod ar fi însemnat o
-- programare care nu apare în nicio listă — și pe care nimeni n-o caută,
-- fiindcă în panou pare că a dispărut.
-- ----------------------------------------------------------------------------
do $$
begin
  -- Aduce la formă orice rând scris înainte de constrângere.
  update public.appointments
     set status = 'ceruta'
   where status not in ('ceruta', 'confirmata', 'refuzata', 'anulata');

  if not exists (select 1 from pg_constraint where conname = 'appointments_status_check') then
    alter table public.appointments
      add constraint appointments_status_check
      check (status in ('ceruta', 'confirmata', 'refuzata', 'anulata'));
  end if;
end;
$$;

alter table public.appointments alter column status set default 'ceruta';

-- ----------------------------------------------------------------------------
-- Două programări nu pot ocupa același moment la același cabinet.
--
-- Verificarea se face și în aplicație, dar acolo e o citire urmată de o
-- scriere: două cereri venite în aceeași secundă trec amândouă de citire.
-- Indexul e singurul loc unde „ocupat" chiar înseamnă ocupat.
--
-- Doar cererile vii: o programare refuzată sau anulată eliberează ora.
-- ----------------------------------------------------------------------------
create unique index if not exists appointments_ora_ocupata_idx
  on public.appointments (site_id, starts_at)
  where status in ('ceruta', 'confirmata');

-- Lista din panou se cere mereu la fel: cabinetul, apoi în ordinea orei.
create index if not exists appointments_site_starts_idx
  on public.appointments (site_id, starts_at);
