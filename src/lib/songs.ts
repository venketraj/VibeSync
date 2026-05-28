import type { MoodLabel, Song, SongMetadataInput, SongWithMood } from "@/lib/types";

export function cleanSongInput(song: SongMetadataInput): SongMetadataInput {
  return {
    title: String(song.title ?? "").trim(),
    artist: String(song.artist ?? "").trim(),
    album: optionalText(song.album),
    genre: optionalText(song.genre),
    year: optionalNumber(song.year),
    duration_seconds: optionalNumber(song.duration_seconds),
    bpm: optionalNumber(song.bpm),
    language: optionalText(song.language),
    lyrics_snippet: optionalText(song.lyrics_snippet),
  };
}

export function joinSongsWithLabels(songs: Song[], labels: MoodLabel[]): SongWithMood[] {
  const latestLabelBySong = new Map<string, MoodLabel>();

  labels.forEach((label) => {
    if (!latestLabelBySong.has(label.song_id)) {
      latestLabelBySong.set(label.song_id, label);
    }
  });

  return songs.map((song) => ({
    ...song,
    mood_label: latestLabelBySong.get(song.id) ?? null,
  }));
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
