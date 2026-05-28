import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { Shell } from "@/components/Shell";
import { getDemoUser } from "@/lib/demo-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getDemoUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Shell>
      <div className="mx-auto grid max-w-4xl gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">Tuesday MVP auth</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Login to VibeSync</h1>
          <p className="mt-4 leading-7 text-slate-400">
            Create a lightweight demo account with name and email. Login checks the email in
            Supabase and opens your cloud-saved song library.
          </p>
        </div>
        <LoginForm />
      </div>
    </Shell>
  );
}
