"use client";

import { useState, useEffect } from "react";
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
      <SheetContent className="soha-adm-pane w-full sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="adm-pane-title">
            {template
              ? `${template.durationLabel} — ${template.artifactLabel}`
              : "Chỉnh sửa mẫu Canva"}
          </SheetTitle>
        </SheetHeader>

        {template && (
          <div className="mt-6 space-y-6">
            {/* Template ID */}
            <div className="adm-field">
              <label htmlFor="template-id" className="adm-label">
                Canva Template ID
              </label>
              <input
                id="template-id"
                className="adm-input mono"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                disabled={isSubmitting}
                placeholder="DAG..."
              />
            </div>

            {/* Active status */}
            <div className="adm-check-row">
              <input
                id="template-active"
                type="checkbox"
                className="adm-check"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
              />
              <label htmlFor="template-active" className="adm-label">
                Trạng thái hoạt động
              </label>
              <span className="adm-check-state">{isActive ? "Đang hoạt động" : "Đã tắt"}</span>
            </div>

            {/* Field mapping explanation */}
            <div className="adm-mapnote">
              <p>
                Cột bên trái là tên trường dữ liệu từ hệ thống. Cột bên phải là tên text element
                tương ứng trong mẫu Canva. Chỉnh sửa cột bên phải khi cần cập nhật mapping.
              </p>
            </div>

            {/* Two-column field mapping grid */}
            {sourceFields.length > 0 && (
              <div className="space-y-2">
                <div className="adm-maphead">
                  <p>Trường dữ liệu</p>
                  <p>Tên text element trong Canva</p>
                </div>

                <div className="adm-maplist">
                  {sourceFields.map((field) => (
                    <div key={field} className="adm-maprow">
                      <span className="adm-mapkey">{field}</span>
                      <input
                        className="adm-input mono sm"
                        value={fieldMapping[field] ?? field}
                        onChange={(e) => updateFieldMapping(field, e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save status */}
            {isSubmitting && <p className="adm-muted">Đang xác minh mẫu Canva...</p>}

            {error && <p className="adm-error">{error}</p>}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <button type="button" className="adm-btn" onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu cấu hình"}
              </button>

              {template.isActive && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button type="button" className="adm-btn ghost" disabled={isSubmitting}>
                      Vô hiệu hóa
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="soha-adm-dialog">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="adm-pane-title">Vô hiệu hóa mẫu Canva</AlertDialogTitle>
                      <AlertDialogDescription className="adm-pane-desc">
                        Mẫu này sẽ không còn được dùng cho lần tạo Canva tiếp theo. Bạn có chắc chắn muốn vô hiệu hóa?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="adm-btn ghost">Hủy</AlertDialogCancel>
                      <AlertDialogAction className="adm-btn danger" onClick={handleDeactivate}>
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
