---
status: partial
phase: 02-document-intake-parsing
source: [02-VERIFICATION.md]
started: 2026-03-24T04:05:00Z
updated: 2026-03-24T04:05:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Kiểm tra giao diện tải tài liệu trên desktop và mobile
expected: Sidebar, mobile sheet, drag-and-drop zone, badge chất lượng và banner cảnh báo hiển thị đúng bố cục, đúng tiếng Việt đầy đủ dấu, responsive rõ ràng
result: [pending]

### 2. Tải thử các file thực tế chất lượng kém
expected: PDF scan hoặc DOCX phức tạp hiển thị cảnh báo tiếng Việt rõ ràng; người dùng hiểu nên retry hay đổi file nguồn; nút "Tải file khác" hoạt động đúng
result: [pending]

### 3. Kiểm tra flow hết hạn phiên đăng nhập trong lúc upload
expected: API trả lỗi 401 với thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục." và UX khôi phục hợp lý
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
