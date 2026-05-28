import "server-only";

import { z } from "zod";
import { primaryMoods, type PrimaryMood } from "@/lib/moods";
import type { MoodClassification } from "@/lib/localMoodClassifier";
import type { SongMetadataInput } from "@/lib/types";

const apiFreeLlmSchema = z.object({
  primary_mood: z.enum(primaryMoods),
  secondary_moods: z.array(z.enum(primaryMoods)).max(3).default([]),
  confidence: z.number().min(0).max(1),
  reason: z.string().max(140),
  tags: z.array(z.string().min(1).max(30)).min(3).max(6),
});

export async function classifyWithApiFreeLLM(song: SongMetadataInput): Promise<MoodClassification> {
  const apiKey = process.env.APIFREELLM_API_KEY;

  if (!apiKey) {
    throw new Error("Missing APIFREELLM_API_KEY.");
  }

  const response = await fetch("https://apifreellm.com/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.APIFREELLM_MODEL || "apifreellm",
      message: buildPrompt(song),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`APIFreeLLM failed: ${response.status} ${errorText}`.trim());
  }

  const payload = (await response.json()) as unknown;
  const text = extractAssistantText(payload);
  const json = parseJsonFromText(stripCodeFences(text));
  const parsed = apiFreeLlmSchema.parse(json);

  return {
    primary_mood: parsed.primary_mood,
    secondary_moods: normalizeSecondaryMoods(parsed.secondary_moods, parsed.primary_mood),
    confidence: parsed.confidence,
    reason: parsed.reason.split(/\s+/).slice(0, 20).join(" "),
    tags: parsed.tags.slice(0, 6),
    classifier_version: "apifreellm-fallback-v1",
  };
}

function buildPrompt(song: SongMetadataInput) {
  return `You are VibeSync's music mood classifier.

Classify the song using only the provided metadata. Do not invent facts.

Allowed primary_mood values:
happy, sad, calm, energetic, romantic, focus, party, workout, nostalgic, angry

Rules:
- Return JSON only.
- Do not include markdown.
- Do not include explanations outside JSON.
- Pick exactly one primary_mood.
- Pick up to three secondary_moods.
- confidence must be between 0 and 1.
- reason must be under 20 words.
- tags must contain 3 to 6 short tags.
- Do not recommend illegal downloads or copyrighted redistribution.

Expected JSON shape:
{
  "primary_mood": "calm",
  "secondary_moods": ["focus"],
  "confidence": 0.78,
  "reason": "Soft genre and slow tempo suggest a relaxed mood.",
  "tags": ["chill", "study", "late-night"]
}

Song metadata:
${JSON.stringify(song, null, 2)}`;
}

function extractAssistantText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "";

  const record = payload as Record<string, unknown>;
  for (const key of ["response", "reply", "message", "content", "text", "answer"]) {
    if (typeof record[key] === "string") return record[key];
  }

  if (record.data && typeof record.data === "object") return extractAssistantText(record.data);
  if (Array.isArray(record.choices) && record.choices[0]) return extractAssistantText(record.choices[0]);

  return JSON.stringify(payload);
}

function stripCodeFences(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseJsonFromText(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("APIFreeLLM response did not contain JSON.");
    return JSON.parse(match[0]);
  }
}

function normalizeSecondaryMoods(moods: PrimaryMood[], primaryMood: PrimaryMood) {
  return Array.from(new Set(moods)).filter((mood) => mood !== primaryMood).slice(0, 3);
}
