"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ErrorState } from "@/components/ui/States";

type ExportErrorResponse = {
  success?: boolean;
  error?: {
    message?: string;
  };
};

export function ExportLibraryButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  async function exportLibrary() {
    setLoading(true);
    setError("");
    setStatus("");

    try {
      const response = await fetch("/api/export-library", {
        method: "GET",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ExportErrorResponse;
        setError(data.error?.message ?? "Export failed.");
        setLoading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "vibesync-classified-library.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setStatus("CSV export downloaded.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Export failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-md border border-white/15 px-4 py-3 font-semibold text-slate-100 hover:bg-white/10 disabled:opacity-60"
        disabled={loading}
        onClick={exportLibrary}
        type="button"
      >
        <Download className="size-4" aria-hidden />
        {loading ? "Exporting..." : "Export CSV"}
      </button>
      {status ? <p className="text-sm text-slate-400">{status}</p> : null}
      {error ? <ErrorState title="Export issue" message={error} /> : null}
    </div>
  );
}
