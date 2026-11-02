# ADR-032 — Tích hợp API Phase 6 theo chỉ thị trực tiếp

## Status

**Accepted — 02/11/2026 (Asia/Bangkok)**, theo chỉ thị người dùng “Tích hợp luôn api”, sau bàn giao UI mock P6. Người dùng nhắc lại “Không cần test e2e” trong lượt tích hợp.

## Decision

Tích hợp API thật cho S1–S3 ngay trong lượt này, không yêu cầu thêm phản hồi approve UI riêng. Chỉ thị này mở cổng API trong phạm vi P6; không ghi UI đã nghiệm thu hoặc phase Done. Giữ phạm vi quiz/điểm/dữ liệu/quyền theo ADR-031, giữ nguyên design nguồn Claude.

Ứng dụng bình thường dùng service thật; mock chỉ ở chế độ review được chọn rõ ràng, không fallback khi backend lỗi. Contract/legacy snapshot đi cùng schema/service/hook và các kiểm tra tương ứng. Tiếp tục miễn E2E/Maestro theo chỉ thị trước và lần nhắc lại, không chạy E2E mới. Test model/UI/service, HTTP mô phỏng và API thật trên fixture cô lập là bằng chứng riêng, không đổi thành E2E native pass.

## Quan hệ

Thay cổng approve UI trước API của ADR-009/016/017 và phần tương ứng ADR-031 **riêng P6 ở lượt này**. Không sửa các ADR Accepted cũ; giữ quyền nghiệm thu cuối của người dùng. Hồ sơ [tích hợp P6](../implement/phase-006-mentor-quiz/api-integration.md) ghi kết quả và giới hạn.
