import { Loader2 } from "lucide-react";

interface HistorySkeletonProps {
  isAdmin: boolean;
}

function SkeletonRow({ isAdmin }: { isAdmin: boolean }) {
  const bar = (width: string) => <span className="sk" style={{ width }} />;
  return (
    <div className="skrow" aria-hidden="true">
      <div className="skf">
        <span className="sk fi" />
        <span className="skl">
          {bar("78%")}
          {bar("46%")}
        </span>
      </div>
      {isAdmin && bar("70%")}
      {bar("82%")}
      <span className="sk badge" style={{ width: "84%" }} />
      <span className="sk" style={{ width: "72%", height: 24, borderRadius: 999 }} />
      {bar("80%")}
      {bar("60%")}
    </div>
  );
}

export function HistorySkeleton({ isAdmin }: HistorySkeletonProps) {
  return (
    <section className="card tbl-card">
      <div className="tbl-cap">
        <span className="h">Đang tải lịch sử…</span>
        <span className="cnt">
          <Loader2 className="spin" /> Vui lòng đợi
        </span>
      </div>
      <div className="tbl-scroll">
        <div className={`tbl${isAdmin ? " admin" : ""}`}>
          <div className="thead" aria-hidden="true">
            <span className="th">Tên file</span>
            {isAdmin && <span className="th">Người tạo</span>}
            <span className="th">Ngày tạo</span>
            <span className="th">Trạng thái</span>
            <span className="th">Loại tour</span>
            <span className="th">Liên kết Canva</span>
            <span className="th r" />
          </div>
          <div className="tbody">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
