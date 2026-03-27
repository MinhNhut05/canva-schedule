import { db } from "@/lib/db";
import { TemplatesTable } from "./_components/templates-table";

const DURATION_LABELS: Record<string, string> = {
  ONE_DAY: "Tour 1 ngày",
  TWO_DAY: "Tour 2 ngày",
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
      <h1 className="text-xl font-semibold text-foreground">Mẫu Canva</h1>
      <TemplatesTable templates={templatesWithLabels} />
    </div>
  );
}
