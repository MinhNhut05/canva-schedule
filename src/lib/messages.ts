// Stepper labels (D-22)
export const STEPPER_LABELS = [
  "Tải lên",
  "Trích xuất",
  "Duyệt",
  "Tạo Canva",
  "Hoàn thành",
] as const;

// Error messages for 3 failure points (D-07, D-08)
export const ERROR_MESSAGES = {
  uploadParsing: {
    title: "Không thể đọc tệp",
    description:
      "Tệp không được hỗ trợ hoặc bị lỗi — hãy thử lại hoặc chọn tệp khác.",
    action: "Chọn file khác",
  },
  aiExtraction: {
    title: "Trích xuất thất bại",
    description:
      "AI không trả về kết quả — vui lòng thử lại hoặc chọn file khác.",
    action: "Thử lại",
  },
  aiTimeout: {
    title: "AI phản hồi quá chậm",
    description: "Thời gian chờ vượt quá 30 giây. Vui lòng thử lại.",
    action: "Thử lại",
  },
  canvaGeneration: {
    title: "Tạo Canva thất bại",
    description: "Không thể tạo thiết kế — bấm Thử lại để tạo lại.",
    action: "Thử lại",
  },
} as const;

// Stepper error tooltips (D-04)
export const STEPPER_TOOLTIPS = {
  extraction: "Trích xuất thất bại",
  canva: "Tạo Canva thất bại",
} as const;

// Completion banner (D-17)
export const COMPLETION_MESSAGES = {
  fullSuccess: {
    heading: "Hoàn thành!",
    body: "Tài liệu đã sẵn sàng trên Canva.",
  },
  partialSuccess: {
    heading: "Tạo một phần thành công",
    body: "Lịch trình đã tạo thành công. Thực đơn gặp lỗi — bấm Thử lại.",
  },
  ctaNewTour: "Tạo tour mới",
  ctaHistory: "Xem lịch sử",
} as const;

// Cooldown banner (D-16)
export const COOLDOWN_MESSAGES = {
  primary: (minutes: number) =>
    `Hệ thống đang chờ Canva — còn ${minutes} phút`,
  secondary:
    "Nút tạo sẽ được kích hoạt lại sau khi thời gian chờ kết thúc.",
} as const;
