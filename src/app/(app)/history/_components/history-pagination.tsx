import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type StatusFilter = "all" | "success" | "error";

interface HistoryPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  shownCount: number;
  query: string;
  status: StatusFilter;
}

function buildPageItems(current: number, total: number): Array<number | "dots"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const items: Array<number | "dots"> = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("dots");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < total - 1) items.push("dots");
  items.push(total);

  return items;
}

export function HistoryPagination({
  currentPage,
  totalPages,
  totalCount,
  shownCount,
  query,
  status,
}: HistoryPaginationProps) {
  function href(page: number): string {
    const params = new URLSearchParams();
    if (page > 1) params.set("page", String(page));
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    const qs = params.toString();
    return qs ? `/history?${qs}` : "/history";
  }

  const items = buildPageItems(currentPage, totalPages);
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav className="pager" aria-label="Phân trang">
      <span className="pinfo">
        Hiển thị <b>{shownCount}</b> trên <b>{totalCount}</b> tài liệu · 20 mỗi trang
      </span>

      {isFirst ? (
        <span className="pgbtn nav disabled" aria-hidden="true">
          <ChevronLeft />
        </span>
      ) : (
        <Link className="pgbtn nav" href={href(currentPage - 1)} aria-label="Trang trước">
          <ChevronLeft />
        </Link>
      )}

      {items.map((item, index) =>
        item === "dots" ? (
          <span key={`dots-${index}`} className="pgdots">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={href(item)}
            className={`pgbtn${item === currentPage ? " on" : ""}`}
            aria-current={item === currentPage ? "page" : undefined}
          >
            {item}
          </Link>
        )
      )}

      {isLast ? (
        <span className="pgbtn nav disabled" aria-hidden="true">
          <ChevronRight />
        </span>
      ) : (
        <Link className="pgbtn nav" href={href(currentPage + 1)} aria-label="Trang sau">
          <ChevronRight />
        </Link>
      )}
    </nav>
  );
}
