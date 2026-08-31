-- ============================================================================
-- Conținut demonstrativ pentru tenanții de test, ca site-ul public să aibă ce
-- randa. Toate rândurile sunt marcate `is_demo = true`, deci ecranul „Pregătit
-- de lansare" (Faza 6) va refuza publicarea până când sunt înlocuite.
--
-- Rulează DUPĂ migrările 20260826090000, 20260826110000 și 20260826130000.
-- Se poate rula de câte ori vrei — rescrie rândurile existente, nu le dublează.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Secțiunile paginii principale
--
-- Se șterg întâi rândurile demonstrative, apoi se inserează la loc. Nu se mai
-- poate folosi `on conflict (site_id, key)`: constrângerea a fost eliminată ca
-- aceeași secțiune să poată apărea de mai multe ori (banda cu citat). Filtrul
-- pe `is_demo` face ștergerea sigură — conținutul real al clientului nu e atins
-- niciodată.
-- ----------------------------------------------------------------------------
delete from public.site_content
where is_demo = true
  and site_id in (
    select id from public.sites
    where domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
  );

insert into public.site_content (site_id, key, tone, position, is_demo, data)
select s.id, v.key, v.tone, v.position, true, v.data
from public.sites s
cross join (values

  ('hero', 'deschis', 10, jsonb_build_object(
    'eyebrow', 'Cabinet · București · online & fizic',
    'titlu', 'Sunt Rodica,',
    'titluAccent', 'psiholog clinician.',
    'subtitlu', 'Lucrez cu adulți care traversează perioade grele — anxietate, epuizare, despărțiri. Prima discuție e scurtă și fără cost, ca să vedem dacă ne potrivim.',
    'butonPrincipal', jsonb_build_object('text', 'Programează o discuție', 'href', '#contact'),
    'butonSecundar', jsonb_build_object('text', 'Cum decurge o ședință', 'href', '#proces')
  )),

  ('aboutTeaser', 'nuantat', 20, jsonb_build_object(
    'eyebrow', 'Despre mine',
    'titlu', 'Câteva cuvinte despre drumul',
    'titluAccent', 'pe care ți-l propun.',
    'paragrafe', jsonb_build_array(
      'Cred că terapia este un loc, nu o tehnică. Un loc unde poți respira, unde te poți auzi pe tine, unde nimic din ce simți nu este „prea mult" sau „prea puțin".',
      'Lucrez de peste zece ani cu oameni care trec prin momente complicate ale vieții. Nu am rețete; am răbdare, și încrederea că fiecare găsește ce îi trebuie, dacă are unde să caute în liniște.'
    ),
    'fraza', 'Nu te schimb. Te ajut să te regăsești.',
    'buton', jsonb_build_object('text', 'Citește povestea mea', 'href', '/despre')
  )),

  ('quote', 'deschis', 30, jsonb_build_object(
    'citat', 'Acasă nu e un loc, e o stare. Te ajut să ți-o construiești.'
  )),

  -- Fără listă de servicii: din migrarea 20260826180000 ele stau în tabelul
  -- `services`, ca să nu fie scrise de două ori. Secțiunea rămâne vitrină.
  ('features', 'deschis', 40, jsonb_build_object(
    'eyebrow', 'Ce ofer',
    'titlu', 'Serviciile',
    'titluAccent', 'mele.',
    'intro', 'Lucrez cu adulți, individual și în cuplu, la cabinet sau online.'
  )),

  ('howItWorks', 'inchis', 50, jsonb_build_object(
    'eyebrow', 'Pas cu pas',
    'titlu', 'Cum decurge',
    'titluAccent', 'colaborarea noastră.',
    'intro', 'Nimic nu se întâmplă înainte să fii tu pregătit. Iată la ce să te aștepți.',
    'pasi', jsonb_build_array(
      jsonb_build_object('titlu', 'Sună pentru programare', 'descriere', 'O discuție scurtă la telefon, ca să-mi spui pe scurt ce te aduce aici.'),
      jsonb_build_object('titlu', 'Prima întâlnire', 'descriere', 'Ne cunoaștem, fără presiune. Dacă simți că nu e potrivit, e absolut în regulă.'),
      jsonb_build_object('titlu', 'Ședințele propriu-zise', 'descriere', 'De obicei săptămânal, 50 de minute. Ritmul îl stabilim împreună.'),
      jsonb_build_object('titlu', 'Evaluăm împreună', 'descriere', 'Din când în când ne oprim să vedem ce s-a schimbat și încotro mergem.')
    )
  )),

  ('quote', 'inchis', 60, jsonb_build_object(
    'citat', 'Vindecarea nu este o destinație — este un drum pe care nu trebuie să mergi singur.'
  )),

  -- Poziții intercalate (65, 75, 95, 100): ordinea urmează structura reală a
  -- șablonului din design/sabloane/README.md, fără să renumerotăm restul.
  --
  -- Aparițiile și programele nu au `imagine`: n-avem fișiere încărcate pentru
  -- tenanții de test, iar secțiunile sunt scrise să arate bine și fără. Așa se
  -- verifică și cazul acesta, care va fi cel al oricărui client în prima zi.
  ('logos', 'nuantat', 65, jsonb_build_object(
    'eyebrow', 'În public',
    'titlu', 'Apariții și',
    'titluAccent', 'acreditări.',
    'intro', 'Conversații despre sănătate mintală, dincolo de cabinet.',
    'aparitii', jsonb_build_array(
      jsonb_build_object(
        'tip', 'Podcast', 'sursa', 'Vorbim deschis', 'data', 'martie 2026',
        'titlu', 'Cum recunoști epuizarea înainte să te doboare',
        'descriere', 'O oră despre semnele pe care le trecem cel mai des cu vederea.'
      ),
      jsonb_build_object(
        'tip', 'Emisiune TV', 'sursa', 'Exemplu TV', 'data', 'ianuarie 2026',
        'titlu', 'Anxietatea la tineri: ce s-a schimbat în zece ani',
        'descriere', 'Invitată într-o discuție despre presiunea din școli și din online.'
      )
    )
  )),

  ('testimonials', 'relief', 70, jsonb_build_object(
    'eyebrow', 'Păreri',
    'titlu', 'Povești ale celor',
    'titluAccent', 'care au început.',
    'marturii', jsonb_build_array(
      jsonb_build_object('text', 'Am venit crezând că trebuie reparat ceva la mine. Am plecat înțelegând că doar nu mă ascultasem niciodată.', 'autor', 'A.M.', 'context', 'consiliere individuală'),
      jsonb_build_object('text', 'După șapte ani în care ne certam pe aceleași lucruri, am învățat în sfârșit să ne auzim.', 'autor', 'C. și R.', 'context', 'consiliere de cuplu'),
      jsonb_build_object('text', 'Cel mai mult a contat că nu m-a grăbit nimeni. Am mers în ritmul meu.', 'autor', 'D.P.', 'context', 'anxietate')
    )
  )),

  ('portfolio', 'nuantat', 75, jsonb_build_object(
    'eyebrow', 'Împreună',
    'titlu', 'Experiențe',
    'titluAccent', 'de grup.',
    'intro', 'Câteva zile în care lucrezi cu tine, dar nu singur.',
    'elemente', jsonb_build_array(
      jsonb_build_object(
        'eticheta', 'Retreat',
        'titlu', 'Trei zile de liniște',
        'descriere', 'Un weekend departe de oraș, cu ateliere de dimineață și mult timp nestructurat. Fără telefoane, fără program încărcat.',
        'detalii', jsonb_build_array('14–16 martie', 'Brașov', '12 locuri')
      ),
      jsonb_build_object(
        'eticheta', 'Atelier',
        'titlu', 'Granițe sănătoase',
        'descriere', 'Patru ore despre cum spui nu fără să te simți vinovat. Exerciții practice, în grup mic.',
        'detalii', jsonb_build_array('sâmbătă, 4 aprilie', 'online', '20 de locuri')
      )
    )
  )),

  ('latestPosts', 'deschis', 80, jsonb_build_object(
    'eyebrow', 'Blog',
    'titlu', 'Articole',
    'titluAccent', 'recente.',
    'numar', 3,
    'linkToateArticolele', jsonb_build_object('text', 'Toate articolele', 'href', '/blog')
  )),

  ('faq', 'deschis', 90, jsonb_build_object(
    'eyebrow', 'Bine de știut',
    'titlu', 'Întrebări',
    'titluAccent', 'frecvente.',
    'intrebari', jsonb_build_array(
      jsonb_build_object('intrebare', 'Cât durează o ședință?', 'raspuns', 'Cincizeci de minute. Prima discuție, cea de cunoaștere, e mai scurtă și nu se plătește.'),
      jsonb_build_object('intrebare', 'Cât de des trebuie să vin?', 'raspuns', 'De obicei săptămânal, la început. Pe măsură ce lucrurile se așază, putem rări întâlnirile. Ritmul îl stabilim împreună, în funcție de ce ai nevoie.'),
      jsonb_build_object('intrebare', 'Ce se întâmplă dacă simt că nu ne potrivim?', 'raspuns', 'Îmi spui, și e perfect în regulă. Potrivirea dintre terapeut și client contează enorm. Dacă nu e, te pot îndruma către un coleg.'),
      jsonb_build_object('intrebare', 'Ședințele online sunt la fel de eficiente?', 'raspuns', 'Pentru majoritatea situațiilor, da. Sunt și oameni care preferă cabinetul, și e la fel de bine. Alegi ce te face să te simți mai în largul tău.'),
      jsonb_build_object('intrebare', 'Ce discutăm rămâne confidențial?', 'raspuns', 'Da. Confidențialitatea e o obligație profesională, cu excepțiile prevăzute de lege, pe care ți le explic de la prima întâlnire.')
    )
  )),

  ('newsletter', 'inchis', 95, jsonb_build_object(
    'eyebrow', 'Newsletter',
    'titlu', 'Un email pe lună,',
    'titluAccent', 'fără zgomot.',
    'intro', 'Scriu despre ce văd cel mai des în cabinet și despre ce ajută, cu adevărat, între ședințe.',
    'textButon', 'Abonează-mă'
  )),

  ('contact', 'relief', 100, jsonb_build_object(
    'eyebrow', 'Contact',
    'titlu', 'Hai să',
    'titluAccent', 'vorbim.',
    'intro', 'Lasă-mi numele și numărul. Te sun eu, la ora care îți convine.',
    -- Fără câmp de adresă a linkului: telefonul și emailul devin apăsabile
    -- singure, după cum arată conținutul. Programul are două rânduri, ca să se
    -- vadă că se poate.
    'detalii', jsonb_build_array(
      jsonb_build_object('eticheta', 'Telefon', 'valoare', '0700 000 000'),
      jsonb_build_object('eticheta', 'Email', 'valoare', 'contact@example.com'),
      jsonb_build_object('eticheta', 'Cabinet', 'valoare', 'Str. Exemplu nr. 1, București'),
      jsonb_build_object('eticheta', 'Program', 'valoare', E'Luni – vineri, 10:00 – 19:00\nSâmbătă, 09:00 – 14:00')
    ),
    'textButon', 'Trimite mesajul'
  ))

) as v(key, tone, position, data)
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com');

-- ----------------------------------------------------------------------------
-- 1b. Serviciile demonstrative — în tabelul lor, nu în secțiune
-- ----------------------------------------------------------------------------
delete from public.services
where site_id in (
  select id from public.sites
  where domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
);

insert into public.services (site_id, slug, title, excerpt, content, price_label, duration_label, position, status)
select s.id, v.slug, v.titlu, v.scurt, v.lung, v.pret, v.durata, v.pozitie, 'published'
from public.sites s
cross join (values
  ('terapie-individuala', 'Terapie individuală',
   'Un spațiu numai al tău, în care nu trebuie să te explici sau să te justifici.',
   E'Lucrăm împreună la ce te apasă acum și la tiparele care se repetă de mai multă vreme.\n\nPrimele ședințe sunt de cunoaștere: îmi spui ce te aduce aici, iar eu îți spun cum lucrez și ce ne putem propune realist. Nu trebuie să vii cu lucrurile puse în ordine — de asta e ședința.\n\nRitmul îl stabilim împreună. De obicei săptămânal la început, mai rar pe măsură ce lucrurile se așază.',
   '250 lei / ședință', '50 de minute', 10),
  ('consiliere-de-cuplu', 'Consiliere de cuplu',
   'Când aceleași certuri se reiau, cu alte cuvinte, de ani de zile.',
   E'Ședințele de cuplu nu sunt un tribunal în care se stabilește cine are dreptate.\n\nCăutăm împreună tiparul din care nu reușiți să ieșiți: ce spune unul, ce aude celălalt, unde se rupe conversația de fiecare dată. De cele mai multe ori, cearta despre vase nu e despre vase.\n\nVeniți amândoi. Dacă unul dintre voi are nevoie și de ședințe individuale, vă îndrum către un coleg — nu pot fi terapeutul cuplului și al unuia dintre voi în același timp.',
   '350 lei / ședință', '80 de minute', 20),
  ('anxietate-si-atacuri-de-panica', 'Anxietate și atacuri de panică',
   'Când neliniștea nu se mai oprește singură și îți îngustează viața.',
   E'Anxietatea nu se vindecă prin a-ți spune că nu e nimic. Corpul tău a învățat să reacționeze la o alarmă care nu se mai oprește, și tot corpul trebuie să reînvețe.\n\nLucrăm în două direcții: ce faci în momentul în care te prinde, și ce întreține alarma între timp. Prima parte aduce ușurare destul de repede, a doua durează mai mult și ține mai mult.\n\nDacă ai avut atacuri de panică, îți explic de la prima ședință ce se întâmplă în corp atunci. De multe ori, doar să înțelegi mecanismul le face mai puțin înspăimântătoare.',
   '250 lei / ședință', '50 de minute', 30)
) as v(slug, titlu, scurt, lung, pret, durata, pozitie)
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com');

-- ----------------------------------------------------------------------------
-- 2. Datele de antet și subsol (nu sunt secțiuni — sunt cadrul paginii)
-- ----------------------------------------------------------------------------
insert into public.site_settings (site_id, brand)
select s.id, jsonb_build_object(
  'subtitlu', 'Psiholog clinician',
  'telefon', '0700 000 000',
  'email', 'contact@example.com',
  'adresa', 'Str. Exemplu nr. 1, București',
  'acreditare', 'Membru al Colegiului Psihologilor din România',
  'descriereSubsol', 'Cabinet de psihoterapie pentru adulți. Ședințe la cabinet sau online.'
)
from public.sites s
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
on conflict (site_id) do update
  set brand = excluded.brand,
      updated_at = now();

-- ----------------------------------------------------------------------------
-- 3. Articole demonstrative, ca secțiunea „Articole recente" să aibă ce afișa.
--    Fără ele componenta nu se randează deloc — un titlu urmat de gol arată a
--    site stricat, nu a site nou.
-- ----------------------------------------------------------------------------
insert into public.blog_articles (site_id, title, slug, excerpt, status, published_at, content)
select s.id, v.title, v.slug, v.excerpt, 'published', v.published_at::timestamptz, v.content
from public.sites s
cross join (values
  ('Când neliniștea devine prea mare', 'cand-nelinistea-devine-prea-mare',
   'Cum recunoști momentul în care anxietatea a încetat să te mai protejeze și a început să te limiteze.',
   '2026-08-18', 'Conținut demonstrativ.'),
  ('Despre epuizare, fără clișee', 'despre-epuizare-fara-clisee',
   'Burnout-ul nu înseamnă doar oboseală. Înseamnă că sensul s-a scurs din lucrurile care înainte îl aveau.',
   '2026-08-05', 'Conținut demonstrativ.'),
  ('Primul pas către terapie', 'primul-pas-catre-terapie',
   'Ce se întâmplă, de fapt, la prima ședință — și de ce nu trebuie să știi dinainte ce ai de spus.',
   '2026-07-22', 'Conținut demonstrativ.')
) as v(title, slug, excerpt, published_at, content)
where s.domain in ('test-tenant-a.example.com', 'test-tenant-b.example.com')
on conflict (site_id, slug) do update
  set title = excluded.title,
      excerpt = excluded.excerpt,
      status = excluded.status,
      published_at = excluded.published_at,
      updated_at = now();

-- ----------------------------------------------------------------------------
-- Verificare
-- ----------------------------------------------------------------------------
select s.domain, sc.position, sc.key, sc.tone
from public.site_content sc
join public.sites s on s.id = sc.site_id
where s.domain = 'test-tenant-a.example.com'
order by sc.position;
