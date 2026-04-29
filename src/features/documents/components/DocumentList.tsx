"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentMeta } from "../types/document";
import { deleteDocumentAction } from "../api/actions";

type Props = {
  projectId: string;
  documents: DocumentMeta[];
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function DocumentList({ projectId, documents }: Props) {
  const [isPending, startTransition] = useTransition();

  if (documents.length === 0) {
    return (
      <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        まだ資料がアップロードされていません。
      </p>
    );
  }

  return (
    <ul className="divide-y rounded-md border">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{doc.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(doc.size)} ・ {doc.contentType || "unknown"} ・{" "}
              {new Date(doc.uploadedAt).toLocaleString("ja-JP")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              if (!confirm(`「${doc.fileName}」を削除しますか？`)) return;
              startTransition(async () => {
                await deleteDocumentAction({ projectId, documentId: doc.id });
              });
            }}
          >
            削除
          </Button>
        </li>
      ))}
    </ul>
  );
}
