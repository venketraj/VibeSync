"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { moodLabels, primaryMoods, type PrimaryMood } from "@/lib/moods";
import type { SongWithMood } from "@/lib/types";

type SongTableProps = {
  songs: SongWithMood[];
};

export function SongTable({ songs }: SongTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<PrimaryMood | "all" | "unclassified">("all");
  const [error, setError] = useState("");
  const [savingSongId, setSavingSongId] = useState<string | null>(null);

  const filteredSongs = useMemo(() => {
    if (filter === "all") {
      return songs;
    }

    if (filter === "unclassified") {
      return songs.filter((song) => !song.mood_label);
    }

    return songs.filter((song) => song.mood_label?.primary_mood === filter);
  }, [filter, songs]);

  async function correctMood(songId: string, mood: PrimaryMood) {
    setSavingSongId(songId);
    setError("");

    const response = await fetch("/api/mood-label", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: songId,
        primary_mood: mood,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    setSavingSongId(null);

    if (!response.ok) {
      setError(data.error ?? "Mood correction failed.");
      return;
    }

    router.refresh();
  }

  if (songs.length === 0) {
    return (
      <EmptyState
        title="No songs yet"
        message="Import the sample library or upload a CSV to start classifying moods."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? <ErrorState title="Could not update mood" message={error} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-50">Song library</h2>
        <select
          className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-300"
          onChange={(event) => setFilter(event.target.value as PrimaryMood | "all" | "unclassified")}
          value={filter}
        >
          <option value="all">All moods</option>
          <option value="unclassified">Unclassified</option>
          {primaryMoods.map((mood) => (
            <option key={mood} value={mood}>
              {moodLabels[mood]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Album</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">BPM</th>
                <th className="px-4 py-3">Primary mood</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Correction</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredSongs.map((song) => (
                <tr key={song.id} className="bg-white/[0.025]">
                  <td className="px-4 py-3 font-medium text-slate-100">{song.title}</td>
                  <td className="px-4 py-3 text-slate-300">{song.artist}</td>
                  <td className="px-4 py-3 text-slate-400">{song.album || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{song.genre || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{song.year || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{song.bpm || "-"}</td>
                  <td className="px-4 py-3">
                    {song.mood_label ? (
                      <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                        {moodLabels[song.mood_label.primary_mood]}
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-100">
                        Unclassified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {song.mood_label ? `${Math.round(song.mood_label.confidence * 100)}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {song.mood_label ? classifierSourceLabel(song.mood_label.classifier_version) : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-md border border-white/10 bg-slate-950 px-2 py-2 text-xs text-slate-100 outline-none focus:border-cyan-300 disabled:opacity-60"
                      disabled={savingSongId === song.id}
                      onChange={(event) => correctMood(song.id, event.target.value as PrimaryMood)}
                      value={song.mood_label?.primary_mood ?? ""}
                    >
                      <option value="" disabled>
                        Set mood
                      </option>
                      {primaryMoods.map((mood) => (
                        <option key={mood} value={mood}>
                          {moodLabels[mood]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {filteredSongs.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-400" colSpan={10}>
                    No songs match this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function classifierSourceLabel(version: string | null | undefined) {
  if (version === "local-v1") return "Local";
  if (version === "local-v1-fallback-used") return "Local fallback";
  if (version === "apifreellm-fallback-v1") return "APIFreeLLM fallback";
  if (version === "user-corrected") return "User corrected";
  return "Unknown";
}
