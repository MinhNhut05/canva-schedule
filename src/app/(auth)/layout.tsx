export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--surface-hero))_0%,hsl(var(--surface-hero))_24%,hsl(var(--background))_24%,hsl(var(--background))_100%)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:items-center">
          <section className="surface-hero hero-grid hero-grain hidden overflow-hidden rounded-[32px] border border-semantic-dark p-8 text-surface-hero-foreground shadow-semantic-dark lg:block">
            <div className="relative space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-light">
                  Premium travel operations
                </p>
                <h1 className="max-w-lg text-4xl font-bold leading-tight text-white">
                  Không gian điều phối tài liệu cho hành trình review và tạo Canva.
                </h1>
                <p className="max-w-xl text-base leading-7 text-white/78">
                  Bắt đầu từ upload, kiểm tra chất lượng trích xuất, duyệt nội dung và chuyển tiếp sang thiết kế với flow rõ ràng hơn.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Luồng chính</p>
                  <p className="mt-3 text-lg font-semibold text-white">Upload → Review → Canva</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55">Ưu tiên</p>
                  <p className="mt-3 text-lg font-semibold text-white">Rõ thứ bậc, nhanh thao tác, tăng độ tin cậy</p>
                </div>
              </div>
            </div>
          </section>
          {children}
        </div>
      </div>
    </div>
  );
}
