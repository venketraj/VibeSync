import { classifyWithApiFreeLLM } from "@/lib/apifreellm";
import { classifyLocalMood } from "@/lib/localMoodClassifier";
import type { MoodClassification } from "@/lib/localMoodClassifier";
import type { SongMetadataInput } from "@/lib/types";

export async function classifySong(song: SongMetadataInput): Promise<MoodClassification> {
  const localResult = classifyLocalMood(song);

  if (localResult.confidence >= 0.65) {
    return localResult;
  }

  if (!process.env.APIFREELLM_API_KEY) {
    return {
      ...localResult,
      classifier_version: "local-v1-fallback-used",
    };
  }

  try {
    return await classifyWithApiFreeLLM(song);
  } catch {
    return {
      ...localResult,
      classifier_version: "local-v1-fallback-used",
    };
  }
}
