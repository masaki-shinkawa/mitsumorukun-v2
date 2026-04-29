import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | undefined };

export const openai: OpenAI = globalForOpenAI.openai ?? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}

export type ModelRole = "normal" | "light";

export function getModel(role: ModelRole): string {
  if (role === "light") {
    return process.env.OPENAI_MODEL_LIGHT ?? "gpt-4o-mini";
  }
  return process.env.OPENAI_MODEL ?? "gpt-4o";
}
