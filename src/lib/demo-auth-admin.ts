import "server-only";

import { randomUUID } from "crypto";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function ensureDemoAuthUser(email: string, fullName: string) {
  const supabase = createSupabaseAdminClient();
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: `vibesync-${randomUUID()}`,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error) {
    const duplicate = await findAuthUserByEmail(email);
    if (duplicate) return duplicate;
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Supabase did not return a created auth user.");
  }

  return {
    id: data.user.id,
    email: data.user.email ?? email,
  };
}

async function findAuthUserByEmail(email: string) {
  const supabase = createSupabaseAdminClient();
  const normalizedEmail = email.toLowerCase();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      throw new Error(error.message);
    }

    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === normalizedEmail);
    if (user) {
      return {
        id: user.id,
        email: user.email ?? email,
      };
    }

    if (data.users.length < 100) {
      break;
    }

    page += 1;
  }

  return null;
}
