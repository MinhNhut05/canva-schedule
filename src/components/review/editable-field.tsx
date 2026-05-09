"use client";

import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  label: string;
  value: string;
  fieldPath: string;
  uploadId: string;
  multiline?: boolean;
  placeholder?: string;
  /** Custom render for display mode (styled text with highlights) */
  renderValue?: (value: string) => React.ReactNode;
  /** Additional className for the label text */
  labelClassName?: string;
  /** Additional className for the display button */
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
        onSaveError?.(result.error || "Luu that bai.");
      }
    } catch {
      onSaveError?.("Co loi xay ra khi luu.");
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
      <div className="space-y-2">
        <p className={cn("text-sm font-semibold text-muted-foreground", labelClassName)}>{label}</p>
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              rows={3}
              className="border-2 border-primary bg-card focus-visible:ring-ring"
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              className="border-2 border-primary bg-card focus-visible:ring-ring"
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => void handleSave()}
              disabled={isSaving}
                          >
              {isSaving ? "Dang luu..." : "Luu"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Huy
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className={cn("text-sm font-semibold text-muted-foreground", labelClassName)}>{label}</p>
      <button
        type="button"
        onClick={handleStartEdit}
        className={cn(
          "w-full cursor-pointer rounded-lg px-3 py-2 text-left text-base transition-colors",
          !displayClassName && "text-foreground hover:bg-surface-panel-cool/70",
          displayClassName,
          !value && "italic text-muted-foreground",
        )}
        title="Nhan de chinh sua"
      >
        {value
          ? (renderValue ? renderValue(value) : value)
          : (placeholder || "Chua co — nhan de them")}
      </button>
    </div>
  );
}
