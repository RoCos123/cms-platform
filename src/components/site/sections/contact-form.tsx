"use client";

import { useActionState, useEffect, useRef } from "react";
import { trimiteMesajContact } from "@/app/actions/formulare";
import { LIMITE, STARE_INITIALA } from "@/lib/formulare";
import { ATRIBUT_MODEL, TEXTE_VANZARE, optiunileModelului } from "@/lib/pagina-vanzare";
import { Camp, Capcana, MesajFormular, Selectie, stilButonTrimite } from "@/components/site/form-parts";
import { CasetaAmanata } from "@/components/site/captcha";

export function ContactForm({
  siteKey,
  furnizorCaptcha,
  temaCaptcha,
  nota,
  textAcord,
  linkConfidentialitate,
  mesajSucces,
  textButon,
  modele,
}: {
  siteKey: string | null;
  furnizorCaptcha: string | null;
  temaCaptcha: "light" | "dark";
  /** Un rând mic deasupra formularului (ex.: „Răspund personal în 24 de ore"). */
  nota?: string;
  textAcord: string;
  /** Lipsă = pagina nu există încă, deci textul rămâne fără link. */
  linkConfidentialitate?: string;
  mesajSucces?: string;
  textButon: string;
  /**
   * DOAR pe pagina de vânzare: numele modelelor din galerie. Prezența listei
   * (chiar goală) aduce telefonul, modelul preferat și mesajul; lipsa ei lasă
   * formularul de cabinet exact cum era — nume, email, acord.
   */
  modele?: readonly string[];
}) {
  const [stare, actiune, seLucreaza] = useActionState(trimiteMesajContact, STARE_INITIALA);
  const vanzare = modele !== undefined;
  const refModel = useRef<HTMLSelectElement>(null);

  /*
    Butonul „Vreau acest model" de pe cartonașe e un link simplu către
    `#contact`, cu numele modelului în `data-model`. Ascultarea stă aici, pe
    document, nu pe buton: cartonașele sunt randate pe server, fără JavaScript
    al lor. Fără JavaScript, linkul tot duce la formular — doar că modelul
    rămâne de ales de mână.
  */
  useEffect(() => {
    if (!vanzare) return;

    function laClic(eveniment: MouseEvent) {
      const tinta = eveniment.target;
      if (!(tinta instanceof Element)) return;

      const link = tinta.closest(`a[${ATRIBUT_MODEL}]`);
      const lista = refModel.current;
      if (!link || !lista) return;

      const model = link.getAttribute(ATRIBUT_MODEL) ?? "";
      if (Array.from(lista.options).some((optiune) => optiune.value === model)) {
        lista.value = model;
      }
    }

    document.addEventListener("click", laClic);
    return () => document.removeEventListener("click", laClic);
  }, [vanzare]);

  const texte = TEXTE_VANZARE.formular;

  return (
    <form action={actiune} style={{ display: "flex", flexDirection: "column", gap: "18px" }} noValidate>
      {nota?.trim() && (
        <p style={{ margin: 0, fontSize: "15px", lineHeight: 1.6, color: "var(--s-text-secundar)" }}>
          {nota}
        </p>
      )}

      {stare.status !== "initial" && stare.mesaj && (
        <MesajFormular status={stare.status}>
          {stare.status === "succes" ? (mesajSucces ?? stare.mesaj) : stare.mesaj}
        </MesajFormular>
      )}

      <Capcana />

      <Camp
        id="contact-nume"
        name="nume"
        eticheta={vanzare ? texte.nume : "Numele tău"}
        autoComplete="name"
        maxLength={LIMITE.nume}
        eroare={stare.erori?.nume}
        valoare={stare.valori?.nume}
      />

      {/*
        Numai email, fără telefon (16 sept. 2026, la cererea proprietarului).
        Cu telefonul scos, emailul rămâne singurul canal prin care cabinetul
        poate răspunde — deci devine obligatoriu (era opțional). Câmpul de mesaj
        rămâne scos oricum, din motivul GDPR de pe 28 aug. (vezi mai jos).
      */}
      <Camp
        id="contact-email"
        name="email"
        tip="email"
        eticheta={vanzare ? texte.email : "Adresa de email"}
        autoComplete="email"
        maxLength={LIMITE.email}
        eroare={stare.erori?.email}
        valoare={stare.valori?.email}
      />

      {/*
        EXCEPȚIA paginii de vânzare (9 oct. 2026, hotărârea proprietarului):
        telefon, model preferat și mesaj — DOAR pe sitepsihologi.ro. Acolo scriu
        psihologi despre un site, nu pacienți despre sănătatea lor, deci motivul
        pentru care cabinetele n-au text liber și telefon nu se aplică. Vezi
        CONTEXT.md, la hotărârile din 28 aug. și 16–18 sept.
      */}
      {modele && (
        <>
          <Camp
            id="contact-telefon"
            name="telefon"
            tip="tel"
            eticheta={texte.telefon}
            autoComplete="tel"
            maxLength={LIMITE.telefon}
            obligatoriu={false}
            sufixOptional={texte.optional}
            eroare={stare.erori?.telefon}
            valoare={stare.valori?.telefon}
          />

          {/*
            `key` pe numărul de încercări: după o trimitere, React reface
            formularul din valorile implicite, iar la o listă `defaultValue`
            contează doar la montare. Fără remontare, modelul ales se pierdea la
            prima eroare (prins la proba din 9 oct. 2026) — omul corecta
            telefonul și trimitea, fără să observe, „Încă nu m-am hotărât".
          */}
          <Selectie
            key={stare.incercari}
            id="contact-model"
            name="model"
            eticheta={texte.model}
            optiuni={optiunileModelului(modele)}
            valoare={stare.valori?.model}
            eroare={stare.erori?.model}
            schemaCulori={temaCaptcha}
            refSelectie={refModel}
          />

          <Camp
            id="contact-mesaj"
            name="mesaj"
            eticheta={texte.mesaj}
            randuri={5}
            maxLength={LIMITE.mesaj}
            obligatoriu={false}
            sufixOptional={texte.optional}
            eroare={stare.erori?.mesaj}
            valoare={stare.valori?.mesaj}
          />
        </>
      )}

      {/*
        Câmpul de mesaj a fost scos dinadins (28 aug. 2026). Pe site-ul unui
        psiholog, „scrie-mi câteva rânduri" adună date despre sănătate —
        categoria cu cerințele legale cele mai stricte. Vezi migrarea
        `contact_fara_mesaj` pentru raționamentul întreg. Nu se pune la loc
        fără să se recitească acolo. (Excepția de mai sus, a paginii de
        vânzare, nu atinge niciun site de cabinet.)
      */}

      <Acord
        eroare={stare.erori?.acord}
        text={textAcord}
        linkConfidentialitate={linkConfidentialitate}
        textLink={vanzare ? texte.politica : undefined}
      />

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

      <button type="submit" disabled={seLucreaza} style={stilButonTrimite(seLucreaza)}>
        {seLucreaza ? (vanzare ? texte.seTrimite : "Se trimite…") : textButon}
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
  textLink = "Politica de confidențialitate",
}: {
  eroare?: string;
  text: string;
  linkConfidentialitate?: string;
  /** Pagina de vânzare îl ia din textele ei; cabinetele, de aici. */
  textLink?: string;
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
              {textLink}
            </a>
          ) : (
            textLink
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
