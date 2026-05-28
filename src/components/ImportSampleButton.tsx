"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { sampleSongs } from "@/data/sampleSongs";
import type { ImportResult } from "@/lib/types";

export function ImportSampleButton() {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function importSample() {
    setLoading(true);
    setStatus("");

    const response = await fetch("/api/import-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: sampleSongs }),
    });

    const data = (await response.json()) as ImportResult | { error: string };
    setLoading(false);

    if (!response.ok) {
      setStatus("error" in data ? data.error : "Import failed.");
      return;
    }

    if ("error" in data) {
      setStatus(data.error);
      return;
    }

    setStatus(`Sample library ready. Imported ${data.inserted}; ${data.existing} already existed.`);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60 sm:w-auto"
        disabled={loading}
        onClick={importSample}
        type="button"
      >
        <UploadCloud className="size-4" aria-hidden />
        Import sample library
      </button>
      {status ? <p className="text-sm text-slate-400">{status}</p> : null}
    </div>
  );
}
