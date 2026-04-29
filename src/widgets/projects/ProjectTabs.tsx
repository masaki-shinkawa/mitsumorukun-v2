"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsPanel } from "@/features/documents/components/DocumentsPanel";
import type { DocumentMeta } from "@/features/documents/types/document";
import { ExtractionPanel } from "@/features/extraction/components/ExtractionPanel";
import { ProjectSettingsPanel } from "@/features/project-settings/components/ProjectSettingsPanel";
import { EstimateRoughPanel } from "@/features/estimate-rough/components/EstimateRoughPanel";
import { EstimateDetailPanel } from "@/features/estimate-detail/components/EstimateDetailPanel";
import { QaPanel } from "@/features/qa/components/QaPanel";

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
        <TabsTrigger value="qa">QA</TabsTrigger>
      </TabsList>

      <TabsContent value="files" className="mt-4">
        <DocumentsPanel projectId={projectId} documents={documents} />
      </TabsContent>

      <TabsContent value="extraction" className="mt-4">
        <ExtractionPanel />
      </TabsContent>

      <TabsContent value="settings" className="mt-4">
        <ProjectSettingsPanel />
      </TabsContent>

      <TabsContent value="estimate-rough" className="mt-4">
        <EstimateRoughPanel />
      </TabsContent>

      <TabsContent value="estimate-detail" className="mt-4">
        <EstimateDetailPanel />
      </TabsContent>

      <TabsContent value="qa" className="mt-4">
        <QaPanel />
      </TabsContent>
    </Tabs>
  );
}
