# ADR-016 — Kế hoạch trước implement, UI trước API

## Status

**Accepted** — chỉ thị trực tiếp của người dùng ngày 30/10/2026 (Asia/Bangkok): “Viết kế hoạch implement trong phase. Sau đó tôi đọc sau đó tôi implement thì mới được triển khai code. Và tiếp đó viết UI trước, tôi approve thì mới được gắn API”. Ghi nhận chỉ thị rồi đóng băng theo ADR-012.

## Ngày

30/10/2026. Người ghi: Codex.

## Context

ADR-009 đã yêu cầu design Claude, TDD UI toàn phase và người dùng duyệt UI trước API. Người dùng bổ sung bước đọc kế hoạch và chỉ thị implement trước khi triển khai code. Working tree có một phần UI mock nháp được viết trước khi nhận chỉ thị bổ sung này.

## Decision

1. Viết kế hoạch tại `docs/implement/phase-NNN-<slug>/plan.md`, dẫn design, chia task theo phụ thuộc, nêu kiểm chứng và các cổng còn chờ.
2. Để người dùng đọc. Chỉ triển khai hoặc tiếp tục sửa code khi người dùng yêu cầu implement; lập kế hoạch hoặc có design không tự mở cổng code.
3. Khi được yêu cầu implement, triển khai UI toàn phase bằng mock theo design Claude, TDD và kiểm tra cần thiết.
4. Dừng để người dùng approve UI toàn phase. Chưa approve thì chưa triển khai contract/service/hook/API integration.
5. Sau approve UI, gắn API theo contract và các ADR/câu hỏi liên quan đã được giải quyết. Giữ cleanup, lint, typecheck, Jest, native build, Maestro và nghiệm thu như ADR-009.
6. Bản nháp đã có phải được ghi trung thực là chưa được duyệt; không tự xóa/khôi phục thay đổi của người dùng hoặc tăng tiến độ hoàn tất. Chờ chỉ thị implement để rà soát và tiếp tục.

## Quan hệ thay thế

Bổ sung cổng trước code cho quy trình ADR-009; ADR-016 được ưu tiên nếu có cách hiểu rằng yêu cầu tạo phase hoặc có design cho phép code ngay. Không sửa ADR-009 hay các ADR Accepted khác. Không thay đổi quyền sở hữu design Claude, cổng approve UI trước API hoặc nghiệm thu.

## Alternatives

Viết kế hoạch và code trong cùng lượt mà chưa có chỉ thị implement sau khi người dùng đọc: không chọn vì trái yêu cầu mới.

## Consequences

Kế hoạch là sản phẩm bàn giao riêng trước code. Tiến độ phải phân biệt rõ kế hoạch chờ implement, source nháp, UI được duyệt, API được kiểm chứng và phase được nghiệm thu. Không gộp các cổng duyệt này.

## BR-slice bị ảnh hưởng

Không thay đổi BR nghiệp vụ. Áp dụng quy trình triển khai theo phase; trước mắt là P0-S1–S4.
