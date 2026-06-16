"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filter, Search } from "lucide-react";

type StatusFilter = "all" | "success" | "error";

interface HistoryToolbarProps {
  query: string;
  status: StatusFilter;
}

const statusChips: Array<{ value: StatusFilter; label: string; dot?: "g" | "r" }> = [
  { value: "all", label: "Tất cả" },
  { value: "success", label: "Thành công", dot: "g" },
  { value: "error", label: "Lỗi", dot: "r" },
];

export function HistoryToolbar({ query, status }: HistoryToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(query);
  }, [query]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function push(next: { q?: string; status?: StatusFilter }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      const trimmed = next.q.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
    }
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
    }
    params.delete("page");

    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchChange(nextValue: string) {
    setValue(nextValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push({ q: nextValue }), 350);
  }

  return (
    <div className="tools">
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (debounceRef.current) clearTimeout(debounceRef.current);
          push({ q: value });
        }}
      >
        <Search />
        <input
          type="text"
          placeholder="Tìm theo tên file…"
          value={value}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Tìm theo tên file"
        />
      </form>
      <div className="fchips" role="group" aria-label="Lọc theo trạng thái">
        <span className="fl">
          <Filter /> Lọc
        </span>
        {statusChips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            className={`fchip${status === chip.value ? " on" : ""}`}
            aria-pressed={status === chip.value}
            onClick={() => push({ status: chip.value })}
          >
            {chip.dot ? <span className={`cdot ${chip.dot}`} /> : null}
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
