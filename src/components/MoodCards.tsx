import { moodLabels, primaryMoods, type PrimaryMood } from "@/lib/moods";

type MoodCardsProps = {
  counts: Record<PrimaryMood, number>;
  classifiedCount: number;
};

export function MoodCards({ counts, classifiedCount }: MoodCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {primaryMoods.map((mood) => {
        const count = counts[mood] ?? 0;
        const percentage = classifiedCount > 0 ? Math.round((count / classifiedCount) * 100) : 0;

        return (
          <div key={mood} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">{moodLabels[mood]}</p>
              <span className="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">
                {percentage}%
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-50">{count}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percentage}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
