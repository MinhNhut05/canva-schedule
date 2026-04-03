"use client";

import { useMemo } from "react";

import type { Activity, StructuredDraft } from "@/lib/ai/extraction-schema";
import type { SectionColors } from "@/lib/review/highlight-terms";
import {
  extractImportantTerms,
  PRIMARY_SECTION,
  SECONDARY_SECTION,
} from "@/lib/review/highlight-terms";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { EditableField } from "./editable-field";
import { FlaggedField } from "./flagged-field";
import { HighlightedText } from "./highlighted-text";

interface ItineraryEditorProps {
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

const SECTION_LABELS: Record<string, string> = {
  morning: "Buoi sang",
  afternoon: "Buoi chieu",
  day1: "Ngay 1",
  day2: "Ngay 2",
};

/** Map section keys to their theme variant */
const SECTION_THEMES: Record<string, SectionColors> = {
  morning: PRIMARY_SECTION,
  day1: PRIMARY_SECTION,
  afternoon: SECONDARY_SECTION,
  day2: SECONDARY_SECTION,
};

function ActivityItem({
  activity,
  index,
  sectionKey,
  uploadId,
  colors,
  importantTerms,
  onSaveField,
  onSaveSuccess,
  onSaveError,
}: {
  activity: Activity;
  index: number;
  sectionKey: string;
  uploadId: string;
  colors: SectionColors;
  importantTerms: string[];
  onSaveField: ItineraryEditorProps["onSaveField"];
  onSaveSuccess: () => void;
  onSaveError: (error: string) => void;
}) {
  const basePath = `itinerary.${sectionKey}.${index}`;

  return (
    <FlaggedField
      isFlagged={activity.needsReview}
      helperText={
        activity.needsReview
          ? activity.sourceConfidence === "low"
            ? "Do tin cay thap — hay kiem tra lai noi dung nay."
            : "Thong tin can duoc xac nhan."
          : undefined
      }
    >
      <div className="space-y-2">
        <EditableField
          label={activity.timeLabel ? `Thoi gian (${activity.timeLabel})` : "Thoi gian"}
          value={activity.timeLabel || ""}
          fieldPath={`${basePath}.timeLabel`}
          uploadId={uploadId}
          placeholder="VD: 6:00, 7:30 - 8:00"
          labelClassName={`text-xs opacity-70`}
          displayClassName="hover:bg-white/10"
          renderValue={(val) => (
            <HighlightedText
              text={val}
              importantTerms={[]}
              colors={colors}
              isTimeLabel
            />
          )}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Hoat dong"
          value={activity.text}
          fieldPath={`${basePath}.text`}
          uploadId={uploadId}
          multiline
          labelClassName={`text-xs opacity-70`}
          displayClassName="hover:bg-white/10"
          renderValue={(val) => (
            <HighlightedText
              text={val}
              importantTerms={importantTerms}
              colors={colors}
            />
          )}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
      </div>
    </FlaggedField>
  );
}

export function ItineraryEditor({
  draft,
  uploadId,
  onSaveField,
  onSaveSuccess,
  onSaveError,
}: ItineraryEditorProps) {
  const importantTerms = useMemo(() => extractImportantTerms(draft), [draft]);

  const sections =
    draft.duration === "ONE_DAY"
      ? [
          { key: "morning", activities: draft.itinerary.morning },
          { key: "afternoon", activities: draft.itinerary.afternoon },
        ]
      : [
          { key: "day1", activities: draft.itinerary.day1 },
          { key: "day2", activities: draft.itinerary.day2 },
        ];

  return (
    <Card className="border-border bg-white shadow-sm">
      <CardHeader>
        <CardTitle>Lich trinh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Shared fields — no theming */}
        <div className="space-y-3">
          <EditableField
            label="Ten chuong trinh"
            value={draft.programName || ""}
            fieldPath="programName"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          <EditableField
            label="Tieu de tuyen / truong"
            value={draft.title || ""}
            fieldPath="title"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          <EditableField
            label="Ten khach hang"
            value={draft.clientName || ""}
            fieldPath="clientName"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          {draft.clientType === "SCHOOL" ? (
            <EditableField
              label="Ten truong"
              value={draft.schoolName || ""}
              fieldPath="schoolName"
              uploadId={uploadId}
              onSave={onSaveField}
              onSaveSuccess={onSaveSuccess}
              onSaveError={onSaveError}
            />
          ) : null}
          <EditableField
            label="Ngay khoi hanh"
            value={draft.tourDate || ""}
            fieldPath="tourDate"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          <EditableField
            label="Loi chao"
            value={draft.greetingText || ""}
            fieldPath="greetingText"
            uploadId={uploadId}
            multiline
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          <EditableField
            label="Diem don"
            value={draft.pickupLocation || ""}
            fieldPath="pickupLocation"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
          <EditableField
            label="Diem tra"
            value={draft.returnLocation || ""}
            fieldPath="returnLocation"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
        </div>

        {/* Themed itinerary sections */}
        {sections.map((section) => {
          const colors = SECTION_THEMES[section.key] || PRIMARY_SECTION;

          return (
            <div
              key={section.key}
              className={cn(
                "rounded-xl p-4 space-y-3 transition-colors",
                colors.bg,
              )}
            >
              <h3
                className="text-lg font-bold"
                style={{ color: colors.headingColor }}
              >
                {SECTION_LABELS[section.key] || section.key}
              </h3>
              <div className="space-y-4">
                {section.activities.map((activity, index) => (
                  <ActivityItem
                    key={`${section.key}-${index}`}
                    activity={activity}
                    index={index}
                    sectionKey={section.key}
                    uploadId={uploadId}
                    colors={colors}
                    importantTerms={importantTerms}
                    onSaveField={onSaveField}
                    onSaveSuccess={onSaveSuccess}
                    onSaveError={onSaveError}
                  />
                ))}
                {section.activities.length === 0 ? (
                  <p
                    className="py-4 text-center text-sm italic opacity-60"
                    style={{ color: colors.textColor }}
                  >
                    Chua co hoat dong nao.
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
