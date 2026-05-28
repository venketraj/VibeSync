import Link from "next/link";
import { redirect } from "next/navigation";
import { ClassifyButton } from "@/components/ClassifyButton";
import { ImportSampleButton } from "@/components/ImportSampleButton";
import { MoodCards } from "@/components/MoodCards";
import { PrivacyNote } from "@/components/PrivacyNote";
import { Shell } from "@/components/Shell";
import { SyncProofCard } from "@/components/SyncProofCard";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { getDemoUser } from "@/lib/demo-auth";
import { getLibraryStats } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getDemoUser();

  if (!user) {
    redirect("/login");
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);
  const stats = await getLibraryStats(authUser.id);

  return (
    <Shell userLabel={user.full_name}>
      <div className="space-y-8">
        <PrivacyNote className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300" />

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-slate-400">Logged in as</p>
            <h1 className="mt-2 break-all text-2xl font-semibold text-slate-50">{user.full_name}</h1>
            <p className="mt-1 break-all text-sm text-slate-400">{user.email}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <Link className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/10" href="/library">
                Open library
              </Link>
              <Link className="rounded-md border border-white/15 px-3 py-2 hover:bg-white/10" href="/playlist">
                Open playlists
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Total songs</p>
              <p className="mt-3 text-4xl font-semibold">{stats.totalSongs}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Classified</p>
              <p className="mt-3 text-4xl font-semibold">{stats.classifiedSongs}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Unclassified</p>
              <p className="mt-3 text-4xl font-semibold">{stats.unclassifiedSongs}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <p className="text-sm text-slate-400">Cloud sync</p>
              <p className="mt-3 text-lg font-semibold text-emerald-200">Supabase saved</p>
            </div>
          </div>
        </section>

        <SyncProofCard
          classifiedSongs={stats.classifiedSongs}
          lastSyncedAt={stats.lastSyncedAt}
          totalSongs={stats.totalSongs}
        />

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <h2 className="text-lg font-semibold text-slate-50">Demo mode assistant</h2>
          {stats.totalSongs === 0 ? (
            <div className="mt-3 space-y-3">
              <p className="text-slate-300">
                You have no songs yet. Start instantly with the sample library to run the full Friday demo flow.
              </p>
              <ImportSampleButton />
            </div>
          ) : stats.classifiedSongs === 0 ? (
            <div className="mt-3 space-y-3">
              <p className="text-slate-300">
                Your songs are imported. Next step: classify songs to unlock dashboard mood insights and playlist generation.
              </p>
              <ClassifyButton />
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-slate-300">
                Your library is classified. You are ready to generate and save a mood playlist.
              </p>
              <Link
                className="inline-flex items-center justify-center rounded-md bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 hover:bg-cyan-300"
                href="/playlist"
              >
                Generate playlist
              </Link>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-start">
          <ImportSampleButton />
          <Link
            className="inline-flex items-center justify-center rounded-md border border-white/15 px-4 py-3 font-semibold text-slate-100 hover:bg-white/10"
            href="/upload"
          >
            Upload CSV
          </Link>
          <ClassifyButton />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-50">Mood counts</h2>
            <Link className="text-sm font-medium text-cyan-200 hover:text-cyan-100" href="/library">
              View library
            </Link>
          </div>
          <MoodCards counts={stats.moodCounts} classifiedCount={stats.classifiedSongs} />
        </section>
      </div>
    </Shell>
  );
}
