import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const signupSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required."),
  email: z.string().trim().email("Valid email is required."),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid name and email." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const fullName = parsed.data.full_name.trim();
  const supabase = createSupabaseAdminClient();
  const authUser = await ensureDemoAuthUser(email, fullName);

  const { data: existingUser, error: lookupError } = await supabase
    .from("demo_users")
    .select("id, full_name, email")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: formatDemoUsersError(lookupError.message) }, { status: 500 });
  }

  if (existingUser) {
    if (existingUser.id !== authUser.id) {
      await supabase.from("demo_users").update({ id: authUser.id, updated_at: new Date().toISOString() }).eq("email", email);
    }

    return NextResponse.json({ error: "An account with this email already exists. Use Login." }, { status: 409 });
  }

  const { data: insertedUser, error: insertError } = await supabase
    .from("demo_users")
    .insert({
      id: authUser.id,
      full_name: fullName,
      email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id, full_name, email")
    .single();

  if (insertError) {
    return NextResponse.json({ error: formatDemoUsersError(insertError.message) }, { status: 500 });
  }

  return NextResponse.json({
    message: "Sign up successful. Click Login to continue.",
    user: insertedUser,
  });
}

function formatDemoUsersError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("demo_users")) {
    return "Create the demo_users table in Supabase. The SQL is in README.md under Demo Auth SQL.";
  }

  return message;
}
