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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Quy tắc</h1>
      </div>
      <RulesTable rules={rulesWithMeta} />
    </div>
  );
}
