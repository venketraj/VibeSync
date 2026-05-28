import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { primaryMoods } from "@/lib/moods";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const savePlaylistSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(220).default(""),
  mood: z.enum(primaryMoods),
  vibe_tags: z.array(z.string().min(1).max(30)).max(8).default([]),
  song_ids: z.array(z.string().uuid()).min(1).max(30),
});

export async function POST(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return errorResponse("You must be logged in to save playlists.", "SAVE_PLAYLIST_FAILED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = savePlaylistSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Invalid save playlist input.", "SAVE_PLAYLIST_FAILED", 400);
  }

  try {
    const authUser = await ensureDemoAuthUser(user.email, user.full_name);
    const supabase = createSupabaseAdminClient();
    const uniqueSongIds = Array.from(new Set(parsed.data.song_ids));
    const { data: ownedSongs, error: ownedSongsError } = await supabase
      .from("songs")
      .select("id")
      .eq("user_id", authUser.id)
      .in("id", uniqueSongIds);

    if (ownedSongsError) {
      return errorResponse(ownedSongsError.message, "SAVE_PLAYLIST_FAILED", 500);
    }

    if ((ownedSongs ?? []).length !== uniqueSongIds.length) {
      return errorResponse("One or more songs are not owned by the logged-in user.", "SAVE_PLAYLIST_FAILED", 400);
    }

    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .insert({
        user_id: authUser.id,
        name: parsed.data.name,
        description: parsed.data.description,
        mood: parsed.data.mood,
        vibe_tags: parsed.data.vibe_tags,
      })
      .select("id")
      .single();

    if (playlistError || !playlist) {
      return errorResponse(playlistError?.message ?? "Unable to save playlist.", "SAVE_PLAYLIST_FAILED", 500);
    }

    const playlistItems = uniqueSongIds.map((songId, index) => ({
      playlist_id: playlist.id,
      song_id: songId,
      position: index + 1,
    }));

    const { error: itemsError } = await supabase.from("playlist_items").insert(playlistItems);

    if (itemsError) {
      return errorResponse(itemsError.message, "SAVE_PLAYLIST_FAILED", 500);
    }

    return successResponse(
      {
        playlist_id: playlist.id,
      },
      {},
      201,
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Save playlist failed.", "SAVE_PLAYLIST_FAILED", 500);
  }
}
