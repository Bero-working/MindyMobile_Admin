# P5 — UI và API đã triển khai

Ngày: 02/11/2026 (Asia/Bangkok). Người thực hiện: Codex.

**Đã viết UI/API cho 5/5 slice.** Người dùng chốt Q-P5-01–05 và yêu cầu triển khai API luôn, bỏ cổng xác nhận UI riêng theo [ADR-027](../../adr/ADR-027-phase-5-direct-api-implementation.md). Sau đó yêu cầu bỏ qua E2E và hoàn thiện P5 theo [ADR-030](../../adr/ADR-030-phase-5-e2e-waiver.md). Chưa ghi nhận nghiệm thu hoặc phase Done.

## Hành vi đã triển khai

| Slice | UI và API                                                                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| S1    | Từ Tổng quan buổi Manager mở dạy thay; candidates server/search debounce/phân trang, chọn người mới hoặc trả về mentor chính có lý do, version candidates và key; chỉ SCHEDULED tương lai                                                 |
| S2    | Thay editor mock cũ bằng dời buổi có ngày/giờ/lý do; giữ tên và người dạy, validate UTC+7/class period, review lịch cũ/mới; gửi version/key đúng DTO                                                                                      |
| S3    | Hủy SCHEDULED/IN_PROGRESS với impact đọc độc lập; chuyển bước tạo replacement trên cùng màn. Hai mutation riêng, giữ thời lượng/chain/version mới, không copy attendance/actual times, hiển thị gia hạn lớp và mở context mới             |
| S4    | Tile Đơn tiền mặt ở Home Manager, không gọi API từ Home; list CASH/PENDING theo filter server, mã đơn exact search, lớp lazy lookup/phân trang, Date header cho nhãn quá hạn, không detail từng hàng                                      |
| S5    | Đọc lại trước mở sheet, nhập số tiền thực nhận trống, phải bằng toàn bộ tổng nguyên VND; confirm chỉ amount, không key/version. Đọc collector sau mọi 200, phân biệt người khác đã thu; timeout phải kiểm trạng thái trước khi cho resend |

Module `src/modules/operations/` có provider/source boundary, query/mutation hooks, Zod schema, adapter HTTP cookie, translations vi/en, UI state và fixture RAM cho chế độ development review. Route chỉ trong stack Manager. Logout/đổi account remount bộ nhớ; response identity cũ bị loại; mất quyền xóa dữ liệu/form, offline không queue hoặc auto-send. Không sửa backend hoặc design Claude.

Context/lịch/lớp/incomplete/attendance caches liên quan được làm mới khi thay lịch; CASH xác nhận hoặc reconcile PAID làm stale list/roster. Khóa theo resource ngăn intent mới ghi đè thao tác lịch chưa rõ; retry cùng payload/key/version. Lịch ở thiết bị Mentor cập nhật qua focus/foreground/refresh, không giả invalidate máy khác.

## Bằng chứng kiểm chứng

- Model/UI/API unit: **22 tests, 3 suites pass** trong lượt trước cleanup cuối, bao phủ entry point/role/lazy list, filter/search, đủ tiền, kiểm collector và response loss, S1 reason/candidate/version, S2 không gửi title, S3 tách cancel/replacement, Zod/money/date/status. Lượt check toàn repo cuối được ghi tiếp tại mục cuối; không coi 22 test là mọi test case design đều đã kiểm trên native.
- API thật qua adapter hiện hành: `node scripts/verify-operations-api.cjs` pass. Đọc cả bốn status CASH, detail, exact code, lớp và Mentor denied. Tổng thay đổi khi tạo fixture nên không dùng con số của một lượt làm KPI.
- Fixture: `node scripts/setup-operations-dataset.cjs` tạo mới lớp `P5 E2E <run>`, 6 buổi tương lai, hai Mentor và hai học viên/đơn CASH qua route hợp lệ. Credentials chỉ ở file tài khoản local bị ignore. Không thay dữ liệu học/thanh toán ngoài fixture này.
- Mutation thật: `node scripts/verify-operations-mutations.cjs` pass; gán/xóa dạy thay, replay cùng key, stale version bị chặn, dời buổi giữ title/status, cancel/replacement tuyến tính không actual times, số tiền lệch bị từ chối, confirm/replay thành PAID với đúng collector và roster thanh toán. Lượt chạy tổng trước native cũng lặp lại thành công trên fixture mới.
- Postman CLI 1.77.0 simulation local port 4018: chạy adapter TypeScript thật qua Axios HTTP, pass mất response **sau một commit** lịch rồi replay cùng key; version conflict; CASH commit rồi timeout → GET PAID → replay vẫn đúng một commit; HTML 503 và 403. Request events lưu local tại `build-logs/phase-5-sim-rerun.ndjson`; fixture/manifest tại `postman/mocks/operations` và `postman/simulations/operations`. Đây là synthetic HTTP, không dùng thay kết quả backend thật.
- Android Debug x86_64: `android/gradlew.bat assembleDebug -PreactNativeArchitectures=x86_64` **BUILD SUCCESSFUL (26s)**, cài APK lên emulator-5554 thành công. Lượt all-ABI trước bị khóa app-debug.apk khi package, chạy lại đã thành công. Build không chứng minh bố cục native đúng.

## E2E và giới hạn

`npm run test:e2e:phase-5` đã chạy API/setup/mutations pass, nhưng Maestro lỗi **AndroidInstrumentationSetupFailure trước khi chạy flow**. Không có bằng chứng flow/ảnh native pass. Người dùng chỉ thị bỏ qua E2E sau lượt đó: đã dừng, không retry hoặc chạy hồi quy E2E thêm, không chuyển kết quả thành pass. Xem [E2E P5](e2e.md).

Chưa kiểm visual QA đầy đủ trên thiết bị, iOS hoặc mọi tổ hợp dark/vi/en/font-size bằng native. Test model/UI/API và build được báo độc lập. Q-PLAT-01 tiếp tục là giới hạn nghiệm thu nền tảng; người dùng chưa nghiệm thu P5. Luồng học bù P4 dùng lối đi có điều kiện theo module đã có, không coi bằng chứng P5 thay nghiệm thu P4.

## Lượt check cuối

`npm run check` **PASS** trên source cuối: ESLint 0 error/0 warning, Prettier pass, tsc --noEmit pass, **354 tests / 34 suites pass** (175,277s). Log local `build-logs/phase-5-check-final.log`. Trong đó P5 có 22 tests / 3 suites; không tuyên bố mọi case design/native đều đã chạy. Một số test React Navigation/P2 có console act warning trong log; đây không phải cảnh báo ESLint hoặc test fail. Không lấy kết quả pass của phase cũ làm bằng chứng lượt này.
