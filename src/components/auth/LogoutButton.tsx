"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/demo-auth/logout", {
      method: "POST",
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="size-4" aria-hidden />
      Logout
    </button>
  );
}
