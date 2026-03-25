export default function ReviewLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-slate-200" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-slate-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-white p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-white p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}
