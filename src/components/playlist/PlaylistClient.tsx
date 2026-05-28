"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { moodLabels, primaryMoods, type PrimaryMood } from "@/lib/moods";

type SeedSong = {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  primary_mood: PrimaryMood | null;
};

type SavedPlaylist = {
  id: string;
  name: string;
  description: string | null;
  mood: PrimaryMood;
  vibe_tags: string[];
  song_count: number;
  created_at: string | null;
};

type SavedPlaylistSong = {
  position: number;
  id: string;
  title: string;
  artist: string;
  album: string | null;
  primary_mood: PrimaryMood | null;
  confidence: number | null;
};

type SavedPlaylistDetails = {
  playlist: {
    id: string;
    name: string;
    description: string | null;
    mood: string;
    created_at: string | null;
  };
  songs: SavedPlaylistSong[];
};

type PlaylistSong = {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  genre: string | null;
  year: number | null;
  bpm: number | null;
  primary_mood: PrimaryMood | null;
  confidence: number;
  score: number;
  secondary_moods?: PrimaryMood[];
  classifier_version?: string | null;
  user_corrected?: boolean;
};

type PlaylistResult = {
  playlist_name: string;
  description: string;
  mood: PrimaryMood;
  vibe_tags: string[];
  songs: PlaylistSong[];
  explanation?: {
    selected_mood?: string;
    total_candidates?: number;
    primary_mood_matches?: number;
    secondary_mood_matches?: number;
    high_confidence_matches?: number;
    seed_genre_matches?: number;
    local_classifier_count?: number;
    apifreellm_classifier_count?: number;
    user_corrected_count?: number;
    summary?: string;
  };
};

type GenerateResponse = {
  success: boolean;
  data?: PlaylistResult;
  meta?: {
    total_candidates: number;
    returned_count: number;
    used_apifreellm: boolean;
  };
  error?: {
    message: string;
    code: string;
  };
};

type SavePlaylistResponse = {
  success: boolean;
  data?: {
    playlist_id: string;
  };
  error?: {
    message: string;
    code: string;
  };
};

type FeedbackResponse = {
  success: boolean;
  data?: {
    feedback_id: string;
  };
  error?: {
    message: string;
    code: string;
  };
};

type SavedPlaylistDetailsResponse = {
  success: boolean;
  data?: SavedPlaylistDetails;
  meta?: {
    returned_count?: number;
  };
  error?: {
    message?: string;
    code?: string;
  };
};

type PlaylistClientProps = {
  seedSongs: SeedSong[];
  initialSavedPlaylists: SavedPlaylist[];
};

export function PlaylistClient({ seedSongs, initialSavedPlaylists }: PlaylistClientProps) {
  const router = useRouter();
  const [selectedMood, setSelectedMood] = useState<PrimaryMood>("focus");
  const [seedSongId, setSeedSongId] = useState<string>("");
  const [generated, setGenerated] = useState<PlaylistResult | null>(null);
  const [hiddenSongIds, setHiddenSongIds] = useState<string[]>([]);
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>(initialSavedPlaylists);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [detailsByPlaylistId, setDetailsByPlaylistId] = useState<Record<string, SavedPlaylistDetails>>({});
  const [loadingByPlaylistId, setLoadingByPlaylistId] = useState<Record<string, boolean>>({});
  const [errorByPlaylistId, setErrorByPlaylistId] = useState<Record<string, string>>({});

  const visibleSongs = useMemo(() => {
    if (!generated) return [];
    return generated.songs.filter((song) => !hiddenSongIds.includes(song.id));
  }, [generated, hiddenSongIds]);
  const classifiedSeedCount = useMemo(
    () => seedSongs.filter((song) => Boolean(song.primary_mood)).length,
    [seedSongs],
  );

  async function generatePlaylist() {
    setLoading(true);
    setError("");
    setStatus("");
    setHiddenSongIds([]);

    const response = await fetch("/api/generate-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood: selectedMood,
        seed_song_id: seedSongId || undefined,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as GenerateResponse;
    setLoading(false);

    if (!data.success || !data.data) {
      setGenerated(null);
      setError(data.error?.message ?? "Playlist generation failed.");
      return;
    }

    setGenerated(data.data);
    setStatus(
      `Generated ${data.meta?.returned_count ?? data.data.songs.length} songs from ${
        data.meta?.total_candidates ?? data.data.songs.length
      } candidates.`,
    );
  }

  async function savePlaylist() {
    if (!generated || visibleSongs.length === 0) {
      return;
    }

    setSaving(true);
    setError("");

    const response = await fetch("/api/save-playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: generated.playlist_name,
        description: generated.description,
        mood: generated.mood,
        vibe_tags: generated.vibe_tags,
        song_ids: visibleSongs.map((song) => song.id),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as SavePlaylistResponse;

    if (!data.success || !data.data) {
      setSaving(false);
      setError(data.error?.message ?? "Save playlist failed.");
      return;
    }
    const playlistId = data.data.playlist_id;

    const feedbackResponse = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playlist_id: playlistId,
        event_type: "save_playlist",
        event_value: generated.mood,
      }),
    });
    const feedbackData = (await feedbackResponse.json().catch(() => ({}))) as FeedbackResponse;
    if (!feedbackData.success) {
      setError(feedbackData.error?.message ?? "Feedback save failed.");
    }

    setSavedPlaylists((previous) => [
      {
        id: playlistId,
        name: generated.playlist_name,
        description: generated.description,
        mood: generated.mood,
        vibe_tags: generated.vibe_tags,
        song_count: visibleSongs.length,
        created_at: new Date().toISOString(),
      },
      ...previous,
    ]);
    setSaving(false);
    setStatus("Playlist saved.");
    router.refresh();
  }

  async function saveSongFeedback(songId: string, eventType: "like_song" | "hide_song") {
    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        song_id: songId,
        event_type: eventType,
        event_value: selectedMood,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as FeedbackResponse;

    if (!data.success) {
      setError(data.error?.message ?? "Feedback save failed.");
      return false;
    }

    return true;
  }

  async function likeSong(songId: string) {
    setError("");
    const ok = await saveSongFeedback(songId, "like_song");
    if (ok) {
      setStatus("Song liked.");
    }
  }

  async function hideSong(songId: string) {
    setError("");
    const ok = await saveSongFeedback(songId, "hide_song");
    if (!ok) return;

    setHiddenSongIds((previous) => [...previous, songId]);
    setStatus("Song hidden from this playlist result.");
  }

  async function likePlaylist() {
    if (!generated) return;

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "like_playlist",
        event_value: generated.playlist_name,
      }),
    });
    const data = (await response.json().catch(() => ({}))) as FeedbackResponse;

    if (!data.success) {
      setError(data.error?.message ?? "Feedback save failed.");
      return;
    }

    setStatus("Playlist liked.");
  }

  async function toggleSavedPlaylist(playlistId: string) {
    if (expandedPlaylistId === playlistId) {
      setExpandedPlaylistId(null);
      return;
    }

    setExpandedPlaylistId(playlistId);

    if (detailsByPlaylistId[playlistId]) {
      return;
    }

    setLoadingByPlaylistId((previous) => ({ ...previous, [playlistId]: true }));
    setErrorByPlaylistId((previous) => ({ ...previous, [playlistId]: "" }));

    const response = await fetch(`/api/saved-playlist/${playlistId}`, {
      method: "GET",
    });
    const data = (await response.json().catch(() => ({}))) as SavedPlaylistDetailsResponse;

    if (!data.success || !data.data) {
      setLoadingByPlaylistId((previous) => ({ ...previous, [playlistId]: false }));
      setErrorByPlaylistId((previous) => ({
        ...previous,
        [playlistId]: data.error?.message ?? "Could not load playlist songs.",
      }));
      return;
    }

    const details = data.data;
    setDetailsByPlaylistId((previous) => ({
      ...previous,
      [playlistId]: details,
    }));
    setLoadingByPlaylistId((previous) => ({ ...previous, [playlistId]: false }));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h1 className="text-2xl font-semibold text-slate-50">Generate a mood playlist</h1>
        {seedSongs.length === 0 ? (
          <div className="mt-4 rounded-md border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
            No songs found yet. Import sample library from your dashboard first.
            <Link className="ml-2 font-semibold underline underline-offset-2" href="/dashboard">
              Go to dashboard
            </Link>
          </div>
        ) : null}
        {seedSongs.length > 0 && classifiedSeedCount === 0 ? (
          <div className="mt-4 rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">
            Songs are imported. Run classification from dashboard for stronger playlist quality.
          </div>
        ) : null}
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="mood">
              Mood
            </label>
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300"
              id="mood"
              onChange={(event) => setSelectedMood(event.target.value as PrimaryMood)}
              value={selectedMood}
            >
              {primaryMoods.map((mood) => (
                <option key={mood} value={mood}>
                  {moodLabels[mood]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="seedSong">
              Seed song (optional)
            </label>
            <select
              className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none focus:border-cyan-300"
              id="seedSong"
              onChange={(event) => setSeedSongId(event.target.value)}
              value={seedSongId}
            >
              <option value="">None</option>
              {seedSongs.map((song) => (
                <option key={song.id} value={song.id}>
                  {song.title} - {song.artist}
                </option>
              ))}
            </select>
          </div>
          <div className="md:self-end">
            <button
              className="w-full rounded-md bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              disabled={loading || seedSongs.length === 0}
              onClick={generatePlaylist}
              type="button"
            >
              Generate playlist
            </button>
          </div>
        </div>
      </section>

      {loading ? <LoadingState title="Generating playlist..." message="Scoring songs from your cloud library." /> : null}
      {error ? <ErrorState title="Playlist issue" message={error} /> : null}
      {status ? <p className="text-sm text-slate-400">{status}</p> : null}

      {generated ? (
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-50">{generated.playlist_name}</h2>
              <p className="mt-2 text-sm text-slate-300">{generated.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {generated.vibe_tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                onClick={likePlaylist}
                type="button"
              >
                Like playlist
              </button>
              <button
                className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300 disabled:opacity-60"
                disabled={saving || visibleSongs.length === 0}
                onClick={savePlaylist}
                type="button"
              >
                Save playlist
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-white/10">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Song</th>
                    <th className="px-4 py-3">Artist</th>
                    <th className="px-4 py-3">Mood</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {visibleSongs.map((song, index) => (
                    <tr key={song.id} className="bg-white/[0.025]">
                      <td className="px-4 py-3 text-slate-400">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-100">{song.title}</td>
                      <td className="px-4 py-3 text-slate-300">{song.artist}</td>
                      <td className="px-4 py-3 text-slate-400">{song.primary_mood ? moodLabels[song.primary_mood] : "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            className="rounded-md border border-emerald-300/30 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-300/10"
                            onClick={() => likeSong(song.id)}
                            type="button"
                          >
                            Like
                          </button>
                          <button
                            className="rounded-md border border-rose-300/30 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-300/10"
                            onClick={() => hideSong(song.id)}
                            type="button"
                          >
                            Hide
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {visibleSongs.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-slate-400" colSpan={5}>
                        All songs hidden from current result.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 rounded-md border border-white/10 bg-slate-950/50 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">Why this playlist?</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>
                Selected mood: {generated.explanation?.selected_mood ?? generated.mood}
              </li>
              <li>
                Candidates checked: {generated.explanation?.total_candidates ?? generated.songs.length}
              </li>
              <li>
                Primary mood matches: {generated.explanation?.primary_mood_matches ?? 0}
              </li>
              <li>
                High-confidence matches: {generated.explanation?.high_confidence_matches ?? 0}
              </li>
              <li>
                Seed genre matches: {generated.explanation?.seed_genre_matches ?? 0}
              </li>
              <li>{generated.explanation?.summary ?? "Playlist ranking prioritized your selected mood and balanced artist variety."}</li>
            </ul>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No playlist generated yet"
          message="Select a mood and optional seed song, then generate a playlist."
        />
      )}

      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h2 className="text-xl font-semibold text-slate-50">Saved playlists</h2>
        {savedPlaylists.length === 0 ? (
          <EmptyState title="No saved playlists yet" message="Generate and save a playlist to keep it in cloud sync." />
        ) : (
          <div className="mt-4 space-y-3">
            {savedPlaylists.map((playlist) => (
              <div key={playlist.id} className="rounded-md border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{playlist.name}</p>
                    <p className="text-sm text-slate-400">{playlist.description || "No description."}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {moodLabels[playlist.mood]} - {playlist.song_count} songs
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <p className="text-xs text-slate-500">
                      {playlist.created_at ? new Date(playlist.created_at).toLocaleString() : "Unknown time"}
                    </p>
                    <button
                      className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/10"
                      onClick={() => toggleSavedPlaylist(playlist.id)}
                      type="button"
                    >
                      {expandedPlaylistId === playlist.id ? "Hide songs" : "View songs"}
                    </button>
                  </div>
                </div>

                {expandedPlaylistId === playlist.id ? (
                  <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-3">
                    {loadingByPlaylistId[playlist.id] ? (
                      <p className="text-sm text-cyan-200">Loading songs...</p>
                    ) : null}
                    {errorByPlaylistId[playlist.id] ? (
                      <ErrorState title="Could not load playlist songs" message={errorByPlaylistId[playlist.id]} />
                    ) : null}
                    {!loadingByPlaylistId[playlist.id] &&
                    !errorByPlaylistId[playlist.id] &&
                    (detailsByPlaylistId[playlist.id]?.songs?.length ?? 0) === 0 ? (
                      <p className="text-sm text-slate-400">This saved playlist has no songs yet.</p>
                    ) : null}
                    {!loadingByPlaylistId[playlist.id] &&
                    !errorByPlaylistId[playlist.id] &&
                    (detailsByPlaylistId[playlist.id]?.songs?.length ?? 0) > 0 ? (
                      <ul className="space-y-2">
                        {detailsByPlaylistId[playlist.id].songs.map((song) => (
                          <li
                            key={`${playlist.id}-${song.id}-${song.position}`}
                            className="flex flex-col gap-1 rounded-md border border-white/10 bg-slate-950/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-100">
                                {song.position}. {song.title}
                              </p>
                              <p className="truncate text-xs text-slate-400">{song.artist}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-xs">
                              <span className="rounded-md bg-cyan-300/10 px-2 py-1 font-semibold text-cyan-100">
                                {song.primary_mood ? moodLabels[song.primary_mood] : "-"}
                              </span>
                              <span className="text-slate-400">
                                {typeof song.confidence === "number" ? `${Math.round(song.confidence * 100)}%` : "-"}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
