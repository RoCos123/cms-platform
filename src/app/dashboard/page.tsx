import Link from "next/link";
import { verifySession, getTenant } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

const LINK_BUTON =
  "inline-flex h-9 items-center justify-center rounded-base bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const LINK_SECUNDAR =
  "inline-flex h-9 items-center justify-center rounded-base border border-border bg-surface px-4 text-sm font-medium text-foreground hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export default async function DashboardOverviewPage() {
  const session = await verifySession();
  const { domain } = await getTenant();
  const supabase = await createClient();

  const { count: sectiuni } = await supabase
    .from("site_content")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId)
    .eq("visible", true);

  const { count: demonstrative } = await supabase
    .from("site_content")
    .select("id", { head: true, count: "exact" })
    .eq("site_id", session.siteId)
    .eq("is_demo", true);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Bine ai revenit</h1>
        <p className="mt-2 text-sm text-muted-foreground">Conectat ca {session.email}.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader
            title="Pagina principală"
            description={`${sectiuni ?? 0} secțiuni vizibile pe site.`}
          />
          <CardBody>
            <p className="mb-4 text-sm text-muted-foreground">
              Textele, ordinea și ce se vede pe prima pagină. Cât scrii, vezi alături cum
              arată pe site.
            </p>
            {/* Link, nu Button: e navigare, deci trebuie să fie o ancoră reală
                (deschidere în tab nou, copiere adresă, cititoare de ecran). */}
            <Link href="/dashboard/sectiuni" className={LINK_BUTON}>
              Editează pagina principală
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Site-ul tău" description={domain} />
          <CardBody>
            <p className="mb-4 text-sm text-muted-foreground">
              Așa te văd oamenii care ajung la tine. Odată conectat, ai și pe site un buton
              din care revii aici.
            </p>
            <Link href="/" target="_blank" className={LINK_SECUNDAR}>
              Deschide site-ul
            </Link>
          </CardBody>
        </Card>
      </div>

      {(demonstrative ?? 0) > 0 && (
        <Card>
          <CardHeader
            title="Ai încă text demonstrativ pe site"
            description={`${demonstrative} secțiuni conțin textele de exemplu puse la pornire.`}
          />
          <CardBody>
            <p className="text-sm text-muted-foreground">
              Sunt marcate cu „text demonstrativ” în lista de secțiuni. Înlocuiește-le cu
              textele tale înainte ca site-ul să ajungă la clienți — un text de exemplu
              lăsat pe pagină spune mai mult decât o pagină goală, și nu ce ți-ai dori.
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
