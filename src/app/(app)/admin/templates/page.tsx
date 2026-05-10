import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { TemplatesTable } from "./_components/templates-table";

const DURATION_LABELS: Record<string, string> = {
  ONE_DAY: "Tour 1 ngày",
  TWO_DAY: "Tour 2 ngày",
  THREE_DAY: "Tour 3 ngày",
  FOUR_DAY: "Tour 4 ngày",
};

const ARTIFACT_LABELS: Record<string, string> = {
  ITINERARY: "Lịch trình",
  MENU: "Thực đơn",
};

export const metadata = {
  title: "Quản lý mẫu Canva | SileTravel",
};

export default async function AdminTemplatesPage() {
  const templates = await db.canvaTemplate.findMany({
    orderBy: [{ tourDuration: "asc" }, { artifactType: "asc" }],
  });

  const templatesWithLabels = templates.map((t) => ({
    ...t,
    durationLabel: DURATION_LABELS[t.tourDuration] ?? t.tourDuration,
    artifactLabel: ARTIFACT_LABELS[t.artifactType] ?? t.artifactType,
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
          Quản trị Canva
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Mẫu Canva</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Kiểm tra template ID theo thời lượng tour và loại tài liệu để đảm bảo luồng tạo Canva dùng đúng mẫu.
          </p>
        </div>
      </div>
      <TemplatesTable templates={templatesWithLabels} />
    </div>
  );
}
