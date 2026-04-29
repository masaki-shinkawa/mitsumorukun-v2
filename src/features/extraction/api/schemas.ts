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
  parentTitle: z.string().optional(),
  title: z.string(),
  description: z.string(),
  inputs: z.string().optional(),
  outputs: z.string().optional(),
  actors: z.array(z.string()),
  priority: z.enum(["must", "should", "nice_to_have", "unknown"]).default("unknown"),
  confidence: z.enum(["high", "medium", "low"]),
  evidence: z.array(evidenceSchema),
  supersededEvidence: z.array(evidenceSchema).default([]),
  notes: z.string().optional(),
});

export type RequirementOutput = z.infer<typeof requirementOutputSchema>;

export const llmOutputSchema = z.object({
  requirements: z.array(requirementOutputSchema),
});

export type LlmOutput = z.infer<typeof llmOutputSchema>;
