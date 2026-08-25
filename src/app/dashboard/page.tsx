import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export default async function DashboardOverviewPage() {
  const session = await verifySession();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Bine ai revenit</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Conectat ca {session.email}. Restul ecranelor (secțiuni, blog, programări…) vin
          în fazele următoare.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader
          title="Componente"
          description="Galeria pieselor din care se construiesc ecranele de editare."
        />
        <CardBody>
          <p className="mb-4 text-sm text-muted-foreground">
            Fiecare componentă e funcțională — le poți încerca pe rând înainte să apară
            în ecranele reale.
          </p>
          {/* Link, nu Button: e navigare, deci trebuie să fie o ancoră reală
              (deschidere în tab nou, copiere adresă, cititoare de ecran). */}
          <Link
            href="/dashboard/componente"
            className="inline-flex h-9 items-center justify-center rounded-base bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Deschide galeria
          </Link>
        </CardBody>
      </Card>
    </div>
  );
}
