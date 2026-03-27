export function HistorySkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-semibold text-foreground">Ten file</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Ngay tao</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Trang thai</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Loai tour</th>
            <th className="px-4 py-3 text-left font-semibold text-foreground">Lien ket Canva</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b">
              <td className="px-4 py-4"><div className="h-4 w-40 animate-pulse rounded bg-muted" /></td>
              <td className="px-4 py-4"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
              <td className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded bg-muted" /></td>
              <td className="px-4 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
              <td className="px-4 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
