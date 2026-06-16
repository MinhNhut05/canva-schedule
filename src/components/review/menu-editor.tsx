"use client";

import { UtensilsCrossed, Utensils } from "lucide-react";

import type { MenuItem, StructuredDraft } from "@/lib/ai/extraction-schema";

import { EditableField } from "./editable-field";
import { FlaggedField } from "./flagged-field";

interface MenuEditorProps {
  draft: StructuredDraft;
  uploadId: string;
  onSaveField: (
    uploadId: string,
    fieldPath: string,
    newValue: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onSaveSuccess: () => void;
  onSaveError: (error: string) => void;
}

const MENU_SECTION_LABELS: Record<string, string> = {
  morning: "Sáng",
  lunch: "Trưa",
  afternoon: "Chiều",
  morning_day1: "Sáng - Ngày 1",
  lunch_day1: "Trưa - Ngày 1",
  afternoon_day1: "Chiều - Ngày 1",
  morning_day2: "Sáng - Ngày 2",
  lunch_day2: "Trưa - Ngày 2",
  afternoon_day2: "Chiều - Ngày 2",
  morning_day3: "Sáng - Ngày 3",
  lunch_day3: "Trưa - Ngày 3",
  afternoon_day3: "Chiều - Ngày 3",
  morning_day4: "Sáng - Ngày 4",
  lunch_day4: "Trưa - Ngày 4",
  afternoon_day4: "Chiều - Ngày 4",
};

function MenuItemRow({
  item,
  index,
  sectionKey,
  uploadId,
  onSaveField,
  onSaveSuccess,
  onSaveError,
}: {
  item: MenuItem;
  index: number;
  sectionKey: string;
  uploadId: string;
  onSaveField: MenuEditorProps["onSaveField"];
  onSaveSuccess: () => void;
  onSaveError: (error: string) => void;
}) {
  const basePath = `menu.${sectionKey}.${index}`;

  return (
    <FlaggedField
      isFlagged={item.needsReview}
      helperText={item.needsReview ? "Món ăn cần được xác nhận." : undefined}
    >
      <EditableField
        label={`Món ${index + 1}`}
        value={item.text}
        fieldPath={`${basePath}.text`}
        uploadId={uploadId}
        onSave={onSaveField}
        onSaveSuccess={onSaveSuccess}
        onSaveError={onSaveError}
      />
    </FlaggedField>
  );
}

export function MenuEditor({
  draft,
  uploadId,
  onSaveField,
  onSaveSuccess,
  onSaveError,
}: MenuEditorProps) {
  const sections =
    draft.duration === "ONE_DAY"
      ? [
          { key: "morning", items: draft.menu.morning },
          { key: "lunch", items: draft.menu.lunch },
          { key: "afternoon", items: draft.menu.afternoon },
        ]
      : draft.duration === "THREE_DAY"
        ? [
            { key: "morning_day1", items: draft.menu.morning_day1 },
            { key: "lunch_day1", items: draft.menu.lunch_day1 },
            { key: "afternoon_day1", items: draft.menu.afternoon_day1 },
            { key: "morning_day2", items: draft.menu.morning_day2 },
            { key: "lunch_day2", items: draft.menu.lunch_day2 },
            { key: "afternoon_day2", items: draft.menu.afternoon_day2 },
            { key: "morning_day3", items: draft.menu.morning_day3 },
            { key: "lunch_day3", items: draft.menu.lunch_day3 },
            { key: "afternoon_day3", items: draft.menu.afternoon_day3 },
          ]
        : draft.duration === "FOUR_DAY"
          ? [
              { key: "morning_day1", items: draft.menu.morning_day1 },
              { key: "lunch_day1", items: draft.menu.lunch_day1 },
              { key: "afternoon_day1", items: draft.menu.afternoon_day1 },
              { key: "morning_day2", items: draft.menu.morning_day2 },
              { key: "lunch_day2", items: draft.menu.lunch_day2 },
              { key: "afternoon_day2", items: draft.menu.afternoon_day2 },
              { key: "morning_day3", items: draft.menu.morning_day3 },
              { key: "lunch_day3", items: draft.menu.lunch_day3 },
              { key: "afternoon_day3", items: draft.menu.afternoon_day3 },
              { key: "morning_day4", items: draft.menu.morning_day4 },
              { key: "lunch_day4", items: draft.menu.lunch_day4 },
              { key: "afternoon_day4", items: draft.menu.afternoon_day4 },
            ]
          : [
              { key: "morning_day1", items: draft.menu.morning_day1 },
              { key: "lunch_day1", items: draft.menu.lunch_day1 },
              { key: "afternoon_day1", items: draft.menu.afternoon_day1 },
              { key: "morning_day2", items: draft.menu.morning_day2 },
              { key: "lunch_day2", items: draft.menu.lunch_day2 },
              { key: "afternoon_day2", items: draft.menu.afternoon_day2 },
            ];

  return (
    <div className="rv-card rv-editor rv-rv">
      <div className="rv-editor-h">
        <UtensilsCrossed /> Thực đơn
      </div>

      {sections.map((section) => (
        <div key={section.key} className="rv-group">
          <div className="rv-group-h">
            <Utensils /> {MENU_SECTION_LABELS[section.key] || section.key}
          </div>
          <div className="rv-fieldset">
            {section.items.map((item, index) => (
              <MenuItemRow
                key={`${section.key}-${index}`}
                item={item}
                index={index}
                sectionKey={section.key}
                uploadId={uploadId}
                onSaveField={onSaveField}
                onSaveSuccess={onSaveSuccess}
                onSaveError={onSaveError}
              />
            ))}
            {section.items.length === 0 ? (
              <p className="rv-empty">Chưa có thực đơn.</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
