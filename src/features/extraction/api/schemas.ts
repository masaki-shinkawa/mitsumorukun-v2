import { z } from "zod";

export const anchorSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("heading-path"),
    value: z.array(z.string()),
  }),
  z.object({
    type: z.literal("page"),
    value: z.number(),
  }),
  z.object({
    type: z.literal("line"),
    value: z.number(),
  }),
]);

export const evidenceSchema = z.object({
  documentId: z.string(),
  fileName: z.string(),
  uploadedAt: z.string(),
  quote: z.string(),
  anchor: anchorSchema,
});

export type Evidence = z.infer<typeof evidenceSchema>;

export const requirementOutputSchema = z.object({
  category: z.enum(["functional", "non_functional", "constraint", "assumption", "out_of_scope"]),
  parentTitle: z.string().nullish().transform((v) => v ?? undefined),
  title: z.string(),
  description: z.string(),
  inputs: z.string().nullish().transform((v) => v ?? undefined),
  outputs: z.string().nullish().transform((v) => v ?? undefined),
  actors: z.array(z.string()).default([]),
  priority: z.enum(["must", "should", "nice_to_have", "unknown"]).default("unknown"),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  evidence: z.array(evidenceSchema).default([]),
  supersededEvidence: z.array(evidenceSchema).default([]),
  notes: z.string().nullish().transform((v) => v ?? undefined),
});

export type RequirementOutput = z.infer<typeof requirementOutputSchema>;

export const llmOutputSchema = z.object({
  requirements: z.array(requirementOutputSchema),
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;
