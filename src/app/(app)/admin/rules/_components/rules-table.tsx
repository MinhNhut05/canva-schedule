"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>Thêm quy tắc</Button>
      </div>

      <Card className="surface-panel-glass border-semantic-light shadow-semantic-light">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rule ID</TableHead>
                <TableHead>Tên quy tắc</TableHead>
                <TableHead className="w-[120px]">Danh mục</TableHead>
                <TableHead className="w-[140px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow
                  key={rule.ruleId}
                  className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
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
                  <TableCell className="font-mono text-sm">{rule.ruleId}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{rule.name}</span>
                      {rule.isSeeded ? (
                        <Badge variant="secondary">Quy tắc gốc</Badge>
                      ) : (
                        <Badge variant="outline">Theo dõi</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{rule.category}</TableCell>
                  <TableCell>
                    <div data-toggle-zone="">
                      <RuleActiveToggle ruleId={rule.ruleId} isActive={rule.isActive} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RuleEditSheet rule={editRule} onClose={() => setEditRule(null)} />
      <RuleCreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </>
  );
}
