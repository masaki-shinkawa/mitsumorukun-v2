import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ProjectForm } from "@/features/projects/components/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">新規案件</h1>
          <p className="text-sm text-muted-foreground">
            案件の基本情報を入力してください
          </p>
        </div>
        <Link href="/projects" className={buttonVariants({ variant: "outline" })}>
          一覧に戻る
        </Link>
      </div>
      <ProjectForm />
    </div>
  );
}
