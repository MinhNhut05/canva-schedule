"use client";

import { useState } from "react";
import { Check, Minus } from "lucide-react";
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
      <div className="adm-tablecard">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Loại tour</th>
              <th>Loại đầu ra</th>
              <th>Canva Template ID</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((template) => (
              <tr
                key={template.id}
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
                <td data-label="Loại tour">{template.durationLabel}</td>
                <td data-label="Loại đầu ra">{template.artifactLabel}</td>
                <td data-label="Canva Template ID">
                  <span className="adm-mono">{template.templateId}</span>
                </td>
                <td data-label="Trạng thái">
                  {template.isActive ? (
                    <span className="adm-badge green">
                      <Check /> Hoạt động
                    </span>
                  ) : (
                    <span className="adm-badge neutral">
                      <Minus /> Tắt
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TemplateEditSheet template={editTemplate} onClose={() => setEditTemplate(null)} />
    </>
  );
}
