import { primaryMoods, type PrimaryMood } from "@/lib/moods";
import type { SongMetadataInput } from "@/lib/types";

export type MoodClassification = {
  primary_mood: PrimaryMood;
  secondary_moods: PrimaryMood[];
  confidence: number;
  reason: string;
  tags: string[];
  classifier_version: string;
};

const keywordRules: Array<{ words: string[]; boosts: Partial<Record<PrimaryMood, number>>; tag: string }> = [
  { words: ["love", "heart", "forever", "kiss", "beautiful"], boosts: { romantic: 4 }, tag: "romantic" },
  { words: ["sad", "tears", "lonely", "goodbye", "broken", "pain"], boosts: { sad: 4 }, tag: "melancholy" },
  { words: ["night", "memories", "old", "yesterday", "childhood"], boosts: { nostalgic: 4 }, tag: "memory" },
  { words: ["fire", "power", "fight", "stronger", "beast", "champion"], boosts: { workout: 3, energetic: 3 }, tag: "power" },
  { words: ["sleep", "calm", "rain", "soft", "peace", "silent"], boosts: { calm: 4 }, tag: "soft" },
  { words: ["study", "focus", "deep", "instrumental", "work"], boosts: { focus: 4 }, tag: "focus" },
  { words: ["dance", "party", "club", "tonight"], boosts: { party: 4 }, tag: "dance" },
  { words: ["happy", "smile", "sunshine", "joy"], boosts: { happy: 4 }, tag: "bright" },
  { words: ["rage", "angry", "hate", "war"], boosts: { angry: 4 }, tag: "intense" },
];

export function classifyLocalMood(song: SongMetadataInput): MoodClassification {
  const scores = Object.fromEntries(primaryMoods.map((mood) => [mood, 0])) as Record<PrimaryMood, number>;
  const tags = new Set<string>(["metadata"]);
  const evidence: string[] = [];

  applyBpmRules(scores, tags, evidence, song.bpm);
  applyGenreRules(scores, tags, evidence, song.genre);
  applyKeywordRules(scores, tags, evidence, song);

  const ranked = primaryMoods
    .map((mood) => ({ mood, score: scores[mood] }))
    .sort((a, b) => b.score - a.score);

  const winner = ranked[0];
  const runnerUp = ranked[1];
  const metadataStrength = countMetadata(song);
  const gap = winner.score - runnerUp.score;
  const totalScore = ranked.reduce((sum, item) => sum + item.score, 0);

  let confidence = 0.42;

  if (winner.score >= 7 && gap >= 3) confidence = 0.84;
  else if (winner.score >= 5 && gap >= 2) confidence = 0.74;
  else if (winner.score >= 4 && gap >= 1.5) confidence = 0.66;
  else if (winner.score >= 3) confidence = 0.58;
  else if (totalScore > 0) confidence = 0.5;

  if (metadataStrength <= 2) confidence = Math.min(confidence, 0.48);
  if (gap <= 1 && totalScore > 0) confidence = Math.min(confidence, 0.62);
  confidence = Math.min(0.9, Math.max(0.35, confidence));

  const secondaryMoods = ranked
    .slice(1)
    .filter((item) => item.score > 0)
    .slice(0, 3)
    .map((item) => item.mood);

  return {
    primary_mood: winner.score > 0 ? winner.mood : "calm",
    secondary_moods: secondaryMoods.length ? secondaryMoods : ["focus"],
    confidence,
    reason: buildReason(evidence, winner.mood),
    tags: Array.from(tags).slice(0, 6),
    classifier_version: "local-v1",
  };
}

function applyBpmRules(
  scores: Record<PrimaryMood, number>,
  tags: Set<string>,
  evidence: string[],
  bpmValue: number | null | undefined,
) {
  const bpm = Number(bpmValue);
  if (!Number.isFinite(bpm) || bpm <= 0) return;

  tags.add(`${Math.round(bpm)}bpm`);
  evidence.push(`${Math.round(bpm)} BPM`);

  if (bpm >= 145) boost(scores, { energetic: 3, workout: 4, party: 2 });
  else if (bpm >= 120) boost(scores, { happy: 2, party: 4, energetic: 3 });
  else if (bpm >= 90) boost(scores, { happy: 2, romantic: 2, nostalgic: 2 });
  else if (bpm >= 60) boost(scores, { calm: 3, sad: 2, romantic: 2, focus: 2 });
  else boost(scores, { calm: 4, sad: 2, focus: 3 });
}

function applyGenreRules(
  scores: Record<PrimaryMood, number>,
  tags: Set<string>,
  evidence: string[],
  genreValue: string | null | undefined,
) {
  const genre = normalize(genreValue);
  if (!genre) return;

  tags.add(genre.split(" ")[0]);
  evidence.push(`${genreValue} genre`);

  if (containsAny(genre, ["ambient", "classical", "lo fi", "lofi", "instrumental"])) boost(scores, { calm: 4, focus: 3 });
  if (containsAny(genre, ["dance", "edm", "electronic", "house", "techno"])) boost(scores, { party: 4, energetic: 3 });
  if (containsAny(genre, ["rock", "metal", "punk"])) boost(scores, { energetic: 3, angry: 2, workout: 3 });
  if (containsAny(genre, ["ballad", "acoustic", "soul"])) boost(scores, { sad: 2, romantic: 3, calm: 2 });
  if (containsAny(genre, ["pop"])) boost(scores, { happy: 2, romantic: 2, party: 2 });
  if (containsAny(genre, ["hip hop", "hip-hop", "rap", "trap"])) boost(scores, { energetic: 3, party: 2 });
  if (containsAny(genre, ["devotional", "meditation"])) boost(scores, { calm: 4, focus: 3 });
}

function applyKeywordRules(scores: Record<PrimaryMood, number>, tags: Set<string>, evidence: string[], song: SongMetadataInput) {
  const text = normalize([song.title, song.album, song.artist, song.lyrics_snippet].filter(Boolean).join(" "));
  if (!text) return;

  for (const rule of keywordRules) {
    if (containsAny(text, rule.words)) {
      boost(scores, rule.boosts);
      tags.add(rule.tag);
      evidence.push(`${rule.tag} keywords`);
    }
  }
}

function boost(scores: Record<PrimaryMood, number>, boosts: Partial<Record<PrimaryMood, number>>) {
  Object.entries(boosts).forEach(([mood, value]) => {
    scores[mood as PrimaryMood] += value ?? 0;
  });
}

function normalize(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function countMetadata(song: SongMetadataInput) {
  return [song.title, song.artist, song.album, song.genre, song.year, song.bpm, song.lyrics_snippet].filter(Boolean).length;
}

function buildReason(evidence: string[], mood: PrimaryMood) {
  if (evidence.length === 0) {
    return `Limited metadata suggests ${mood}.`;
  }

  return `${evidence.slice(0, 2).join(" and ")} suggest ${mood}.`.split(/\s+/).slice(0, 20).join(" ");
}
