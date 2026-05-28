import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { joinSongsWithLabels } from "@/lib/songs";
import type { MoodLabel, Song, SongWithMood } from "@/lib/types";
import { primaryMoods, type PrimaryMood } from "@/lib/moods";

export type LibraryStats = {
  songs: SongWithMood[];
  totalSongs: number;
  classifiedSongs: number;
  unclassifiedSongs: number;
  moodCounts: Record<PrimaryMood, number>;
  lastSyncedAt: string | null;
};

export async function getLibraryStats(userId: string): Promise<LibraryStats> {
  const supabase = createSupabaseAdminClient();

  const [{ data: songsData, error: songsError }, { data: labelsData, error: labelsError }] =
    await Promise.all([
      supabase
        .from("songs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("song_mood_labels")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

  if (songsError) {
    throw new Error(songsError.message);
  }

  if (labelsError) {
    throw new Error(labelsError.message);
  }

  const songs = (songsData ?? []) as Song[];
  const labels = (labelsData ?? []) as MoodLabel[];
  const songsWithMood = joinSongsWithLabels(songs, labels);
  const classifiedSongIds = new Set(labels.map((label) => label.song_id));
  const moodCounts = Object.fromEntries(primaryMoods.map((mood) => [mood, 0])) as Record<
    PrimaryMood,
    number
  >;

  songsWithMood.forEach((song) => {
    if (song.mood_label) {
      moodCounts[song.mood_label.primary_mood] += 1;
    }
  });

  const timestamps = [...songs.map((song) => song.created_at), ...labels.map((label) => label.created_at)].filter(
    (value): value is string => Boolean(value),
  );
  const lastSyncedAt =
    timestamps.length > 0
      ? timestamps.reduce((latest, current) =>
          new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
        )
      : null;

  return {
    songs: songsWithMood,
    totalSongs: songs.length,
    classifiedSongs: classifiedSongIds.size,
    unclassifiedSongs: Math.max(0, songs.length - classifiedSongIds.size),
    moodCounts,
    lastSyncedAt,
  };
}
