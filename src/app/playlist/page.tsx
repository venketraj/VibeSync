import { redirect } from "next/navigation";
import { PlaylistClient } from "@/components/playlist/PlaylistClient";
import { PrivacyNote } from "@/components/PrivacyNote";
import { Shell } from "@/components/Shell";
import { getDemoUser } from "@/lib/demo-auth";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { primaryMoods, type PrimaryMood } from "@/lib/moods";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { MoodLabel, Song } from "@/lib/types";

export const dynamic = "force-dynamic";

type PlaylistRow = {
  id: string;
  name: string;
  description: string | null;
  mood: PrimaryMood;
  vibe_tags: string[] | null;
  created_at: string | null;
};

type PlaylistItemRow = {
  playlist_id: string;
  song_id: string;
};

export default async function PlaylistPage() {
  const user = await getDemoUser();

  if (!user) {
    redirect("/login");
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);
  const supabase = createSupabaseAdminClient();
  const [{ data: songsData }, { data: labelsData }, { data: playlistsData }] = await Promise.all([
    supabase.from("songs").select("*").eq("user_id", authUser.id).order("title", { ascending: true }),
    supabase.from("song_mood_labels").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }),
    supabase.from("playlists").select("id,name,description,mood,vibe_tags,created_at").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(20),
  ]);

  const songs = ((songsData ?? []) as Song[]).filter((song) => song.title && song.artist);
  const labels = (labelsData ?? []) as MoodLabel[];
  const latestLabelBySong = new Map<string, MoodLabel>();

  labels.forEach((label) => {
    if (!latestLabelBySong.has(label.song_id)) {
      latestLabelBySong.set(label.song_id, label);
    }
  });

  const seedSongs = songs.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre: song.genre ?? null,
    primary_mood: latestLabelBySong.get(song.id)?.primary_mood ?? null,
  }));

  const playlists = (playlistsData ?? []) as PlaylistRow[];
  const playlistIds = playlists.map((playlist) => playlist.id);
  const { data: itemsData } =
    playlistIds.length > 0
      ? await supabase.from("playlist_items").select("playlist_id,song_id").in("playlist_id", playlistIds)
      : { data: [] as PlaylistItemRow[] };

  const itemCounts = new Map<string, number>();
  (itemsData ?? []).forEach((item) => {
    itemCounts.set(item.playlist_id, (itemCounts.get(item.playlist_id) ?? 0) + 1);
  });

  const safePlaylists = playlists
    .filter((playlist) => primaryMoods.includes(playlist.mood))
    .map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      mood: playlist.mood,
      vibe_tags: Array.isArray(playlist.vibe_tags) ? playlist.vibe_tags : [],
      song_count: itemCounts.get(playlist.id) ?? 0,
      created_at: playlist.created_at,
    }));

  return (
    <Shell userLabel={user.full_name}>
      <div className="space-y-5">
        <PrivacyNote className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300" />
        <PlaylistClient initialSavedPlaylists={safePlaylists} seedSongs={seedSongs} />
      </div>
    </Shell>
  );
}
