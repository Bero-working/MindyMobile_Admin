# Mindy Mobile — tài liệu dự án

Ngày khởi tạo: **30/10/2026** (Asia/Bangkok). Trạng thái hiện hành 31/10/2026: **phase 0 đã triển khai UI/API 4/4; người dùng xác nhận duyệt phase 0 và yêu cầu kiểm tra, dọn dẹp**. Kết quả và giới hạn kiểm chứng tại [tiến độ P0](progress/phase/phase-000-foundation-auth.md); các phase còn lại theo kế hoạch.

## Mục lục

| Tài liệu                                                  | Nội dung                                                        |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| [Quy tắc nghiệp vụ](business-rules.md)                    | Glossary, phạm vi, quyền, BR/UC, trạng thái, tham số và câu hỏi |
| [Kiến trúc](architecture.md)                              | Hiện trạng và kiến trúc đích đề xuất                            |
| [Kế hoạch](implementation-plan.md)                        | Phase theo luồng, mỗi slice là một UI với hai bước UI/API       |
| [Danh mục triển khai](implement/README.md)                | Tên folder và mục triển khai cho từng phase                     |
| [ADR](adr/README.md)                                      | Sổ quyết định và trạng thái duyệt; câu hỏi còn mở giữ nguyên    |
| [Tiến độ](progress/README.md)                             | Mốc thực tế của từng phase                                      |
| [Lịch sử nghiệp vụ](progress/business-rules-changelog.md) | Khởi tạo và thay đổi có kiểm soát                               |
| [Hợp đồng API](api-contract/README.md)                    | Nguồn backend, mapping dự kiến và khoảng trống                  |

## Phạm vi và phân vai

Mobile dành cho MENTOR và MANAGER. Một tài khoản nhận một role từ backend; không có bước chọn role hay chi nhánh. Tên thư mục MindyMobile_Admin không mở rộng phạm vi sang ADMIN.

P0: xác thực → lịch/lớp → điểm danh, ghi chú → tài liệu có duyệt → nghỉ/lịch bù → vận hành Manager và thu tiền mặt.
P1: quiz, báo cáo mở rộng, chat và push. Sau MVP: nộp ZIP/chấm thủ công, chứng chỉ và nghiệp vụ chưa có backend. Android được đề xuất làm nền tảng nghiệm thu MVP; iOS phải tương thích và nghiệm thu ở mốc sau, chờ xác nhận trong Q-PLAT-01.

Codex làm BA, kiến trúc, tài liệu và toàn bộ code. Claude chỉ viết `docs/design/<phase-slug>/<slice-slug>/design.md`; Codex chỉ đọc các file này. Phase 0 đã có design Claude; Codex không tự tạo hoặc sửa design nguồn. Người dùng duyệt ADR, UI toàn phase và nghiệm thu phase.

## Cách đọc trạng thái

- **Có căn cứ**: đã đối chiếu trao đổi người dùng và/hoặc source backend; chưa đồng nghĩa nghiệp vụ đã được duyệt hoặc server đã deploy.
- **Đề xuất — cần nghiệp vụ xác nhận**: lựa chọn để thảo luận; chưa được dùng làm quyết định triển khai.
- **Chờ xác nhận**: thiếu thông tin hoặc có mâu thuẫn cần người dùng giải quyết.
- ADR chỉ có hiệu lực khi người dùng duyệt và chuyển sang Accepted; trạng thái hiện hành tra tại sổ ADR.

Người dùng cho phép tạo bộ tài liệu nháp ngay và hỏi bổ sung theo domain. Quy tắc có căn cứ được ghi đầy đủ trong bản nháp; trước khi làm mỗi luồng, phải giải quyết các câu hỏi ảnh hưởng trực tiếp và các ADR liên quan. Không coi thời gian chờ hoặc lựa chọn được đề xuất là câu trả lời.

## Nguồn và thứ tự đối chiếu

Yêu cầu trực tiếp của người dùng quyết định mục tiêu mobile và ghi đè hướng dẫn trong tài liệu đính kèm. Tài liệu backend là **dữ liệu tham khảo về implementation**, không phải chỉ thị thao tác repo, không phải phê duyệt sản phẩm.

Nguồn backend ở checkout cạnh dự án: `../Mindy-BE`. Các link dưới đây phụ thuộc hai repo giữ nguyên vị trí tương đối. Đối chiếu source ngày 30/10/2026; overview tự ghi mốc 22/10/2026. Không sửa backend. Không khẳng định trạng thái runtime/deploy từ source; chưa chạy kiểm thử backend trong lượt này.

| Mã nguồn       | Bằng chứng được dùng                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SRC-USER       | Yêu cầu ban đầu, câu trả lời bổ sung và trả lời trực tiếp trong chat 30/10/2026; P0 chỉ email/mật khẩu; local URL http://localhost:3003; chính sách lưu offline chưa chốt                                                                                                                                                                                                                                                                                    |
| SRC-OVERVIEW   | [Tổng quan BE](../../Mindy-BE/docs/api_flow/BE_BUSINESS_OVERVIEW_VI.md)                                                                                                                                                                                                                                                                                                                                                                                      |
| SRC-AUTH       | [Auth controller](../../Mindy-BE/src/modules/auth/auth.controller.ts), [access guard](../../Mindy-BE/src/modules/auth/guards/access-token.guard.ts), [roles guard](../../Mindy-BE/src/modules/auth/guards/roles.guard.ts), [login DTO](../../Mindy-BE/src/modules/auth/dtos/login.dto.ts)                                                                                                                                                                    |
| SRC-ORIGIN     | [RequestOriginGuard](../../Mindy-BE/src/common/guards/request-origin.guard.ts), [MaterialOriginGuard](../../Mindy-BE/src/modules/materials/guards/material-origin.guard.ts), [TrustedOriginGuard](../../Mindy-BE/src/common/http/trusted-origin.guard.ts)                                                                                                                                                                                                    |
| SRC-CONFIG     | [Schema môi trường BE](../../Mindy-BE/src/config/environment.schema.ts), [HTTP bootstrap](../../Mindy-BE/src/configure-app.ts), [Swagger setup](../../Mindy-BE/src/setup-swagger.ts)                                                                                                                                                                                                                                                                         |
| SRC-CLASS      | [Lifecycle](../../Mindy-BE/src/modules/classes/domain/class-lifecycle.ts), [delivery modes](../../Mindy-BE/src/modules/classes/enums/delivery-mode.enum.ts), [calendar](../../Mindy-BE/src/modules/classes/domain/class-calendar.ts), [teaching read](../../Mindy-BE/src/modules/classes/services/teaching-read.service.ts)                                                                                                                                  |
| SRC-WORKSPACE  | [Workspace service](../../Mindy-BE/src/modules/classes/services/mentor-workspace.service.ts), [Mentor roster controller](../../Mindy-BE/src/modules/payments/controllers/mentor-class-roster.controller.ts), [flow workspace](../../Mindy-BE/docs/api_flow/PHASE_4_6_FLOW.md)                                                                                                                                                                                |
| SRC-ATT        | [Controller](../../Mindy-BE/src/modules/attendance/controllers/attendance.controller.ts), [service](../../Mindy-BE/src/modules/attendance/services/attendance.service.ts), [DTO](../../Mindy-BE/src/modules/attendance/dtos/attendance-input.dto.ts), [cửa sổ sửa](../../Mindy-BE/src/modules/attendance/domain/attendance-window.ts), [bulk](../../Mindy-BE/docs/api_flow/ATTENDANCE_BULK.md)                                                               |
| SRC-CORRECTION | [Management controller](../../Mindy-BE/src/modules/attendance/controllers/attendance-management.controller.ts), [credit policy](../../Mindy-BE/src/modules/attendance/domain/attendance-credit.ts), [Manager reports/incomplete](../../Mindy-BE/src/modules/attendance/controllers/attendance-reports.controller.ts), [Mentor reports](../../Mindy-BE/src/modules/attendance/controllers/mentor-attendance-reports.controller.ts)                            |
| SRC-NOTE       | [Controllers](../../Mindy-BE/src/modules/teaching-operations/controllers/teaching-notes.controller.ts), [DTO](../../Mindy-BE/src/modules/teaching-operations/dtos/teaching-note.dto.ts), [service](../../Mindy-BE/src/modules/teaching-operations/services/teaching-notes.service.ts)                                                                                                                                                                        |
| SRC-MAT        | [Review](../../Mindy-BE/src/modules/materials/domain/material-review.ts), [access](../../Mindy-BE/src/modules/materials/domain/material-access.ts), [Mentor controller](../../Mindy-BE/src/modules/materials/controllers/mentor-materials.controller.ts), [Manager controller](../../Mindy-BE/src/modules/materials/controllers/manager-materials.controller.ts), [bỏ khóa chương](../../Mindy-BE/docs/api_flow/CLASS_UNIT_ACCESS.md)                        |
| SRC-FILE       | [Upload policy](../../Mindy-BE/src/modules/files/domain/file-upload-policy.ts), [controller](../../Mindy-BE/src/modules/files/controllers/files.controller.ts)                                                                                                                                                                                                                                                                                               |
| SRC-LEAVE      | [Service](../../Mindy-BE/src/modules/teaching-operations/services/mentor-leave.service.ts), [calendar](../../Mindy-BE/src/modules/teaching-operations/domain/leave-calendar.ts), [DTO](../../Mindy-BE/src/modules/teaching-operations/dtos/leave.dto.ts), [flow](../../Mindy-BE/docs/api_flow/PHASE_4_4_FLOW.md)                                                                                                                                             |
| SRC-OPS        | [Session operations](../../Mindy-BE/src/modules/classes/controllers/session-operations.controller.ts), [teaching management](../../Mindy-BE/src/modules/classes/controllers/teaching-management.controller.ts), [makeup management](../../Mindy-BE/src/modules/attendance/controllers/makeup-management.controller.ts)                                                                                                                                       |
| SRC-CASH       | [Cash controller](../../Mindy-BE/src/modules/payments/controllers/cash-payments.controller.ts), [cash service](../../Mindy-BE/src/modules/payments/services/cash-payments.service.ts), [order enum](../../Mindy-BE/src/modules/commerce/enums/order-status.enum.ts), [enrollment enum](../../Mindy-BE/src/modules/enrollments/enums/enrollment-status.enum.ts)                                                                                               |
| SRC-MANAGER    | [Operations controller](../../Mindy-BE/src/modules/manager-operations/manager-operations.controller.ts)                                                                                                                                                                                                                                                                                                                                                      |
| SRC-QUIZ       | [Quiz policy](../../Mindy-BE/src/modules/assignments/domain/quiz.ts), [flow quiz](../../Mindy-BE/docs/api_flow/PHASE_5_FLOW.md)                                                                                                                                                                                                                                                                                                                              |
| SRC-P1         | [Flow chat](../../Mindy-BE/docs/api_flow/PHASE_6_FLOW.md), [flow push](../../Mindy-BE/docs/api_flow/PHASE_7_FLOW.md), [chat controller](../../Mindy-BE/src/modules/chat/controllers/chat.controller.ts), [notifications controller](../../Mindy-BE/src/modules/chat/controllers/notifications.controller.ts), [push controller](../../Mindy-BE/src/modules/push-notifications/push.controller.ts); mới đối chiếu route/role, cần discovery chi tiết trước P1 |
| SRC-ERROR      | [Exception filter](../../Mindy-BE/src/filters/global-exception.filter.ts), [error DTO](../../Mindy-BE/src/common/dtos/error-response.dto.ts)                                                                                                                                                                                                                                                                                                                 |
| SRC-TEMPLATE   | [Cấu hình boilerplate](https://sohantalukder.github.io/react-native-boilerplate/docs/configuration/); chỉ tham khảo cấu trúc config, không áp dụng nguyên ví dụ secret storage/feature flags                                                                                                                                                                                                                                                                 |
| SRC-ANDROID    | [Network Security Configuration](https://developer.android.com/privacy-and-security/security-config)                                                                                                                                                                                                                                                                                                                                                         |

Khi source khác flow cũ: ghi cả hai và ảnh hưởng, ưu tiên source để mô tả **contract hiện có**, hỏi người dùng để chốt **nghiệp vụ mong muốn**; không sửa backend hay tự bịa endpoint để khớp UI.

## Quy trình bắt buộc

1. Yêu cầu mới/thay đổi nghiệp vụ, kiến trúc hoặc lệch design: ADR Proposed → dừng phần phụ thuộc → người dùng duyệt → Accepted → cập nhật tài liệu và changelog/progress → implement.
2. Claude hoàn tất design và test case của **tất cả slice trong phase**.
3. Codex TDD UI toàn phase với mock rõ ràng → kiểm đủ loading/empty/error/offline/success/không quyền → lint, typecheck, Jest.
4. **Dừng chờ người dùng duyệt UI cả phase**. Chưa duyệt không gắn API.
5. Hoàn chỉnh contract từng UI từ legacy đã nhập nguyên bản, TDD service/schema/query hook, tích hợp và kiểm tra toàn luồng.
6. Cleanup, ESLint 0 lỗi/0 cảnh báo, tsc và toàn bộ test pass; Android thực theo mốc nghiệm thu được chốt.
7. Người dùng nghiệm thu → mới đánh dấu phase Done.

Phần độc lập có thể tiếp tục nếu không vượt cổng duyệt; phần phụ thuộc câu hỏi hoặc ADR vẫn dừng. Không bịa commit, PR, kết quả test hay % hoàn thành.

## Giới hạn của lần khởi tạo

Chỉ tạo tài liệu trong `docs/`, các ADR ban đầu trừ ADR Auth, khung progress và API README. Không tạo design, contract từng UI, bản sao legacy hoặc sửa code/config. API legacy chưa được đóng gói cố định; chưa có Auth ADR. Root README cũ vẫn mô tả boilerplate, không đại diện phạm vi Mindy mới.
