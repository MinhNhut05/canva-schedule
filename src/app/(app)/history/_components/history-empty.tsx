import NextImage from "next/image";
import Link from "next/link";
import { UploadCloud } from "lucide-react";

export function HistoryEmpty() {
  return (
    <section className="card">
      <div className="empty">
        <div className="ph">
          <span className="hand-tag">Theo dõi</span>
          <NextImage
            src="/front-flow/mascot-otter-reports.png"
            alt=""
            aria-hidden="true"
            width={2000}
            height={1414}
          />
        </div>
        <h2>Chưa có lịch sử tạo Canva</h2>
        <p>Chưa có tour nào được tạo Canva. Hãy tải tài liệu để bắt đầu một luồng xử lý mới.</p>
        <Link className="btn" href="/upload">
          <UploadCloud /> Tải tài liệu
        </Link>
      </div>
    </section>
  );
}
