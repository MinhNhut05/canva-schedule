import type { RuleDefinition, RuleViolation } from "./types";

const SCHOOL_GREETING = "Quý thầy cô và các bạn học sinh";
const GROUP_GREETINGS = ["Quý khách", "Quý đoàn"];
const DEFAULT_GROUP_GREETING = "Quý khách";

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
      const { day1, day2 } = draft.menu;
      const totalItems = day1.length + day2.length;

      if (totalItems === 0) {
        violations.push({
          ruleId: "RULE-07",
          field: "menu",
          message: "Tour 2 ngày chưa có thực đơn (ngày 1/ngày 2). Cần bổ sung khi review.",
          severity: "needs_review",
          originalValue: null,
          correctedValue: null,
        });
      }
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
];

export { DEFAULT_GROUP_GREETING, GROUP_GREETINGS, SCHOOL_GREETING };
