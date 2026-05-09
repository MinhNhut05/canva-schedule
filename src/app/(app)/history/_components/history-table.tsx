"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface HistoryJob {
  id: string;
  fileName: string;
  createdAt: string;
  status: "success" | "error";
  statusLabel: string;
  tourTypeLabel: string;
  canvaLinkLabel: string;
}

interface HistoryTableProps {
  jobs: HistoryJob[];
}

export function HistoryTable({ jobs }: HistoryTableProps) {
  const router = useRouter();

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
          {jobs.map((job) => (
            <TableRow
              key={job.id}
              role="link"
              tabIndex={0}
              aria-label={`Mở bản review cho ${job.fileName}`}
              className="cursor-pointer border-semantic-light focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              onClick={() => router.push(`/review/${job.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/review/${job.id}`);
                }
              }}
            >
              <TableCell className="px-4 py-4 font-medium text-foreground whitespace-normal break-words">
                {job.fileName}
              </TableCell>
              <TableCell className="px-4 py-4 text-muted-foreground whitespace-normal">
                {new Date(job.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
              <TableCell className="px-4 py-4">
                <Badge variant={job.status === "success" ? "default" : "destructive"}>
                  {job.statusLabel}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-4 text-muted-foreground whitespace-normal">
                {job.tourTypeLabel}
              </TableCell>
              <TableCell className="px-4 py-4 text-muted-foreground whitespace-normal">
                {job.canvaLinkLabel}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
