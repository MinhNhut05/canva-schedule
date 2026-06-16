"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { updateRule, softDeleteRule } from "../actions";

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

interface RuleEditSheetProps {
  rule: RuleWithMeta | null;
  onClose: () => void;
}

export function RuleEditSheet({ rule, onClose }: RuleEditSheetProps) {
  const [name, setName] = useState(rule?.name ?? "");
  const [description, setDescription] = useState(rule?.description ?? "");
  const [category, setCategory] = useState(rule?.category ?? "");
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when rule changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleRuleChange = () => {
    if (rule) {
      setName(rule.name);
      setDescription(rule.description);
      setCategory(rule.category);
      setIsActive(rule.isActive);
      setError(null);
    }
  };

  const handleSave = async () => {
    if (!rule) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateRule(rule.ruleId, {
        name,
        description,
        category,
        isActive,
      });

      if (result.success) {
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

  const handleSoftDelete = async () => {
    if (!rule) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await softDeleteRule(rule.ruleId);

      if (result.success) {
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
    <Sheet open={rule !== null} onOpenChange={handleOpenChange}>
      <SheetContent
        className="soha-adm-pane w-full sm:max-w-[480px] overflow-y-auto"
        onAnimationEnd={handleRuleChange}
      >
        <SheetHeader>
          <SheetTitle className="adm-pane-title">Chỉnh sửa quy tắc</SheetTitle>
        </SheetHeader>

        {rule && (
          <div className="mt-6 space-y-4">
            <div className="adm-field">
              <label className="adm-label">Rule ID</label>
              <p className="adm-ro">{rule.ruleId}</p>
            </div>

            <div className="adm-field">
              <label htmlFor="rule-name" className="adm-label">
                Tên quy tắc
              </label>
              <input
                id="rule-name"
                className="adm-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Nhập tên quy tắc..."
              />
            </div>

            <div className="adm-field">
              <label htmlFor="rule-description" className="adm-label">
                Mô tả
              </label>
              <textarea
                id="rule-description"
                className="adm-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Mô tả quy tắc..."
                rows={3}
              />
            </div>

            <div className="adm-field">
              <label htmlFor="rule-category" className="adm-label">
                Danh mục
              </label>
              <input
                id="rule-category"
                className="adm-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                placeholder="VD: layout, greeting, naming..."
              />
            </div>

            <div className="adm-check-row">
              <input
                id="rule-active"
                type="checkbox"
                className="adm-check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="rule-active" className="adm-label">
                Trạng thái hoạt động
              </label>
              <span className="adm-check-state">{isActive ? "Đang hoạt động" : "Đã tắt"}</span>
            </div>

            {!rule.isSeeded && (
              <p className="adm-note">
                Quy tắc này chỉ lưu metadata, chưa tự động áp dụng vào pipeline.
              </p>
            )}

            {error && <p className="adm-error">{error}</p>}

            <div className="flex items-center justify-between pt-2">
              <button type="button" className="adm-btn" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
              </button>

              {!rule.isSeeded && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button type="button" className="adm-btn danger" disabled={isSubmitting}>
                      Tắt quy tắc
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="soha-adm-dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="adm-pane-title">Tắt quy tắc</AlertDialogTitle>
                      <AlertDialogDescription className="adm-pane-desc">
                        Quy tắc này sẽ ngừng áp dụng cho các lần xử lý mới. Bạn có chắc chắn muốn tắt?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="adm-btn ghost">Hủy</AlertDialogCancel>
                      <AlertDialogAction className="adm-btn danger" onClick={handleSoftDelete}>
                        Xác nhận tắt
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
