# Phase 2 — E2E API và native

Command công khai duy nhất: `npm run test:e2e:phase-2`. Runner kiểm API đọc → tạo dataset mới qua Admin HTTP → kiểm mutation bằng Mentor/Manager → Maestro → đọc lại backend để xác minh note, trạng thái COMPLETED và audit correction/recovery. Mọi lỗi setup/API/native/postcondition trả exit khác 0; không dùng dataset cũ nếu setup fail. Cần APK source hiện hành, Metro 8081 và emulator Android có kết nối adb.

Credentials đọc từ `.maestro/accounts.local.json` hoặc môi trường, không commit; không có credential trong YAML/dataset. Runner redact credentials khỏi artifact text của Maestro. Admin chỉ dùng cho tạo fixture; app sử dụng Mentor/Manager. Lớp, buổi, học viên và đơn thử có tên P2 E2E riêng; không sửa các lớp sẵn có.

## Kết quả hiện hành

**PASS ngày 02/11/2026, 21:11 ICT** — `npm run test:e2e:phase-2` exit 0 trên Pixel_8 Android 17/API 37, APK debug x86_64. Runner đã chạy API đọc, setup fixture mới, mutation, toàn flow Maestro và backend postconditions. Run ID `6193a60a-3986-48b4-8afc-9d57ffd35b02`; report `build-logs/phase-2-api/maestro-6193a60a-3986-48b4-8afc-9d57ffd35b02/2026-11-02_210549`; log tổng `build-logs/phase-2-api/e2e-read-retry.log`. `nativeVerifiedAt` là `2026-11-02T14:11:40.872Z`.

Backend đọc lại xác nhận note đúng nội dung `P2 native E2E note`, ba buổi native đều COMPLETED, correction có lý do đã lưu và recovery có audit/evidence. History rỗng trước recovery và hiện audit thật sau recovery; tabs nằm trong chi tiết cùng buổi. Đã xem ảnh 03-note, 09-recovery-form và 10-recovery-audit của chính report pass. Lượt pass không thay thế các giới hạn phía dưới hoặc nghiệm thu người dùng.

## Nhật ký

- Người dùng yêu cầu dọn dữ liệu P2 E2E. Đã kiểm kê read-only qua Admin API bằng `scripts/inventory-attendance-fixtures.cjs`, đối chiếu đồng thời email/displayName, class code/name và mentor ID: 33 tài khoản, 11 lớp trên API thật. Danh sách ID và class detail lưu ở `build-logs/phase-2-api/cleanup-inventory.local.json` (ignored). Chưa xóa bản ghi nào: backend không có API DELETE user/class/order; suspend/cancel không phải xóa và có thể phát sinh tác động nghiệp vụ. Kết nối database local trỏ localhost; Coolify hiện có không chứa backend này. Đã yêu cầu kết nối database/SSH đúng server để tiếp tục cleanup. Không chạy thêm E2E tạo fixture trong khi chờ dọn.

- Sau report pass, người dùng phát hiện tab Recovery báo “Ghi danh chưa đủ điều kiện” sau khi đóng picker chưa chọn học viên. Live read cùng fixture `apiLifecycle` xác nhận canRecover=true, 2 bản ghi hiện hữu và roster 2 học viên. Đã sửa empty selection thành lời hướng dẫn khôi phục bản ghi thiếu và nút mở lại picker; không đổi API/quyền. Regression test đã tái hiện fail trước sửa. Lượt kiểm sau sửa bị lỗi Icon ở Workspace trước khi vào Recovery; full check hiện bị CRLF và TypeScript ở các module khác trong workspace, không ghi nhận pass mới. ESLint/Prettier riêng ba file sửa pass. Cần rerun native sau thay đổi UI này; report pass phía trên thuộc baseline trước sửa empty selection.

- TDD adapter fail trước implementation; 30 kiểm tra adapter/key ban đầu pass.
- Backend đọc: tất cả loại read chính pass; log gọi route theo role ở verifier. API fixture mutation pass: idempotency, conflict, hai trang, save/bulk/finalize, independent note version, Manager correction/finalize, sync, recovery/record-exists/audit.
- Lượt đầu API note fail ORIGIN_NOT_ALLOWED do Origin local khác deploy; đã xác minh Origin từ cấu hình frontend và preflight runtime rồi kiểm PUT thành công.
- Lượt đầu Manager finalize trong verifier fail khi dùng đồng hồ client; đã dùng server asOf cho actual end và chạy lại fixture mới thành công.
- Maestro report `maestro-075ca808-362b-4b65-b989-40c4f400dfa7/2026-11-02_132407`: login/class/context pass, fail ở mở AttendanceEditor; ảnh đã xem cho thấy NAVIGATE không có route. Đã sửa đăng ký route theo role thay vì attendanceMock và thêm hai test live-mode. Chưa dùng lượt fail làm bằng chứng pass.
- Emulator bị ngắt sau lượt trên; đã khởi động lại Pixel_8 và tiếp tục kiểm tra source hiện hành.

- Maestro report `maestro-14dc25a9-25e9-4213-909f-a1805fe9db19/2026-11-02_194616`: Mentor start/mark/save/finalize/note; Manager correction/finalize/backlog/snapshot/History empty đều pass, dừng ở review Recovery. Đã xem ảnh: actual end mới nhập bị so với asOf cũ và báo time invalid. Đã sửa form clock server-relative, thêm regression test và auto-scroll tab được chọn. `npm run check` cuối pass 23 suites/268 tests, lint/format/tsc pass. Lượt fail không được ghi native pass.

- Maestro report `maestro-1998c5b4-d187-4105-89b1-66db587fc43c/2026-11-02_195645`: các bước Mentor, correction và Manager finalize pass; công cụ ngắt ở nhập filter lớp. Log Maestro ghi lỗi Windows file lock khi heartbeat (`KeyValueStore.commit`); không có assertion lỗi API/app ở điểm dừng. Đã kiểm chỉ còn một lượt Maestro rồi rerun command tổng trên dataset mới. Không quy lượt bị ngắt thành pass.

- Maestro report `maestro-38418099-f69e-4c16-bcdc-346d5b202186/2026-11-02_201603`: toàn flow native gồm Recovery/History chạy hết, nhưng backend postcondition phát hiện note còn null. Ảnh 03-note cho thấy floating Review P2 che nút Save và mở menu mock, khiến check mất nhãn unsaved không đủ. Đã ẩn switcher trong các màn live nghiệp vụ, thêm test host và assert không có overlay trước/sau Save; giữ postcondition backend bắt buộc. Lượt này không được tính E2E pass.

- Maestro report `maestro-14d47052-d588-4b79-a212-f1aaf7f9a843/2026-11-02_203830`: ghi chú native đã được backend xác nhận version 1; correction chạy được, dừng khi tìm fixture chốt thay. Ảnh tại điểm dừng cho thấy app đã ở mock Mentor classes. Kiểm adapter thật riêng xác nhận danh sách global vẫn có fixture cần chốt. Đã loại bỏ debug switcher khỏi toàn bộ live workspace và ràng buộc assertion trước mở tiện ích; chỉ màn đăng nhập còn entry review. Lượt này không tính pass.

## Phạm vi native

Các lượt bổ sung (không tính pass): `maestro-f8620f44-25ae-41f6-933c-bd9bcdce5734/2026-11-02_204859` dừng tại chọn lớp sau khi ẩn bàn phím đã đóng sheet; YAML đã kiểm search và mở lại sheet khi cần. `maestro-f654f485-ee9a-4e65-9dcf-6e9cc1e9859d/2026-11-02_205919` dừng tại context ghi chú lỗi đọc; gọi lại context/note bằng adapter với cùng tài khoản/buổi thành công. YAML cho phép bấm Thử lại một lần khi có lỗi đọc, sau đó vẫn bắt buộc form, Save và postcondition backend.

Mentor login → lớp/context P1 → start/mark/save/finalize → note; Manager login/account boundary → chọn học viên/lớp/buổi → correction có lý do → chốt thay với giờ thực tế → backlog/filter → snapshot/candidates → History empty → Recovery với dữ liệu fixture có thanh toán/bằng chứng → History có audit thật. Chuyển tab có dirty guard được kiểm bằng UI tests. Ảnh cần được xem trước bàn giao.

Q-PLAT-01/iOS và nghiệm thu phase vẫn riêng. Không tự chuyển Done từ E2E pass.
