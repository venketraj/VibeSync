"use client";

import { isSupabaseAuthCookie } from "@/lib/auth-cookies";

export function clearSupabaseBrowserAuthCookies() {
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0]?.trim();

    if (name && isSupabaseAuthCookie(name)) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  });
}
