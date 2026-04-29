import { DocumentUploader } from "./DocumentUploader";
import { DocumentList } from "./DocumentList";
import type { DocumentMeta } from "../types/document";

type Props = {
  projectId: string;
  documents: DocumentMeta[];
};

export function DocumentsPanel({ projectId, documents }: Props) {
  return (
    <div className="space-y-3">
      <DocumentUploader projectId={projectId} />
      <DocumentList projectId={projectId} documents={documents} />
    </div>
  );
}
