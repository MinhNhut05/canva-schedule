"use client";

import type { MenuItem, StructuredDraft } from "@/lib/ai/extraction-schema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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
  morning: "Sang",
  lunch: "Trua",
  afternoon: "Chieu",
  day1: "Ngay 1",
  day2: "Ngay 2",
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
      helperText={item.needsReview ? "Mon an can duoc xac nhan." : undefined}
    >
      <EditableField
        label={`Mon ${index + 1}`}
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
      : [
          { key: "day1", items: draft.menu.day1 },
          { key: "day2", items: draft.menu.day2 },
        ];

  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Thuc don</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {sections.map((section) => (
          <div key={section.key} className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              {MENU_SECTION_LABELS[section.key] || section.key}
            </h3>
            <div className="space-y-3">
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
                <p className="py-4 text-center text-sm italic text-muted-foreground">
                  Chua co thuc don.
                </p>
              ) : null}
            </div>
            <Separator />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
