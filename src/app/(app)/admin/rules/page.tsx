import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { SEEDED_RULE_IDS } from "@/lib/rules/seed";
import { RulesTable } from "./_components/rules-table";

export const metadata = {
  title: "Quản lý quy tắc | SileTravel",
};

export default async function AdminRulesPage() {
  const rules = await db.companyRule.findMany({
    orderBy: [{ category: "asc" }, { ruleId: "asc" }],
  });

  const rulesWithMeta = rules.map((rule) => ({
    ...rule,
    isSeeded: SEEDED_RULE_IDS.has(rule.ruleId),
  }));

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Badge variant="outline" className="w-fit border-primary/15 bg-primary/5 text-primary">
          Quản trị nội dung
        </Badge>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Quy tắc trích xuất</h1>
          <p className="max-w-3xl text-base leading-7 text-muted-foreground">
            Quản lý các guardrail dùng để định hướng AI khi trích xuất, rà soát và chuẩn hóa nội dung tour.
          </p>
        </div>
      </div>
      <RulesTable rules={rulesWithMeta} />
    </div>
  );
}
