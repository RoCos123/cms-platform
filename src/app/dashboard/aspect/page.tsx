import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { citesteAspectCulori, culoriDinBrand } from "@/lib/aspect/culori";
import { getTemplate } from "@/lib/templates";
import { LinkVeziPeSite } from "@/components/dashboard/link-vezi-pe-site";
import { FormularAspect } from "./formular";

export const metadata = { title: "Aspect" };

export default async function AspectPage() {
  const session = await verifySession();
  const supabase = await createClient();

  const [{ data: site }, { data: setari }] = await Promise.all([
    supabase.from("sites").select("name, template").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("brand").eq("site_id", session.siteId).maybeSingle(),
  ]);

  const sablon = getTemplate(site?.template as string | null);
  const initiale = citesteAspectCulori(culoriDinBrand(setari?.brand));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Panou</p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Aspect</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Cum arată site-ul tău. Deocamdată alegi culorile; fonturile urmează.
          </p>
        </div>

        <LinkVeziPeSite href="/" eticheta="Vezi site-ul" />
      </div>

      <FormularAspect
        sablonId={sablon.id}
        numeSablon={sablon.nume}
        numeSite={String(site?.name ?? "")}
        initiale={initiale}
      />
    </div>
  );
}
