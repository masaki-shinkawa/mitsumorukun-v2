import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getProject } from "@/features/projects/api/projects-repository";
import { ProjectDetail } from "@/features/projects/components/ProjectDetail";
import { listDocuments } from "@/features/documents/api/documents-repository";
import { DocumentUploader } from "@/features/documents/components/DocumentUploader";
import { DocumentList } from "@/features/documents/components/DocumentList";

type Params = Promise<{ id: string }>;

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const documents = await listDocuments(id);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <ProjectDetail project={project} />
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          一覧に戻る
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">RFP / 関連資料</h2>
        <DocumentUploader projectId={project.id} />
        <DocumentList projectId={project.id} documents={documents} />
      </section>
    </div>
  );
}
