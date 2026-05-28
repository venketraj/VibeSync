import type { PrimaryMood } from "@/lib/moods";

export type SongMetadataInput = {
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  year?: number | null;
  duration_seconds?: number | null;
  bpm?: number | null;
  language?: string | null;
  lyrics_snippet?: string | null;
};

export type Song = SongMetadataInput & {
  id: string;
  user_id: string;
  fingerprint: string;
  created_at?: string;
};

export type MoodLabel = {
  id?: string;
  song_id: string;
  user_id: string;
  primary_mood: PrimaryMood;
  secondary_moods: PrimaryMood[];
  confidence: number;
  reason: string;
  tags: string[];
  classifier_version?: string | null;
  user_corrected?: boolean | null;
  created_at?: string;
};

export type SongWithMood = Song & {
  mood_label?: MoodLabel | null;
};

export type ImportResult = {
  inserted: number;
  existing: number;
  total: number;
};
