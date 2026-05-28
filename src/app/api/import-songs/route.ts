import { NextResponse } from "next/server";
import { z } from "zod";
import { createSongFingerprint } from "@/lib/fingerprint";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { getDemoUser } from "@/lib/demo-auth";
import { cleanSongInput } from "@/lib/songs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const songSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string().nullish(),
  genre: z.string().nullish(),
  year: z.coerce.number().int().nullable().optional(),
  duration_seconds: z.coerce.number().int().nullable().optional(),
  bpm: z.coerce.number().int().nullable().optional(),
  language: z.string().nullish(),
  lyrics_snippet: z.string().nullish(),
});

const importSchema = z.object({
  songs: z.array(songSchema).min(1).max(250),
});

export async function POST(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to import songs." }, { status: 401 });
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);

  const body = await request.json().catch(() => null);
  const parsed = importSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid song metadata payload." }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const preparedSongs = parsed.data.songs.map((song) => {
    const cleaned = cleanSongInput(song);

    return {
      ...cleaned,
      user_id: authUser.id,
      fingerprint: createSongFingerprint(cleaned),
    };
  });

  const fingerprints = Array.from(new Set(preparedSongs.map((song) => song.fingerprint)));
  const { data: existingSongs, error: existingError } = await supabase
    .from("songs")
    .select("fingerprint")
    .eq("user_id", authUser.id)
    .in("fingerprint", fingerprints);

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingFingerprints = new Set((existingSongs ?? []).map((song) => song.fingerprint as string));
  const seenInPayload = new Set<string>();
  const songsToInsert = preparedSongs.filter((song) => {
    if (existingFingerprints.has(song.fingerprint) || seenInPayload.has(song.fingerprint)) {
      return false;
    }

    seenInPayload.add(song.fingerprint);
    return true;
  });

  if (songsToInsert.length > 0) {
    const { error: insertError } = await supabase.from("songs").insert(songsToInsert);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    inserted: songsToInsert.length,
    existing: preparedSongs.length - songsToInsert.length,
    total: preparedSongs.length,
  });
}
