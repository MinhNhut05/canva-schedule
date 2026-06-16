"use client";

import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string;
  fieldPath: string;
  uploadId: string;
  multiline?: boolean;
  placeholder?: string;
  /** Custom render for display mode */
  renderValue?: (value: string) => React.ReactNode;
  /** Additional className for the label text */
  labelClassName?: string;
  /** Additional className for the display field */
  displayClassName?: string;
  onSave: (
    uploadId: string,
    fieldPath: string,
    newValue: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

export function EditableField({
  label,
  value,
  fieldPath,
  uploadId,
  multiline = false,
  placeholder,
  renderValue,
  labelClassName,
  displayClassName,
  onSave,
  onSaveSuccess,
  onSaveError,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const length = editValue.length;
      if ("setSelectionRange" in inputRef.current) {
        inputRef.current.setSelectionRange(length, length);
      }
    }
  }, [editValue.length, isEditing]);

  const handleStartEdit = useCallback(() => {
    setEditValue(value);
    setIsEditing(true);
  }, [value]);

  const handleCancel = useCallback(() => {
    setEditValue(value);
    setIsEditing(false);
  }, [value]);

  const handleSave = useCallback(async () => {
    const trimmed = editValue.trim();

    if (trimmed === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave(uploadId, fieldPath, trimmed);
      if (result.success) {
        setIsEditing(false);
        onSaveSuccess?.();
      } else {
        onSaveError?.(result.error || "Lưu thất bại.");
      }
    } catch {
      onSaveError?.("Có lỗi xảy ra khi lưu.");
    } finally {
      setIsSaving(false);
    }
  }, [editValue, fieldPath, onSave, onSaveError, onSaveSuccess, uploadId, value]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        handleCancel();
      }

      if (event.key === "Enter" && !multiline && !event.shiftKey) {
        event.preventDefault();
        void handleSave();
      }
    },
    [handleCancel, handleSave, multiline],
  );

  if (isEditing) {
    return (
      <div className="rv-field editing">
        <span className={cn("rv-field-label", labelClassName)}>{label}</span>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            rows={3}
            className="rv-edit-input"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={editValue}
            onChange={(event) => setEditValue(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className="rv-edit-input"
          />
        )}
        <div className="rv-edit-actions">
          <button
            type="button"
            className="rv-btn green sm"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            type="button"
            className="rv-btn ghost sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Huỷ
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleStartEdit}
      className={cn("rv-field", displayClassName)}
      title="Nhấn để chỉnh sửa"
    >
      <span className={cn("rv-field-label", labelClassName)}>{label}</span>
      <span className="rv-field-edit" aria-hidden="true">
        <Pencil />
      </span>
      <span className={cn("rv-field-value", !value && "empty")}>
        {value
          ? renderValue
            ? renderValue(value)
            : value
          : placeholder || "Chưa có — nhấn để thêm"}
      </span>
    </button>
  );
}
