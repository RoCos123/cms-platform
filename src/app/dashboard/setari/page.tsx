import { getTenant, verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { CAMPURI_CABINET, CAMPURI_SEO, type Brand, type Seo } from "@/lib/setari";
import { catreEditor } from "@/lib/sectiuni-editare";
import { FormularSetari } from "./formular";

export const metadata = { title: "Setări" };

export default async function SetariPage() {
  const session = await verifySession();
  const { domain } = await getTenant();
  const supabase = await createClient();

  const [{ data: site }, { data: setari }] = await Promise.all([
    supabase.from("sites").select("name").eq("id", session.siteId).single(),
    supabase.from("site_settings").select("brand, seo").eq("site_id", session.siteId).maybeSingle(),
  ]);

  const brand = (setari?.brand ?? {}) as Brand;
  const seo = (setari?.seo ?? {}) as Seo;

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

      <FormularSetari
        // Numele stă în alt tabel decât restul, dar în formular e un câmp ca
        // oricare altul: pentru client sunt același lucru.
        cabinetInitial={catreEditor({ ...brand, nume: site?.name ?? "" }, CAMPURI_CABINET)}
        seoInitial={catreEditor(seo, CAMPURI_SEO)}
        domeniu={domain}
      />
    </div>
  );
}
