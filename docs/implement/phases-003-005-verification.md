# Kiểm chứng P3, P4, P5 — 02/11/2026

Nguồn yêu cầu: người dùng “Test luôn 3 phase 3, 4, 5”; sau đó báo ảnh CASH có khóa dịch; cuối cùng **“Không cần test e2e, tôi sẽ yêu cầu sau”**. Đã dừng các lượt Maestro do lượt này khởi chạy và đóng emulator test riêng `emulator-5556`; giữ nguyên emulator `emulator-5554` của người dùng. Không tiếp tục E2E sau chỉ thị dừng.

## Bằng chứng

| Phần               | Kết quả / giới hạn                                                                                                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jest theo P3/P4/P5 | Hồi quy cuối `npm test -- --runInBand`: **33/33 suite, 337/337 test pass**. Gồm CASH vi/en, P3 query race/permission loss/request identity và hồi quy auth/teaching/attendance/leave/operations. Log: `build-logs/phases-3-4-5-final-jest.log`                                          |
| CASH localization  | 11/11 operations UI tests pass, gồm hai locale; xác minh Metro sourceExts `js,jsx,json,ts,tsx` resolve registration về `operations/messages.ts` sau đổi tên dữ liệu                                                                                                                     |
| Lint/typecheck     | Lượt `npm run lint` pass gồm ESLint 0 warning, format và `tsc --noEmit`; chạy lại khi mã cuối thay đổi                                                                                                                                                                                  |
| P3 API thật        | Lifecycle ARTICLE và storage PDF/READY/signed GET pass trên course/class/mentor tạo riêng; không sửa dữ liệu dạy học thật                                                                                                                                                               |
| P3 simulation      | Adapter thật qua Postman HTTP stand-in pass uncertain-after-commit/replay một commit, conflict, HTML 503 và denied. Không phải bằng chứng provider/native                                                                                                                               |
| P4                 | UI/model tests pass với mock. Runner hiện là UI mock; không coi đó là tích hợp API thật hoặc E2E pass                                                                                                                                                                                   |
| P5 API thật        | `verify-operations-api.cjs` pass query CASH theo status và Mentor denied; `setup-operations-dataset.cjs`/`verify-operations-mutations.cjs` pass assign/clear/replay/stale version, reschedule, cancel/replacement, đúng số tiền CASH/replay/collector và paid roster trên fixture riêng |
| Android            | Build x86_64 pass với dependency native mới; build đa ABI đầu tiên fail vì CMake directory lock trên Windows                                                                                                                                                                            |
| E2E                | Các lượt P3/P4 thử trước chỉ thị cuối không pass vì harness/device; P5 chưa chạy native trong lượt này. Sau chỉ thị cuối: dừng/chờ người dùng yêu cầu lại, không quy đổi thành miễn mọi tiêu chí nghiệm thu                                                                             |

## Sửa lỗi phát hiện

- CASH hiện `cash.title`, `status.PENDING`, `mock` vì Metro resolve `./messages` sang `messages.json`, bỏ qua side effect `addResourceBundle` trong TS. Chuyển JSON thành `translations.json`, giữ file đăng ký `messages.ts`, thêm test hiển thị nhãn cả hai locale. Không đổi logic thu tiền.
- Hồi quy chung có fixture session thiếu `asOf` từ contract đang dùng và test chờ mock session editor đã bị P5 thay thế: đồng bộ fixture/wait marker với contract và UI hiện hành; giữ test lazy attendance.
- Mock attendance legacy updateSession cần từ chối Mentor giống boundary Manager. Bổ sung guard, giữ test bảo toàn roster/audit/thời gian thật khi Manager sửa.

Log và screenshot nằm dưới `build-logs/`, tài khoản/dataset local bị ignore. Không có commit/PR, không nghiệm thu hoặc đánh dấu phase Done từ các kết quả này. Xem [hồ sơ P3](phase-003-material-review/api-integration.md) để biết phần chưa kiểm chứng native.
