"use client";

import Papa from "papaparse";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileUp } from "lucide-react";
import { sampleSongs } from "@/data/sampleSongs";
import { ErrorState } from "@/components/ui/States";
import type { ImportResult, SongMetadataInput } from "@/lib/types";

const expectedFields = [
  "title",
  "artist",
  "album",
  "genre",
  "year",
  "duration_seconds",
  "bpm",
  "language",
  "lyrics_snippet",
];

export function UploadCsvClient() {
  const router = useRouter();
  const [rows, setRows] = useState<SongMetadataInput[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setError("");
        const parsedRows = result.data
          .map((row) => ({
            title: row.title,
            artist: row.artist,
            album: row.album,
            genre: row.genre,
            year: toNumber(row.year),
            duration_seconds: toNumber(row.duration_seconds),
            bpm: toNumber(row.bpm),
            language: row.language,
            lyrics_snippet: row.lyrics_snippet,
          }))
          .filter((row) => row.title && row.artist);

        setRows(parsedRows);
        setStatus(`Previewing ${parsedRows.length} valid rows.`);
        if (parsedRows.length === 0) {
          setError("No valid rows found. CSV must include at least title and artist columns.");
        }
      },
      error: (error) => {
        setError(error.message);
      },
    });
  }

  async function importRows(importRows: SongMetadataInput[]) {
    setLoading(true);
    setStatus("");
    setError("");

    const response = await fetch("/api/import-songs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songs: importRows }),
    });
    const data = (await response.json()) as ImportResult | { error: string };

    setLoading(false);

    if (!response.ok) {
      setError("error" in data ? data.error : "Import failed.");
      return;
    }

    if ("error" in data) {
      setError(data.error);
      return;
    }

    setStatus(`Imported ${data.inserted}; ${data.existing} already existed.`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-white/15 bg-slate-950/60 px-4 py-10 text-center hover:border-cyan-300/70"
          htmlFor="csv"
        >
          <FileUp className="size-8 text-cyan-300" aria-hidden />
          <span className="font-semibold text-slate-100">Upload CSV</span>
          <span className="max-w-2xl text-sm text-slate-400">
            Expected fields: {expectedFields.join(", ")}
          </span>
        </label>
        <input
          accept=".csv,text/csv"
          className="sr-only"
          id="csv"
          onChange={(event) => handleFile(event.target.files?.[0])}
          type="file"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="rounded-md bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
          disabled={loading || rows.length === 0}
          onClick={() => importRows(rows)}
          type="button"
        >
          Import preview rows
        </button>
        <button
          className="rounded-md border border-white/15 px-4 py-3 font-semibold text-slate-100 hover:bg-white/10 disabled:opacity-60"
          disabled={loading}
          onClick={() => importRows(sampleSongs)}
          type="button"
        >
          Use sample library
        </button>
      </div>

      {status ? <p className="text-sm text-slate-400">{status}</p> : null}
      {error ? <ErrorState title="Upload issue" message={error} /> : null}

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.06] text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Artist</th>
                <th className="px-4 py-3">Album</th>
                <th className="px-4 py-3">Genre</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">BPM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rows.slice(0, 12).map((row, index) => (
                <tr key={`${row.title}-${row.artist}-${index}`} className="bg-white/[0.025]">
                  <td className="px-4 py-3 font-medium text-slate-100">{row.title}</td>
                  <td className="px-4 py-3 text-slate-300">{row.artist}</td>
                  <td className="px-4 py-3 text-slate-400">{row.album || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{row.genre || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{row.year || "-"}</td>
                  <td className="px-4 py-3 text-slate-400">{row.bpm || "-"}</td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-slate-400" colSpan={6}>
                    Choose a CSV to preview rows before import.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function toNumber(value: string | undefined) {
  if (!value) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
