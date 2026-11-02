# P7-S2 — Manager đọc chuyên cần theo lớp

Ngày tách: **02/11/2026 (Asia/Bangkok)**, sau phản hồi “Duyệt” kế hoạch tổng phase 7. **Kế hoạch tổng đã duyệt; chưa có chỉ thị implement hoặc code UI/API.** Không sử dụng SpecKit.

## Phạm vi và đầu vào

BR-REPORT-01/02/03; UC-MG-10. Phụ thuộc P1-S7/P2-S4 và P4 cho tình huống học bù. Đối chiếu [kế hoạch tổng](phase-007-attendance-progress-reports.md), [S1 Mentor](slice-001-mentor-attendance-report.md), [mapping API](../../api-contract/README.md#p7-s2) và [tiến độ](../../progress/phase/phase-007-attendance-progress-reports.md).

Manager vào từ lớp, xem chuyên cần theo enrollment với range, pagination và thời điểm dữ liệu do server cung cấp. Không thêm KPI cả lớp/nhiều lớp, doanh thu, export, sửa điểm danh, Manager progress hoặc history chi tiết học viên chưa có endpoint tương ứng. Controller có ADMIN không tự mở Admin workspace trong app.

Design đích chưa có: `docs/design/attendance-progress-reports/manager-attendance-report/design.md`. Layout, route cụ thể và testID chờ Claude. Q-P1-01 cho báo cáo/KPI và policy dữ liệu tiếp tục chờ chốt theo kế hoạch tổng; duyệt tổng không tự đóng các câu hỏi này.

## Checklist UI TDD sau khi đủ đầu vào và chỉ thị implement

- [ ] Giữ classId từ ManagerClassDetail P1; kiểm role và quyền hiện hành khi mở/deep link/refresh. Không lấy quyền từ cache hoặc cho Mentor dùng route Manager.
- [ ] Đề xuất mặc định không range, page 1/pageSize 20. Chỉ tải lớp đang xem, không preload báo cáo mọi lớp hoặc thêm filter/search/sort không có nguồn.
- [ ] Mỗi hàng theo enrollmentId, không gộp học viên đăng ký lại chỉ bằng studentId. Hiển thị tên/metadata đúng DTO; không gọi detail từng hàng để trang trí.
- [ ] Hiển thị present/absent/unmarked/excluded/makeupPending và finalizedEligibleCount/rate từ server. Null là chưa đủ dữ liệu, 0% có mẫu số là 0 thật; không dùng fallback `rate || 0`.
- [ ] Giải thích chuyên cần theo credit đã chốt; không đếm đôi replacement/placement hoặc coi pending/unmarked/excluded là absent. Không suy chuyên cần thành stored progress/hoàn thành/chứng chỉ.
- [ ] Total là tổng hàng theo query, không phải KPI. Không cộng một trang, lấy trung bình rate hoặc quét tất cả trang để tự dựng tổng hợp mới.
- [ ] Đổi range/lớp reset trang và che kết quả khác query; chặn response cũ ghi đè. Load more chỉ phần đang mở, chống trùng, giữ hàng cùng query, retry đúng trang lỗi.
- [ ] Đủ chưa tải/loading/empty/success/error/refresh-error/offline/denied. Skeleton theo nội dung, content/empty trước warning; offline không Retry và cache theo policy được chốt.
- [ ] Hiển thị asOf/timeZone; range theo ngày nghiệp vụ UTC+7. Không coi completed/cancelled là empty hoặc khóa lịch sử nếu server vẫn cho đọc.
- [ ] Mất quyền/phiên, logout hoặc đổi tài khoản che/xóa dữ liệu đúng boundary. Điều hướng/Back trực tiếp; vi/en, theme, chữ lớn, tên dài và accessibility theo design.
- [ ] Test fail theo test case design → model/fixture/UI mock pass; chưa nối API P7 trước duyệt UI cả hai slice.

## API sau duyệt UI toàn phase

- [ ] Nhập snapshot/contract/schema từ `GET /management/classes/:classId/attendance-summary`; không gọi API Mentor/Student để bù dữ liệu hoặc vượt quyền.
- [ ] Query page/pageSize và cặp from/to tùy chọn đúng DTO; page bắt đầu 1, pageSize 1–100. Bỏ cả hai mốc hoặc đủ ISO instant có timezone, from < to và tối đa 93 ngày.
- [ ] Giữ điều kiện giao khoảng server, không tự lọc/cộng history để tính credit. Nếu UI dùng ngày kết thúc bao gồm cả ngày thì đổi sang đầu ngày kế tiếp UTC+7 và kiểm lại giới hạn range.
- [ ] Validate classId, items theo enrollment, counts, rate number/null, finalizedEligibleCount, total/page/pageSize và asOf/timeZone. Không giả có global totals, readonly hoặc aggregationScope nếu DTO management không trả các trường đó.
- [ ] Dùng shared cookie HTTP/auth/error; query key có account/role/classId/range/page. Xử lý validation, 401/403/404, network/timeout và 5xx theo contract; giữ requestId, không fallback mock hoặc empty khi lỗi.
- [ ] Refresh sau P2 correction/recovery và P4/P5 thay đổi lịch/placement khi quay lại; không tự cộng/trừ count hoặc tải mọi lớp. Cache RAM/offline/no-store theo policy được chốt; logout/đổi account/mất quyền xử lý đúng boundary.
- [ ] Test primary/substitute không truy cập route Manager, Manager hợp lệ, inactive/mất phiên, classId lạ, lớp đóng, nhiều trang/range và response race. Dữ liệu từng enrollment phải cùng công thức backend dùng cho Mentor mà không tự giả so khớp các snapshot khác asOf.

## Kiểm chứng và hoàn thành

Dataset cần Manager và role không được phép, lớp nhiều trang, enrollment đăng ký lại, mẫu số 0, rate 0 thật/100/làm tròn, pending/excluded/unmarked và credit replacement/placement. Kiểm range trống, thiếu mốc, from=to/đảo, timezone, 93 ngày/vượt giới hạn và giao khoảng ở biên.

Maestro đi từ lớp Manager P1 → báo cáo → range → tải thêm/retry → Back; đổi lớp nhanh, refresh sau nguồn P2/P4/P5 thay đổi, offline/online, mất phiên/quyền và logout. Hồi quy entry/quyền P1 và nghiệp vụ P2/P4/P5 chịu tác động. Không tạo luồng progress/history chưa có nguồn; thiếu fixture ghi blocked/skipped.

Chỉ dùng command tổng `npm run test:e2e:phase-7` khi được tạo lúc triển khai; hiện chưa tồn tại. Theo kế hoạch tổng, chạy lint/typecheck/Jest, native build và Maestro toàn phase/hồi quy trên bản hiện tại; lưu ảnh native/log, backend/dataset, thiết bị/OS và kết quả từng flow. Chưa có test hoặc kết quả pass. Hoàn chỉnh slice cần đủ UI/API, kiểm chứng và nghiệm thu; duyệt kế hoạch không tăng tiến độ UI/API.
