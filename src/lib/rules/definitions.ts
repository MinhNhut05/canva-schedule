import type { Activity } from "@/lib/ai/extraction-schema";
import type { RuleDefinition, RuleViolation } from "./types";

const SCHOOL_GREETING = "Quý thầy cô và các bạn học sinh";
const GROUP_GREETINGS = ["Quý khách", "Quý đoàn"];
const DEFAULT_GROUP_GREETING = "Quý khách";
const MAX_PRIMARY_BULLETS = 3;

function normalizeSpaces(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeComparisonValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.!:;,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimTrailingPunctuation(value: string) {
  return value.replace(/[.!:;,]+$/g, "").trim();
}

function countPrimaryBullets(text: string) {
  return text
    .split("\n")
    .filter((line) => /^\s*[•*-]\s+/.test(line.trim())).length;
}

function looksLikeGenericTravelLine(text: string) {
  return /^(khởi hành đi|di chuyển)(?:[.!]?)$/i.test(normalizeSpaces(text));
}

function looksLikeGenericReturnLine(text: string) {
  return /^(khởi hành về|về lại|về lại trường|về trường|trở về|trở về trường)(?:[.!]?)$/i.test(
    normalizeSpaces(text),
  );
}

function looksSpecificDestination(value: string) {
  const normalized = normalizeComparisonValue(value);
  if (!normalized || normalized.length < 6) {
    return false;
  }

  return !new Set([
    "trường",
    "về lại trường",
    "khởi hành về",
    "khởi hành đi",
    "di chuyển",
    "về",
    "điểm hẹn",
  ]).has(normalized);
}

function deriveReturnDestination(
  returnLocation: string | null | undefined,
  schoolName: string | null | undefined,
) {
  const raw = normalizeSpaces(returnLocation ?? schoolName ?? "");
  if (!raw) {
    return null;
  }

  const stripped = trimTrailingPunctuation(
    raw.replace(/^(khởi hành về|về lại|về|trở về|trả khách tại)\s+/i, ""),
  );

  if (looksSpecificDestination(stripped)) {
    return stripped;
  }

  return looksSpecificDestination(raw) ? trimTrailingPunctuation(raw) : null;
}

function applyOneDayFidelityChecks(
  section: "morning" | "afternoon",
  activity: Activity,
  index: number,
  returnDestination: string | null,
) {
  const violations: RuleViolation[] = [];
  const fieldBase = `itinerary.${section}[${index}]`;
  let nextActivity: Activity = { ...activity };

  if (nextActivity.sourceConfidence === "low" && !nextActivity.needsReview) {
    nextActivity = { ...nextActivity, needsReview: true };
    violations.push({
      ruleId: "RULE-08",
      field: `${fieldBase}.needsReview`,
      message:
        "Activity tour 1 ngày có độ tin cậy thấp phải được đánh dấu needsReview để người dùng kiểm tra lại.",
      severity: "auto_fixed",
      originalValue: "false",
      correctedValue: "true",
    });
  }

  if (looksLikeGenericTravelLine(nextActivity.text)) {
    if (!nextActivity.needsReview) {
      nextActivity = { ...nextActivity, needsReview: true };
    }

    violations.push({
      ruleId: "RULE-08",
      field: `${fieldBase}.text`,
      message:
        "Câu khởi hành/di chuyển tour 1 ngày đang mất đích đến. Cần giữ wording gần nguồn hoặc bổ sung địa điểm rõ ràng.",
      severity: "needs_review",
      originalValue: activity.text,
      correctedValue: null,
    });
  } else if (looksLikeGenericReturnLine(nextActivity.text)) {
    if (returnDestination) {
      const corrected = `Khởi hành về ${returnDestination}.`;
      if (normalizeComparisonValue(nextActivity.text) !== normalizeComparisonValue(corrected)) {
        nextActivity = { ...nextActivity, text: corrected };
        violations.push({
          ruleId: "RULE-08",
          field: `${fieldBase}.text`,
          message:
            "Câu về tour 1 ngày phải giữ đích đến rõ ràng. Đã tự động khôi phục từ điểm trả về đã biết.",
          severity: "auto_fixed",
          originalValue: activity.text,
          correctedValue: corrected,
        });
      }
    } else {
      if (!nextActivity.needsReview) {
        nextActivity = { ...nextActivity, needsReview: true };
      }

      violations.push({
        ruleId: "RULE-08",
        field: `${fieldBase}.text`,
        message:
          "Câu về tour 1 ngày đang mất đích đến và hệ thống không thể khôi phục an toàn. Cần review thủ công.",
        severity: "needs_review",
        originalValue: activity.text,
        correctedValue: null,
      });
    }
  }

  const bulletCount = countPrimaryBullets(nextActivity.text);
  if (bulletCount > MAX_PRIMARY_BULLETS) {
    if (!nextActivity.needsReview) {
      nextActivity = { ...nextActivity, needsReview: true };
    }

    violations.push({
      ruleId: "RULE-08",
      field: `${fieldBase}.text`,
      message:
        "Khối hoạt động tour 1 ngày đang giữ quá nhiều bullet phụ. Chỉ nên giữ câu mở đầu và các bullet chính.",
      severity: "needs_review",
      originalValue: activity.text,
      correctedValue: null,
    });
  }

  return { activity: nextActivity, violations };
}

const rule01OneDayLayout: RuleDefinition = {
  ruleId: "RULE-01",
  name: "Cấu trúc lịch trình tour 1 ngày",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.duration !== "ONE_DAY") {
      return { draft, violations };
    }

    const { morning, afternoon } = draft.itinerary;

    if (!morning || morning.length === 0) {
      violations.push({
        ruleId: "RULE-01",
        field: "itinerary.morning",
        message: 'Tour 1 ngày thiếu mục "Buổi sáng" trong lịch trình.',
        severity: "needs_review",
        originalValue: null,
        correctedValue: null,
      });
    }

    if (!afternoon || afternoon.length === 0) {
      violations.push({
        ruleId: "RULE-01",
        field: "itinerary.afternoon",
        message: 'Tour 1 ngày thiếu mục "Buổi chiều" trong lịch trình.',
        severity: "needs_review",
        originalValue: null,
        correctedValue: null,
      });
    }

    return { draft, violations };
  },
};

const rule02TwoDayLayout: RuleDefinition = {
  ruleId: "RULE-02",
  name: "Cấu trúc lịch trình tour 2 ngày",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.duration !== "TWO_DAY") {
      return { draft, violations };
    }

    const { day1, day2 } = draft.itinerary;

    if (!day1 || day1.length === 0) {
      violations.push({
        ruleId: "RULE-02",
        field: "itinerary.day1",
        message: 'Tour 2 ngày thiếu mục "Ngày 1" trong lịch trình.',
        severity: "needs_review",
        originalValue: null,
        correctedValue: null,
      });
    }

    if (!day2 || day2.length === 0) {
      violations.push({
        ruleId: "RULE-02",
        field: "itinerary.day2",
        message: 'Tour 2 ngày thiếu mục "Ngày 2" trong lịch trình.',
        severity: "needs_review",
        originalValue: null,
        correctedValue: null,
      });
    }

    return { draft, violations };
  },
};

const rule03SchoolGreeting: RuleDefinition = {
  ruleId: "RULE-03",
  name: "Lời chào tour trường học",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.clientType !== "SCHOOL") {
      return { draft, violations };
    }

    if (draft.greetingText !== SCHOOL_GREETING) {
      const originalValue = draft.greetingText ?? null;

      violations.push({
        ruleId: "RULE-03",
        field: "greetingText",
        message: `Lời chào tour trường học phải là "${SCHOOL_GREETING}". Đã tự động sửa.`,
        severity: "auto_fixed",
        originalValue,
        correctedValue: SCHOOL_GREETING,
      });

      draft = { ...draft, greetingText: SCHOOL_GREETING };
    }

    return { draft, violations };
  },
};

const rule04GroupGreeting: RuleDefinition = {
  ruleId: "RULE-04",
  name: "Lời chào tour đoàn/doanh nghiệp",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.clientType !== "GROUP") {
      return { draft, violations };
    }

    const currentGreeting = draft.greetingText?.trim() ?? "";

    if (!GROUP_GREETINGS.includes(currentGreeting)) {
      const originalValue = draft.greetingText ?? null;

      violations.push({
        ruleId: "RULE-04",
        field: "greetingText",
        message: `Lời chào tour đoàn phải là "Quý khách" hoặc "Quý đoàn". Đã tự động sửa thành "${DEFAULT_GROUP_GREETING}".`,
        severity: "auto_fixed",
        originalValue,
        correctedValue: DEFAULT_GROUP_GREETING,
      });

      draft = { ...draft, greetingText: DEFAULT_GROUP_GREETING };
    }

    return { draft, violations };
  },
};

const rule05SchoolNameIntegrity: RuleDefinition = {
  ruleId: "RULE-05",
  name: "Tên trường học nguyên vẹn",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (!draft.schoolName) {
      return { draft, violations };
    }

    const hasLineBreaks = /[\n\r]/.test(draft.schoolName);
    const hasExcessiveWhitespace = /\s{3,}/.test(draft.schoolName);

    if (hasLineBreaks || hasExcessiveWhitespace) {
      const cleaned = draft.schoolName
        .replace(/[\n\r]+/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();

      violations.push({
        ruleId: "RULE-05",
        field: "schoolName",
        message: "Tên trường bị tách dòng hoặc phân mảnh. Đã tự động gộp lại.",
        severity: "auto_fixed",
        originalValue: draft.schoolName,
        correctedValue: cleaned,
      });

      draft = { ...draft, schoolName: cleaned };
    }

    return { draft, violations };
  },
};

const rule06ReturnToSchool: RuleDefinition = {
  ruleId: "RULE-06",
  name: "Câu về lại trường phải kèm tên trường",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.clientType !== "SCHOOL" || !draft.schoolName) {
      return { draft, violations };
    }

    const schoolName = draft.schoolName;
    const returnLocation = draft.returnLocation ?? "";

    if (!returnLocation.includes(schoolName)) {
      const corrected = `Về lại ${schoolName}`;

      violations.push({
        ruleId: "RULE-06",
        field: "returnLocation",
        message: `Câu về lại trường phải kèm tên trường "${schoolName}". Đã tự động sửa.`,
        severity: "auto_fixed",
        originalValue: returnLocation || null,
        correctedValue: corrected,
      });

      draft = { ...draft, returnLocation: corrected };
    }

    return { draft, violations };
  },
};

const rule07MenuStructure: RuleDefinition = {
  ruleId: "RULE-07",
  name: "Thực đơn tách riêng và đúng cấu trúc",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.duration === "ONE_DAY") {
      const { morning, lunch, afternoon } = draft.menu;
      const totalItems = morning.length + lunch.length + afternoon.length;

      if (totalItems === 0) {
        violations.push({
          ruleId: "RULE-07",
          field: "menu",
          message: "Tour 1 ngày chưa có thực đơn (sáng/trưa/chiều). Cần bổ sung khi review.",
          severity: "needs_review",
          originalValue: null,
          correctedValue: null,
        });
      }
    }

    if (draft.duration === "TWO_DAY") {
      const {
        morning_day1,
        lunch_day1,
        afternoon_day1,
        morning_day2,
        lunch_day2,
        afternoon_day2,
      } = draft.menu;
      const totalItems =
        morning_day1.length +
        lunch_day1.length +
        afternoon_day1.length +
        morning_day2.length +
        lunch_day2.length +
        afternoon_day2.length;

      if (totalItems === 0) {
        violations.push({
          ruleId: "RULE-07",
          field: "menu",
          message:
            "Tour 2 ngày chưa có thực đơn (sáng/trưa/chiều cho từng ngày). Cần bổ sung khi review.",
          severity: "needs_review",
          originalValue: null,
          correctedValue: null,
        });
      }
    }

    if (draft.duration === "THREE_DAY") {
      const {
        morning_day1,
        lunch_day1,
        afternoon_day1,
        morning_day2,
        lunch_day2,
        afternoon_day2,
        morning_day3,
        lunch_day3,
        afternoon_day3,
      } = draft.menu;
      const totalItems =
        morning_day1.length +
        lunch_day1.length +
        afternoon_day1.length +
        morning_day2.length +
        lunch_day2.length +
        afternoon_day2.length +
        morning_day3.length +
        lunch_day3.length +
        afternoon_day3.length;

      if (totalItems === 0) {
        violations.push({
          ruleId: "RULE-07",
          field: "menu",
          message:
            "Tour 3 ngày chưa có thực đơn (sáng/trưa/chiều cho từng ngày). Cần bổ sung khi review.",
          severity: "needs_review",
          originalValue: null,
          correctedValue: null,
        });
      }
    }

    return { draft, violations };
  },
};

const rule08OneDayWordingFidelity: RuleDefinition = {
  ruleId: "RULE-08",
  name: "Tour 1 ngày giữ wording gần nguồn và đích đến rõ ràng",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.duration !== "ONE_DAY") {
      return { draft, violations };
    }

    const returnDestination = deriveReturnDestination(
      draft.returnLocation,
      draft.schoolName,
    );

    const morning = draft.itinerary.morning.map((activity, index) => {
      const result = applyOneDayFidelityChecks(
        "morning",
        activity,
        index,
        returnDestination,
      );
      violations.push(...result.violations);
      return result.activity;
    });

    const afternoon = draft.itinerary.afternoon.map((activity, index) => {
      const result = applyOneDayFidelityChecks(
        "afternoon",
        activity,
        index,
        returnDestination,
      );
      violations.push(...result.violations);
      return result.activity;
    });

    return {
      draft: {
        ...draft,
        itinerary: {
          morning,
          afternoon,
        },
      },
      violations,
    };
  },
};

const rule09ProgramLabelFidelity: RuleDefinition = {
  ruleId: "RULE-09",
  name: "Program label và title phải là hai trường review riêng",
  check: (draft) => {
    const violations: RuleViolation[] = [];

    if (draft.duration !== "ONE_DAY") {
      return { draft, violations };
    }

    const programName = normalizeSpaces(draft.programName ?? "");
    const title = normalizeSpaces(draft.title ?? "");

    if (!programName || !title) {
      return { draft, violations };
    }

    if (normalizeComparisonValue(programName) === normalizeComparisonValue(title)) {
      violations.push({
        ruleId: "RULE-09",
        field: "programName",
        message:
          '"programName" đang bị gộp với "title". Với tour 1 ngày, heading nguồn và title ngắn phải được review tách riêng.',
        severity: "needs_review",
        originalValue: draft.programName ?? null,
        correctedValue: null,
      });
    }

    return { draft, violations };
  },
};

export const V1_RULES: RuleDefinition[] = [
  rule01OneDayLayout,
  rule02TwoDayLayout,
  rule03SchoolGreeting,
  rule04GroupGreeting,
  rule05SchoolNameIntegrity,
  rule06ReturnToSchool,
  rule07MenuStructure,
  rule08OneDayWordingFidelity,
  rule09ProgramLabelFidelity,
];

export { DEFAULT_GROUP_GREETING, GROUP_GREETINGS, SCHOOL_GREETING };
