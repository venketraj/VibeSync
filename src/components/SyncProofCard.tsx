"use client";

import { useRouter } from "next/navigation";

type SyncProofCardProps = {
  totalSongs: number;
  classifiedSongs: number;
  lastSyncedAt: string | null;
};

export function SyncProofCard({ totalSongs, classifiedSongs, lastSyncedAt }: SyncProofCardProps) {
  const router = useRouter();
  const lastSyncedText = lastSyncedAt ? new Date(lastSyncedAt).toLocaleString() : "No cloud writes yet";

  return (
    <section className="rounded-lg border border-emerald-300/20 bg-emerald-500/10 p-5">
      <p className="text-sm font-medium text-emerald-100">Saved to cloud with Supabase.</p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-50">
        Your mood labels are tied to your account, so they can reload when you sign in from another browser or device.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-emerald-300/20 bg-slate-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-emerald-200">Total songs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{totalSongs}</p>
        </div>
        <div className="rounded-md border border-emerald-300/20 bg-slate-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-emerald-200">Classified songs</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{classifiedSongs}</p>
        </div>
        <div className="rounded-md border border-emerald-300/20 bg-slate-950/40 p-3">
          <p className="text-xs uppercase tracking-wide text-emerald-200">Last synced</p>
          <p className="mt-2 text-sm font-semibold text-slate-100">{lastSyncedText}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex w-fit rounded-md border border-emerald-300/30 bg-emerald-300/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-100">
          Available across devices
        </span>
        <button
          className="rounded-md border border-emerald-300/30 px-3 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/10"
          onClick={() => router.refresh()}
          type="button"
        >
          Reload from cloud
        </button>
      </div>
    </section>
  );
}
