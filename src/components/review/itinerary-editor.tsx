"use client";

import {
  CalendarDays,
  ListTree,
  Moon,
  Sunrise,
  Sunset,
  type LucideIcon,
} from "lucide-react";

import type { Activity, StructuredDraft } from "@/lib/ai/extraction-schema";

import { EditableField } from "./editable-field";
import { FlaggedField } from "./flagged-field";

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
  morning: "Buổi sáng",
  afternoon: "Buổi chiều",
  night1: "Đêm 1",
  day1: "Ngày 1",
  day2: "Ngày 2",
  day3: "Ngày 3",
  day4: "Ngày 4",
};

const SECTION_ICONS: Record<string, LucideIcon> = {
  morning: Sunrise,
  afternoon: Sunset,
  night1: Moon,
  day1: CalendarDays,
  day2: CalendarDays,
  day3: CalendarDays,
  day4: CalendarDays,
};

function ActivityItem({
  activity,
  index,
  sectionKey,
  uploadId,
  onSaveField,
  onSaveSuccess,
  onSaveError,
}: {
  activity: Activity;
  index: number;
  sectionKey: string;
  uploadId: string;
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
            ? "Độ tin cậy thấp — hãy kiểm tra lại nội dung này."
            : "Thông tin cần được xác nhận."
          : undefined
      }
    >
      <div className="rv-fieldset">
        <EditableField
          label={activity.timeLabel ? `Thời gian (${activity.timeLabel})` : "Thời gian"}
          value={activity.timeLabel || ""}
          fieldPath={`${basePath}.timeLabel`}
          uploadId={uploadId}
          placeholder="VD: 6:00, 7:30 - 8:00"
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Hoạt động"
          value={activity.text}
          fieldPath={`${basePath}.text`}
          uploadId={uploadId}
          multiline
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
  const sections =
    draft.duration === "ONE_DAY"
      ? [
          { key: "morning", activities: draft.itinerary.morning },
          { key: "afternoon", activities: draft.itinerary.afternoon },
        ]
      : draft.duration === "THREE_DAY"
        ? [
            { key: "day1", activities: draft.itinerary.day1 },
            { key: "day2", activities: draft.itinerary.day2 },
            { key: "day3", activities: draft.itinerary.day3 },
          ]
        : draft.duration === "FOUR_DAY"
          ? [
              { key: "night1", activities: draft.itinerary.night1 },
              { key: "day1", activities: draft.itinerary.day1 },
              { key: "day2", activities: draft.itinerary.day2 },
              { key: "day3", activities: draft.itinerary.day3 },
              { key: "day4", activities: draft.itinerary.day4 },
            ]
          : [
              { key: "day1", activities: draft.itinerary.day1 },
              { key: "day2", activities: draft.itinerary.day2 },
            ];

  return (
    <div className="rv-card rv-editor rv-rv">
      <div className="rv-editor-h">
        <ListTree /> Lịch trình
      </div>

      <div className="rv-fieldset">
        <EditableField
          label="Tên chương trình"
          value={draft.programName || ""}
          fieldPath="programName"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Tiêu đề tuyến / trường"
          value={draft.title || ""}
          fieldPath="title"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Tên khách hàng"
          value={draft.clientName || ""}
          fieldPath="clientName"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        {draft.clientType === "SCHOOL" ? (
          <EditableField
            label="Tên trường"
            value={draft.schoolName || ""}
            fieldPath="schoolName"
            uploadId={uploadId}
            onSave={onSaveField}
            onSaveSuccess={onSaveSuccess}
            onSaveError={onSaveError}
          />
        ) : null}
        <EditableField
          label="Ngày khởi hành"
          value={draft.tourDate || ""}
          fieldPath="tourDate"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Lời chào"
          value={draft.greetingText || ""}
          fieldPath="greetingText"
          uploadId={uploadId}
          multiline
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Điểm đón"
          value={draft.pickupLocation || ""}
          fieldPath="pickupLocation"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
        <EditableField
          label="Điểm trả"
          value={draft.returnLocation || ""}
          fieldPath="returnLocation"
          uploadId={uploadId}
          onSave={onSaveField}
          onSaveSuccess={onSaveSuccess}
          onSaveError={onSaveError}
        />
      </div>

      {sections.map((section) => {
        const Icon = SECTION_ICONS[section.key] || CalendarDays;

        return (
          <div key={section.key} className="rv-group">
            <div className="rv-group-h">
              <Icon /> {SECTION_LABELS[section.key] || section.key}
            </div>
            <div className="rv-fieldset">
              {section.activities.map((activity, index) => (
                <ActivityItem
                  key={`${section.key}-${index}`}
                  activity={activity}
                  index={index}
                  sectionKey={section.key}
                  uploadId={uploadId}
                  onSaveField={onSaveField}
                  onSaveSuccess={onSaveSuccess}
                  onSaveError={onSaveError}
                />
              ))}
              {section.activities.length === 0 ? (
                <p className="rv-empty">Chưa có hoạt động nào.</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
