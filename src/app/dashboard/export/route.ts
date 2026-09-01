import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { adresaImaginii } from "@/lib/imagini-adrese";

/**
 * Descarcă tot ce are cabinetul, într-un singur fișier.
 *
 * DE CE. Un client care pleacă trebuie să-și poată lua conținutul cu el. Fără
 * asta, nu-l ține la noi calitatea produsului, ci faptul că n-are cum să scoată
 * ce a scris — iar asta e o legătură pe care n-o vrem. Prin GDPR, i se cuvine
 * oricum: datele pe care le prelucrăm pentru el, într-o formă citibilă de o
 * mașină.
 *
 * DE CE JSON. E formatul pe care îl cere legea („structurat, folosit în mod
 * curent, citibil automat") și singurul care poate purta un site întreg fără
 * să-l strice. Cine îi va face următorul site va ști ce să facă cu el; iar
 * textele se citesc și cu ochiul liber.
 *
 * DE CE O RUTĂ, ȘI NU UN SERVER ACTION. Un Server Action întoarce date către
 * pagină, nu un fișier către browser. Descărcarea are nevoie de un răspuns cu
 * `Content-Disposition`, deci de o rută. Stă sub `/dashboard`, deci proxy-ul îi
 * cere oricum conectare, iar `verifySession()` verifică din nou aici.
 *
 * Imaginile NU sunt în fișier — ar fi însemnat un arhivator și zeci de megaocteți
 * într-un JSON. În locul lor e lista lor, cu adresa fiecăreia: cât timp site-ul
 * trăiește, se descarcă de acolo.
 */
export async function GET() {
  const session = await verifySession();
  const supabase = await createClient();

  const [site, setari, sectiuni, pagini, servicii, articole, categorii, imagini, mesaje, programari, abonati] =
    await Promise.all([
      supabase.from("sites").select("name, domain, template, published_at, created_at").eq("id", session.siteId).maybeSingle(),
      supabase.from("site_settings").select("brand, seo, social, pagini, programari").eq("site_id", session.siteId).maybeSingle(),
      supabase.from("site_content").select("key, variant, tone, position, visible, data").eq("site_id", session.siteId).order("position"),
      supabase.from("pages").select("slug, title, content, status, seo, nav_location, position, created_at, updated_at").eq("site_id", session.siteId).order("position"),
      supabase.from("services").select("slug, title, excerpt, content, price_label, duration_label, visible, position, status, seo, created_at, updated_at").eq("site_id", session.siteId).order("position"),
      supabase.from("blog_articles").select("slug, title, excerpt, content, status, cover_alt, seo, published_at, created_at, updated_at").eq("site_id", session.siteId).order("created_at"),
      supabase.from("blog_categories").select("name, slug").eq("site_id", session.siteId),
      supabase.from("uploads").select("id, filename, mime_type, size_bytes, width, height, alt_text, created_at").eq("site_id", session.siteId).order("created_at"),
      supabase.from("contact_messages").select("name, phone, email, consent, read_at, created_at").eq("site_id", session.siteId).order("created_at"),
      supabase.from("appointments").select("name, phone, email, service, starts_at, status, created_at").eq("site_id", session.siteId).order("starts_at"),
      supabase.from("newsletter_subscribers").select("email, confirmed_at, unsubscribed_at, created_at").eq("site_id", session.siteId).order("created_at"),
    ]);

  const continut = {
    _despre: {
      ce_e:
        "Tot ce ține de site-ul acestui cabinet, la data de mai jos. Fișierul e citibil " +
        "de un program, dar textele se pot citi și cu ochiul liber.",
      generat_la: new Date().toISOString(),
      imaginile:
        "Fișierele nu sunt aici, doar lista lor. Fiecare are o adresă în „imagini”: " +
        "descarcă-le de acolo cât timp site-ul e în funcțiune.",
      atentie:
        "Secțiunea „date_primite_de_la_oameni” conține date ale altor persoane " +
        "(pacienți, vizitatori). Ai grijă unde ajunge fișierul: pe un laptop pierdut, " +
        "e o scurgere de date pe care legea o pune în seama cabinetului.",
    },

    cabinet: site.data ?? null,
    setari: setari.data ?? null,

    continutul_site_ului: {
      sectiunile_primei_pagini: sectiuni.data ?? [],
      pagini: pagini.data ?? [],
      servicii: servicii.data ?? [],
      articole: articole.data ?? [],
      categorii_articole: categorii.data ?? [],
    },

    imagini: (imagini.data ?? []).map((rand) => ({
      nume_fisier: rand.filename,
      descriere: rand.alt_text,
      tip: rand.mime_type,
      octeti: rand.size_bytes,
      latime: rand.width,
      inaltime: rand.height,
      incarcata_la: rand.created_at,
      adresa: adresaImaginii(rand.id as string),
    })),

    date_primite_de_la_oameni: {
      mesaje_de_contact: mesaje.data ?? [],
      cereri_de_programare: programari.data ?? [],
      abonati_newsletter: abonati.data ?? [],
    },
  };

  const azi = new Date().toISOString().slice(0, 10);
  const numeFisier = `export-${(site.data?.domain as string | undefined) ?? "site"}-${azi}.json`;

  return new Response(JSON.stringify(continut, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${numeFisier}"`,
      // Un export e o fotografie a unei clipe: memorat, ar întoarce mâine datele
      // de azi, iar cine îl descarcă n-ar avea de unde să afle.
      "Cache-Control": "no-store",
    },
  });
}
