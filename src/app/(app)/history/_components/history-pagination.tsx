"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function HistoryPagination({ currentPage, totalPages }: HistoryPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label="Phan trang" className="flex justify-end md:justify-end">
      <div className="flex items-center gap-2 max-md:mx-auto">
        {pages.map((page) => (
          <Link
            key={page}
            href={`/history?page=${page}`}
            className={cn(
              "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              page === currentPage
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            )}
            aria-current={page === currentPage ? "page" : undefined}
          >
            {page}
          </Link>
        ))}
      </div>
    </nav>
  );
}
