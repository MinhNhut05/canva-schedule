import type { StructuredDraft } from "@/lib/ai/extraction-schema";

export type ViolationSeverity = "auto_fixed" | "needs_review";

export interface RuleViolation {
  ruleId: string;
  field: string;
  message: string;
  severity: ViolationSeverity;
  originalValue: string | null;
  correctedValue: string | null;
}

export interface RuleResult {
  correctedDraft: StructuredDraft;
  violations: RuleViolation[];
  autoFixCount: number;
  needsReviewCount: number;
}

export interface RuleDefinition {
  ruleId: string;
  name: string;
  check: (draft: StructuredDraft) => {
    draft: StructuredDraft;
    violations: RuleViolation[];
  };
}
