-- ----------------------------------------------------------------------------
-- Cererea de programare poate veni fără email.
--
-- Formularul scurt de pe prima pagină cere doar numele; telefonul e opțional
-- (hotărât de proprietar, 27 aug. 2026). Coloana era `not null` din vremea în
-- care singurul formular era cel de pe `/programare`, unde emailul se cere.
--
-- Fără linia asta, cererea trimisă de pe prima pagină ar fi picat la scriere,
-- iar omul ar fi văzut „problemă tehnică” pentru un formular completat corect.
--
-- Nu se pune șir gol în loc: „” nu e o adresă, iar în panou ar fi devenit un
-- link `mailto:` care nu duce nicăieri. `null` spune adevărul — nu știm cum să
-- luăm legătura pe email — iar ecranul poate atunci să arate altceva.
-- ----------------------------------------------------------------------------

alter table public.appointments alter column email drop not null;
