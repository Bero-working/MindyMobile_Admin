# P5 — E2E được bỏ qua theo chỉ thị người dùng

02/11/2026 (Asia/Bangkok): người dùng “Bỏ qua test e2e, triển khai hoàn thiện phase 5”. Áp dụng [ADR-030](../../adr/ADR-030-phase-5-e2e-waiver.md); không tiếp tục chạy E2E trong lượt này.

Lượt trước: `npm run test:e2e:phase-5` đã kiểm API/setup fixture/mutations thật thành công; Maestro không khởi tạo được instrumentation Android nên flow chưa chạy. **Không pass native E2E**, không có screenshot native được dùng làm bằng chứng UI.

Đã giữ runner tổng `scripts/e2e-phase-5.cjs` và flow `.maestro/phase-005-manager-operations-cash/` cho yêu cầu sau này. Command tự chạy API read → tạo dataset mới → mutation tests → Maestro → đọc postconditions; lỗi mọi bước trả nonzero, không dùng dataset cũ khi setup lỗi. Tài khoản local, credentials không ghi Git; runner redacts secrets khỏi report dạng text.

Flow chuẩn bị gồm: Manager login, tìm đơn CASH/xác nhận đúng tiền/đọc collector, lớp và S1 assign, S2 reschedule, S3 cancel/replacement/source chain. **Flow và selectors chưa được xác minh bằng native pass**. Bộ này chưa chứng minh mọi hồi quy P0–P4, hai Manager thu đồng thời, guest history/credit hoặc iOS; cần bổ sung/xác minh khi khôi phục mốc E2E. Build và Jest không thay các bằng chứng đó.

API thật/simulation/build và giới hạn tại [hồ sơ tích hợp](api-integration.md). Không tự đánh dấu phase Done.
