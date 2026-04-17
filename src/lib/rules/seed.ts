import type { PrismaClient } from "@prisma/client";

const COMPANY_RULES_SEED = [
  {
    ruleId: "RULE-01",
    name: "Cấu trúc lịch trình tour 1 ngày",
    description:
      'Tour 1 ngày phải có mục "Buổi sáng" và "Buổi chiều" trong lịch trình.',
    category: "layout",
  },
  {
    ruleId: "RULE-02",
    name: "Cấu trúc lịch trình tour 2 ngày",
    description:
      'Tour 2 ngày phải có mục "Ngày 1" và "Ngày 2" trong lịch trình.',
    category: "layout",
  },
  {
    ruleId: "RULE-03",
    name: "Lời chào tour trường học",
    description:
      'Tour trường học phải có lời chào "Quý thầy cô và các bạn học sinh".',
    category: "greeting",
  },
  {
    ruleId: "RULE-04",
    name: "Lời chào tour đoàn/doanh nghiệp",
    description: 'Tour đoàn phải có lời chào "Quý khách" hoặc "Quý đoàn".',
    category: "greeting",
  },
  {
    ruleId: "RULE-05",
    name: "Tên trường học nguyên vẹn",
    description:
      "Tên trường phải là một chuỗi liên tục, không bị tách dòng hoặc phân mảnh.",
    category: "naming",
  },
  {
    ruleId: "RULE-06",
    name: "Câu về lại trường kèm tên trường",
    description:
      'Với tour trường học, câu về lại phải kèm tên trường cụ thể (VD: "Về lại THPT Trần Đại Nghĩa").',
    category: "naming",
  },
  {
    ruleId: "RULE-07",
    name: "Thực đơn tách riêng và đúng cấu trúc",
    description:
      "Thực đơn phải tách riêng khỏi lịch trình, cấu trúc phải khớp với loại tour (1 ngày: sáng/trưa/chiều, 2 ngày: ngày 1/ngày 2).",
    category: "menu",
  },
  {
    ruleId: "RULE-08",
    name: "Tour 1 ngày giữ wording gần nguồn và đích đến rõ ràng",
    description:
      "Với tour 1 ngày, câu khởi hành/câu về phải giữ đích đến rõ ràng, khối hoạt động lớn chỉ giữ các bullet chính, và activity độ tin cậy thấp phải được đẩy sang review.",
    category: "content",
  },
  {
    ruleId: "RULE-09",
    name: "Program label và title phải tách riêng",
    description:
      'Heading nguồn dùng cho program label phải được giữ riêng với "title" ngắn của tour, không được gộp hai trường thành một nhãn chung.',
    category: "naming",
  },
] as const;

export const SEEDED_RULE_IDS: Set<string> = new Set(
  COMPANY_RULES_SEED.map((r) => r.ruleId)
);

export async function seedCompanyRules(prisma: PrismaClient) {
  console.log("Seeding company rules...");

  for (const rule of COMPANY_RULES_SEED) {
    await prisma.companyRule.upsert({
      where: { ruleId: rule.ruleId },
      update: {},
      create: {
        ruleId: rule.ruleId,
        name: rule.name,
        description: rule.description,
        category: rule.category,
        isActive: true,
      },
    });
  }

  console.log(`Seeded ${COMPANY_RULES_SEED.length} company rules.`);
}
