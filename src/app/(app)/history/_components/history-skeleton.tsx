import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HistorySkeleton() {
  return (
    <div className="surface-panel-glass overflow-hidden rounded-[24px] border border-semantic-light shadow-semantic-light">
      <Table className="min-w-[720px]">
        <TableHeader className="bg-surface-panel-cool/80">
          <TableRow className="border-semantic-light hover:bg-transparent">
            <TableHead className="px-4 py-3 text-sm font-semibold text-foreground">Tên file</TableHead>
            <TableHead className="px-4 py-3 text-sm font-semibold text-foreground">Ngày tạo</TableHead>
            <TableHead className="px-4 py-3 text-sm font-semibold text-foreground">Trạng thái</TableHead>
            <TableHead className="px-4 py-3 text-sm font-semibold text-foreground">Loại tour</TableHead>
            <TableHead className="px-4 py-3 text-sm font-semibold text-foreground">Liên kết Canva</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="border-semantic-light">
              <TableCell className="px-4 py-4"><div className="h-4 w-40 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell className="px-4 py-4"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell className="px-4 py-4"><div className="h-5 w-20 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell className="px-4 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
              <TableCell className="px-4 py-4"><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
