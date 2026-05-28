import { redirect } from "next/navigation";
import { ClassifyButton } from "@/components/ClassifyButton";
import { ExportLibraryButton } from "@/components/ExportLibraryButton";
import { Shell } from "@/components/Shell";
import { SongTable } from "@/components/SongTable";
import { ensureDemoAuthUser } from "@/lib/demo-auth-admin";
import { getDemoUser } from "@/lib/demo-auth";
import { getLibraryStats } from "@/lib/server-data";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await getDemoUser();

  if (!user) {
    redirect("/login");
  }

  const authUser = await ensureDemoAuthUser(user.email, user.full_name);
  const stats = await getLibraryStats(authUser.id);

  return (
    <Shell userLabel={user.full_name}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-cyan-200">Cloud library</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-50">Songs and moods</h1>
            <p className="mt-3 text-slate-400">
              Unclassified songs stay visible until the AI batch labeler stores mood rows.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ExportLibraryButton />
            <ClassifyButton />
          </div>
        </div>
        <SongTable songs={stats.songs} />
      </div>
    </Shell>
  );
}
