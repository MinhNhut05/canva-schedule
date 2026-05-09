export default function ReviewLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-9 w-72 animate-pulse rounded-lg bg-surface-panel-cool" />
        <div className="h-5 w-48 animate-pulse rounded-lg bg-surface-panel-cool" />
        <div className="flex gap-2">
          <div className="h-6 w-20 animate-pulse rounded-full bg-surface-panel-cool" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-surface-panel-cool" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-semantic-light bg-surface-panel-glass p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-surface-panel-cool" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
          </div>
        </div>
        <div className="space-y-4 rounded-xl border border-semantic-light bg-surface-panel-glass p-6">
          <div className="h-6 w-24 animate-pulse rounded bg-surface-panel-cool" />
          <div className="space-y-3">
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
            <div className="h-10 animate-pulse rounded-lg bg-surface-panel-cool" />
          </div>
        </div>
      </div>
    </div>
  );
}
