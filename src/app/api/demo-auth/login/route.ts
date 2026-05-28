import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { demoAuthCookieName, encodeDemoUser } from "@/lib/demo-auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const loginSchema = z.object({
  email: z.string().trim().email("Valid email is required."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const supabase = createSupabaseAdminClient();
  const { data: user, error } = await supabase
    .from("demo_users")
    .select("id, full_name, email")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "No account found for this email. Create account first." }, { status: 404 });
  }

  const authUser = await ensureDemoAuthUser(email, user.full_name ?? "VibeSync user");
  const normalizedUser = user.id === authUser.id ? user : { ...user, id: authUser.id };

  if (user.id !== authUser.id) {
    await supabase.from("demo_users").update({ id: authUser.id, updated_at: new Date().toISOString() }).eq("email", email);
  }

  const response = NextResponse.json({
    message: "Login successful.",
    user: normalizedUser,
  });

  response.cookies.set(
    demoAuthCookieName,
    encodeDemoUser({
      id: normalizedUser.id,
      email: normalizedUser.email,
      full_name: normalizedUser.full_name ?? "VibeSync user",
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );

  return response;
}
