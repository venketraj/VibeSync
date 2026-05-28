import { NextResponse } from "next/server";
import { z } from "zod";
import { classifySong } from "@/lib/ai/classifySong";
import { getDemoUser } from "@/lib/demo-auth";

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

export async function POST(request: Request) {
  const user = await getDemoUser();

  if (!user) {
    return NextResponse.json({ error: "You must be logged in to classify songs." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = songSchema.safeParse(body?.song ?? body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid song payload." }, { status: 400 });
  }

  try {
    const classification = await classifySong(parsed.data);
    return NextResponse.json(classification);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Classification failed." },
      { status: 500 },
    );
  }
}
