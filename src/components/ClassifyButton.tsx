"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/ui/States";

export function ClassifyButton() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function classifySongs() {
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/classify-bulk", {
      method: "POST",
    });
    const data = (await response.json()) as {
      attempted?: number;
      classified?: number;
      local_count?: number;
      apifreellm_count?: number;
      failed_count?: number;
      skipped_count?: number;
      failures?: { song_id: string; error: string }[];
      error?: string;
    };

    setLoading(false);

    if (!response.ok) {
      setStatus(data.error ?? "Classification failed.");
      return;
    }

    const failureText = data.failed_count ? ` ${data.failed_count} failed.` : "";
    setStatus(
      `Classification complete. ${data.classified ?? 0}/${data.attempted ?? 0} labeled. Local: ${
        data.local_count ?? 0
      }. APIFreeLLM: ${data.apifreellm_count ?? 0}. Skipped: ${data.skipped_count ?? 0}.${failureText}`,
    );
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-cyan-300/40 px-4 py-3 font-semibold text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-60 sm:w-auto"
        disabled={loading}
        onClick={classifySongs}
        type="button"
      >
        <Sparkles className="size-4" aria-hidden />
        Classify unclassified songs
      </button>
      {loading ? (
        <LoadingState title="Classifying your music library..." message="Hybrid local-first classifier is running." />
      ) : null}
      {status ? (
        status.toLowerCase().includes("failed") || status.toLowerCase().includes("error") ? (
          <ErrorState title="Classification issue" message={status} />
        ) : (
          <p className="text-sm text-slate-400">{status}</p>
        )
      ) : null}
    </div>
  );
}
