import { Badge } from "@/components/ui/badge";
import type { Project } from "../types/project";

type Props = {
  project: Project;
};

export function ProjectDetail({ project }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <Badge variant="secondary">POC</Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        作成: {new Date(project.createdAt).toLocaleString("ja-JP")}
      </div>
      {project.description && (
        <p className="text-sm whitespace-pre-wrap">{project.description}</p>
      )}
    </div>
  );
}
