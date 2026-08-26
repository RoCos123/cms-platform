# Șablon: Politica de confidențialitate

Text de pornire pentru pagina de confidențialitate a unui cabinet, potrivit pe
ce face CHIAR acest site: formular de contact, verificare anti-spam Cloudflare,
fonturi de la Google, fără urmărire și fără cookie-uri pentru vizitatori.

**Nu e text juridic verificat.** E o descriere onestă a ce se întâmplă tehnic,
scrisă pe înțelesul unui vizitator. Înainte să ajungă pe site-ul unui client,
citește-l cu cineva care se ocupă de partea juridică — mai ales dacă acel cabinet
mai face ceva ce site-ul nu face (newsletter, programări online, plăți).

## De completat, la fiecare client

| Ce | Unde apare |
|---|---|
| `[NUMELE CABINETULUI]` | prima frază |
| `[NUME ȘI PRENUME]` | prima frază |
| `[ADRESA SEDIULUI]` | prima frază |
| `[COD COLEGIUL PSIHOLOGILOR]` | prima frază |
| `[EMAIL DE CONTACT]` | de trei ori |
| `[CÂTE LUNI]` | secțiunea despre păstrarea mesajelor |
| `[DATA]` | ultima secțiune |

## De verificat înainte de publicare

- **Turnstile.** Dacă `TURNSTILE_SECRET_KEY` nu e pus în variabilele de mediu,
  verificarea anti-spam nu rulează — atunci scoate paragraful despre Cloudflare.
- **Fonturile.** Cât timp site-ul le încarcă de la Google Fonts, paragraful
  despre ele trebuie să rămână. Dacă le mutăm vreodată pe serverul nostru, se
  scoate.
- **Regiunea Supabase.** Dacă proiectul nu e într-o regiune din UE, adaugă o
  frază despre transferul datelor în afara Uniunii.

---

DE AICI ÎN JOS SE COPIAZĂ ÎN CÂMPUL „TEXTUL PAGINII”

---

## Cine sunt și cum mă contactezi

Site-ul acesta aparține cabinetului [NUMELE CABINETULUI], reprezentat de [NUME ȘI PRENUME], psiholog cu drept de liberă practică, [COD COLEGIUL PSIHOLOGILOR], cu sediul în [ADRESA SEDIULUI].

Pentru orice întrebare legată de datele tale, scrie-mi la [EMAIL DE CONTACT].

## Ce date strâng și de ce

Prin formularul de contact de pe site se salvează numele, adresa de email și mesajul tău. Am nevoie de ele pentru un singur lucru: ca să-ți pot răspunde.

Formularul nu îți cere numărul de telefon. Dacă mi-l scrii chiar tu în mesaj, ajunge tot acolo, împreună cu restul textului.

Ca să nu primesc mesaje trimise automat de programe, formularul folosește un serviciu al Cloudflare, numit Turnstile. Pentru verificarea aceasta, adresa IP a dispozitivului tău ajunge la Cloudflare. Eu nu o primesc și nu o păstrez.

Fonturile cu care e scris site-ul se încarcă de la Google Fonts, așa că browserul tău cere fișierele acelea direct de la serverele Google, care îți văd adresa IP. E singurul lucru pe care site-ul îl cere de la altcineva în timp ce îl citești.

## Ce nu se întâmplă

Site-ul nu pune niciun cookie pe dispozitivul tău. Cookie-uri există doar pentru mine, atunci când mă conectez ca să administrez site-ul.

Nu folosesc Google Analytics și niciun alt program de urmărire. Nu știu cine intră pe site, de unde vine sau ce pagini citește.

Nu vând, nu închiriez și nu dau datele tale nimănui în scop de reclamă.

## Cât timp păstrez mesajele

Păstrez mesajele primite prin formular cel mult [CÂTE LUNI] luni de la primire, apoi le șterg definitiv.

Poți să-mi ceri ștergerea oricând, mai devreme. O fac fără să te întreb de ce.

## Cine mai are acces la ele

Site-ul, baza de date și fișierele sunt găzduite de firme care se ocupă de partea tehnică:

— Vercel Inc., pentru găzduirea site-ului
— Supabase Inc., pentru baza de date și fișierele încărcate
— Cloudflare Inc., pentru verificarea anti-spam a formularului

Niciuna nu are dreptul să folosească datele tale altfel decât ca să țină site-ul în funcțiune.

## De ce am voie să le prelucrez

Prelucrez datele din formular pe baza acordului tău — bifa pe care o pui înainte de a trimite mesajul. Îl poți retrage oricând, scriindu-mi la [EMAIL DE CONTACT].

## Drepturile tale

Legea îți dă următoarele drepturi asupra datelor tale:

— să afli ce date am despre tine
— să ceri corectarea lor, dacă sunt greșite
— să ceri ștergerea lor
— să ceri o copie, într-un format pe care îl poți duce altundeva
— să te opui prelucrării lor
— să ceri limitarea prelucrării

Pentru oricare dintre ele, scrie-mi la [EMAIL DE CONTACT]. Îți răspund în cel mult 30 de zile.

Dacă răspunsul meu nu te mulțumește, poți depune plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal, pe dataprotection.ro.

## Ce discutăm în cabinet e altceva

Politica aceasta e despre site și despre datele care ajung la mine prin el.

Ce vorbim în ședințe e protejat separat, prin secretul profesional și prin Codul deontologic al profesiei de psiholog. Acolo regulile sunt mai stricte decât aici, iar despre ele îți vorbesc la prima întâlnire.

## Când se schimbă politica aceasta

Ultima actualizare: [DATA].

Dacă modific ceva important, schimb data de mai sus. Merită să arunci un ochi înainte să-mi trimiți un mesaj nou.
