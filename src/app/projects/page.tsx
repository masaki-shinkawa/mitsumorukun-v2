import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { listProjects } from "@/features/projects/api/projects-repository";
import { ProjectList } from "@/features/projects/components/ProjectList";

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">案件一覧</h1>
          <p className="text-sm text-muted-foreground">
            登録済みの案件を表示します
          </p>
        </div>
        <Link href="/projects/new" className={buttonVariants()}>
          新規案件
        </Link>
      </div>
      <ProjectList projects={projects} />
    </div>
  );
}
