import "server-only";

import { cookies } from "next/headers";

export type DemoUser = {
  id: string;
  email: string;
  full_name: string;
};

export const demoAuthCookieName = "vibesync_demo_user";

export async function getDemoUser(): Promise<DemoUser | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(demoAuthCookieName)?.value;

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as DemoUser;
  } catch {
    return null;
  }
}

export function encodeDemoUser(user: DemoUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64url");
}
