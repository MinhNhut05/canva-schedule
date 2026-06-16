"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { RuleEditSheet } from "./rule-edit-sheet";
import { RuleCreateSheet } from "./rule-create-sheet";
import { RuleActiveToggle } from "./rule-active-toggle";

interface RuleWithMeta {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  isSeeded: boolean;
  config: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface RulesTableProps {
  rules: RuleWithMeta[];
}

export function RulesTable({ rules }: RulesTableProps) {
  const [editRule, setEditRule] = useState<RuleWithMeta | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <>
      <div className="adm-toolbar">
        <button type="button" className="adm-btn" onClick={() => setShowCreate(true)}>
          <Plus /> Thêm quy tắc
        </button>
      </div>

      <div className="adm-tablecard">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Rule ID</th>
              <th>Tên quy tắc</th>
              <th>Danh mục</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr
                key={rule.ruleId}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setEditRule(rule);
                  }
                }}
                onClick={(e) => {
                  // Don't open sheet if toggle was clicked
                  if ((e.target as HTMLElement).closest("[data-toggle-zone]")) return;
                  setEditRule(rule);
                }}
              >
                <td data-label="Rule ID">
                  <span className="adm-mono">{rule.ruleId}</span>
                </td>
                <td data-label="Tên quy tắc">
                  <div className="adm-rulename">
                    <span className="nm">{rule.name}</span>
                    {rule.isSeeded ? (
                      <span className="adm-tag seed">Quy tắc gốc</span>
                    ) : (
                      <span className="adm-tag track">Theo dõi</span>
                    )}
                  </div>
                </td>
                <td data-label="Danh mục">{rule.category}</td>
                <td data-label="Trạng thái">
                  <div data-toggle-zone="">
                    <RuleActiveToggle ruleId={rule.ruleId} isActive={rule.isActive} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RuleEditSheet rule={editRule} onClose={() => setEditRule(null)} />
      <RuleCreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
