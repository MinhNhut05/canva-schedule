"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
        className="w-full sm:max-w-[480px] overflow-y-auto"
        onAnimationEnd={handleRuleChange}
      >
        <SheetHeader>
          <SheetTitle>Chỉnh sửa quy tắc</SheetTitle>
        </SheetHeader>

        {rule && (
          <div className="mt-6 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Rule ID
              </label>
              <p className="font-mono text-sm text-muted-foreground">{rule.ruleId}</p>
            </div>

            <div className="space-y-1">
              <label htmlFor="rule-name" className="text-sm font-medium text-foreground">
                Tên quy tắc
              </label>
              <Input
                id="rule-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                placeholder="Nhập tên quy tắc..."
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="rule-description" className="text-sm font-medium text-foreground">
                Mô tả
              </label>
              <Textarea
                id="rule-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
                placeholder="Mô tả quy tắc..."
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="rule-category" className="text-sm font-medium text-foreground">
                Danh mục
              </label>
              <Input
                id="rule-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                placeholder="VD: layout, greeting, naming..."
              />
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="rule-active" className="text-sm font-medium text-foreground">
                Trạng thái hoạt động
              </label>
              <input
                id="rule-active"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-sm text-muted-foreground">
                {isActive ? "Đang hoạt động" : "Đã tắt"}
              </span>
            </div>

            {!rule.isSeeded && (
              <p className="text-xs text-muted-foreground italic">
                Quy tắc này chỉ lưu metadata, chưa tự động áp dụng vào pipeline.
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
              </Button>

              {!rule.isSeeded && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isSubmitting}>
                      Tắt quy tắc
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tắt quy tắc</AlertDialogTitle>
                      <AlertDialogDescription>
                        Quy tắc này sẽ ngừng áp dụng cho các lần xử lý mới. Bạn có chắc chắn muốn tắt?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSoftDelete}>
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
