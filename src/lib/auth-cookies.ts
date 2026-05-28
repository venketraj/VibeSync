export function isSupabaseAuthCookie(name: string) {
  return name.startsWith("sb-") || name.includes("supabase-auth-token");
}

export function isRefreshTokenError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("refresh token") || normalized.includes("invalid refresh");
}

export function isExpectedSignedOutAuthError(message: string) {
  const normalized = message.toLowerCase();

  return (
    isRefreshTokenError(message) ||
    normalized.includes("auth session missing") ||
    normalized.includes("session missing") ||
    normalized.includes("missing session")
  );
}
