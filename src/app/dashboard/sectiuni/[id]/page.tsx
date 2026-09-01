import { notFound } from "next/navigation";
import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { metaSectiune } from "@/lib/sectiuni";
import { catreEditor } from "@/lib/sectiuni-editare";
import { getTemplate, type SectionTone } from "@/lib/templates";
import { serviciiPublicate } from "@/lib/servicii-publice";
import { articolePublicate } from "@/lib/blog-public";
import { paginaEsteActiva, type Pagini } from "@/lib/setari";
import { COLOANE_MODULE, moduleleSiteului } from "@/lib/module";
import { oreDeAratatPePrimaPagina } from "@/lib/programari-publice";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EditorSectiune } from "./editor";
import { rescrieAdresele } from "@/lib/imagini";
import { adresaImaginii } from "@/lib/imagini-adrese";

export default async function EditorSectiunePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await verifySession();
  const supabase = await createClient();

  const { data: rand } = await supabase
    .from("site_content")
    .select("id, key, tone, data")
    .eq("id", id)
    .eq("site_id", session.siteId)
    .maybeSingle();

  // `.eq("site_id", …)` peste RLS: nu e redundant, e explicit. O secțiune a
  // altui client dispare aici la fel ca una inexistentă — 404, nu „interzis”,
  // ca să nu confirmăm nici măcar că id-ul există undeva.
  if (!rand) notFound();

  // Aceeași rescriere ca pe site (src/app/page.tsx): previzualizarea din editor
  // trebuie să arate poza pe adresa ei de acum, nu pe cea veche din JSON.
  const continut = rescrieAdresele(rand.data, adresaImaginii);

  const meta = metaSectiune(rand.key as string);

  if (!meta) {
    return (
      <Card className="max-w-xl">
        <CardHeader
          title="Secțiune necunoscută"
          description={`Panoul nu știe să editeze secțiunea „${rand.key}”.`}
        />
        <CardBody>
          <p className="text-sm text-muted-foreground">
            O poți muta sau ascunde din lista de secțiuni, dar conținutul ei nu poate fi
            modificat de aici.
          </p>
          <Link href="/dashboard/sectiuni" className="mt-4 inline-block text-sm underline">
            ← Toate secțiunile
          </Link>
        </CardBody>
      </Card>
    );
  }

  const [{ data: site }, articole, servicii, { data: setari }] = await Promise.all([
    supabase.from("sites").select(`template, ${COLOANE_MODULE}`).eq("id", session.siteId).single(),
    // Previzualizarea „Articolelor recente” arată articole adevărate, nu
    // exemple: altfel clientul n-ar avea cum să vadă că secțiunea dispare
    // singură când nu există niciun articol publicat.
    articolePublicate(session.siteId),
    // Doar cele publicate, ca previzualizarea să arate exact ce vede un
    // vizitator — inclusiv atunci când asta înseamnă „nimic încă”.
    serviciiPublicate(session.siteId),
    supabase.from("site_settings").select("pagini").eq("site_id", session.siteId).maybeSingle(),
  ]);

  // Aceleași ore ca pe site: previzualizarea secțiunii de programare trebuie să
  // arate exact ce vede un vizitator — inclusiv că se stinge fără ore libere.
  const oreProgramare = await oreDeAratatPePrimaPagina(
    session.siteId,
    moduleleSiteului(site).programari,
  );

  return (
    <EditorSectiune
      id={id}
      meta={meta}
      tone={(rand.tone as SectionTone) ?? "deschis"}
      valoareInitiala={catreEditor(continut, meta.campuri)}
      template={getTemplate(site?.template as string | null)}
      // Goale când blogul e oprit — exact ca pe site, ca previzualizarea să nu
      // arate o secțiune care în realitate nu apare.
      articole={paginaEsteActiva((setari?.pagini ?? {}) as Pagini, "blog") ? articole : []}
      servicii={servicii}
      paginaServiciiActiva={paginaEsteActiva((setari?.pagini ?? {}) as Pagini, "servicii")}
      oreProgramare={oreProgramare}
    />
  );
}
