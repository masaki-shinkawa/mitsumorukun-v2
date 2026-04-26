import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Project } from "../types/project";

type Props = {
  projects: Project[];
};

export function ProjectList({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        まだ案件がありません。「新規案件」から作成してください。
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`} className="block">
          <Card className="h-full transition-colors hover:border-foreground/40">
            <CardHeader>
              <CardTitle className="line-clamp-1">{project.name}</CardTitle>
              <CardDescription>
                {new Date(project.createdAt).toLocaleString("ja-JP")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3 text-sm text-muted-foreground whitespace-pre-wrap">
                {project.description || "（説明なし）"}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
