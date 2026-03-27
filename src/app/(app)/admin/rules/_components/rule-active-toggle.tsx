"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleRuleActive } from "../actions";

interface RuleActiveToggleProps {
  ruleId: string;
  isActive: boolean;
}

export function RuleActiveToggle({ ruleId, isActive: initialIsActive }: RuleActiveToggleProps) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    setIsActive(checked);

    try {
      await toggleRuleActive(ruleId, checked);
    } catch {
      // Revert on error
      setIsActive(!checked);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="flex min-h-[44px] items-center"
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={isActive}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        aria-label={isActive ? "Tắt quy tắc" : "Bật quy tắc"}
      />
    </div>
  );
}
