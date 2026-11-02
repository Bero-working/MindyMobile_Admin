# ADR-026 — Mỗi phase chỉ có một command test E2E

## Status

**Accepted** — 01/11/2026 (Asia/Bangkok), theo chỉ thị trực tiếp của người dùng: “Gộp tất cả thành 1 command test e2e như phase 0” và “Thêm quy tắc adr về mỗi phase chỉ có 1 command test e2e”. Chỉ thị cho phép ghi và áp dụng đúng quy tắc này. Ghi nguồn/ngày tại lần tạo và đóng băng file theo ADR-012.

## Context

ADR-020 đã yêu cầu flow tổng và lệnh E2E riêng cho từng phase, nhưng Phase 1 có ba lệnh npm cho UI mock, kiểm API và E2E tích hợp. Người chạy phải nhớ kiểm API để tạo dataset trước khi mở Maestro; chạy thiếu bước có thể dùng dataset cũ. Cần một điểm chạy duy nhất như Phase 0.

## Decision

1. Mỗi phase đã triển khai chỉ có một command npm công khai để kiểm E2E: `npm run test:e2e:phase-<số>`. Không thêm command riêng dạng `:ui`, `:api` hoặc command `test:api:phase-<số>` yêu cầu người chạy ghép thủ công để hoàn tất E2E của phase.
2. Command tổng tự chạy tuần tự mọi bước cần cho bộ E2E hiện hành: kiểm API/chuẩn bị dataset nếu cần, rồi toàn bộ flow native tích hợp bắt buộc và hồi quy liên quan theo ADR-020. Có thể tách helper script/flow nội bộ; người chạy không phải gọi chúng trước. Không tạo command rỗng cho phase chưa triển khai.
3. Mọi bước dùng cùng cấu hình backend, tài khoản và role của lần chạy; biến môi trường ưu tiên file tài khoản local. Không ghi credentials vào Git hoặc log. Dataset phải được tạo lại và kiểm đủ ID cần dùng trước khi chạy flow phụ thuộc, không tiếp tục bằng dataset cũ khi bước API thất bại.
4. Lỗi chuẩn bị, API, thiếu dataset, không khởi chạy được tiến trình, bị ngắt hoặc lỗi flow đều làm command trả exit code khác 0. Dừng trước bước phụ thuộc khi bước trước lỗi. Chỉ trả 0 khi toàn bộ bước bắt buộc thành công; không coi API pass là E2E native pass.
5. Flow UI mock trước tích hợp API được giữ để truy vết và hỗ trợ phát triển nội bộ; không chạy chung fixture cũ với bộ tích hợp hiện hành hoặc dùng kết quả mock thay bằng chứng native/API thật. Hồ sơ phải ghi rõ command cũ là lịch sử và chỉ hướng dẫn command tổng cho lần chạy hiện tại.
6. README, kế hoạch và `e2e.md` của phase hướng dẫn cùng command duy nhất, nêu các bước tự động, điều kiện môi trường, phạm vi và kết quả kiểm chứng. Quy tắc áp dụng P0–P8 và các phase bổ sung khi triển khai.

## Quan hệ với ADR hiện hành

Bổ sung và thay phần tổ chức command của [ADR-020](ADR-020-e2e-suite-per-phase.md): một command duy nhất bao gồm các bước tiền điều kiện, không chia thành nhiều command npm độc lập. Giữ nguyên flow theo phase, phạm vi native/backend thật, cổng kiểm chứng/nghiệm thu và hồ sơ bằng chứng của ADR-009/020/025. Giữ nguyên các file Accepted cũ theo [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md); mapping hiệu lực ghi tại [sổ ADR](README.md).

## Alternatives

- Giữ nhiều command và hướng dẫn chạy theo thứ tự: dễ bỏ bước hoặc dùng dataset cũ.
- Chỉ xóa alias npm nhưng không gộp bước API: không đáp ứng yêu cầu chạy trọn bộ bằng một command.
- Chạy cả flow mock cũ và flow API trên cùng app hiện hành: khác nguồn dữ liệu và selector, không tạo bằng chứng tích hợp hợp lệ.

## Consequences

Người chạy chỉ cần nhớ một command cho mỗi phase. Lần chạy P1 bao gồm kiểm API và tạo dataset mới nên lâu hơn gọi riêng Maestro. Helper vẫn có thể tách file để bảo trì; số file/flow không bị giới hạn bằng số command. Không tự thay nghiệp vụ, mở rộng phạm vi phase hoặc thay quyền nghiệm thu của người dùng.

## Áp dụng và kiểm chứng

P0 giữ `npm run test:e2e:phase-0`. P1 giữ `npm run test:e2e:phase-1`, tự chạy `scripts/verify-teaching-api.cjs` rồi Maestro với dataset mới; bỏ hai command npm cũ và launcher UI mock không còn dùng. Kết quả kiểm tra lần thay đổi ghi tại [E2E P1](../implement/phase-001-teaching-workspace/e2e.md), không sửa kết quả lịch sử thành pass mới.

## BR/slice bị ảnh hưởng

Quy trình chạy kiểm chứng của mọi phase; không đổi BR nghiệp vụ hoặc số slice.
