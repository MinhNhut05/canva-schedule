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
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Thêm quy tắc mới</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="space-y-1">
            <label htmlFor="create-rule-name" className="text-sm font-medium text-foreground">
              Tên quy tắc
            </label>
            <Input
              id="create-rule-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nhập tên quy tắc..."
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-rule-description" className="text-sm font-medium text-foreground">
              Mô tả
            </label>
            <Textarea
              id="create-rule-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              placeholder="Mô tả quy tắc..."
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="create-rule-category" className="text-sm font-medium text-foreground">
              Danh mục
            </label>
            <Input
              id="create-rule-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              placeholder="VD: layout, greeting, naming..."
            />
          </div>

          <p className="text-xs text-muted-foreground italic">
            Quy tắc mới chỉ lưu metadata, chưa tự động áp dụng vào pipeline.
          </p>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="pt-2">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Đang thêm..." : "Thêm quy tắc"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
