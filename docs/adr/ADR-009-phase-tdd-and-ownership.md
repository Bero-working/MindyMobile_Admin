# ADR-009 — TDD theo phase, phân vai và các cổng duyệt

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Chốt tất cả adr 1->9”. Chấp nhận nội dung Decision của ADR này; các câu hỏi còn mở và cổng duyệt riêng tiếp tục giữ nguyên, phần phụ thuộc chưa được triển khai khi chưa đủ điều kiện.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Người dùng quy định Claude chỉ thiết kế, Codex viết tài liệu/code, UI toàn phase được duyệt trước API; cho phép tạo tài liệu nháp và hỏi theo domain.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Quy trình: tất cả design phase → UI TDD toàn phase → người dùng duyệt UI → contract/API TDD toàn phase → cleanup/lint/tsc/Jest → E2E Maestro toàn phase → người dùng nghiệm thu. Trước mỗi luồng chốt câu hỏi trực tiếp và ADR liên quan. Chỉ người dùng chuyển quyết định sang Accepted hoặc phase Done qua phản hồi rõ ràng.

### Bổ sung đã duyệt — 30/10/2026

Nguồn: người dùng yêu cầu “Thêm test e2e sau mỗi phase trước khi tôi nghiệm thu” và chỉ định “sử dụng maestro”. Đây là chỉ thị trực tiếp bổ sung ADR-009 Accepted, áp dụng tất cả phase P0–P8 khi được triển khai; không mở rộng phạm vi roadmap hoặc tự duyệt UI.

Codex phải viết và chạy E2E bằng **Maestro** trên bản app native đã tích hợp của phase, qua emulator hoặc thiết bị. Kiểm tra luồng chính, quyền và các nhánh lỗi quan trọng theo BR/design/contract, cùng hồi quy các luồng cũ bị ảnh hưởng. Android là cổng trước mắt; mốc iOS tiếp tục theo Q-PLAT-01, không suy kết quả Android thành iOS pass.

Sau cleanup/lint/tsc/Jest, E2E bắt buộc pass trước khi trình người dùng nghiệm thu. Nếu fail, blocked hoặc thiếu bằng chứng, sửa/giải quyết rồi chạy lại; không coi build, unit test hay test dùng mock là E2E tích hợp pass. Không tính test skipped là pass. Lưu lệnh chạy, build, thiết bị/OS, dữ liệu thử, kết quả từng flow và report/log/screenshot khi cần trong hồ sơ phase. E2E pass không tự chuyển phase Done. Xem [quy ước Maestro](../implement/e2e-maestro.md).

## Alternatives

Làm UI rồi API từng màn; Codex tự tạo design; coi test pass là nghiệm thu. Không chọn vì trái cổng duyệt/phân vai.

## Consequences

Tài liệu có nguồn và trạng thái, progress Todo/0% lúc đầu; không ghi pass từ lịch sử BE cho mobile. Draft bổ sung được ghi nguồn, nhưng luật đã duyệt chỉ đổi qua ADR Accepted và changelog + phase log. Android thực và iOS có bằng chứng/mốc riêng. Không tự tạo commit/PR trong workspace chưa có .git.

## BR-slice bị ảnh hưởng

BR: `BR-SCOPE-01`, `BR-QUIZ-04` — xem [business-rules](../business-rules.md).
Slice: Mọi phase/slice trong implementation-plan.md — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-DESIGN-01, Q-PLAT-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
