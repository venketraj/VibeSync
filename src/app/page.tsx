import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, FileUp, Lock, Sparkles } from "lucide-react";
import { PrivacyNote } from "@/components/PrivacyNote";
import { Shell } from "@/components/Shell";
import { getDemoUser } from "@/lib/demo-auth";

export default async function Home() {
  const user = await getDemoUser();

  return (
    <Shell userLabel={user?.full_name}>
      <section className="grid min-h-[72vh] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-4 inline-flex rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-100">
            VibeSync
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-50 sm:text-6xl">VibeSync</h1>
          <p className="mt-3 text-xl font-medium text-cyan-100">AI mood sync for your music library</p>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Upload your song metadata, auto-classify moods, generate playlists, and keep your mood intelligence synced in cloud storage.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-md bg-cyan-400 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              href={user ? "/dashboard" : "/login"}
            >
              Try sample library
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-md border border-white/15 px-5 py-3 font-semibold text-slate-100 hover:bg-white/10"
              href="/login"
            >
              Login
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-400">Try a sample library without needing your own CSV.</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div className="grid gap-3">
            {[
              { icon: FileUp, title: "Upload", text: "Import CSV metadata with title, artist, genre, BPM, and snippets." },
              { icon: Sparkles, title: "Classify", text: "Server-side AI mood labeling for a small Tuesday batch." },
              { icon: Database, title: "View moods", text: "Dashboard cards show classified library shape and mood coverage instantly." },
              { icon: Lock, title: "Sync", text: "Supabase persistence keeps moods and playlists available across devices." },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 rounded-md border border-white/10 bg-slate-950/50 p-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-cyan-300/10 text-cyan-200">
                  <item.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-100">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-md border border-white/10 bg-slate-950/50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">How it works</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-200" aria-hidden />
                1. Upload metadata
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-200" aria-hidden />
                2. Classify moods
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-200" aria-hidden />
                3. Generate playlist
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-cyan-200" aria-hidden />
                4. Sync across devices
              </li>
            </ol>
          </div>
          <PrivacyNote className="mt-5 rounded-md bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100" />
        </div>
      </section>
    </Shell>
  );
}
