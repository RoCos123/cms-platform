import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import {
  descrieIntrarea,
  grupeazaPeZile,
  oraIntrarii,
  type IntrareJurnal,
} from "@/lib/activitate";
import type { ActiuneAudit, EntitateAudit } from "@/lib/audit";

export const metadata = { title: "Activitate" };

/** Câte intrări se aduc odată. Paginarea vine când un client chiar are atâtea. */
const LIMITA = 100;

export default async function ActivitatePage() {
  const session = await verifySession();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_log")
    .select("id, action, entity_type, diff, created_at, actor_id")
    .eq("site_id", session.siteId)
    .order("created_at", { ascending: false })
    .limit(LIMITA);

  if (error) console.error("Citirea jurnalului a eșuat:", error);

  const randuri = (data ?? []) as unknown as {
    id: string;
    action: ActiuneAudit;
    entity_type: EntitateAudit;
    diff: { rezumat?: string } | null;
    created_at: string;
    actor_id: string | null;
  }[];

  const autori = await emailurileAutorilor(randuri.map((r) => r.actor_id));

  const intrari: IntrareJurnal[] = randuri.map((rand) => ({
    id: rand.id,
    text: descrieIntrarea({
      actiune: rand.action,
      entitate: rand.entity_type,
      rezumat: rand.diff?.rezumat,
    }),
    /**
     * Numele celui care a făcut modificarea apare doar când NU e cel care se
     * uită acum. Pe un cabinet cu un singur cont — adică aproape toate —
     * altfel fiecare rând ar repeta același email, degeaba.
     */
    autor:
      rand.actor_id && rand.actor_id !== session.userId
        ? (autori.get(rand.actor_id) ?? "un alt cont")
        : undefined,
    cand: rand.created_at,
  }));

  const zile = grupeazaPeZile(intrari, new Date());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Panou
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-foreground">Activitate</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Ce s-a schimbat pe site și când. Folosește-l când ceva arată altfel decât
          ții minte — sau ca să vezi unde ai rămas.
        </p>
      </div>

      {zile.length === 0 ? (
        <div className="rounded-base border border-border bg-surface p-6">
          <p className="text-sm text-foreground">Încă nu s-a întâmplat nimic.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aici apar modificările pe măsură ce le faci: o pagină publicată, un articol
            scris, o setare schimbată.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {zile.map((zi) => (
            <section key={zi.cheie} className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {zi.eticheta}
              </h2>

              <ol className="space-y-px overflow-hidden rounded-base border border-border">
                {zi.intrari.map((intrare) => (
                  <li key={intrare.id} className="flex gap-x-3 bg-surface px-4 py-3">
                    {/*
                      Ora e scrisă cu cifre de aceeași lățime, ca să se alinieze
                      pe coloană. Altfel „11:05” și „09:32” ies decalate, iar
                      ochiul nu mai poate coborî drept pe listă.
                    */}
                    <time
                      dateTime={intrare.cand}
                      className="w-12 shrink-0 text-sm tabular-nums text-muted-foreground"
                    >
                      {oraIntrarii(intrare.cand)}
                    </time>

                    {/*
                      Pe telefon autorul coboară sub text; de la `sm` în sus stă
                      la capătul rândului. Puse pe același rând la 390px, cele
                      două se certau pe lățime și textul se rupea pe o coloană
                      de trei cuvinte — verificat, arăta stricat.
                    */}
                    <div className="flex min-w-0 flex-1 flex-col gap-y-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-x-4">
                      <span className="text-sm text-foreground">{intrare.text}</span>
                      {intrare.autor && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {intrare.autor}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}

      {intrari.length === LIMITA && (
        <p className="text-sm text-muted-foreground">
          Se arată cele mai recente {LIMITA} de modificări.
        </p>
      )}
    </div>
  );
}

/**
 * Emailurile celor care au făcut modificările, într-o singură interogare.
 *
 * Două cereri în loc de o îmbinare, ca peste tot în proiect: `actor_id` chiar e
 * cheie externă, dar forma aia de interogare se rupe tăcut dacă se schimbă
 * numele constrângerii — vezi `coperti()` din blog-public.ts.
 */
async function emailurileAutorilor(iduri: (string | null)[]): Promise<Map<string, string>> {
  const cerute = [...new Set(iduri.filter((id): id is string => Boolean(id)))];
  if (cerute.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.from("users").select("id, email").in("id", cerute);

  if (error) {
    // Un rând fără nume e tot lizibil; un ecran căzut, nu.
    console.error("Citirea autorilor din jurnal a eșuat:", error);
    return new Map();
  }

  return new Map((data ?? []).map((rand) => [rand.id as string, rand.email as string]));
}
