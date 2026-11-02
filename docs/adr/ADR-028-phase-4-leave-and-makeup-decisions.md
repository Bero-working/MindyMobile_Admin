# ADR-028 — Quyết định triển khai P4 theo design và backend hiện hành

## Status

**Accepted — 02/11/2026 (Asia/Bangkok), theo quyền quyết định người dùng giao trong lượt triển khai P4.** Nguồn: người dùng yêu cầu “Triển khai phase 4”, xác nhận design “Đã có”, chọn “Có, triển khai đủ S1–S7”, và giao xử lý câu hỏi quy tắc nghỉ: “Bạn tự xử lý theo hướng tối ưu”. Codex chọn các phương án dưới đây từ design Claude và backend hiện hữu; đây không phải lời người dùng duyệt riêng từng đề xuất hay duyệt UI. Không xin lại quyền đã được giao.

## Decision

- Giữ đủ S1–S7, gồm xếp/hủy/xếp lại học bù khác lớp; không đổi mẫu số 7 của baseline. Giữ replacement cả lớp và placement một học viên là hai luồng khác nhau.
- Nghỉ theo notice backend: trước 00:00 ngày liền trước ngày buổi đầu, không phải 48 giờ; các ca 00–12/12–18/18–24/FULL_DAY hiện rõ khung giờ. Preview server quyết định đủ notice. Quá notice không tạo đơn, hướng dẫn liên hệ Quản lý; 0 buổi thì báo không cần tạo đơn. Không dựng luồng nghỉ khẩn bỏ kiểm tra backend.
- Duyệt đơn bị chặn khi `sourcesCurrent=false` hoặc còn trùng lịch học viên. Không cung cấp checkbox vượt xung đột; payload approve giữ `acknowledgeStudentConflicts: false` theo DTO. Quản lý vẫn có thể từ chối để Mentor lập phương án khác. Đây là đính chính phần acknowledgment cũ của BR-LEAVE-05 theo G-P4-01 trong design Claude; không thay transaction/hủy source/replacement/audit.
- Chọn policy P4 theo design: dữ liệu/query/form/intent chỉ RAM, không persist, không queue/replay tự động; logout/đổi tài khoản xóa. Mutation chỉ online; retry intent chưa rõ giữ nguyên key/body/version.
- Home Manager chỉ có một nguồn đếm PENDING khi vào/focus; lỗi/offline/0 không hiện số. Trong bước UI nguồn là mock, chưa gọi HTTP thật.
- Giữ các slot backend, không tự thêm khung giờ dạy; sheet cuộn gần giờ gốc. Luôn `sessionMappings`, không `dayMappings`; lọc slot giao khoảng nghỉ/lựa chọn khác và preview lại trước xác nhận gửi.

## Quan hệ và giới hạn

Bổ sung quyết định nghiệp vụ P4 dưới quy trình ADR-009/016/017 và đính chính BR-LEAVE-05 trong phạm vi xung đột học viên. Không sửa các ADR Accepted cũ. Không áp ngoại lệ P5 tại ADR-027 sang P4: UI mock toàn phase vẫn phải được người dùng approve trước contract/API. Giữ checks, native review, Maestro tích hợp và nghiệm thu cuối; không đánh dấu Done bằng unit/mock.

Design nguồn tại `docs/design/leave-and-makeup/` giữ nguyên; nhật ký kế hoạch/progress ghi hiệu lực các quyết định này. Q-PLAT-01 và các gap dữ liệu backend giữ theo hồ sơ, không được coi là đã giải quyết.
