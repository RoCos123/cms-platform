"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, InlineError, StatusBadge } from "@/components/ui/feedback";
import { TextAreaField, TextField } from "@/components/ui/field";
import { ImageField, type ImageValue } from "@/components/ui/image-field";
import { MediaLibrary, type MediaUpload } from "@/components/ui/media-library";
import { RepeaterList } from "@/components/ui/repeater-list";
import { SaveBar } from "@/components/ui/save-bar";
import { SlugField } from "@/components/ui/slug-field";
import { useToast } from "@/components/ui/toast";
import { VariantPicker } from "@/components/ui/variant-picker";
import {
  PreviewCentrat,
  PreviewClasic,
  PreviewEditorial,
} from "@/components/ui/variant-previews";

type Serviciu = { id: string; titlu: string; descriere: string };

type Articol = {
  id: string;
  titlu: string;
  slug: string;
  stare: "draft" | "published" | "unpublished";
  actualizat: string;
};

const ARTICOLE: Articol[] = [
  { id: "1", titlu: "Cum recunoști anxietatea", slug: "cum-recunosti-anxietatea", stare: "published", actualizat: "2026-08-20" },
  { id: "2", titlu: "Terapia de cuplu: ce presupune", slug: "terapia-de-cuplu", stare: "published", actualizat: "2026-08-18" },
  { id: "3", titlu: "Despre burnout", slug: "despre-burnout", stare: "draft", actualizat: "2026-08-15" },
  { id: "4", titlu: "Somnul și sănătatea mintală", slug: "somnul-si-sanatatea-mintala", stare: "unpublished", actualizat: "2026-08-11" },
  { id: "5", titlu: "Primii pași în terapie", slug: "primii-pasi-in-terapie", stare: "published", actualizat: "2026-08-04" },
];

const VARIANTE = [
  {
    id: "clasic",
    label: "Clasic",
    description: "Titlu în stânga, imagine în dreapta.",
    preview: <PreviewClasic />,
  },
  {
    id: "centrat",
    label: "Centrat",
    description: "Totul pe mijloc, imagine mare dedesubt.",
    preview: <PreviewCentrat />,
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Două coloane, ca într-o revistă.",
    preview: <PreviewEditorial />,
  },
];

/** Imagini inventate pentru demonstrație — biblioteca reală citește din `uploads`. */
const IMAGINI_DEMO: MediaUpload[] = [
  {
    id: "demo-1",
    url: "/next.svg",
    filename: "cabinet-fereastra.svg",
    altText: "Fotoliu lângă fereastră, într-un cabinet luminos",
    sizeBytes: 184320,
    width: 1200,
    height: 800,
    createdAt: "2026-08-20T09:12:00.000Z",
    usageCount: 3,
  },
  {
    id: "demo-2",
    url: "/vercel.svg",
    filename: "portret.svg",
    altText: "",
    sizeBytes: 96000,
    width: 800,
    height: 800,
    createdAt: "2026-08-12T14:40:00.000Z",
    usageCount: 0,
  },
];

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody className="space-y-4">{children}</CardBody>
    </Card>
  );
}

export function ComponentGallery() {
  const toast = useToast();

  const [titlu, setTitlu] = useState("Psihoterapie pentru adulți");
  const [slug, setSlug] = useState("psihoterapie-pentru-adulti");
  const [varianta, setVarianta] = useState("clasic");
  const [imagine, setImagine] = useState<ImageValue | null>(null);
  const [bibliotecaDeschisa, setBibliotecaDeschisa] = useState(false);
  const [dialogDeschis, setDialogDeschis] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [servicii, setServicii] = useState<Serviciu[]>([
    { id: "s1", titlu: "Consiliere individuală", descriere: "50 de minute, față în față sau online." },
    { id: "s2", titlu: "Terapie de cuplu", descriere: "80 de minute, doar la cabinet." },
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section
        title="Câmpuri de text"
        description="Eticheta, ajutorul și eroarea sunt legate de control, ca să fie citite corect."
      >
        <TextField
          label="Titlul secțiunii"
          value={titlu}
          required
          onChange={(event) => {
            setTitlu(event.target.value);
            setIsDirty(true);
          }}
          hint="Apare ca titlu mare, primul lucru pe care îl citește vizitatorul."
        />
        <TextAreaField
          label="Descriere"
          defaultValue=""
          hint="Două-trei rânduri. Poate rămâne gol."
        />
        <TextField
          label="Adresă de email"
          defaultValue="scris gresit"
          error="Adresa nu pare validă. Verifică dacă are @ și un domeniu."
        />
      </Section>

      <Section
        title="Adresa paginii"
        description="Diacriticele românești devin corect litere simple: ș → s, ț → t, ă → a."
      >
        <SlugField
          value={slug}
          onChange={setSlug}
          sourceValue={titlu}
          prefix="/servicii/"
          label="Adresa paginii"
          checkAvailability={async (candidat) => {
            await new Promise((resolve) => setTimeout(resolve, 600));
            return candidat !== "contact";
          }}
        />
        <p className="text-xs text-muted-foreground">
          Scrie {"„contact”"} ca să vezi cum arată o adresă deja ocupată.
        </p>
      </Section>

      <Section
        title="Model de pagină"
        description="Miniaturi în locul descrierilor tehnice din originalul auditat."
      >
        <VariantPicker
          value={varianta}
          onChange={(id) => {
            setVarianta(id);
            setIsDirty(true);
          }}
          variants={VARIANTE}
          label="Cum vrei să arate secțiunea?"
          hint="Poți schimba oricând, fără să pierzi ce ai scris."
        />
      </Section>

      <Section
        title="Imagine"
        description="Textul alternativ se cere la vedere — ajută cititoarele de ecran și Google."
      >
        <ImageField
          label="Imaginea secțiunii"
          value={imagine}
          onChange={setImagine}
          onPickFromLibrary={() => setBibliotecaDeschisa(true)}
          hint="Formatele obișnuite de poză, până în 5 MB."
        />
        <Button variant="secondary" onClick={() => setBibliotecaDeschisa(true)}>
          Deschide biblioteca
        </Button>
        <MediaLibrary
          open={bibliotecaDeschisa}
          onClose={() => setBibliotecaDeschisa(false)}
          uploads={IMAGINI_DEMO}
          onSelect={(upload) => {
            setImagine({ uploadId: upload.id, url: upload.url, altText: upload.altText });
            setBibliotecaDeschisa(false);
            toast.show("Imagine aleasă din bibliotecă.", "success");
          }}
          onDelete={async () => {
            toast.show("În galerie ștergerea e doar simulată.", "info");
          }}
        />
      </Section>

      <Section
        title="Listă reordonabilă"
        description="Trage de mâner sau folosește butoanele sus/jos — drag-ul nu merge de la tastatură."
      >
        <RepeaterList
          items={servicii}
          onChange={(next) => {
            setServicii(next);
            setIsDirty(true);
          }}
          getKey={(item) => item.id}
          addLabel="+ Adaugă serviciu"
          itemLabel="serviciul"
          onAdd={() => ({ id: crypto.randomUUID(), titlu: "", descriere: "" })}
          renderItem={(item, index) => (
            <div className="space-y-3">
              <TextField
                label="Denumire"
                value={item.titlu}
                onChange={(event) =>
                  setServicii((current) =>
                    current.map((s, i) =>
                      i === index ? { ...s, titlu: event.target.value } : s,
                    ),
                  )
                }
              />
              <TextField
                label="Detalii"
                value={item.descriere}
                onChange={(event) =>
                  setServicii((current) =>
                    current.map((s, i) =>
                      i === index ? { ...s, descriere: event.target.value } : s,
                    ),
                  )
                }
              />
            </div>
          )}
        />
      </Section>

      <Section
        title="Stări și mesaje"
        description="Cele trei stări de publicare, explicate — în original nu scria nicăieri ce înseamnă."
      >
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="draft" />
          <StatusBadge status="published" />
          <StatusBadge status="unpublished" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast.show("Modificările au fost salvate.", "success")}>
            Notificare de succes
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show("Nu am putut salva. Încearcă din nou.", "danger")}
          >
            Notificare de eroare
          </Button>
          <Button variant="danger" onClick={() => setDialogDeschis(true)}>
            Cere confirmare
          </Button>
        </div>

        <InlineError>Un mesaj de eroare afișat direct în formular.</InlineError>

        <div className="rounded-base border border-border">
          <EmptyState
            title="Nicio imagine încărcată încă."
            description="Aici vor apărea pozele pe care le adaugi."
          />
        </div>

        <ConfirmDialog
          open={dialogDeschis}
          onOpenChange={setDialogDeschis}
          title="Ștergi serviciul?"
          description="Serviciul dispare de pe site imediat după salvare."
          warning="Imaginea folosită aici mai apare în 3 locuri."
          confirmLabel="Șterge definitiv"
          cancelLabel="Renunță"
          tone="danger"
          onConfirm={() => toast.show("Ștergere confirmată (simulată).", "info")}
        />
      </Section>

      <Section
        title="Tabel"
        description="Sortare, căutare și paginare — absente complet din panoul original."
      >
        <DataTable
          rows={ARTICOLE}
          getKey={(row) => row.id}
          label="Articole de blog"
          searchable
          searchPlaceholder="Caută după titlu…"
          pageSize={3}
          columns={[
            {
              key: "titlu",
              header: "Titlu",
              sortable: true,
              render: (row) => (
                <div>
                  <p className="font-medium text-foreground">{row.titlu}</p>
                  <p className="text-xs text-muted-foreground">/blog/{row.slug}</p>
                </div>
              ),
            },
            {
              key: "stare",
              header: "Stare",
              className: "w-32",
              render: (row) => <StatusBadge status={row.stare} />,
            },
            { key: "actualizat", header: "Actualizat", sortable: true, className: "w-32" },
          ]}
          actions={(row) => (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toast.show(`Ai deschis „${row.titlu}”.`, "info")}
            >
              Editează
            </Button>
          )}
        />
      </Section>

      <Section
        title="Bara de salvare"
        description="Apare la prima modificare și avertizează dacă pleci fără să salvezi."
      >
        <p className="text-sm text-muted-foreground">
          Modifică orice câmp de mai sus, apoi încearcă să pleci de pe pagină — sau
          folosește butonul de aici.
        </p>
        <Button variant="secondary" onClick={() => setIsDirty(true)}>
          Simulează o modificare
        </Button>
      </Section>

      <SaveBar
        isDirty={isDirty}
        isSaving={isSaving}
        onSave={async () => {
          setIsSaving(true);
          await new Promise((resolve) => setTimeout(resolve, 800));
          setIsSaving(false);
          setIsDirty(false);
          toast.show("Modificările au fost salvate.", "success");
        }}
        onDiscard={() => {
          setIsDirty(false);
          toast.show("Modificările au fost anulate.", "info");
        }}
      />
    </div>
  );
}
