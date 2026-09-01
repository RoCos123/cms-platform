import { getTenant, verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  CAMPURI_CABINET,
  CAMPURI_SEO,
  CAMPURI_SOCIAL,
  type Brand,
  type Seo,
  type Social,
} from "@/lib/setari";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate } from "@/lib/templates";
import { FormularSetari } from "./formular";
import { ComutatorPublicare } from "./comutator-publicare";

export const metadata = { title: "Setări" };

export default async function SetariPage() {
  const session = await verifySession();
  const { domain } = await getTenant();
  const supabase = await createClient();

  const [{ data: site }, { data: setari }, { data: politica }] = await Promise.all([
    supabase.from("sites").select("name, template, published_at").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("brand, seo, social").eq("site_id", session.siteId).maybeSingle(),
    // Doar starea, nu textul: cardul de publicare vrea să știe dacă politica de
    // confidențialitate mai e ciornă, ca să spună asta înainte de lansare.
    supabase
      .from("pages")
      .select("status")
      .eq("site_id", session.siteId)
      .eq("slug", "politica-de-confidentialitate")
      .maybeSingle(),
  ]);

  const brand = (setari?.brand ?? {}) as Brand;
  const seo = (setari?.seo ?? {}) as Seo;
  const social = (setari?.social ?? {}) as Social;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Setări</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Datele care apar peste tot pe site, nu doar într-o secțiune anume.
        </p>
      </div>

      <ComutatorPublicare
        publicat={site?.published_at !== null && site?.published_at !== undefined}
        domeniu={domain}
        // Lipsa paginii se numără tot ca „ciornă": un site fără politică de
        // confidențialitate e în aceeași situație ca unul cu ea nepublicată.
        politicaEsteCiorna={politica?.status !== "published"}
      />

      <FormularSetari
        // Numele stă în alt tabel decât restul, dar în formular e un câmp ca
        // oricare altul: pentru client sunt același lucru.
        cabinetInitial={catreEditor({ ...brand, nume: site?.name ?? "" }, CAMPURI_CABINET)}
        seoInitial={catreEditor(seo, CAMPURI_SEO)}
        socialInitial={catreEditor(social, CAMPURI_SOCIAL)}
        domeniu={domain}
        template={getTemplate(site?.template as string | null)}
      />
    </div>
  );
}
