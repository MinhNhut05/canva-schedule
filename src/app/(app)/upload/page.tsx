import { UploadForm } from "./upload-form";

export default function UploadPage() {
  return (
    <section className="space-y-4">
      <div className="space-y-2">
        <h1 className="text-[28px] font-semibold leading-tight text-foreground">
          Tải lên và trích xuất tài liệu
        </h1>
        <p className="max-w-3xl text-base text-muted-foreground">
          Tải file PDF hoặc DOCX để lấy văn bản thô trước khi chuyển sang bước AI.
        </p>
      </div>

      <UploadForm />
    </section>
  );
}
