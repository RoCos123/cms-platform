import Link from "next/link";
import { getTenant, verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/cn";
import { ListaMesaje, type Mesaj } from "./lista-mesaje";

export const metadata = { title: "Mesaje" };

type Vedere = "toate" | "necitite" | "sterse";

const VEDERI: { cheie: Vedere; eticheta: string }[] = [
  { cheie: "toate", eticheta: "Toate" },
  { cheie: "necitite", eticheta: "Necitite" },
  { cheie: "sterse", eticheta: "Șterse" },
];

/** Câte mesaje se aduc odată. Paginarea vine când un client chiar are atâtea. */
const LIMITA = 100;

export default async function MesajePage({
  searchParams,
}: {
  searchParams: Promise<{ vedere?: string }>;
}) {
  const session = await verifySession();
  const { domain } = await getTenant();
  const supabase = await createClient();

  const cerut = (await searchParams).vedere;
  const vedere: Vedere = VEDERI.some((v) => v.cheie === cerut) ? (cerut as Vedere) : "toate";

  let interogare = supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at, read_at, deleted_at")
    .eq("site_id", session.siteId)
    .order("created_at", { ascending: false })
    .limit(LIMITA);

  if (vedere === "sterse") {
    interogare = interogare.not("deleted_at", "is", null);
  } else {
    interogare = interogare.is("deleted_at", null);
    if (vedere === "necitite") interogare = interogare.is("read_at", null);
  }

  const [{ data, error }, { count: necitite }] = await Promise.all([
    interogare,
    supabase
      .from("contact_messages")
      .select("id", { head: true, count: "exact" })
      .eq("site_id", session.siteId)
      .is("deleted_at", null)
      .is("read_at", null),
  ]);

  if (error) console.error("Citirea mesajelor a eșuat:", error);

  const mesaje: Mesaj[] = (data ?? []).map((rand) => ({
    id: rand.id as string,
    nume: rand.name as string,
    email: rand.email as string,
    text: rand.message as string,
    primitLa: rand.created_at as string,
    citit: rand.read_at !== null,
    sters: rand.deleted_at !== null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Mesaje</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ce ți se trimite prin formularul de contact de pe site. Deocamdată nu pleacă
          nicio notificare pe email, deci merită să treci pe aici din când în când.
        </p>
      </div>

      <nav aria-label="Filtrează mesajele" className="flex flex-wrap gap-2">
        {VEDERI.map((optiune) => {
          const activa = optiune.cheie === vedere;
          return (
            <Link
              key={optiune.cheie}
              href={optiune.cheie === "toate" ? "/dashboard/mesaje" : `/dashboard/mesaje?vedere=${optiune.cheie}`}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "inline-flex h-8 items-center gap-2 rounded-base px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                activa
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-foreground hover:bg-surface-hover",
              )}
            >
              {optiune.eticheta}
              {optiune.cheie === "necitite" && (necitite ?? 0) > 0 && (
                <span
                  className={cn(
                    "rounded-base px-1.5 text-xs",
                    activa ? "bg-primary-foreground/20" : "bg-primary text-primary-foreground",
                  )}
                >
                  {necitite}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <ListaMesaje mesaje={mesaje} vedere={vedere} domeniu={domain} />

      {mesaje.length === LIMITA && (
        <p className="text-sm text-muted-foreground">
          Se arată cele mai recente {LIMITA} de mesaje.
        </p>
      )}
    </div>
  );
}
