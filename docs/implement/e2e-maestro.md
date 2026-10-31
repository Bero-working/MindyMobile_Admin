# E2E bằng Maestro trước nghiệm thu phase

Ngày áp dụng: 30/10/2026 (Asia/Bangkok). Theo chỉ thị trực tiếp của người dùng, bổ sung [ADR-009](../adr/ADR-009-phase-tdd-and-ownership.md). Áp dụng P0–P8 khi từng phase đủ điều kiện triển khai.

## Cổng bắt buộc

UI toàn phase được duyệt → API toàn phase hoàn thành → cleanup/lint/typecheck/Jest pass → Maestro E2E pass → người dùng nghiệm thu. Giữ nguyên các cổng design/contract/quyền và câu hỏi còn mở. Chưa có bộ flow E2E hoặc kết quả chạy Maestro ở thời điểm lập quy ước này; các test Jest hiện tại không phải E2E.

Codex viết và chạy flow khi triển khai phase; không đợi người dùng tự kiểm thử thay cho E2E. Chạy app native trên Android emulator/thiết bị, dùng backend và tài khoản/dữ liệu thử dành cho kiểm thử. Không ghi mật khẩu/token trong flow, log hoặc Git. Những nhánh lỗi cần fixture hoặc điều kiện mạng phải ghi rõ cách tái hiện; kết quả mô phỏng ghi riêng, không thay thế bằng chứng tích hợp thật.

## Tổ chức flow và bằng chứng

- Khi tạo flow, đặt tại `.maestro/phase-NNN-<slug>/`, cùng số và slug với hồ sơ phase. Flow dùng chung đặt tại `.maestro/shared/`; không chạy flow helper như ca độc lập.
- Mỗi phase phải có lệnh `npm run test:e2e:phase-<số>` trong `package.json`, chạy flow tổng của riêng phase đó. Flow tổng phải bao gồm toàn bộ ca E2E tích hợp bắt buộc của phase, truyền đúng tài khoản/vai trò và trả exit code thất bại nếu một ca lỗi. Bổ sung lệnh, flow và hồ sơ E2E khi triển khai phase; không tạo lệnh hoặc flow rỗng cho phase chưa triển khai.
- Ưu tiên selector `testID` ổn định; kiểm tra kết quả người dùng thấy và trạng thái nghiệp vụ sau thao tác. Dữ liệu thử phải tái lập được, tách biệt để chạy lại không gây xung đột.
- Mỗi phase ghi mapping BR/UC/slice → flow → expected result trong `docs/implement/phase-NNN-<slug>/e2e.md` khi bắt đầu viết E2E. Không tạo hàng loạt flow rỗng hoặc báo pass từ skeleton.
- Hồ sơ chạy ghi ngày, lệnh/version Maestro thực dùng, build/version/commit nếu có, thiết bị/OS, môi trường backend, vai trò/dataset, kết quả pass/fail/blocked/skipped và đường dẫn report/log/screenshot. Artifact lớn hoặc chứa dữ liệu nhạy cảm giữ ngoài Git và ghi nơi lưu phù hợp.
- Chạy toàn bộ flow của phase và hồi quy luồng cũ bị tác động. Sau sửa lỗi phải chạy lại các flow liên quan; không ghi đè lịch sử fail bằng tuyên bố pass thiếu bằng chứng.

## Phạm vi tối thiểu theo phase

Các mục dưới đây là hướng kiểm chứng từ kế hoạch hiện hữu; chi tiết và dữ liệu phụ thuộc design/contract đã chốt, không tự tạo luật nghiệp vụ mới.

| Phase | Luồng E2E chính và rủi ro cần kiểm tra |
| --- | --- |
| P0 / 000 | Login → workspace đúng role; sai thông tin/role không được phép; khôi phục/hết phiên, logout và settings theo policy đã chốt |
| P1 / 001 | Mentor xem lịch/lớp/học viên đúng scope; Manager xem lớp; resource không còn quyền bị chặn |
| P2 / 002 | Điểm danh/ghi chú → đọc lại; correction/audit; offline/reconnect/conflict theo policy đã chốt |
| P3 / 003 | Mentor gửi tài liệu → Manager review/công bố → đọc lại trạng thái và quyền preview |
| P4 / 004 | Mentor xin nghỉ → Manager xử lý → lịch bù cập nhật; conflict/reject theo contract |
| P5 / 005 | Phân công/xử lý lịch; xác nhận CASH → trạng thái sau đọc lại; quyền và thao tác lặp |
| P6 / 006 | Tạo quiz → công bố → theo dõi trạng thái trong phạm vi roadmap được duyệt |
| P7 / 007 | Báo cáo theo vai trò, bộ lọc và ngữ nghĩa số liệu đã chốt; đối chiếu dữ liệu thử |
| P8 / 008 | Trao đổi/nhận thông báo theo quyền và điều hướng theo scope đã duyệt; push theo cấu hình thực |

## Điều kiện trình nghiệm thu

Các flow bắt buộc của phase và hồi quy liên quan phải pass, có bằng chứng thực tế. Fail/blocked/skipped còn ảnh hưởng tiêu chí nghiệm thu thì chưa đủ điều kiện trình nghiệm thu; ghi lý do và xử lý trước. Android pass không xác nhận iOS; iOS có bằng chứng riêng khi đến mốc đã chốt. Người dùng vẫn là người quyết định nghiệm thu và chuyển phase Done.

## UI mock phase 0 — 30/10/2026

Các flow tại `.maestro/phase-000-foundation-auth/ui-mock/` có tag `ui-mock`, chỉ kiểm chứng UI và navigation trên bản native development với service giả. Không có backend hoặc tài khoản thật. Báo cáo UI mock không được dùng để đóng mốc E2E tích hợp của ADR-009. Khi đến bước API, cần bộ flow/bằng chứng tích hợp riêng và hồi quy các luồng này.
