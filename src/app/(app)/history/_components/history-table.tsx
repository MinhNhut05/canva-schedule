"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, Clock, FileText, Layers, Link2 } from "lucide-react";

export interface HistoryJob {
  id: string;
  fileName: string;
  createdAt: string;
  status: "success" | "error";
  statusLabel: string;
  tourTypeLabel: string;
  canvaLinkLabel: string;
  canvaLinkKind: "full" | "partial" | "none";
  creatorName: string;
}

interface HistoryTableProps {
  jobs: HistoryJob[];
  isAdmin: boolean;
  resultCount: number;
}

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function fileExt(name: string): "pdf" | "docx" {
  return /\.(docx?|doc)$/i.test(name) ? "docx" : "pdf";
}

function creatorInitial(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const last = parts[parts.length - 1] ?? "?";
  return last.slice(0, 1).toUpperCase();
}

export function HistoryTable({ jobs, isAdmin, resultCount }: HistoryTableProps) {
  const router = useRouter();

  function openReview(id: string) {
    router.push(`/review/${id}`);
  }

  return (
    <section className="card tbl-card">
      <div className="tbl-cap">
        <span className="h">Tài liệu đã xử lý</span>
        <span className="cnt">
          <Layers /> {resultCount} kết quả
        </span>
      </div>
      <div className="tbl-scroll">
        <div className={`tbl${isAdmin ? " admin" : ""}`}>
          <div className="thead">
            <span className="th">Tên file</span>
            {isAdmin && <span className="th">Người tạo</span>}
            <span className="th">Ngày tạo</span>
            <span className="th">Trạng thái</span>
            <span className="th">Loại tour</span>
            <span className="th">Liên kết Canva</span>
            <span className="th r" />
          </div>
          <div className="tbody">
            {jobs.length === 0 ? (
              <div className="empty no-result">
                <div className="ph">
                  <NextImage
                    src="/front-flow/mascot-otter-reports.png"
                    alt=""
                    aria-hidden="true"
                    width={2000}
                    height={1414}
                  />
                </div>
                <h2>Không tìm thấy kết quả</h2>
                <p>
                  Không có tài liệu nào khớp với từ khoá hoặc bộ lọc hiện tại. Hãy thử lại với tên
                  file khác.
                </p>
              </div>
            ) : (
              jobs.map((job) => {
                const ext = fileExt(job.fileName);
                const tourUnknown = job.tourTypeLabel === "Chưa xác định";
                return (
                  <div
                    key={job.id}
                    className="trow"
                    role="button"
                    tabIndex={0}
                    aria-label={`Mở review: ${job.fileName}`}
                    onClick={() => openReview(job.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openReview(job.id);
                      }
                    }}
                  >
                    <div className="td td-file">
                      <span className={`fi ${ext}`}>
                        <FileText />
                      </span>
                      <span className="nm">{job.fileName}</span>
                    </div>
                    {isAdmin && (
                      <div className="td td-creator">
                        <span className="cl">Người tạo</span>
                        <span className="av">{creatorInitial(job.creatorName)}</span>
                        <span className="nm">{job.creatorName}</span>
                      </div>
                    )}
                    <div className="td td-date">
                      <span className="cl">Ngày tạo</span>
                      <span>
                        <Clock />
                      </span>
                      <span>{dateFormatter.format(new Date(job.createdAt))}</span>
                    </div>
                    <div className="td td-status">
                      <span className="cl">Trạng thái</span>
                      {job.status === "success" ? (
                        <span className="status green">
                          <Check /> {job.statusLabel}
                        </span>
                      ) : (
                        <span className="status red">
                          <AlertTriangle /> {job.statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="td td-tour">
                      <span className="cl">Loại tour</span>
                      <span className={`tourpill${tourUnknown ? " none" : ""}`}>
                        {job.tourTypeLabel}
                      </span>
                    </div>
                    <div className="td td-link">
                      <span className="cl">Liên kết Canva</span>
                      <span className={`td-links ${job.canvaLinkKind}`}>
                        <Link2 /> {job.canvaLinkLabel}
                      </span>
                    </div>
                    <div className="td td-go">
                      <span className="cl">Mở</span>
                      <span className="go">
                        mở <ArrowRight />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
