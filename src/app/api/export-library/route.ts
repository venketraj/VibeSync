import { errorResponse } from "@/lib/apiResponse";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { joinSongsWithLabels } from "@/lib/songs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MoodLabel, Song } from "@/lib/types";

const columns = [
  "title",
  "artist",
  "album",
  "genre",
  "year",
  "duration_seconds",
  "bpm",
  "language",
  "primary_mood",
  "secondary_moods",
  "confidence",
  "classifier_source",
  "reason",
  "tags",
  "user_corrected",
  "created_at",
] as const;

export async function GET() {
  const user = await getDemoUser();

  if (!user) {
    return errorResponse("You must be logged in to export library.", "EXPORT_LIBRARY_FAILED", 401);
  }

  try {
    const authUser = await ensureDemoAuthUser(user.email, user.full_name);
    const supabase = createSupabaseAdminClient();
    const [{ data: songsData, error: songsError }, { data: labelsData, error: labelsError }] = await Promise.all([
      supabase.from("songs").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
      supabase.from("song_mood_labels").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
    ]);

    if (songsError) {
      return errorResponse(songsError.message, "EXPORT_LIBRARY_FAILED", 500);
    }

    if (labelsError) {
      return errorResponse(labelsError.message, "EXPORT_LIBRARY_FAILED", 500);
    }

    const songs = (songsData ?? []) as Song[];
    const labels = (labelsData ?? []) as MoodLabel[];
    const songsWithMood = joinSongsWithLabels(songs, labels);
    const lines = [columns.join(",")];

    songsWithMood.forEach((song) => {
      const label = song.mood_label;
      const row = [
        song.title ?? "",
        song.artist ?? "",
        song.album ?? "",
        song.genre ?? "",
        song.year ?? "",
        song.duration_seconds ?? "",
        song.bpm ?? "",
        song.language ?? "",
        label?.primary_mood ?? "",
        (label?.secondary_moods ?? []).join("|"),
        label ? String(label.confidence) : "",
        label ? classifierSourceLabel(label.classifier_version) : "Unclassified",
        label?.reason ?? "",
        (label?.tags ?? []).join("|"),
        label ? String(Boolean(label.user_corrected)) : "",
        song.created_at ?? "",
      ].map(csvEscape);

      lines.push(row.join(","));
    });

    const csv = lines.join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="vibesync-classified-library.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Export failed.", "EXPORT_LIBRARY_FAILED", 500);
  }
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function classifierSourceLabel(version: string | null | undefined) {
  if (version === "local-v1") return "Local";
  if (version === "local-v1-fallback-used") return "Local fallback";
  if (version === "apifreellm-fallback-v1") return "APIFreeLLM fallback";
  if (version === "user-corrected") return "User corrected";
  return "Unknown";
}
