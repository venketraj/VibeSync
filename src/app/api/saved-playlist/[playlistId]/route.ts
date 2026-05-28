import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MoodLabel, Song } from "@/lib/types";

type RouteContext = {
  params: Promise<{
    playlistId: string;
  }>;
};

type PlaylistRecord = {
  id: string;
  name: string;
  description: string | null;
  mood: string;
  created_at: string | null;
};

type PlaylistItemRecord = {
  song_id: string;
  position: number;
};

export async function GET(_: Request, context: RouteContext) {
  const user = await getDemoUser();

  if (!user) {
    return errorResponse("You must be logged in to view saved playlists.", "SAVED_PLAYLIST_FETCH_FAILED", 401);
  }

  const { playlistId } = await context.params;

  if (!playlistId) {
    return errorResponse("Playlist id is required.", "SAVED_PLAYLIST_FETCH_FAILED", 400);
  }

  try {
    const authUser = await ensureDemoAuthUser(user.email, user.full_name);
    const supabase = createSupabaseAdminClient();
    const { data: playlistData, error: playlistError } = await supabase
      .from("playlists")
      .select("id,name,description,mood,created_at")
      .eq("id", playlistId)
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (playlistError) {
      return errorResponse(playlistError.message, "SAVED_PLAYLIST_FETCH_FAILED", 500);
    }

    if (!playlistData) {
      return errorResponse("Playlist not found for this user.", "SAVED_PLAYLIST_FETCH_FAILED", 404);
    }

    const playlist = playlistData as PlaylistRecord;
    const { data: itemsData, error: itemsError } = await supabase
      .from("playlist_items")
      .select("song_id,position")
      .eq("playlist_id", playlist.id)
      .order("position", { ascending: true });

    if (itemsError) {
      return errorResponse(itemsError.message, "SAVED_PLAYLIST_FETCH_FAILED", 500);
    }

    const items = (itemsData ?? []) as PlaylistItemRecord[];
    const songIds = items.map((item) => item.song_id);

    if (songIds.length === 0) {
      return successResponse(
        {
          playlist,
          songs: [],
        },
        { returned_count: 0 },
      );
    }

    const [{ data: songsData, error: songsError }, { data: labelsData, error: labelsError }] = await Promise.all([
      supabase.from("songs").select("*").eq("user_id", authUser.id).in("id", songIds),
      supabase
        .from("song_mood_labels")
        .select("*")
        .eq("user_id", authUser.id)
        .in("song_id", songIds)
        .order("created_at", { ascending: false }),
    ]);

    if (songsError) {
      return errorResponse(songsError.message, "SAVED_PLAYLIST_FETCH_FAILED", 500);
    }

    if (labelsError) {
      return errorResponse(labelsError.message, "SAVED_PLAYLIST_FETCH_FAILED", 500);
    }

    const songs = (songsData ?? []) as Song[];
    const labels = (labelsData ?? []) as MoodLabel[];
    const latestLabelBySong = new Map<string, MoodLabel>();

    labels.forEach((label) => {
      if (!latestLabelBySong.has(label.song_id)) {
        latestLabelBySong.set(label.song_id, label);
      }
    });

    const songById = new Map<string, Song>();
    songs.forEach((song) => {
      songById.set(song.id, song);
    });

    const orderedSongs = items
      .map((item) => {
        const song = songById.get(item.song_id);
        if (!song) return null;

        const moodLabel = latestLabelBySong.get(song.id);
        return {
          position: item.position,
          id: song.id,
          title: song.title,
          artist: song.artist,
          album: song.album ?? null,
          primary_mood: moodLabel?.primary_mood ?? null,
          confidence: moodLabel?.confidence ?? null,
        };
      })
      .filter((song): song is NonNullable<typeof song> => Boolean(song));

    return successResponse(
      {
        playlist,
        songs: orderedSongs,
      },
      { returned_count: orderedSongs.length },
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Could not fetch saved playlist details.",
      "SAVED_PLAYLIST_FETCH_FAILED",
      500,
    );
  }
}
