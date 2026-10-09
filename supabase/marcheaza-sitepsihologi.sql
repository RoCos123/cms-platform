-- =============================================================================
-- Marchează sitepsihologi ca PAGINĂ DE VÂNZARE (brieful din 9 oct. 2026).
--
-- De ce: toate site-urile rulează pe același cod, iar formularul cu telefon,
-- model preferat și mesaj, galeria „Modele”, subsolul cu o singură listă,
-- „Datele firmei” și restul trebuie să apară DOAR pe sitepsihologi. Codul îl
-- recunoaște după marcajul ăsta. Clientul nu-l poate pune din panou, dinadins.
--
-- Ordine: DUPĂ migrarea `20261009120000_pagina_de_vanzare.sql`, care face
-- coloana. Rulat înainte, dă eroare („column "tip" does not exist”) și nu schimbă
-- nimic. Pe site nu se schimbă nimic până nu e publicat codul.
--
-- Site-ul se caută după id (din citirea din 9 oct.) ȘI după domeniu: dacă unul
-- dintre ele nu se potrivește, nu se atinge nimic. Merge și după ce adresa se
-- mută pe sitepsihologi.ro. Se poate rula de mai multe ori.
--
-- Rezultat corect: EXACT un rând, cu tip = vanzare. Zero rânduri = nimic schimbat.
-- =============================================================================

update public.sites
set tip = 'vanzare'
where id = 'd4643a1a-42a3-4f45-814f-75234b041200'
  and domain ilike '%sitepsihologi%'
returning id, domain, name, tip;
