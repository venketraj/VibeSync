import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { primaryMoods, type PrimaryMood } from "@/lib/moods";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MoodLabel, Song } from "@/lib/types";

const playlistRequestSchema = z.object({
  mood: z.enum(primaryMoods),
  seed_song_id: z.string().uuid().optional(),
});

const aiPlaylistSchema = z.object({
  playlist_name: z.string().min(1).max(80),
  description: z.string().min(1).max(220),
  vibe_tags: z.array(z.string().min(1).max(30)).min(2).max(6),
});

const localMoodNames: Record<PrimaryMood, string> = {
  focus: "Deep Focus Mix",
  calm: "Calm Reset",
  workout: "Energy Builder",
  party: "After Hours Party",
  romantic: "Soft Hearts",
  nostalgic: "Memory Lane",
  happy: "Bright Mood Mix",
  sad: "Slow Rain",
  energetic: "High Voltage",
  angry: "Release Mode",
};

type PlaylistSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null | undefined;
  genre: string | null | undefined;
  year: number | null | undefined;
  bpm: number | null | undefined;
  primary_mood: PrimaryMood | null;
  confidence: number;
  score: number;
  secondary_moods: PrimaryMood[];
  classifier_version: string | null;
  user_corrected: boolean;
};

type Candidate = {
  song: Song;
  label: MoodLabel | null;
  baseScore: number;
};

export async function POST(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return errorResponse("You must be logged in to generate playlists.", "PLAYLIST_GENERATION_FAILED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = playlistRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Invalid playlist input.", "PLAYLIST_GENERATION_FAILED", 400);
  }

  try {
    const authUser = await ensureDemoAuthUser(user.email, user.full_name);
    const supabase = createSupabaseAdminClient();

    const [{ data: songsData, error: songsError }, { data: labelsData, error: labelsError }] =
      await Promise.all([
        supabase.from("songs").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
        supabase
          .from("song_mood_labels")
          .select("*")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false }),
      ]);

    if (songsError) {
      return errorResponse(songsError.message, "PLAYLIST_GENERATION_FAILED", 500);
    }

    if (labelsError) {
      return errorResponse(labelsError.message, "PLAYLIST_GENERATION_FAILED", 500);
    }

    const songs = (songsData ?? []) as Song[];
    const labels = (labelsData ?? []) as MoodLabel[];
    const latestLabelBySong = new Map<string, MoodLabel>();

    labels.forEach((label) => {
      if (!latestLabelBySong.has(label.song_id)) {
        latestLabelBySong.set(label.song_id, label);
      }
    });

    const seedSong = parsed.data.seed_song_id ? songs.find((song) => song.id === parsed.data.seed_song_id) ?? null : null;
    const seedGenre = normalize(seedSong?.genre ?? null);

    const candidates = songs.map((song) =>
      buildCandidate({
        song,
        label: latestLabelBySong.get(song.id) ?? null,
        targetMood: parsed.data.mood,
        seedGenre,
      }),
    );

    const targetCount = songs.length >= 10 ? Math.min(12, songs.length) : songs.length;
    const selected = selectRankedSongs(candidates, targetCount);
    const playlistSongs: PlaylistSong[] = selected.map((candidate) => ({
      id: candidate.song.id,
      title: candidate.song.title,
      artist: candidate.song.artist,
      album: candidate.song.album,
      genre: candidate.song.genre,
      year: candidate.song.year,
      bpm: candidate.song.bpm,
      primary_mood: candidate.label?.primary_mood ?? null,
      confidence: round(candidate.label?.confidence ?? 0),
      score: round(candidate.baseScore),
      secondary_moods: Array.isArray(candidate.label?.secondary_moods) ? candidate.label.secondary_moods : [],
      classifier_version: candidate.label?.classifier_version ?? null,
      user_corrected: Boolean(candidate.label?.user_corrected),
    }));

    const localMeta = buildLocalPlaylistMeta(parsed.data.mood, seedSong, playlistSongs);
    let usedApiFreeLlm = false;
    let playlistName = localMeta.playlist_name;
    let description = localMeta.description;
    let vibeTags = localMeta.vibe_tags;

    if (process.env.APIFREELLM_API_KEY && playlistSongs.length > 0) {
      try {
        const aiMeta = await generatePlaylistMetaWithApiFreeLlm(parsed.data.mood, playlistSongs, seedSong);
        playlistName = aiMeta.playlist_name;
        description = aiMeta.description;
        vibeTags = aiMeta.vibe_tags;
        usedApiFreeLlm = true;
      } catch {
        usedApiFreeLlm = false;
      }
    }

    const classifiedCandidates = candidates.filter((candidate) => Boolean(candidate.label));
    const explanationTotalCandidates = classifiedCandidates.length;
    const primaryMoodMatches = classifiedCandidates.filter(
      (candidate) => candidate.label?.primary_mood === parsed.data.mood,
    ).length;
    const secondaryMoodMatches = classifiedCandidates.filter((candidate) =>
      (candidate.label?.secondary_moods ?? []).includes(parsed.data.mood),
    ).length;
    const highConfidenceMatches = classifiedCandidates.filter((candidate) => (candidate.label?.confidence ?? 0) >= 0.75).length;
    const seedGenreMatches =
      seedGenre === null
        ? 0
        : classifiedCandidates.filter((candidate) => normalize(candidate.song.genre) === seedGenre).length;
    const localClassifierCount = classifiedCandidates.filter((candidate) => {
      const version = candidate.label?.classifier_version ?? "";
      return version === "local-v1" || version === "local-v1-fallback-used";
    }).length;
    const apiFreeLlmClassifierCount = classifiedCandidates.filter(
      (candidate) => candidate.label?.classifier_version === "apifreellm-fallback-v1",
    ).length;
    const userCorrectedCount = classifiedCandidates.filter((candidate) => Boolean(candidate.label?.user_corrected)).length;
    const summary = `This playlist was built from your ${parsed.data.mood}-matched songs, prioritizing high-confidence labels, seed genre similarity, and artist diversity.`;

    return successResponse(
      {
        playlist_name: playlistName,
        description,
        mood: parsed.data.mood,
        vibe_tags: vibeTags,
        songs: playlistSongs,
        explanation: {
          selected_mood: parsed.data.mood,
          total_candidates: explanationTotalCandidates,
          primary_mood_matches: primaryMoodMatches,
          secondary_mood_matches: secondaryMoodMatches,
          high_confidence_matches: highConfidenceMatches,
          seed_genre_matches: seedGenreMatches,
          local_classifier_count: localClassifierCount,
          apifreellm_classifier_count: apiFreeLlmClassifierCount,
          user_corrected_count: userCorrectedCount,
          summary,
        },
      },
      {
        total_candidates: explanationTotalCandidates,
        returned_count: playlistSongs.length,
        used_apifreellm: usedApiFreeLlm,
      },
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Playlist generation failed.",
      "PLAYLIST_GENERATION_FAILED",
      500,
    );
  }
}

function buildCandidate({
  song,
  label,
  targetMood,
  seedGenre,
}: {
  song: Song;
  label: MoodLabel | null;
  targetMood: PrimaryMood;
  seedGenre: string | null;
}): Candidate {
  const primaryMatch = label?.primary_mood === targetMood ? 1 : 0;
  const secondaryMoodList = Array.isArray(label?.secondary_moods) ? label.secondary_moods : [];
  const secondaryMatch = secondaryMoodList.includes(targetMood) ? 1 : 0;
  const confidence = clamp(label?.confidence ?? 0);
  const genreMatch = seedGenre && normalize(song.genre ?? null) === seedGenre ? 1 : 0;
  const freshnessRandom = combineFreshnessAndRandomness(song);
  const baseScore =
    0.45 * primaryMatch +
    0.2 * secondaryMatch +
    0.15 * confidence +
    0.1 * genreMatch +
    0.05 * freshnessRandom;

  return {
    song,
    label,
    baseScore,
  };
}

function selectRankedSongs(candidates: Candidate[], limit: number) {
  const remaining = [...candidates].sort((a, b) => {
    if (b.baseScore !== a.baseScore) return b.baseScore - a.baseScore;
    if (Boolean(a.label) !== Boolean(b.label)) return Number(Boolean(b.label)) - Number(Boolean(a.label));
    return a.song.title.localeCompare(b.song.title);
  });
  const selected: Candidate[] = [];
  const artistCounts = new Map<string, number>();

  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = -1;

    for (let index = 0; index < remaining.length; index += 1) {
      const candidate = remaining[index];
      const artistKey = normalize(candidate.song.artist) ?? "";
      const artistCount = artistCounts.get(artistKey) ?? 0;
      const diversity = 1 / (artistCount + 1);
      const score = candidate.baseScore + 0.05 * diversity;

      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    }

    const picked = remaining.splice(bestIndex, 1)[0];
    selected.push(picked);
    const artistKey = normalize(picked.song.artist) ?? "";
    artistCounts.set(artistKey, (artistCounts.get(artistKey) ?? 0) + 1);
  }

  return selected;
}

function buildLocalPlaylistMeta(mood: PrimaryMood, seedSong: Song | null, songs: PlaylistSong[]) {
  const moodName = localMoodNames[mood];
  const seedText = seedSong ? ` Built from a seed track by ${seedSong.artist}.` : "";
  const topGenres = Array.from(
    new Set(
      songs
        .map((song) => song.genre?.trim().toLowerCase())
        .filter((genre): genre is string => Boolean(genre)),
    ),
  ).slice(0, 2);

  return {
    playlist_name: moodName,
    description: `A ${mood} playlist generated from your metadata-only library.${seedText}`,
    vibe_tags: [mood, ...topGenres, "metadata-only"].slice(0, 5),
  };
}

async function generatePlaylistMetaWithApiFreeLlm(mood: PrimaryMood, songs: PlaylistSong[], seedSong: Song | null) {
  const response = await fetch("https://apifreellm.com/api/v1/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.APIFREELLM_API_KEY!}`,
    },
    body: JSON.stringify({
      model: process.env.APIFREELLM_MODEL || "apifreellm",
      message: `Create JSON only for a playlist based on this metadata.

Rules:
- Return JSON only.
- Fields: playlist_name, description, vibe_tags.
- playlist_name max 80 chars.
- description max 220 chars.
- vibe_tags array with 2 to 6 short tags.

Mood: ${mood}
Seed song: ${seedSong ? `${seedSong.title} - ${seedSong.artist}` : "none"}
Songs:
${songs
  .slice(0, 12)
  .map((song, index) => `${index + 1}. ${song.title} - ${song.artist} (${song.genre ?? "unknown"})`)
  .join("\n")}`,
    }),
  });

  if (!response.ok) {
    throw new Error("APIFreeLLM playlist metadata request failed.");
  }

  const payload = (await response.json()) as unknown;
  const text = extractAssistantText(payload);
  const json = parseJsonFromText(stripCodeFences(text));
  return aiPlaylistSchema.parse(json);
}

function combineFreshnessAndRandomness(song: Song) {
  const freshness = scoreFreshness(song.created_at ?? null);
  const randomness = deterministicFloat(`${song.id}:${song.title}:${song.artist}`);
  return clamp(freshness * 0.7 + randomness * 0.3);
}

function scoreFreshness(createdAt: string | null) {
  if (!createdAt) return 0.5;
  const ageMs = Math.max(0, Date.now() - new Date(createdAt).getTime());
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return 1 / (1 + ageDays / 30);
}

function deterministicFloat(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return (hash % 1000) / 1000;
}

function normalize(value: string | null | undefined) {
  const text = String(value ?? "").trim().toLowerCase();
  return text.length > 0 ? text : null;
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
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
    if (!match) {
      throw new Error("No JSON object found in APIFreeLLM response.");
    }
    return JSON.parse(match[0]);
  }
}
