import { Badge } from "@/components/ui/badge";
import { ImageGenForm } from "./image-gen-form";

export default function ImageGenPage() {
  return (
    <section className="space-y-6 pb-4">
      <div className="surface-hero hero-grid hero-grain relative overflow-hidden rounded-[28px] border border-semantic-dark px-6 py-8 text-surface-hero-foreground shadow-semantic-dark sm:px-8 lg:px-10 lg:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(169,208,255,0.2),transparent_28%),linear-gradient(120deg,transparent,rgba(255,255,255,0.06),transparent)]" />
        <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.8fr)] lg:items-end">
          <div className="space-y-4">
            <Badge className="w-fit border border-white/15 bg-white/10 text-xs font-semibold tracking-[0.16em] text-white/85 uppercase">
              AI image studio
            </Badge>
            <div className="space-y-2">
              <h1 className="text-[28px] font-semibold leading-tight text-white sm:text-[2.25rem]">
                Tạo ảnh bằng AI
              </h1>
              <p className="max-w-3xl text-base leading-7 text-white/78">
                Nhập mô tả, chọn tỉ lệ khung hình và lưu ảnh đã tạo vào storage công khai.
              </p>
            </div>
          </div>

          <div className="surface-hero-card rounded-[24px] p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/60">
              Flow
            </p>
            <div className="mt-3 space-y-3 text-sm text-white/78">
              <p>1. Viết prompt rõ về bối cảnh, phong cách và chi tiết ảnh.</p>
              <p>2. Chọn tỉ lệ phù hợp rồi tạo ảnh để nhận URL đã lưu.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-panel rounded-[28px] border border-semantic-light px-4 py-5 shadow-semantic-light sm:px-5 lg:px-6 lg:py-6">
        <ImageGenForm />
      </div>
    </section>
  );
}
