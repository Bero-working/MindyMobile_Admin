# ADR-020 — Bộ E2E tương ứng sau mỗi phase

## Status

**Accepted** — người dùng duyệt ngày 31/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt adr 20”. Ghi nhận nguồn/ngày duyệt và đóng băng file tại lần chuyển trạng thái này theo ADR-012; mọi thay đổi sau đó phải có ADR mới.

## Ngày

31/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Người dùng yêu cầu: “Thêm quy tắc sau mỗi phase phải có test e2e tương ứng”, sau đó xác nhận vị trí ghi nhận: “Không ý tôi thêm vào adr”.

[ADR-009](ADR-009-phase-tdd-and-ownership.md) đã quy định Maestro E2E pass trước nghiệm thu. Cần ghi rõ bộ test và lệnh chạy riêng tương ứng với từng phase, để có thể chạy lại và đối chiếu phạm vi kiểm chứng. Theo [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md), bổ sung bằng ADR mới, giữ nguyên các file ADR đã Accepted.

## Decision

1. Sau khi triển khai và tích hợp API của mỗi phase, Codex phải hoàn thiện và chạy bộ E2E Maestro tương ứng trước khi trình người dùng nghiệm thu. Áp dụng P0–P8 và các phase được bổ sung sau này.
2. Mỗi phase có flow tổng tại `.maestro/phase-NNN-<slug>/` và lệnh `npm run test:e2e:phase-<số>` trong `package.json`. Lệnh chạy toàn bộ ca E2E tích hợp bắt buộc của phase, truyền đúng tài khoản/vai trò và trả exit code thất bại nếu một ca lỗi. Không tạo flow hoặc lệnh rỗng cho phase chưa triển khai.
3. Bộ test bao phủ luồng chính, quyền theo vai trò, nhánh lỗi quan trọng theo yêu cầu/design/contract đã duyệt và hồi quy các luồng cũ bị ảnh hưởng. Chạy trên app native với backend và dữ liệu test thực; Jest hoặc UI mock không thay thế E2E tích hợp.
4. Sau sửa lỗi phải chạy lại các flow liên quan. Các flow bắt buộc phải pass; fail, blocked hoặc skipped còn ảnh hưởng tiêu chí nghiệm thu thì phải xử lý trước khi trình nghiệm thu.
5. Mỗi phase có `docs/implement/phase-NNN-<slug>/e2e.md`, ghi mapping yêu cầu → flow → kết quả mong đợi, lệnh chạy, build, môi trường backend, thiết bị/OS, dữ liệu thử, kết quả từng flow và nơi lưu report/log/screenshot. Giữ lịch sử fail và rerun; không đưa mật khẩu/token vào Git.
6. Android là cổng kiểm chứng trước mắt; iOS cần bằng chứng riêng khi đến mốc nền tảng đã chốt. E2E pass không tự chuyển phase sang Done; người dùng quyết định nghiệm thu.

## Quan hệ với ADR hiện hành

Bổ sung ADR-009 về bộ E2E, lệnh chạy và bằng chứng riêng cho từng phase; giữ nguyên thứ tự cleanup/lint/typecheck/Jest → Maestro E2E → người dùng nghiệm thu. Không thay thế cổng duyệt kế hoạch, UI trước API, quyết định nghiệp vụ hoặc quyền nghiệm thu. Khi ADR-020 được Accepted, quy định chi tiết tại đây được ưu tiên trong phạm vi tổ chức E2E theo phase; ADR-009 và ADR-012 giữ nguyên file đã duyệt.

## Alternatives

Chỉ dùng một bộ E2E chung không có mapping theo phase, hoặc chỉ ghi quy tắc trong README/AGENTS.md. Không chọn vì khó kiểm tra đầy đủ phạm vi từng phase và không đáp ứng yêu cầu ghi nhận bằng ADR.

## Consequences

Mỗi phase có bộ test chạy lại được và bằng chứng đối chiếu trước nghiệm thu. Công việc triển khai phase phải bao gồm viết, chạy và sửa lỗi E2E. Không báo hoàn tất phần kiểm chứng khi mới có skeleton, unit test hoặc kết quả mô phỏng.

## BR-slice bị ảnh hưởng

Quy trình kiểm chứng của toàn bộ slice thuộc P0–P8 và các phase bổ sung; không thay đổi BR nghiệp vụ hoặc mở rộng scope sản phẩm. Quy ước thực hiện: [E2E Maestro](../implement/e2e-maestro.md).
