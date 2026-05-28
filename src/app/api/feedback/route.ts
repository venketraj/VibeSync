import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const feedbackEventTypes = ["like_song", "hide_song", "like_playlist", "save_playlist", "correction"] as const;

const feedbackSchema = z.object({
  song_id: z.string().uuid().optional(),
  playlist_id: z.string().uuid().optional(),
  event_type: z.enum(feedbackEventTypes),
  event_value: z.string().max(180).optional().default(""),
});

export async function POST(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return errorResponse("You must be logged in to submit feedback.", "FEEDBACK_SAVE_FAILED", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Invalid feedback payload.", "FEEDBACK_SAVE_FAILED", 400);
  }

  try {
    const authUser = await ensureDemoAuthUser(user.email, user.full_name);
    const supabase = createSupabaseAdminClient();

    if (parsed.data.song_id) {
      const { data: song, error: songError } = await supabase
        .from("songs")
        .select("id")
        .eq("id", parsed.data.song_id)
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (songError) {
        return errorResponse(songError.message, "FEEDBACK_SAVE_FAILED", 500);
      }

      if (!song) {
        return errorResponse("Song not found for this user.", "FEEDBACK_SAVE_FAILED", 404);
      }
    }

    if (parsed.data.playlist_id) {
      const { data: playlist, error: playlistError } = await supabase
        .from("playlists")
        .select("id")
        .eq("id", parsed.data.playlist_id)
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (playlistError) {
        return errorResponse(playlistError.message, "FEEDBACK_SAVE_FAILED", 500);
      }

      if (!playlist) {
        return errorResponse("Playlist not found for this user.", "FEEDBACK_SAVE_FAILED", 404);
      }
    }

    const { data: feedback, error: insertError } = await supabase
      .from("feedback_events")
      .insert({
        user_id: authUser.id,
        song_id: parsed.data.song_id ?? null,
        playlist_id: parsed.data.playlist_id ?? null,
        event_type: parsed.data.event_type,
        event_value: parsed.data.event_value,
      })
      .select("id")
      .single();

    if (insertError || !feedback) {
      return errorResponse(insertError?.message ?? "Unable to save feedback.", "FEEDBACK_SAVE_FAILED", 500);
    }

    return successResponse({
      feedback_id: feedback.id,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Feedback save failed.", "FEEDBACK_SAVE_FAILED", 500);
  }
}
