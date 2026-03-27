"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemplateEditSheet } from "./template-edit-sheet";

interface TemplateWithLabels {
  id: string;
  tourDuration: string;
  artifactType: string;
  templateId: string;
  fieldMapping: unknown;
  isActive: boolean;
  durationLabel: string;
  artifactLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplatesTableProps {
  templates: TemplateWithLabels[];
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const [editTemplate, setEditTemplate] = useState<TemplateWithLabels | null>(null);

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Loại tour</TableHead>
                <TableHead>Loại đầu ra</TableHead>
                <TableHead>Canva Template ID</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  tabIndex={0}
                  role="button"
                  onClick={() => setEditTemplate(template)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setEditTemplate(template);
                    }
                  }}
                >
                  <TableCell>{template.durationLabel}</TableCell>
                  <TableCell>{template.artifactLabel}</TableCell>
                  <TableCell className="font-mono text-sm">{template.templateId}</TableCell>
                  <TableCell>
                    <Badge variant={template.isActive ? "default" : "secondary"}>
                      {template.isActive ? "Hoạt động" : "Tắt"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TemplateEditSheet
        template={editTemplate}
        onClose={() => setEditTemplate(null)}
      />
    </>
  );
}
