# Content Shortening Rules (Quy tắc Rút gọn Nội dung)

Áp dụng khi AI extraction trích xuất nội dung `text` cho mỗi activity trong itinerary.
Mục đích: tạo nội dung ngắn gọn, phù hợp hiển thị trên Canva design.

---

## R1 — Khởi hành / Di chuyển

**Quy tắc:** Chỉ giữ "Khởi hành đi [Địa điểm]." — bỏ tất cả câu marketing, miêu tả (nghỉ ngơi trên xe, làm quen, giao lưu...).

**Trước:**
> Khởi hành đi Đồng Tháp. Quý khách nghỉ ngơi trên xe, làm quen và giao lưu cùng đội ngũ nhân viên thân thiện của Soha Travel.

**Sau:**
> Khởi hành đi Đồng Tháp.

---

## R2 — Tham quan 1 địa điểm

**Quy tắc:** Thêm lời chào phù hợp trước "tham quan", chỉ giữ tên địa điểm — bỏ mô tả chi tiết, miêu tả cảnh quan, trải nghiệm.

- SCHOOL: "Quý thầy cô và các bạn học sinh tham quan [Tên địa điểm]."
- GROUP: "Quý đoàn tham quan [Tên địa điểm]."

**Trước (SCHOOL):**
> Tham quan Khu di tích Nguyễn Sinh Sắc – nơi lưu giữ cội nguồn lịch sử, quần thể kiến trúc văn hóa độc đáo.

**Sau (SCHOOL):**
> Quý thầy cô và các bạn học sinh tham quan Khu di tích Nguyễn Sinh Sắc.

**Trước (GROUP):**
> Tham quan Khu di tích Xẻo Quýt. Trải nghiệm ngồi xuồng len lỏi qua những con rạch nhỏ dưới tán rừng tràm xanh mát.

**Sau (GROUP):**
> Quý đoàn tham quan Khu di tích Xẻo Quýt.

---

## R3 — Khu du lịch lớn (nhiều hoạt động)

**Quy tắc:** Giữ câu mở đầu + tên khu, sau đó liệt kê **từng hoạt động con** trên dòng riêng với dấu chấm tròn (•) đầu dòng.

**Trước:**
> Tự do tham quan và vui chơi tại Khu du lịch Văn Hóa Phương Nam: Nam Phương linh từ, Bảo tàng Đặng tộc, Bảo tàng Nam Bộ, xem biểu diễn xiếc thú (Khỉ, Chó, Dê), vui chơi tại Công viên nước.

**Sau:**
> Sau khi dùng bữa trưa, Quý đoàn tự do tham quan và vui chơi tại Khu du lịch Văn Hóa Phương Nam:
> • Xem biểu diễn xiếc thú: Khỉ, Chó, Dê.
> • Vui chơi tại Công viên nước
> • Trải nghiệm trò chơi dân gian, trò chơi liên hoàn nước

---

## R4 — Khung giờ sau ăn trưa

**Quy tắc:** Luôn thêm "Sau khi dùng bữa trưa, ..." ở đầu câu cho hoạt động đầu tiên sau giờ trưa. Áp dụng cho cả SCHOOL và GROUP.

- GROUP: "Sau khi dùng bữa trưa, Quý đoàn..."
- SCHOOL: "Sau khi dùng bữa trưa, Quý thầy cô và các bạn học sinh..."

---

## R5 — Dấu chấm cuối tên địa điểm

**Quy tắc:** Mỗi tên địa điểm kết thúc bằng dấu chấm `.`

**Ví dụ:**
- "Tham quan Khu di tích Nguyễn Sinh Sắc."
- "Khởi hành đi Đồng Tháp."
- "Tham quan Khu di tích Xẻo Quýt."

---

## Tổng hợp ví dụ đầy đủ

```
04 giờ 30:
Khởi hành đi Đồng Tháp.

07 giờ 30:
Quý đoàn tham quan Khu di tích Nguyễn Sinh Sắc.

09 giờ 30:
Quý đoàn tham quan Khu di tích Xẻo Quýt.

13 giờ 00:
Sau khi dùng bữa trưa, Quý đoàn tự do tham quan và vui chơi tại Khu du lịch Văn Hóa Phương Nam:
• Xem biểu diễn xiếc thú: Khỉ, Chó, Dê.
• Vui chơi tại Công viên nước
• Trải nghiệm trò chơi dân gian, trò chơi liên hoàn nước
```

---

*Created: 2026-03-31*
*Applies to: AI extraction prompt (src/lib/ai/extraction-prompt.ts)*
