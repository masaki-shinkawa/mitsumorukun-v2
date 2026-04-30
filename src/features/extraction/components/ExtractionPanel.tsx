"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ExtractionRun, Requirement } from "../api/extraction-repository";
import type { Granularity } from "@/generated/prisma/enums";

type Props = { projectId: string };

type ExtractionData = { runs: ExtractionRun[]; requirements: Requirement[] };

async function fetchExtraction(projectId: string, granularity: Granularity): Promise<ExtractionData> {
  const res = await fetch(`/api/projects/${projectId}/extraction?granularity=${granularity}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function startExtraction(
  projectId: string,
  granularity: Granularity,
): Promise<ExtractionData & { runId: string }> {
  const res = await fetch(`/api/projects/${projectId}/extraction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ granularity }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? res.statusText);
  return data;
}

const CATEGORY_LABEL: Record<string, string> = {
  functional: "機能",
  non_functional: "非機能",
  constraint: "制約",
  assumption: "前提",
  out_of_scope: "対象外",
};

const PRIORITY_LABEL: Record<string, string> = {
  must: "必須",
  should: "推奨",
  nice_to_have: "あれば良い",
  unknown: "不明",
};

const PRIORITY_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  must: "default",
  should: "secondary",
  nice_to_have: "outline",
  unknown: "outline",
};

const CONFIDENCE_LABEL: Record<string, string> = { high: "高", medium: "中", low: "低" };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    pending: { label: "待機中", className: "bg-yellow-100 text-yellow-800" },
    running: { label: "実行中", className: "bg-blue-100 text-blue-800" },
    completed: { label: "完了", className: "bg-green-100 text-green-800" },
    failed: { label: "失敗", className: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? { label: status, className: "" };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  );
}

function RequirementRow({ req }: { req: Requirement }) {
  const [open, setOpen] = useState(false);
  const evidence = req.evidence as Array<{
    documentId: string;
    fileName: string;
    uploadedAt: string;
    quote: string;
    anchor: { type: string; value: unknown };
  }>;
  const superseded = req.supersededEvidence as typeof evidence;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-14">
          {req.code}
        </span>
        <span className="flex-1 min-w-0">
          <span className="font-medium text-sm">{req.title}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {CATEGORY_LABEL[req.category] ?? req.category}
          </span>
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge variant={PRIORITY_VARIANT[req.priority] ?? "outline"} className="text-xs">
            {PRIORITY_LABEL[req.priority] ?? req.priority}
          </Badge>
          <span className="text-xs text-muted-foreground">
            確度: {CONFIDENCE_LABEL[req.confidence] ?? req.confidence}
          </span>
          <span className="text-muted-foreground text-xs ml-1">{open ? "▲" : "▼"}</span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="px-4 pb-4 pt-1 space-y-3 border-t bg-muted/20">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">説明</p>
            <p className="text-sm whitespace-pre-wrap">{req.description}</p>
          </div>

          {req.inputs && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">入力</p>
              <p className="text-sm whitespace-pre-wrap">{req.inputs}</p>
            </div>
          )}
          {req.outputs && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">出力</p>
              <p className="text-sm whitespace-pre-wrap">{req.outputs}</p>
            </div>
          )}

          {req.actors.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">アクター</p>
              <div className="flex flex-wrap gap-1">
                {req.actors.map((a: string) => (
                  <Badge key={a} variant="outline" className="text-xs">
                    {a}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {evidence.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">根拠</p>
              <div className="space-y-2">
                {evidence.map((ev, i) => (
                  <div key={i} className="rounded border bg-background p-2 text-xs">
                    <p className="font-medium text-muted-foreground mb-1">
                      {ev.fileName}{" "}
                      <span className="font-normal">
                        ({new Date(ev.uploadedAt).toLocaleDateString("ja-JP")})
                      </span>
                    </p>
                    <p className="whitespace-pre-wrap">{ev.quote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {superseded.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                古い根拠（参考情報）
              </p>
              <div className="space-y-2 opacity-60">
                {superseded.map((ev, i) => (
                  <div key={i} className="rounded border bg-background p-2 text-xs">
                    <p className="font-medium text-muted-foreground mb-1">
                      {ev.fileName}{" "}
                      <span className="font-normal">
                        ({new Date(ev.uploadedAt).toLocaleDateString("ja-JP")})
                      </span>
                    </p>
                    <p className="whitespace-pre-wrap">{ev.quote}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {req.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">補足</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{req.notes}</p>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function RequirementList({
  requirements,
  granularity,
}: {
  requirements: Requirement[];
  granularity: Granularity;
}) {
  const filtered = requirements.filter((r) => r.granularity === granularity);
  if (filtered.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        要件がありません。抽出を実行してください。
      </p>
    );
  }

  const grouped: Record<string, Requirement[]> = {};
  for (const req of filtered) {
    if (!grouped[req.category]) grouped[req.category] = [];
    grouped[req.category].push(req);
  }

  return (
    <div className="divide-y rounded-lg border">
      {Object.entries(grouped).map(([category, reqs]) => (
        <div key={category}>
          <div className="bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {CATEGORY_LABEL[category] ?? category}（{reqs.length}件）
          </div>
          {reqs.map((req) => (
            <RequirementRow key={req.id} req={req} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ExtractionPanel({ projectId }: Props) {
  const [activeGranularity, setActiveGranularity] = useState<Granularity>("rough");
  const [errorOpen, setErrorOpen] = useState(false);
  const queryClient = useQueryClient();

  const queryKey = ["extraction", projectId, activeGranularity] as const;

  const { data, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchExtraction(projectId, activeGranularity),
  });

  const countFor = (g: Granularity) => {
    const cached =
      g === "rough"
        ? queryClient.getQueryData<ExtractionData>(["extraction", projectId, "rough"])
        : queryClient.getQueryData<ExtractionData>(["extraction", projectId, "detail"]);
    return cached?.requirements.filter((r) => r.granularity === g).length ?? 0;
  };

  const mutation = useMutation({
    mutationFn: (granularity: Granularity) => startExtraction(projectId, granularity),
    onMutate: (granularity) => {
      // optimistically mark the run as running so the UI reflects it immediately,
      // even if the user navigates away and comes back before the request finishes
      queryClient.setQueryData<ExtractionData>(["extraction", projectId, granularity], (prev) => {
        const optimisticRun: ExtractionRun = {
          id: "__optimistic__",
          projectId,
          granularity,
          status: "running",
          model: "",
          documentSnapshot: {},
          tokenUsage: null,
          errorMessage: null,
          startedAt: new Date(),
          finishedAt: null,
        };
        return {
          runs: [optimisticRun, ...(prev?.runs ?? [])],
          requirements: prev?.requirements ?? [],
        };
      });
    },
    onSuccess: (result, granularity) => {
      queryClient.setQueryData(["extraction", projectId, granularity], {
        runs: result.runs,
        requirements: result.requirements,
      });
      setActiveGranularity(granularity);
    },
    onError: (_err, granularity) => {
      // remove the optimistic run on error so stale "running" doesn't linger
      queryClient.invalidateQueries({ queryKey: ["extraction", projectId, granularity] });
    },
  });

  const handleStart = (granularity: Granularity) => {
    mutation.mutate(granularity);
  };

  const handleGranularityChange = (g: Granularity) => {
    setActiveGranularity(g);
  };

  const runs = data?.runs ?? [];
  const requirements = data?.requirements ?? [];
  const latestRun = runs.find((r) => r.granularity === activeGranularity);
  const latestFailed = latestRun?.status === "failed" ? latestRun : null;

  // disabled when mutation is in-flight OR when DB already has a running job
  // (the latter catches the "navigated away and came back" case via optimistic cache)
  const isRoughRunning =
    (mutation.isPending && mutation.variables === "rough") ||
    runs.some((r) => r.granularity === "rough" && r.status === "running");
  const isDetailRunning =
    (mutation.isPending && mutation.variables === "detail") ||
    runs.some((r) => r.granularity === "detail" && r.status === "running");
  const isRunning = isRoughRunning || isDetailRunning;

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="default" disabled={isRunning} onClick={() => handleStart("rough")}>
          {isRoughRunning ? "実行中…" : "概算抽出を実行"}
        </Button>
        <Button variant="outline" disabled={isRunning} onClick={() => handleStart("detail")}>
          {isDetailRunning ? "実行中…" : "詳細抽出を実行"}
        </Button>
      </div>

      {/* mutation error */}
      {mutation.isError && (
        <p className="text-sm text-destructive">{mutation.error.message}</p>
      )}

      {/* Latest run status */}
      {latestRun && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <StatusBadge status={latestRun.status} />
          <span>
            {latestRun.granularity === "rough" ? "概算" : "詳細"} ·{" "}
            {new Date(latestRun.startedAt).toLocaleString("ja-JP")}
          </span>
          {latestRun.tokenUsage && (
            <span className="text-xs">
              ({(latestRun.tokenUsage as { totalTokens?: number }).totalTokens ?? 0} tokens)
            </span>
          )}
        </div>
      )}

      {/* Error banner */}
      {latestFailed && (
        <Alert variant="destructive">
          <AlertTitle className="flex items-center justify-between">
            <span>
              抽出失敗 · {new Date(latestFailed.startedAt).toLocaleString("ja-JP")} ·{" "}
              {latestFailed.model}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() => handleStart(activeGranularity)}
              disabled={isRunning}
            >
              再実行
            </Button>
          </AlertTitle>
          <AlertDescription>
            <p className="truncate">{latestFailed.errorMessage}</p>
            <Collapsible open={errorOpen} onOpenChange={setErrorOpen}>
              <CollapsibleTrigger className="text-xs underline mt-1">
                {errorOpen ? "詳細を隠す" : "詳細を表示"}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 text-xs whitespace-pre-wrap break-all">
                  {latestFailed.errorMessage}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          </AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Granularity tabs */}
      <div className="flex gap-2">
        {(["rough", "detail"] as Granularity[]).map((g) => {
          const count = countFor(g);
          return (
            <button
              key={g}
              type="button"
              onClick={() => handleGranularityChange(g)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                activeGranularity === g
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted border-border"
              }`}
            >
              {g === "rough" ? "概算" : "詳細"}
              {count > 0 && <span className="ml-1.5 text-xs opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Requirements list */}
      {isFetching && requirements.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">読み込み中…</p>
      ) : (
        <RequirementList requirements={requirements} granularity={activeGranularity} />
      )}
    </div>
  );
}
