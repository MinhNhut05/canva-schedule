"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { updateTemplate } from "../actions";
import { getFieldsForTemplate } from "@/lib/canva/field-map";

interface TemplateWithLabels {
  id: string;
  tourDuration: string;
  artifactType: string;
  templateId: string;
  fieldMapping: unknown;
  isActive: boolean;
  durationLabel: string;
  artifactLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TemplateEditSheetProps {
  template: TemplateWithLabels | null;
  onClose: () => void;
}

export function TemplateEditSheet({ template, onClose }: TemplateEditSheetProps) {
  const [templateId, setTemplateId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [sourceFields, setSourceFields] = useState<readonly string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (template) {
      setTemplateId(template.templateId);
      setIsActive(template.isActive);
      setError(null);

      const fields = getFieldsForTemplate(template.tourDuration, template.artifactType);
      setSourceFields(fields);

      // Build initial field mapping from stored fieldMapping or default to field name
      const storedMapping = (template.fieldMapping as Record<string, string>) ?? {};
      const initialMapping: Record<string, string> = {};
      for (const field of fields) {
        initialMapping[field] = storedMapping[field] ?? field;
      }
      setFieldMapping(initialMapping);
    }
  }, [template]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!template) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateTemplate(template.id, {
        templateId,
        fieldMapping,
        isActive,
      });

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "Không thể xác minh mẫu Canva. Kiểm tra lại Template ID hoặc quyền truy cập Canva rồi thử lưu lại.");
      }
    } catch {
      setError("Có lỗi xảy ra. Thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!template) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await updateTemplate(template.id, { isActive: false });

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

  const updateFieldMapping = (field: string, value: string) => {
    setFieldMapping((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Sheet open={template !== null} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {template
              ? `${template.durationLabel} — ${template.artifactLabel}`
              : "Chỉnh sửa mẫu Canva"}
          </SheetTitle>
        </SheetHeader>

        {template && (
          <div className="mt-6 space-y-6">
            {/* Template ID */}
            <div className="space-y-1">
              <label htmlFor="template-id" className="text-sm font-medium text-foreground">
                Canva Template ID
              </label>
              <Input
                id="template-id"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={isSubmitting}
                placeholder="DAG..."
                className="font-mono"
              />
            </div>

            {/* Active status */}
            <div className="flex items-center gap-3">
              <label htmlFor="template-active" className="text-sm font-medium text-foreground">
                Trạng thái hoạt động
              </label>
              <input
                id="template-active"
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

            {/* Field mapping explanation */}
            <div className="rounded-md bg-muted p-3">
              <p className="text-xs text-muted-foreground">
                Cột bên trái là tên trường dữ liệu từ hệ thống. Cột bên phải là tên text element
                tương ứng trong mẫu Canva. Chỉnh sửa cột bên phải khi cần cập nhật mapping.
              </p>
            </div>

            {/* Two-column field mapping grid */}
            {sourceFields.length > 0 && (
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-2 gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Trường dữ liệu
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tên text element trong Canva
                  </p>
                </div>

                {/* Mapping rows */}
                <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
                  {sourceFields.map((field) => (
                    <div key={field} className="grid grid-cols-2 gap-2 items-center">
                      <span className="font-mono text-xs text-muted-foreground truncate">
                        {field}
                      </span>
                      <Input
                        value={fieldMapping[field] ?? field}
                        onChange={(e) => updateFieldMapping(field, e.target.value)}
                        disabled={isSubmitting}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save status */}
            {isSubmitting && (
              <p className="text-sm text-muted-foreground">Đang xác minh mẫu Canva...</p>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
              </Button>

              {template.isActive && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={isSubmitting}>
                      Vô hiệu hóa
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Vô hiệu hóa mẫu Canva</AlertDialogTitle>
                      <AlertDialogDescription>
                        Mẫu này sẽ không còn được dùng cho lần tạo Canva tiếp theo. Bạn có chắc chắn muốn vô hiệu hóa?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeactivate}>
                        Xác nhận vô hiệu hóa
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
