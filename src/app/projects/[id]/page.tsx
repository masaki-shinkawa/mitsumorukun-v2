import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { getProject } from "@/features/projects/api/projects-repository";
import { ProjectDetail } from "@/features/projects/components/ProjectDetail";
import { DeleteProjectButton } from "@/features/projects/components/DeleteProjectButton";
import { ProjectTabs } from "@/features/projects/components/ProjectTabs";
import { listDocuments } from "@/features/documents/api/documents-repository";

type Params = Promise<{ id: string }>;

export default async function ProjectDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const documents = await listDocuments(id);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <ProjectDetail project={project} />
        <div className="flex gap-2">
          <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
            一覧に戻る
          </Link>
          <DeleteProjectButton projectId={project.id} projectName={project.name} />
        </div>
      </div>

      <ProjectTabs projectId={project.id} documents={documents} />
    </div>
  );
}
