# Raport final — brieful tehnic sitepsihologi.ro (9 oct. 2026)

## Pe scurt

- **Codul** e gata, pe branch-ul `claude/brief-sitepsihologi`. NU e pe master și NU e
  publicat: ajunge pe site doar la „fă pe master". Lint-ul, verificarea de tipuri,
  cele 378 de probe, construcția aplicației și bancul cu migrări trec.
- **Baza de date**: migrarea `20261009120000_pagina_de_vanzare.sql` e rulată în
  Supabase, iar sitepsihologi e marcat ca pagină de vânzare (`sites.tip = 'vanzare'`).
  Marcajul nu schimbă nimic pe site până nu e publicat codul.
- **Textele** le schimbă Robert din panou (hotărârea lui din 9 oct.). Nu s-a scris
  niciun SQL de texte. Singurul text schimbat de noi e cel din tabelul comparativ,
  care nu se editează din panou.
- **Unde s-a încercat**: pe o copie locală a platformei (bază de probă cu toate
  migrările, PostgREST, aplicația construită), cu o trimitere reală de formular din
  browser, la 375 și 1280 px. NU pe site-ul real: mediul de lucru nu ajunge la
  sitepsihologi.vercel.app. După publicare merită o privire pe telefon.
- **Cabinetele** rămân neschimbate: tot ce e nou atârnă de marcajul paginii de vânzare.

## 1. Punct cu punct

| Punct | Stare | Ce și unde |
|---|---|---|
| 1.1 „Păreri" | Robert | O ascunde din panou (Secțiuni → debifează „Vizibilă"). Dispare din pagină, din meniu și din subsol. |
| 1.2 Text între [ ] | Nu se aplică | Hotărârea lui Robert (9 oct.): nimic nu se ascunde automat, pe niciun site, și nu există script de verificare. Secțiunile necompletate le ascunde el. |
| 1.3 Subsol | Făcut (cod) | O singură listă, cu aceleași linkuri ca bara de sus. Fără coloanele „Servicii" și „Cabinet", fără dublura „Formularul de contact"/„Contact". |
| 1.3 Cartonașul de distribuire | Făcut (cod) | Text alternativ: „sitepsihologi.ro: site-uri pentru cabinete de psihologie și psihoterapie" (în `src/lib/pagina-vanzare.ts`). Desenul arată numele site-ului din Setări și, în colț, adresa din `sites.domain` (acum sitepsihologi.vercel.app); nu are cuvinte de cabinet. |
| 1.3 Ancora `modele` | Făcut (cod) | Galeria are `#modele`; `#programe` duce în același loc. |
| 1.4 „Cel mai ales" | Robert | Pachete → „Etichetă (scoate pachetul în față)" → golit. |
| 1.5 Tabelul pe ecran îngust | Făcut (cod) | Sub 768 px, fiecare rând e un card cu valorile etichetate pe coloane; fără derulare în lateral. |
| 2.1 Ordinea secțiunilor | Robert | Din Secțiuni, cu săgețile. |
| 2.1 „Modele" în bară | Făcut (cod) | Primul, în ordinea paginii: Modele · Servicii · Prețuri · Contact. |
| 2.2 Demo în filă nouă | Făcut (cod) | `target="_blank" rel="noopener noreferrer"`. |
| 2.2 „Vreau acest model" | Făcut (cod) | Buton peste poză, în stânga jos; duce la `#contact` și alege modelul în formular. Textul, în `src/lib/pagina-vanzare.ts`. |
| 2.2 Lista modelelor | Făcut | Un singur loc: galeria din panou („Programe și materiale"). Formularul își ia opțiunile de acolo. Cifra „5" rămâne scrisă de mână (hotărârea lui Robert). |
| 2.3 Formularul | Făcut (cod) | Nume, email, telefon (opțional), „Modelul preferat" (modelele + „Încă nu m-am hotărât", aleasă din start), mesaj (opțional), bifa. Capcana anti-spam păstrată. Validare pe server, stocare în `contact_messages` (`phone`, `message`, `model_preferat`), afișare în panou la „Mesaje". Notificare pe email: nu există, ca și până acum. Trimitere încercată local, inclusiv o eroare de validare. |
| 2.4 FAQ și datele pentru Google | Exista deja | Datele structurate se fac din aceeași secțiune ca textul afișat. FAQ-ul nu a fost atins. |
| 2.5 Butoane și ancore | Verificat | „Vezi pachetele" → `#pachete`, „Cere o ofertă" → `#contact`, „Rezervă-ți site-ul" → `#contact`; în bară „Modele" → `/#modele`, „Servicii" → `/#servicii`, „Prețuri" → `/#pachete`, „Contact" → `/#contact`. Toate au secțiunea lor pe pagină. |
| 2.6, 2.7, 2.8 | Robert | Lista exactă e în secțiunea 3. Excepție: „MINIM, doar încarci pozele și textele." → „Minim: doar încarci pozele și textele.", făcut în `tabel-comparativ.tsx`, la cererea lui. |
| 3.1 Titlu și descriere | Robert | Setări → „Cum apari în căutările Google". Titlul ales: „Site-uri pentru cabinete de psihologie \| sitepsihologi.ro" (57 de caractere; cel din brief avea 73, iar câmpul primește 60). Open Graph și Twitter preiau singure aceleași texte. |
| 3.2 Adresa canonică | Rămâne `sites.domain` | Acum: `sitepsihologi.vercel.app`. Se schimbă pe `sitepsihologi.ro` după ce domeniul e legat și răspunde (o linie de SQL). |
| 3.3 robots și sitemap | Verificat | Codul face deja ce cere brieful (vezi secțiunea 4). |
| 3.4 Măsurare | Propunere | Vezi secțiunea 4. Neimplementat. |
| 3.5 Titluri și alt | Verificat | Un singur H1 (prima secțiune), apoi H2 pe secțiuni și H3 în interiorul lor (numele modelelor), în ordine; pozele modelelor au text alternativ (de schimbat „Șablonul" → „Modelul"). |
| 4 Datele firmei | Făcut (cod) | Setări → „Datele firmei", doar pe sitepsihologi: denumire, CUI, Reg. Com., sediu, TVA. Telefonul, WhatsApp-ul și emailul vin din „Datele cabinetului" (aprobat de Robert). Apar: lângă formular (telefon, WhatsApp, email), pe rândul de jos din subsol (denumire, CUI, Reg. Com., sediu), sub preț (TVA). Câmp gol = nimic pe pagină. |
| 4 Politica de confidențialitate | Parțial | Pagina există ca ciornă (`/politica-de-confidentialitate`), nepublicată și nelegată. Textul îl scrie Robert; schița de structură e în anexă. După publicare, „Politica de confidențialitate" de lângă bifă devine link singur. |
| 5 Verificări | Raportat | Secțiunea 4. |
| 6 „Gata înseamnă" | Vezi secțiunea 5 | |

## 2. Ce s-a schimbat, pe fișiere

**Fișiere noi**
- `src/lib/pagina-vanzare.ts` — textele paginii de vânzare scrise în cod și regulile mici (lista modelelor, datele firmei, rândul legal).
- `src/lib/pagina-vanzare-date.ts` — citește marcajul site-ului (la orice eroare: „cabinet") și modelele din galerie.
- `supabase/migrations/20261009120000_pagina_de_vanzare.sql` — coloanele `sites.tip` și `contact_messages.model_preferat` (rulată).
- `supabase/marcheaza-sitepsihologi.sql` — marcajul (rulat).
- `supabase/citire-sitepsihologi.sql` — citirea textelor, doar citește.
- `e2e/pagina-vanzare.proba.mjs` — probele (pică dacă e stricat dinadins ce păzesc).

**Fișiere comune cu site-urile de cabinet** (regula 5 din brief). La toate, pe un cabinet ies exact ca înainte; diferența apare doar cu marcajul „vânzare".
- `src/app/actions/formulare.ts` — formularul de contact: câmpurile noi se citesc doar pe pagina de vânzare; la cabinet, rândul scris în bază e cel de dinainte (fără telefon, fără text).
- `src/components/site/sections/contact-form.tsx`, `contact.tsx` — câmpurile noi, blocul cu telefon/WhatsApp/email, legătura spre politică.
- `src/components/site/form-parts.tsx` — câmp de tip telefon și o listă de ales (folosite doar de pagina de vânzare).
- `src/components/site/sections/portfolio.tsx` — galeria: ancora, filă nouă, butonul.
- `src/components/site/sections/pricing.tsx` — mențiunea de TVA.
- `src/components/site/footer.tsx`, `cadru-site.tsx`, `src/lib/antet.ts` — subsolul cu o listă și „Modele" în bară.
- `src/components/site/render-sections.tsx`, `src/app/page.tsx` — duc informația „pagină de vânzare" la secțiuni; textul alternativ al cartonașului.
- `src/lib/formulare.ts`, `src/lib/setari.ts` — limite și verificarea telefonului; grupul „Datele firmei".
- Panou: `dashboard/mesaje/*` (modelul preferat), `dashboard/setari/*` („Datele firmei", doar pe vânzare), `dashboard/sectiuni/[id]/*` (previzualizarea arată formularul paginii de vânzare).

**Doar pe sitepsihologi, prin varianta tabelului**: `src/components/site/sections/tabel-comparativ.tsx`.

**Documentație**: `CONTEXT.md` (hotărârile și stadiul), acest raport.

## 3. Unde stau textele (pentru brieful de texte)

### În panou (le schimbă Robert)

| Ecran → câmp | Text acum | Text nou, după brief |
|---|---|---|
| Prima secțiune → „Ultimele cuvinte din titlu" | pentru cabinetul tau | pentru cabinetul tău |
| Prima secțiune → „Al doilea buton" | Cere o oferta | Cere o ofertă |
| Cum decurge colaborarea → pasul „Ne contactezi" → „Ce se întâmplă" | Alegi un șablon apoi ne suni sau ne trimiți un email cu solicitarea ta, de exemplu: "Vreau să folosim șablonul "Lumină" pentru site-ul meu." | Alegi un model, apoi ne suni sau ne trimiți un email cu solicitarea ta, de exemplu: „Vreau să folosim modelul Lumină pentru site-ul meu.” |
| Servicii → „Site profesionist la preț excelent" → „Numele serviciului" | Site profesionist la preț excelent | Site profesionist, la preț fix |
| Servicii → „Libertatea de a alege" → „Descriere" | Șabloanele din care poți alege designul viitorului tău site sunt dintr-o gamă adaptată activtății de psihoterapie și psihologie. | Modelele din care alegi viitorul tău site sunt adaptate activității de psihoterapie și psihologie. |
| Servicii → „Indexare SEO" → „Descriere" | …afișarea siteului… | …afișarea site-ului… |
| Pachete → „Pe scurt, pentru cine e" | …contactat ușor de pacienți | …contactat ușor de clienți |
| Pachete → „Ce include" | 5 designuri premium, la alegere | 5 modele, la alegere |
| Pachete → „Ce include" | Panou de administrare extrem de simplu | Panou de administrare simplu |
| Pachete → „Ce include" | Găzduire ultra-rapidă și certificat de securitate | Găzduire și certificat de securitate |
| Pachete → „Etichetă (scoate pachetul în față)" | Cel mai ales | (gol) |
| Programe și materiale → „Titlu" | 5 designuri premium, | 5 modele, |
| Programe și materiale → „Text introductiv" | Îți oferim o selecție de 5 modele premium, actualizată… | Îți oferim o selecție de 5 modele, actualizată… |
| Programe și materiale → „Numele programului" | Caldura / Liniste / Lumina | Căldură / Liniște / Lumină |
| Programe și materiale → fiecare poză → „Text alternativ" | Șablonul Căldură (și celelalte patru) | Modelul Căldură (și celelalte patru) |
| Setări → „Cum apari în căutările Google" | (gol) | titlul ales și descrierea din brief |

Restul textelor paginii stau tot în panou: Prima secțiune, Cum decurge colaborarea, Serviciile mele (titlul „Ce primești") și Servicii (cartonașele), Pachete, Programe și materiale, Întrebări frecvente, Contact (titlu, text, butonul „Trimite mesajul", mesajul de după trimitere, textul de lângă bifă), Setări (nume, telefon, WhatsApp, titlul și descrierea pentru Google, datele firmei), Pagini (politica de confidențialitate).

### În cod

- `src/lib/pagina-vanzare.ts` → `TEXTE_VANZARE`: textele bării („Modele", „Servicii", „Contact"…), butonul „Vreau acest model", textul alternativ al cartonașului de distribuire, etichetele formularului („Numele tău", „Adresa de email", „Telefon", „Modelul preferat", „Încă nu m-am hotărât", „Mesaj", „(opțional)", „Politica de confidențialitate", „Se trimite…"), mesajele de eroare ale câmpurilor noi, etichetele datelor firmei („CUI", „Nr. Reg. Com.", „Sediu:", „Telefon", „WhatsApp", „E-mail"), titlul coloanei „Contact" din subsol.
- `src/components/site/sections/tabel-comparativ.tsx`: tot tabelul comparativ (hotărârea din 7 oct.: rămâne în cod).
- Texte comune cu cabinetele, rămase în cod: mesajele de eroare ale numelui, emailului și bifei, plus mesajul tehnic (`src/app/actions/formulare.ts`); mesajele casetei anti-spam (`src/lib/antispam.ts`); „© an nume" din subsol (`footer.tsx`); textele pentru cititoarele de ecran din bară. Mesajul de după trimitere și textul de lângă bifă se pot scrie din panou și au întâietate.

### Observații pentru brieful de texte (neschimbate)
- Galerie → „Etichetă mică": „DESIGN PROFESIONAL" — aici „design" se referă la modele, nu la aspect.
- Galerie → programul „Caldura" → „Descriere": „Model Caldura". Nu se vede pe pagină (cartonașul arată doar poza și numele).
- Imagini (biblioteca): 29 de poze au descrierea „Șablonul …". Nu se văd pe pagină; contează doar dacă o poză e aleasă din nou într-o secțiune.
- Contact → „Text introductiv": „Lasă-ne adresa de e-mail și te vom contacta noi…" — formularul cere acum și telefon (opțional) și are loc de mesaj.
- În panou, pentru toți clienții: „(pacienți, vizitatori)" în fișierul de la „Descarcă tot conținutul"; „pe care pacienții le pot descărca" la Imagini → Documente; „Șablon" în ecranele de administrator (`/proprietar`).

## 4. Verificări de raportat (punctul 5 din brief și altele)

**Unde ajung datele din formularele și programările cabinetelor.** Toate site-urile scriu în aceeași bază de date Supabase a platformei (proiectul „CMS"): mesajele de contact în `contact_messages`, programările în `appointments`. Aplicația le citește pe server cu cheia secretă a platformei, iar proprietarul platformei poate intra în panoul oricărui cabinet (`/proprietar` → „intră în panou"). Tehnic, deci, platforma are acces la ele. Fraza din FAQ „Noi nu avem acces la aceste conversații" nu e corectă așa cum e scrisă. **Nu am schimbat-o.**

**Programările, față de ce spune FAQ-ul:**
- *Aprobare manuală*: da — și e mereu așa: fiecare cerere așteaptă să fie confirmată sau refuzată din panou.
- *Limită de programări pe zi*: nu există ca setare. Psihologul alege zilele și orele, durata ședinței, pauza, cu cât timp înainte se poate cere (implicit 24 de ore) și cât de departe în viitor; fiecare oră se poate rezerva o singură dată. Limita pe zi e, practic, numărul de ore oferite.
- *Plată în avans*: nu există.
- În plus: cel mult 10 cereri pe oră la un cabinet și o singură cerere în așteptare de la același număr de telefon.

**Subdomeniile demo**: codul citește adresele din galerie (butonul fiecărui model). Acum: `model-caldura.vercel.app`, `model-liniste…`, `model-lumina…`, `model-apropiere…`, `model-claritate.vercel.app`.

**Ciorna „Politica de confidențialitate" a cabinetelor** (cerută ca verificare, nemodificată):
- Ciorna creată automat la fiecare site nou e doar o listă de îndrumări („cine ești ca operator… cât timp le păstrezi și cine mai are acces la ele…"). Nu afirmă nimic despre cine stochează datele sau cine le poate accesa. Spune că „Mesajele primite prin formularul de contact pot conține informații despre sănătatea cuiva", deși formularele de cabinet nu mai au câmp de mesaj din 28 aug.
- Șablonul lung (`sabloane/politica-de-confidentialitate.md`), din care se scriu politicile de mână: spune că „Vercel Inc.", „Supabase Inc." și „Intuition Machines Inc. (hCaptcha)" au acces și că „Niciuna nu are dreptul să folosească datele tale altfel decât ca să țină site-ul în funcțiune". Nu pomenește platforma (firma care face și administrează site-ul), care are acces tehnic. Nu pomenește deloc programările. Spune că formularul salvează „numele și numărul tău de telefon, iar adresa de email doar dacă vrei" — depășit din 16 sept. (acum: nume și email obligatoriu, fără telefon). Durata de păstrare e încă „[CÂTE LUNI]".

**robots.txt și sitemap (3.3).** Pe adresele `*.vercel.app` (unde e acum sitepsihologi), `robots.txt` interzice dinadins orice indexare, fără sitemap — de aici refuzul „acces automatizat nepermis". Pe un domeniu propriu, cu site-ul publicat, permite indexarea și dă sitemap-ul; preview-urile rămân neindexabile. Deci sitepsihologi devine indexabil după mutarea pe sitepsihologi.ro. Dacă instrumentul tot refuză după mutare, de verificat în Vercel: Firewall / protecția anti-bot.

**Măsurare (3.4) — propunere, neimplementată.** Există deja o numărătoare proprie a vizitelor, fără cookie-uri și fără date personale, la „Vizite" în panou. Propunerea: trei evenimente numărate la fel — clic pe un model (demo), clic pe „Vreau acest model"/„Rezervă-ți site-ul", formular trimis. Formularul trimis se numără pe server; clicurile, printr-un semnal mic trimis la apăsare, fără cookie-uri și fără să identifice omul. Se văd în panou, lângă vizite; nu cer banner de cookie-uri. Alternativa: un serviciu extern fără cookie-uri (Plausible, Umami) — mai multe grafice gata făcute, dar încă o firmă care vede vizitele, de trecut în politica de confidențialitate.

**Altele găsite pe drum:**
- Fișierul de la „Descarcă tot conținutul" nu conține textul mesajelor și nici modelul preferat (doar nume, telefon, email, acord, date).
- Nu pleacă niciun email când vine un mesaj (Resend e pus dinadins la final); mesajele se văd doar în panou.

## 5. „Gata înseamnă" — unde suntem

- Build, lint, tipuri: trec.
- 375 și 1280 px: fără derulare în lateral și fără texte tăiate, pe copia locală (cu textele vechi din previzualizare). De privit și pe site, după publicare.
- Cuvintele care nu trebuie să mai apară (fără FAQ):
  - se rezolvă prin cod, la publicare: „Serviciile mele", „Programe și experiențe" (subsolul), „Cartonașul" (textul alternativ), „MINIM" (tabelul);
  - se rezolvă din panou, de Robert: `[Aici`, `[Numele]` („Păreri" ascunsă), „Cel mai ales", „activtății", „siteului", „premium", „extrem de", „ultra-rapidă", „excelent", „șablon"/„Șablon" (inclusiv textele alternative ale pozelor), „designuri", „pacien";
  - „foarte intuitiv", „Absolut", „alegi designul": nu apar în ce s-a citit din bază, deci probabil sunt în FAQ, pe care îl schimbă Robert.
- Textul vizibil schimbat de cod: „MINIM, …" → „Minim: …" în tabel; nou: „Modele" în bară, „Vreau acest model" pe cartonașe, câmpurile noi din formular, telefonul și WhatsApp-ul lângă formular (din Setări), lista din subsol în locul coloanelor de cabinet; textul alternativ al cartonașului de distribuire.
- Formularul: merge cu câmpurile noi; mesajul ajunge, ca înainte, în panou la „Mesaje".
- Site-urile de cabinet: neschimbate.

## 6. Ce rămâne deschis

- Publicarea codului („fă pe master").
- Textele din panou (secțiunea 3), plus FAQ-ul: fraza despre acces și opțiunile programărilor (secțiunea 4).
- Politica de confidențialitate a paginii de vânzare: textul, aprobarea, publicarea.
- Datele firmei: de completat după publicare.
- Domeniul sitepsihologi.ro: legat în Vercel, apoi `sites.domain` schimbat (SQL de la noi).
- Măsurarea: propunerea de mai sus, dacă o vrei.
- Șablonul de politică pentru cabinete (`sabloane/…`) e depășit în trei locuri (secțiunea 4).
- Tehnic, fără efect pe site: generatorul verificării de schemă scrie „line 325: {}: command not found" la fiecare rulare a bancului (era așa și înainte; rezultatul iese corect).

## 7. Ce are de făcut Robert, în ordine

1. Textele din panou, după tabelul din secțiunea 3, și „Păreri" ascunsă. Dacă repari numele modelelor înainte de publicare, lista din formular iese corectă de la început.
2. Setări → „Cum apari în căutările Google": titlul și descrierea.
3. „Fă pe master", când vrei să apară pe site schimbările din cod.
4. După publicare: Setări → „Datele firmei"; o privire pe pagină pe telefon; un mesaj de probă prin formular (apare la „Mesaje").
5. Politica de confidențialitate (schița în anexă), apoi publicarea ei din Pagini.
6. Domeniul: legat în Vercel; îmi spui când răspunde, ca să schimbăm adresa.
7. FAQ: fraza „Noi nu avem acces la aceste conversații" și opțiunile programărilor.

## Anexă — schița politicii de confidențialitate (pagina de vânzare)

O structură, nu un text gata de publicat. De citit cu cineva care se ocupă de partea juridică.

1. **Cine suntem** — denumirea firmei, CUI, nr. Registrul Comerțului, sediul, emailul de contact.
2. **Ce date strângem prin formular** — numele, adresa de email, telefonul (dacă îl lași), modelul preferat, mesajul (dacă scrii unul) și acordul dat prin bifă. La trimitere, verificarea anti-spam (hCaptcha) vede adresa IP a dispozitivului.
3. **De ce** — ca să răspundem la cererea ta despre un site.
4. **Pe ce temei** — de stabilit: acordul dat prin bifă și/sau demersurile făcute la cererea ta înainte de un contract.
5. **Cât timp le păstrăm** — de stabilit.
6. **Cine le mai vede** — firmele care țin site-ul în funcțiune: Vercel (găzduirea), Supabase (baza de date), hCaptcha (anti-spam). De verificat înainte de publicare, inclusiv regiunea bazei de date (dacă e în afara UE, o frază despre transfer).
7. **Drepturile tale** — acces, corectare, ștergere, restricționare, portabilitate, opoziție, retragerea acordului; plângere la ANSPDCP (dataprotection.ro).
8. **Cum ne contactezi** — emailul.
9. **Ultima actualizare** — data.
