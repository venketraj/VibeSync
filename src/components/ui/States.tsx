type StateProps = {
  title: string;
  message?: string;
};

export function EmptyState({ title, message }: StateProps) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center">
      <p className="font-semibold text-slate-100">{title}</p>
      {message ? <p className="mt-2 text-sm text-slate-400">{message}</p> : null}
    </div>
  );
}

export function ErrorState({ title, message }: StateProps) {
  return (
    <div className="rounded-lg border border-rose-300/20 bg-rose-500/10 px-4 py-3">
      <p className="font-semibold text-rose-100">{title}</p>
      {message ? <p className="mt-1 text-sm text-rose-200">{message}</p> : null}
    </div>
  );
}

export function LoadingState({ title, message }: StateProps) {
  return (
    <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-3">
      <p className="font-semibold text-cyan-100">{title}</p>
      {message ? <p className="mt-1 text-sm text-cyan-200">{message}</p> : null}
    </div>
  );
}
