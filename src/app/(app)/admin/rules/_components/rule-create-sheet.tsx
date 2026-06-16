"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { createRule } from "../actions";

interface RuleCreateSheetProps {
  open: boolean;
  onClose: () => void;
}

export function RuleCreateSheet({ open, onClose }: RuleCreateSheetProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await createRule({ name, description, category });

      if (result.success) {
        setName("");
        setDescription("");
        setCategory("");
        onClose();
      } else {
        setError(result.error ?? "Có lỗi xảy ra. Thử lại sau.");
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="soha-adm-pane w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="adm-pane-title">Thêm quy tắc mới</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="adm-field">
            <label htmlFor="create-rule-name" className="adm-label">
              Tên quy tắc
            </label>
            <input
              id="create-rule-name"
              className="adm-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập tên quy tắc..."
            />
          </div>

          <div className="adm-field">
            <label htmlFor="create-rule-description" className="adm-label">
              Mô tả
            </label>
            <textarea
              id="create-rule-description"
              className="adm-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Mô tả quy tắc..."
              rows={3}
            />
          </div>

          <div className="adm-field">
            <label htmlFor="create-rule-category" className="adm-label">
              Danh mục
            </label>
            <input
              id="create-rule-category"
              className="adm-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              placeholder="VD: layout, greeting, naming..."
            />
          </div>

          <p className="adm-note">
            Quy tắc mới chỉ lưu metadata, chưa tự động áp dụng vào pipeline.
          </p>

          {error && <p className="adm-error">{error}</p>}

          <div className="pt-2">
            <button type="button" className="adm-btn" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm quy tắc"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
