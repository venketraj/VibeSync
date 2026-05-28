import { createHash } from "crypto";
import type { SongMetadataInput } from "@/lib/types";

export function normalizeFingerprintPart(value: string | number | null | undefined) {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ");
}

export function createSongFingerprint(song: SongMetadataInput) {
  const source = [
    normalizeFingerprintPart(song.title),
    normalizeFingerprintPart(song.artist),
    normalizeFingerprintPart(song.album),
    normalizeFingerprintPart(song.duration_seconds),
  ].join("|");

  return createHash("sha256").update(source).digest("hex");
}
