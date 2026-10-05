import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { paginaEsteActiva, type Pagini } from "@/lib/setari";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { StatusValue } from "@/components/ui/feedback";
import { LinkVeziPeSite } from "@/components/dashboard/link-vezi-pe-site";
import { ListaArticolePanou, type RandArticol } from "./lista";
import { ComutatorBlog } from "./comutator-blog";
import { creeazaArticol } from "./actions";
import { MesajLimita } from "@/components/dashboard/mesaj-limita";
import { MAXIM_ARTICOLE } from "@/lib/limite-panou";

export const metadata = { title: "Blog" };

const STARI: StatusValue[] = ["draft", "published", "unpublished"];

function stare(brut: unknown): StatusValue {
  return STARI.includes(brut as StatusValue) ? (brut as StatusValue) : "draft";
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ eroare?: string }>;
}) {
  const { eroare } = await searchParams;

  const session = await verifySession();
  const supabase = await createClient();

  const [{ data, error }, { data: setari }] = await Promise.all([
    supabase
      .from("blog_articles")
      .select("id, title, excerpt, status, published_at")
      .eq("site_id", session.siteId)
      // Ordinea de pe site, nu „după ultima atingere": lista din panou și blogul
      // public trebuie să arate la fel, altfel „mută mai sus" n-ar avea un
      // rezultat pe care să-l vezi (vezi `ordine-articole.ts`).
      .order("position", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("site_settings")
      .select("pagini")
      .eq("site_id", session.siteId)
      .maybeSingle(),
  ]);

  if (error) console.error("Citirea articolelor a eșuat:", error);

  const blogActiv = paginaEsteActiva((setari?.pagini ?? {}) as Pagini, "blog");

  const randuri: RandArticol[] = (data ?? []).map((rand) => ({
    id: rand.id as string,
    titlu: rand.title as string,
    extras: (rand.excerpt as string) ?? "",
    stare: stare(rand.status),
    publicatLa: rand.published_at as string | null,
  }));

  const publicate = randuri.filter((rand) => rand.stare === "published").length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Panou
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-foreground">Blog</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Articolele tale, în ordinea în care apar pe site: primul din listă e
            primul pe pagina de blog, iar cele de sus apar și pe prima pagină, la
            „Articole recente”. Din meniul „⋯” de pe fiecare rând îl poți muta mai
            sus sau mai jos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Linkul apare doar când există unde duce — altfel ar da în perete. */}
          {blogActiv && publicate > 0 && (
            <LinkVeziPeSite href="/blog" eticheta="Vezi blogul pe site" />
          )}

          {/* Formular, nu link: creează un rând în baza de date, deci e o acțiune. */}
          <form action={creeazaArticol}>
            <Button type="submit">+ Articol nou</Button>
          </form>
        </div>
      </div>

      <MesajLimita
        eroare={eroare}
        maxim={MAXIM_ARTICOLE}
        singular="articol"
        plural="articole"
      />

      {randuri.length === 0 ? (
        <Card className="max-w-xl">
          <CardHeader
            title="Niciun articol încă"
            description="Secțiunea „Articole recente” nu apare pe site cât timp nu ai niciun articol publicat."
          />
          <CardBody>
            <p className="text-sm text-muted-foreground">
              Un blog ajută cel mai mult când răspunde la ce te întreabă oamenii
              oricum, în prima ședință. Începe cu o singură întrebare de-asta,
              scrisă pe îndelete.
            </p>
          </CardBody>
        </Card>
      ) : (
        <>
          <ListaArticolePanou initiale={randuri} />
          <ComutatorBlog activInitial={blogActiv} />
        </>
      )}
    </div>
  );
}
