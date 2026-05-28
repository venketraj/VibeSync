import { NextResponse } from "next/server";
import { classifySong } from "@/lib/ai/classifySong";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { getDemoUser } from "@/lib/demo-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MoodLabel, Song } from "@/lib/types";

export async function POST() {
  const user = await getDemoUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to classify songs." }, { status: 401 });
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);
  const supabase = createSupabaseAdminClient();
  const [{ data: songsData, error: songsError }, { data: labelsData, error: labelsError }] =
    await Promise.all([
      supabase
        .from("songs")
        .select("*")
        .eq("user_id", authUser.id)
        .order("created_at", { ascending: true })
        .limit(100),
      supabase.from("song_mood_labels").select("song_id").eq("user_id", authUser.id),
    ]);

  if (songsError) {
    return NextResponse.json({ error: songsError.message }, { status: 500 });
  }

  if (labelsError) {
    return NextResponse.json({ error: labelsError.message }, { status: 500 });
  }

  const labeledSongIds = new Set((labelsData ?? []).map((label) => label.song_id as string));
  const songsToClassify = ((songsData ?? []) as Song[])
    .filter((song) => !labeledSongIds.has(song.id))
    .slice(0, 50);

  const attempted = songsToClassify.length;
  let classified = 0;
  let localCount = 0;
  let apiFreeLlmCount = 0;
  const failures: { song_id: string; error: string }[] = [];

  for (const song of songsToClassify) {
    try {
      const classification = await classifySong(song);

      const label: Omit<MoodLabel, "id" | "created_at"> = {
        song_id: song.id,
        user_id: authUser.id,
        primary_mood: classification.primary_mood,
        secondary_moods: classification.secondary_moods,
        confidence: classification.confidence,
        reason: classification.reason,
        tags: classification.tags,
        classifier_version: classification.classifier_version,
      };

      const { error: insertError } = await supabase.from("song_mood_labels").insert(label);

      if (insertError) {
        failures.push({ song_id: song.id, error: insertError.message });
        continue;
      }

      classified += 1;
      if (classification.classifier_version === "apifreellm-fallback-v1") {
        apiFreeLlmCount += 1;
      } else {
        localCount += 1;
      }
    } catch (error) {
      failures.push({
        song_id: song.id,
        error: error instanceof Error ? error.message : "Unknown classification failure.",
      });
    }
  }

  return NextResponse.json({
    attempted,
    classified,
    local_count: localCount,
    apifreellm_count: apiFreeLlmCount,
    failed_count: failures.length,
    skipped_count: 0,
    failures,
  });
}
