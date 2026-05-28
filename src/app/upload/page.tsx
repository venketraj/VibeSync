import { redirect } from "next/navigation";
import { PrivacyNote } from "@/components/PrivacyNote";
import { Shell } from "@/components/Shell";
import { UploadCsvClient } from "@/components/upload/UploadCsvClient";
import { getDemoUser } from "@/lib/demo-auth";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const user = await getDemoUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <Shell userLabel={user.full_name}>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">Metadata import</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-50">Upload CSV</h1>
          <p className="mt-3 max-w-3xl text-slate-400">
            Preview song metadata rows, then import them into Supabase with duplicate protection.
          </p>
        </div>
        <PrivacyNote className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300" />
        <UploadCsvClient />
      </div>
    </Shell>
  );
}
