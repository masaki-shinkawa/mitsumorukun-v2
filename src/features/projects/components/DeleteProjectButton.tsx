"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteProjectAction } from "../api/actions";

type Props = {
  projectId: string;
  projectName: string;
};

export function DeleteProjectButton({ projectId, projectName }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() => {
        if (
          !confirm(
            `案件「${projectName}」を削除しますか？\n資料も含めて完全に削除され、元に戻せません。`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          await deleteProjectAction(projectId);
        });
      }}
    >
      {isPending ? "削除中…" : "案件を削除"}
    </Button>
  );
}
