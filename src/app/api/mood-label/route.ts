import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { getDemoUser } from "@/lib/demo-auth";
import { primaryMoods } from "@/lib/moods";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const correctionSchema = z.object({
  song_id: z.string().uuid(),
  primary_mood: z.enum(primaryMoods),
});

export async function PATCH(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to correct moods." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = correctionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid mood correction payload." }, { status: 400 });
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);
  const supabase = createSupabaseAdminClient();

  const { data: song, error: songError } = await supabase
    .from("songs")
    .select("id")
    .eq("id", parsed.data.song_id)
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (songError) {
    return NextResponse.json({ error: songError.message }, { status: 500 });
  }

  if (!song) {
    return NextResponse.json({ error: "Song not found for this user." }, { status: 404 });
  }

  const correction = {
    song_id: parsed.data.song_id,
    user_id: authUser.id,
    primary_mood: parsed.data.primary_mood,
    secondary_moods: [],
    confidence: 1,
    reason: "User corrected this mood.",
    tags: ["user-corrected", parsed.data.primary_mood, "manual"],
    classifier_version: "user-corrected",
    user_corrected: true,
  };

  const { data: existingLabel, error: labelLookupError } = await supabase
    .from("song_mood_labels")
    .select("id")
    .eq("song_id", parsed.data.song_id)
    .eq("user_id", authUser.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (labelLookupError) {
    return NextResponse.json({ error: labelLookupError.message }, { status: 500 });
  }

  const result = existingLabel
    ? await supabase.from("song_mood_labels").update(correction).eq("id", existingLabel.id)
    : await supabase.from("song_mood_labels").insert(correction);

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Mood corrected.",
    label: correction,
  });
}
