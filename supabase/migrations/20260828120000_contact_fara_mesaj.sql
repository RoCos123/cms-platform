-- ----------------------------------------------------------------------------
-- Formularul de contact nu mai cere mesajul. Cere numărul de telefon.
--
-- DE CE. Trei dintre riscurile mari ale platformei erau legale și țineau toate
-- de același lucru: produsul ÎNTREBA oamenii ce-i doare. „Vrei să adaugi ceva?"
-- și „Mesajul tău", pe site-ul unui psiholog, adună date despre sănătate —
-- categoria cu cerințele cele mai stricte. Hotărât de proprietar pe 28 aug.
-- 2026: se scot amândouă, iar contactul devine „lasă-mi numele și numărul, te
-- sun".
--
-- Ce se câștigă, exact: datele despre sănătate devin ÎNTÂMPLARE, nu proiectare.
-- Cineva tot poate scrie „am depresie" în câmpul de nume, dar asta e altceva
-- decât un produs care întreabă. Contractul de prelucrare rămâne obligatoriu —
-- numele și telefonul sunt tot date personale.
--
-- Ce se pierde, și proprietarul a acceptat conștient: publicul final sunt exact
-- oamenii pentru care e mai ușor să scrie decât să sune.
--
-- COLOANELE NU SE ȘTERG. `message` rămâne, cu tot ce e în ea, pentru mesajele
-- deja primite — un ecran care ar pierde mesajele vechi ale unui client ar fi
-- mai rău decât problema pe care o rezolvăm. Se scoate doar din formular și din
-- acțiune, iar coloana devine opțională.
-- ----------------------------------------------------------------------------

-- Telefonul devine calea principală de răspuns, deci trebuie să aibă unde sta.
alter table public.contact_messages add column if not exists phone text;

-- Emailul nu mai e obligatoriu: cine lasă un număr nu mai trebuie să lase și o
-- adresă. Rămâne opțional, pentru cine preferă să i se scrie.
alter table public.contact_messages alter column email drop not null;

-- Mesajul nu se mai cere deloc, deci nu mai poate fi `not null`. Rândurile
-- vechi îl păstrează neatins.
alter table public.contact_messages alter column message drop not null;
