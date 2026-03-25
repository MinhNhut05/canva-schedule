import type { StructuredDraft } from "@/lib/ai/extraction-schema";
import { V1_RULES } from "./definitions";
import type { RuleResult, RuleViolation } from "./types";

export function applyRules(draft: StructuredDraft): RuleResult {
  let currentDraft = structuredClone(draft);
  const allViolations: RuleViolation[] = [];

  for (const rule of V1_RULES) {
    const result = rule.check(currentDraft);
    currentDraft = result.draft;
    allViolations.push(...result.violations);
  }

  const autoFixCount = allViolations.filter(
    (violation) => violation.severity === "auto_fixed"
  ).length;
  const needsReviewCount = allViolations.filter(
    (violation) => violation.severity === "needs_review"
  ).length;

  return {
    correctedDraft: currentDraft,
    violations: allViolations,
    autoFixCount,
    needsReviewCount,
  };
}

export function violationsToReviewFlags(violations: RuleViolation[]): string[] {
  return violations.map(
    (violation) => `rule:${violation.ruleId}:${violation.severity}`
  );
}
