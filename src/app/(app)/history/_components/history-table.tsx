"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

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
          {jobs.map((job) => (
            <tr
              key={job.id}
              role="link"
              tabIndex={0}
              className="cursor-pointer border-b transition-colors hover:bg-muted/50 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
              onClick={() => router.push(`/review/${job.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(`/review/${job.id}`);
                }
              }}
            >
              <td className="px-4 py-4 font-medium text-foreground">{job.fileName}</td>
              <td className="px-4 py-4 text-muted-foreground">
                {new Date(job.createdAt).toLocaleDateString("vi-VN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-4 py-4">
                <Badge variant={job.status === "success" ? "default" : "destructive"}>
                  {job.statusLabel}
                </Badge>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{job.tourTypeLabel}</td>
              <td className="px-4 py-4 text-muted-foreground">{job.canvaLinkLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
