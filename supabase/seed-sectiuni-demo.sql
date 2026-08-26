-- ============================================================================
-- Conținut demonstrativ pentru tenanții de test, ca site-ul public să aibă ce
-- randa. Toate rândurile sunt marcate `is_demo = true`, deci ecranul „Pregătit
-- de lansare" (Faza 6) va refuza publicarea până când sunt înlocuite.
--
-- Rulează DUPĂ migrarea 20260826090000_templates_and_sections.sql.
-- Se poate rula de mai multe ori — rescrie rândurile existente.
-- ============================================================================

insert into public.site_content (site_id, key, tone, position, is_demo, data)
select
  s.id,
  v.key,
  v.tone,
  v.position,
  true,
  v.data
from public.sites s
cross join (values
  (
    'hero', 'deschis', 10,
    jsonb_build_object(
      'eyebrow', 'Cabinet · București · online & fizic',
      'titlu', 'Sunt Renata,',
      'titluAccent', 'psiholog clinician.',
      'subtitlu', 'Lucrez cu adulți care traversează perioade grele — anxietate, epuizare, despărțiri. Prima discuție e scurtă și fără cost, ca să vedem dacă ne potrivim.',
      'butonPrincipal', jsonb_build_object('text', 'Programează o discuție', 'href', '#contact'),
      'butonSecundar', jsonb_build_object('text', 'Cum decurge o ședință', 'href', '#servicii')
    )
  ),
  (
    'quote', 'nuantat', 20,
    jsonb_build_object(
      'citat', 'Acasă nu e un loc, e o stare. Te ajut să ți-o construiești.',
      'autor', null
    )
  ),
  (
    'features', 'deschis', 30,
    jsonb_build_object(
      'eyebrow', 'Servicii',
      'titlu', 'Cum te pot',
      'titluAccent', 'însoți.',
      'intro', 'Fiecare drum e diferit. Alegem împreună ce ți se potrivește, fără grabă.',
      'servicii', jsonb_build_array(
        jsonb_build_object('titlu', 'Consiliere individuală', 'descriere', 'Un spațiu în care poți vorbi liber, fără să fii judecat sau grăbit.'),
        jsonb_build_object('titlu', 'Consiliere de cuplu', 'descriere', 'Când aceleași certuri se repetă și nu mai găsiți drumul unul spre celălalt.'),
        jsonb_build_object('titlu', 'Consiliere parentală', 'descriere', 'Sprijin pentru părinți care simt că au rămas fără resurse.'),
        jsonb_build_object('titlu', 'Anxietate și atacuri de panică', 'descriere', 'Când neliniștea nu se mai oprește singură și îți îngustează viața.'),
        jsonb_build_object('titlu', 'Epuizare și lipsă de sens', 'descriere', 'Când nimic nu mai are gust, deși din afară pare că funcționezi.'),
        jsonb_build_object('titlu', 'Avize psihologice', 'descriere', 'Evaluări și avize pentru situațiile în care ai nevoie de un act.')
      )
    )
  )
) as v(key, tone, position, data)
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
on conflict (site_id, key) do update
  set data = excluded.data,
      tone = excluded.tone,
      position = excluded.position,
      is_demo = true,
      updated_at = now();

-- Verificare: 6 rânduri (3 secțiuni × 2 tenanți de test).
select s.domain, sc.key, sc.tone, sc.position, sc.is_demo
from public.site_content sc
join public.sites s on s.id = sc.site_id
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
order by s.domain, sc.position;
