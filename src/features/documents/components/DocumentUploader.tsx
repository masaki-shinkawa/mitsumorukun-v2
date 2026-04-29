"use client";

import { useCallback, useRef, useState, useTransition, type DragEvent } from "react";
import { uploadDocumentsAction } from "../api/actions";

type Props = {
  projectId: string;
};

export function DocumentUploader({ projectId }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (list.length === 0) return;
      const formData = new FormData();
      for (const f of list) formData.append("files", f);

      setMessage(null);
      startTransition(async () => {
        const res = await uploadDocumentsAction(projectId, formData);
        const parts: string[] = [];
        if (res.added > 0) parts.push(`${res.added} 件アップロード`);
        if (res.skipped.length > 0)
          parts.push(`スキップ: ${res.skipped.join(", ")}`);
        setMessage(parts.join(" / ") || "アップロード対象がありません");
      });
    },
    [projectId],
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
    },
    [upload],
  );

  return (
    <div className="space-y-3">
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        className={[
          "block rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          isDragging
            ? "border-foreground bg-muted"
            : "border-muted-foreground/30 hover:border-muted-foreground/60",
          isPending && "opacity-60 pointer-events-none",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p className="text-sm">
          {isPending
            ? "アップロード中…"
            : "ファイルをドラッグ＆ドロップ、またはタップして選択"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          複数ファイル対応 / 最大 20MB / MVP は Markdown 推奨
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          disabled={isPending}
          className="sr-only"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      <div
        className="text-xs text-muted-foreground min-h-4"
        aria-live="polite"
        role="status"
      >
        {message}
      </div>
    </div>
  );
}
