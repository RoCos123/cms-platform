import { notFound } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { aspectPermis } from "@/lib/aspect/acces";
import { createClient } from "@/lib/supabase/server";
import { citesteAspectCulori, culoriDinBrand } from "@/lib/aspect/culori";
import { citesteAspectFonturi, fonturiDinBrand } from "@/lib/aspect/fonturi";
import { previzualizareaSiteului } from "@/lib/aspect/previzualizare";
import { getTemplate } from "@/lib/templates";
import { LinkVeziPeSite } from "@/components/dashboard/link-vezi-pe-site";
import { FormularAspect } from "./formular";

export const metadata = { title: "Aspect" };

export default async function AspectPage() {
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: site }, { data: setari }] = await Promise.all([
    supabase.from("sites").select("name, domain, template").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("brand").eq("site_id", session.siteId).maybeSingle(),
  ]);

  // Ecranul e în probă: cine n-are poarta deschisă îl vede ca pe o pagină care nu există.
  if (!aspectPermis({ domain: site?.domain as string | null, template: site?.template as string | null })) notFound();

  const sablon = getTemplate(site?.template as string | null);
  const initiale = citesteAspectCulori(culoriDinBrand(setari?.brand));
  const initialeFonturi = citesteAspectFonturi(fonturiDinBrand(setari?.brand));

  // Site-ul adevărat al clientului, ca să vadă culorile pe pozele și textele lui; `null` pentru
  // un site fără nicio secțiune vizibilă (atunci ecranul păstrează pagina de exemplu).
  const previzualizare = await previzualizareaSiteului(
    supabase,
    session.siteId,
    String(site?.domain ?? ""),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Aspect</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cum arată site-ul tău: culorile și fonturile.
          </p>
        </div>

        <LinkVeziPeSite href="/" eticheta="Vezi site-ul" />
      </div>

      <FormularAspect
        sablonId={sablon.id}
        numeSablon={sablon.nume}
        numeSite={String(site?.name ?? "")}
        initiale={initiale}
        initialeFonturi={initialeFonturi}
        previzualizare={previzualizare}
      />
    </div>
  );
}
