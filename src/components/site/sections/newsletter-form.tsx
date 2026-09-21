"use client";

import { useActionState } from "react";
import { aboneazaLaNewsletter } from "@/app/actions/formulare";
import { LIMITE, STARE_INITIALA } from "@/lib/formulare";
import { Capcana, MesajFormular, stilButonTrimite, stilControl } from "@/components/site/form-parts";
import { CasetaAmanata } from "@/components/site/captcha";

export function NewsletterForm({
  siteKey,
  furnizorCaptcha,
  temaCaptcha,
  textButon,
  placeholder,
  mesajSucces,
}: {
  siteKey: string | null;
  furnizorCaptcha: string | null;
  temaCaptcha: "light" | "dark";
  textButon: string;
  placeholder: string;
  mesajSucces?: string;
}) {
  const [stare, actiune, seLucreaza] = useActionState(aboneazaLaNewsletter, STARE_INITIALA);
  const eroareEmail = stare.erori?.email;

  return (
    <form action={actiune} style={{ display: "flex", flexDirection: "column", gap: "14px" }} noValidate>
      {/*
        Banda de sus poartă doar mesajele generale (succes, anti-spam, eroare
        tehnică). Eroarea de câmp se afișează o singură dată, sub câmp, unde
        trimite și `aria-describedby` — altfel același text apărea de două ori.
      */}
      {stare.status !== "initial" && stare.mesaj && (
        <MesajFormular status={stare.status}>
          {stare.status === "succes" ? (mesajSucces ?? stare.mesaj) : stare.mesaj}
        </MesajFormular>
      )}

      <Capcana />

      {/*
        Un singur câmp, deci eticheta stă ascunsă vizual — dar EXISTĂ. Un
        `placeholder` nu ține loc de etichetă: dispare la scris și multe
        cititoare de ecran nu îl anunță.
      */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
        <label htmlFor="newsletter-email" style={ASCUNS_VIZUAL}>
          Adresa ta de email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          className="camp-public"
          required
          autoComplete="email"
          maxLength={LIMITE.email}
          placeholder={placeholder}
          defaultValue={stare.valori?.email}
          aria-describedby={eroareEmail ? "newsletter-email-eroare" : undefined}
          aria-invalid={eroareEmail ? true : undefined}
          style={{ ...stilControl(Boolean(eroareEmail)), flex: "1 1 240px", width: "auto" }}
        />

        <button type="submit" disabled={seLucreaza} style={stilButonTrimite(seLucreaza)}>
          {seLucreaza ? "Se trimite…" : textButon}
        </button>
      </div>

      {eroareEmail && (
        <p id="newsletter-email-eroare" role="alert" style={{ margin: 0, fontSize: "14px", color: "var(--s-eroare)" }}>
          {eroareEmail}
        </p>
      )}

      {/*
        `key` pe numărul de încercări: tokenul casetei e de unică folosință,
        deci după fiecare trimitere widgetul trebuie remontat ca să emită altul.
        Fără asta, a doua trimitere din aceeași pagină ar fi mereu respinsă.
      */}
      {siteKey && (
            <CasetaAmanata
              key={stare.incercari}
              siteKey={siteKey}
              furnizor={furnizorCaptcha}
              tema={temaCaptcha}
            />
          )}
    </form>
  );
}

const ASCUNS_VIZUAL: React.CSSProperties = {
  position: "absolute",
  width: "1px",
  height: "1px",
  padding: 0,
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};
