import Link from "next/link";
import { Music2 } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

type ShellProps = {
  children: React.ReactNode;
  userLabel?: string | null;
};

export function Shell({ children, userLabel }: ShellProps) {
  return (
    <div className="min-h-screen bg-[#090b10] text-slate-100">
      <header className="border-b border-white/10 bg-[#090b10]/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
              <Music2 className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block text-base font-semibold">VibeSync</span>
              <span className="block text-xs text-slate-400">AI mood sync</span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 text-sm text-slate-300">
            {userLabel ? (
              <>
                <Link className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:inline-flex" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:inline-flex" href="/library">
                  Library
                </Link>
                <Link className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:inline-flex" href="/upload">
                  Upload
                </Link>
                <Link className="hidden rounded-md px-3 py-2 hover:bg-white/10 sm:inline-flex" href="/playlist">
                  Playlist
                </Link>
                <LogoutButton />
              </>
            ) : (
              <Link className="rounded-md bg-cyan-400 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-300" href="/login">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
