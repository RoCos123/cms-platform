"use client";

import { useActionState } from "react";
import { trimiteMesajContact } from "@/app/actions/formulare";
import { LIMITE, STARE_INITIALA } from "@/lib/formulare";
import { Camp, Capcana, MesajFormular, stilButonTrimite } from "@/components/site/form-parts";
import { Turnstile } from "@/components/site/turnstile";

export function ContactForm({
  siteKey,
  temaCaptcha,
  textAcord,
  linkConfidentialitate,
  mesajSucces,
  textButon,
}: {
  siteKey: string | null;
  temaCaptcha: "light" | "dark";
  textAcord: string;
  /** Lipsă = pagina nu există încă, deci textul rămâne fără link. */
  linkConfidentialitate?: string;
  mesajSucces?: string;
  textButon: string;
}) {
  const [stare, actiune, seLucreaza] = useActionState(trimiteMesajContact, STARE_INITIALA);

  return (
    <form action={actiune} style={{ display: "flex", flexDirection: "column", gap: "18px" }} noValidate>
      {stare.status !== "initial" && stare.mesaj && (
        <MesajFormular status={stare.status}>
          {stare.status === "succes" ? (mesajSucces ?? stare.mesaj) : stare.mesaj}
        </MesajFormular>
      )}

      <Capcana />

      <Camp
        id="contact-nume"
        name="nume"
        eticheta="Numele tău"
        autoComplete="name"
        maxLength={LIMITE.nume}
        eroare={stare.erori?.nume}
        valoare={stare.valori?.nume}
      />

      <Camp
        id="contact-email"
        name="email"
        tip="email"
        eticheta="Adresa de email"
        autoComplete="email"
        maxLength={LIMITE.email}
        eroare={stare.erori?.email}
        valoare={stare.valori?.email}
      />

      <Camp
        id="contact-mesaj"
        name="mesaj"
        eticheta="Mesajul tău"
        randuri={6}
        maxLength={LIMITE.mesaj}
        eroare={stare.erori?.mesaj}
        valoare={stare.valori?.mesaj}
      />

      <Acord
        eroare={stare.erori?.acord}
        text={textAcord}
        linkConfidentialitate={linkConfidentialitate}
      />

      {/*
        `key` pe numărul de încercări: tokenul Turnstile e de unică folosință,
        deci după fiecare trimitere widgetul trebuie remontat ca să emită altul.
        Fără asta, a doua trimitere din aceeași pagină ar fi mereu respinsă.
      */}
      {siteKey && <Turnstile key={stare.incercari} siteKey={siteKey} tema={temaCaptcha} />}

      <button type="submit" disabled={seLucreaza} style={stilButonTrimite(seLucreaza)}>
        {seLucreaza ? "Se trimite…" : textButon}
      </button>
    </form>
  );
}

/**
 * Bifa de consimțământ, obligatorie prin GDPR pentru datele trimise printr-un
 * formular de contact. Nu poate fi bifată din start: consimțământul trebuie să
 * fie o acțiune a omului, nu o valoare implicită.
 *
 * `value="da"` face ca `FormData` să conțină câmpul doar când e bifat — exact ce
 * verifică Server Action-ul.
 */
function Acord({
  eroare,
  text,
  linkConfidentialitate,
}: {
  eroare?: string;
  text: string;
  linkConfidentialitate?: string;
}) {
  const idEroare = "contact-acord-eroare";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <input
          id="contact-acord"
          name="acord"
          type="checkbox"
          value="da"
          required
          aria-describedby={eroare ? idEroare : undefined}
          aria-invalid={eroare ? true : undefined}
          style={{ width: "18px", height: "18px", marginTop: "3px", flexShrink: 0, accentColor: "var(--s-accent)" }}
        />
        <label htmlFor="contact-acord" style={{ fontSize: "14px", lineHeight: 1.6 }}>
          {text}{" "}
          {/*
            Link doar dacă există unde să ducă. Un „Politica de
            confidențialitate" care deschide o pagină inexistentă e mai rău
            decât unul care nu se poate apăsa: omul apasă tocmai fiindcă vrea să
            se lămurească, iar peretele pe care îl primește îl lasă cu impresia
            că nu are cine să-i răspundă nici mai încolo.
          */}
          {linkConfidentialitate ? (
            <a
              href={linkConfidentialitate}
              // Subliniat, nu doar colorat: un link în mijlocul unui text distins
              // numai prin culoare pică WCAG 1.4.1 (și dispare pentru cine nu
              // deosebește nuanțele).
              style={{
                color: "var(--s-accent)",
                textDecoration: "underline",
                textDecorationThickness: "1px",
                textUnderlineOffset: "2px",
              }}
            >
              Politica de confidențialitate
            </a>
          ) : (
            "Politica de confidențialitate"
          )}
          .
        </label>
      </div>

      {eroare && (
        <p id={idEroare} style={{ margin: 0, fontSize: "14px", color: "var(--s-eroare)" }}>
          {eroare}
        </p>
      )}
    </div>
  );
}
