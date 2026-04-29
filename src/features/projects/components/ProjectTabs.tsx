"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUploader } from "@/features/documents/components/DocumentUploader";
import { DocumentList } from "@/features/documents/components/DocumentList";
import type { DocumentMeta } from "@/features/documents/types/document";

type Props = {
  projectId: string;
  documents: DocumentMeta[];
};

export function ProjectTabs({ projectId, documents }: Props) {
  return (
    <Tabs defaultValue="files">
      <TabsList>
        <TabsTrigger value="files">ファイル</TabsTrigger>
        <TabsTrigger value="extraction">要件抽出</TabsTrigger>
        <TabsTrigger value="settings">プロジェクト設定</TabsTrigger>
        <TabsTrigger value="estimate-rough">概算見積もり</TabsTrigger>
        <TabsTrigger value="estimate-detail">詳細見積もり</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-4 space-y-3">
        <DocumentUploader projectId={projectId} />
        <DocumentList projectId={projectId} documents={documents} />
      </TabsContent>

      <TabsContent value="extraction" className="mt-4">
        <p className="text-sm text-muted-foreground">要件抽出（準備中）</p>
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <p className="text-sm text-muted-foreground">プロジェクト設定（準備中）</p>
      </TabsContent>

      <TabsContent value="estimate-rough" className="mt-4">
        <p className="text-sm text-muted-foreground">概算見積もり（準備中）</p>
      </TabsContent>

      <TabsContent value="estimate-detail" className="mt-4">
        <p className="text-sm text-muted-foreground">詳細見積もり（準備中）</p>
      </TabsContent>
    </Tabs>
  );
}
