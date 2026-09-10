# Emailul de resetare a parolei — de pus în Supabase

Trei lucruri de făcut o dată, în tabloul Supabase, ca resetarea parolei să
meargă. Fără primele două, linkul din email nu are unde să se întoarcă.

## 1. Adresa de întoarcere (obligatoriu)

**Authentication → URL Configuration → Redirect URLs.** Adaugă adresa pe care se
întoarce linkul. Codul îl trimite pe domeniul CLIENTULUI, la
`/login/confirma-resetare`.

- Cât timp totul e pe `.vercel.app`, ajunge un tipar cu metacaracter:
  `https://*.vercel.app/**`
- Când clienții au domenii proprii, fiecare domeniu se adaugă aici — merge la
  pachet cu conectarea domeniului în Vercel, care e oricum manuală.

(La `Site URL` lasă adresa platformei; nu de ea atârnă întoarcerea, ci de lista
de mai sus.)

## 2. Expeditorul (obligatoriu, dar de obicei deja pornit)

Cât suntem pe **punte**, emailurile de autentificare pleacă prin expeditorul
încorporat al Supabase — nu trebuie configurat nimic, doar să nu fie oprit. E de
mică anvergură (câteva pe oră); pentru resetări rare e destul. Când vine domeniul
și Resend, aici se schimbă o singură setare (Authentication → SMTP Settings), iar
codul rămâne neatins.

## 3. Textul emailului, în română (recomandat)

**Authentication → Email Templates → „Reset Password".**

Fără pasul ăsta, resetarea MERGE deja, dar cu textul implicit al Supabase (în
engleză) și doar dacă omul deschide emailul în același browser din care a cerut
resetarea. Textul de mai jos îl face românesc ȘI îl face să meargă și de pe alt
dispozitiv (telefon), fiindcă pune în link dovada întreagă (`token_hash`), nu una
care depinde de un cookie.

**Subiect:**

```
Alege o parolă nouă
```

**Mesaj (HTML):**

```html
<h2>Resetează-ți parola</h2>
<p>Ai cerut schimbarea parolei. Apasă butonul de mai jos ca să alegi una nouă.</p>
<p>
  <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery"
     style="display:inline-block;padding:10px 18px;background:#18181b;color:#fff;border-radius:8px;text-decoration:none">
    Alege o parolă nouă
  </a>
</p>
<p>Linkul e valabil un timp scurt. Dacă nu tu ai cerut asta, ignoră mesajul —
   parola rămâne neschimbată.</p>
```

Cheia e `{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery`:
`RedirectTo` e domeniul clientului (din pasul 1), iar `token_hash` e dovada pe
care ruta `confirma-resetare` o preschimbă într-o sesiune. Ruta acceptă și forma
implicită (`code`), deci nimic nu se strică în intervalul dintre pașii ăștia.
