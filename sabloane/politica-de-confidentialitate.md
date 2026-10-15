# Șablon: Politica de confidențialitate

Text de pornire pentru pagina de confidențialitate a unui cabinet, potrivit pe
ce face CHIAR acest site: formular de contact, programări online (modul opțional),
verificare anti-spam hCaptcha, un contor de afișări pe pagină (fără persoane),
fără cookie-uri ale site-ului și fără program de urmărire.

Rescris pe 15 oct. 2026, ca să spună și ce s-a schimbat de la prima variantă:
telefonul revine în formularul de contact (opțional, 14 oct.), programările cer
nume, email și telefon opțional (15 oct.), contorul de afișări există (27 aug.), iar
firma care administrează tehnic site-ul are acces la date și trebuie numită.

**Nu e text juridic verificat.** E o descriere onestă a ce se întâmplă tehnic,
scrisă pe înțelesul unui vizitator. Înainte să ajungă pe site-ul unui client,
citește-l cu cineva care se ocupă de partea juridică — mai ales dacă acel cabinet
mai face ceva ce site-ul nu face (plăți, newsletter trimis de el, alte formulare).

## De completat, la fiecare client

| Ce | Unde apare |
|---|---|
| `[NUMELE CABINETULUI]` | prima frază |
| `[NUME ȘI PRENUME]` | prima frază |
| `[ADRESA SEDIULUI]` | prima frază |
| `[COD COLEGIUL PSIHOLOGILOR]` | prima frază |
| `[EMAIL DE CONTACT]` | de patru ori (de trei, fără programări) |
| `[CÂTE LUNI]` | secțiunea despre păstrare (cu programări, de două ori) |
| `[DENUMIREA FIRMEI PLATFORMEI]` | „Cine mai are acces la ele” |
| `[REGIUNEA BAZEI DE DATE]` | „Cine mai are acces la ele” |
| `[DATA]` | ultima secțiune |

## Paragrafe care depind de cabinet

Unele paragrafe încep cu o etichetă în paranteze drepte. Sunt întregi, nu bucăți de
frază: dacă cabinetul are lucrul respectiv, ștergi DOAR eticheta; dacă nu, ștergi
tot paragraful. **Nicio paranteză dreaptă nu rămâne în pagina publicată.**

| Eticheta | Păstrezi paragraful dacă… |
|---|---|
| `[PROGRAMĂRI]` (trei paragrafe) | cabinetul are modulul Programări pornit |
| `[YOUTUBE]` | pe site sunt videoclipuri YouTube la „Apariții” |
| `[WHATSAPP]` | în Setări e pus un număr de WhatsApp (butonul plutitor) |

## De verificat înainte de publicare

- **Caseta anti-spam.** Dacă `CAPTCHA_SECRET_KEY` nu e pus în variabilele de
  mediu, verificarea nu rulează — atunci scoate paragraful despre ea. Dacă e
  pus, paragraful trebuie să numească furnizorul chiar folosit
  (`NEXT_PUBLIC_CAPTCHA_FURNIZOR`): implicit hCaptcha (Intuition Machines),
  altfel Cloudflare Turnstile.
- **Cookie-urile casetei.** Textul spune că site-ul nu pune cookie-uri și că ce
  memorează hCaptcha e descris de firma lor. Nu am verificat ce anume scrie
  hCaptcha în browser; dacă aflați precis, spuneți-o în loc de formularea prudentă.
- **Contorul de afișări.** Textul descrie ce face azi (`page_views_daily`: o cifră
  pe pagină și pe zi; fără IP, fără cookie, fără amprentă; user-agent-ul doar
  filtrează roboții și nu se păstrează). Dacă vreodată se numără altceva — vizitatori
  unici, locație —, paragraful trebuie rescris ÎNAINTE.
- **Fonturile și pozele.** Sunt servite de pe domeniul cabinetului, deci nimic de la
  Google. Dacă vreodată se adaugă un font sau o imagine încărcate de altundeva,
  trebuie pus la loc un paragraf.
- **Ștergerea după [CÂTE LUNI] luni.** Platforma NU șterge nimic singură. Clientul
  o face din „Mesaje” și „Programări” („Șterge”, apoi „Șterge definitiv”, sau
  „Șterge datele unei persoane”). Promite în text doar un număr de luni pe care
  îl poate ține.
- **Firma platformei.** Numește firma care a construit și administrează site-ul,
  fiindcă are acces tehnic la datele din baza de date. Cât timp firma nu există, nu se
  publică politica unui client plătitor (vezi CONTEXT.md, punctul 0 și contractul +
  acordul de prelucrare). Pentru acordul ăsta trebuie un avocat; textul de aici doar
  îl menționează.
- **Regiunea Supabase și firmele din SUA.** Vercel Inc. și Supabase Inc. sunt firme
  americane. Completează `[REGIUNEA BAZEI DE DATE]` cu regiunea proiectului (dacă
  nu e într-o regiune din UE, adaugă o frază despre pe ce temei se transferă
  datele).
- **Newsletter.** Dacă secțiunea „Newsletter” e pornită, site-ul doar strânge adrese de
  email. Trimiterea mesajelor și dezabonarea le face cabinetul, cu instrumentul lui,
  iar mesajul de confirmare de pe site încă nu pleacă (Resend, Faza 6). Nu e acoperit
  aici: adaugă un paragraf abia după ce se știe cum se trimite și cum se dezabonează cineva.

---

DE AICI ÎN JOS SE COPIAZĂ ÎN CÂMPUL „TEXTUL PAGINII”

---

## Cine sunt și cum mă contactezi

Site-ul acesta aparține cabinetului [NUMELE CABINETULUI], reprezentat de [NUME ȘI PRENUME], psiholog cu drept de liberă practică, [COD COLEGIUL PSIHOLOGILOR], cu sediul în [ADRESA SEDIULUI].

Pentru orice întrebare legată de datele tale, scrie-mi la [EMAIL DE CONTACT].

## Ce date strâng și de ce

Prin formularul de contact de pe site se salvează numele tău și adresa ta de email, iar numărul de telefon doar dacă vrei să-l lași. Am nevoie de ele pentru un singur lucru: ca să te pot contacta înapoi.

[PROGRAMĂRI] Dacă ceri o programare online, se salvează numele tău, adresa de email, ziua și ora pe care le-ai ales și, doar dacă vrei, numărul de telefon. Le folosesc ca să stabilesc ședința: ca să ți-o confirm sau, dacă ora nu se potrivește, să-ți propun alta.

Formularele de pe site nu au căsuță de mesaj, dinadins. Nu vreau să ajungă la mine, printr-o pagină de internet, lucruri despre sănătatea ta înainte să fi vorbit vreodată. Ce ai de spus îmi spui la telefon sau la prima ședință.

Ca să nu primesc mesaje trimise automat de programe, formularele folosesc un serviciu numit hCaptcha, al firmei Intuition Machines. Pentru verificarea aceasta, adresa IP a dispozitivului tău ajunge la ei. Eu nu o văd și nu o păstrez; ea trece doar prin serverul care găzduiește site-ul, ca la orice site, și de acolo la hCaptcha.

Fonturile cu care e scris site-ul și pozele se încarcă de pe același server ca restul paginii. Cât citești, browserul tău nu cere nimic de la nimeni altcineva.

[YOUTUBE] Singura excepție sunt videoclipurile de pe YouTube: dacă un videoclip nu are o imagine de copertă a lui, imaginea poate fi adusă de la YouTube (Google) chiar când deschizi pagina, iar atunci YouTube vede adresa ta IP. Filmul în sine se încarcă abia când apeși pe el.

[WHATSAPP] Butonul de WhatsApp e un simplu link: nu se încarcă nimic de la WhatsApp până nu apeși pe el. Dacă îl apeși, ajungi în aplicația lor, unde se aplică regulile lor, nu ale acestui site.

## Ce nu se întâmplă

Site-ul în sine nu pune niciun cookie pe dispozitivul tău. Cookie-uri există doar pentru mine, atunci când mă conectez ca să administrez site-ul. Singura parte care nu e a mea e caseta anti-spam hCaptcha, care se încarcă doar când ajungi la un formular; ce poate memora ea în browserul tău e descris de firma care o face, pe hcaptcha.com/privacy.

Nu folosesc Google Analytics și niciun alt program de urmărire. Site-ul doar numără, pe zile, de câte ori a fost deschisă fiecare pagină — o cifră pe pagină, de felul „Servicii: 14 afișări marți”. Nu se reține cine a deschis-o, de unde, cu ce dispozitiv sau cu ce adresă IP.

Nu vând, nu închiriez și nu dau datele tale nimănui în scop de reclamă.

## Cât timp păstrez ce mi-ai trimis

Păstrez mesajele primite prin formularul de contact cel mult [CÂTE LUNI] luni de la primire, apoi le șterg definitiv.

[PROGRAMĂRI] Cererile de programare le păstrez cel mult [CÂTE LUNI] luni de la data programării, apoi le șterg definitiv.

Poți să-mi ceri ștergerea oricând, mai devreme. O fac fără să te întreb de ce.

## Cine mai are acces la ele

Site-ul, baza de date și fișierele sunt găzduite de firme care se ocupă de partea tehnică:

— Vercel Inc., pentru găzduirea site-ului
— Supabase Inc., pentru baza de date și fișierele încărcate
— Intuition Machines Inc. (hCaptcha), pentru verificarea anti-spam a formularelor
— [DENUMIREA FIRMEI PLATFORMEI], firma care a construit site-ul și îl administrează tehnic, cu acces la datele din baza de date doar ca să rezolve probleme tehnice

Vercel și Supabase sunt firme din SUA. Baza de date a site-ului se află în [REGIUNEA BAZEI DE DATE].

Niciuna dintre ele nu are dreptul să folosească datele tale altfel decât ca să țină site-ul în funcțiune.

## De ce am voie să le prelucrez

Datele din formularul de contact le prelucrez pe baza acordului tău — bifa pe care o pui înainte de a trimite mesajul. Îl poți retrage oricând, scriindu-mi la [EMAIL DE CONTACT].

[PROGRAMĂRI] Cererea de programare o prelucrez la cererea ta: ca să pot stabili ședința pe care ai cerut-o. Nu o folosesc pentru nimic altceva, iar dacă te răzgândești, îmi poți scrie la [EMAIL DE CONTACT] și o șterg.

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
