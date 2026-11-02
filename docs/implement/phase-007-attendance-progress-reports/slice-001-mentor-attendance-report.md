# P7-S1 — Mentor đọc chuyên cần và stored progress

Ngày tách: **02/11/2026 (Asia/Bangkok)**, sau phản hồi “Duyệt” kế hoạch tổng phase 7. **Kế hoạch tổng đã duyệt; chưa có chỉ thị implement hoặc code UI/API.** Không sử dụng SpecKit.

## Phạm vi và đầu vào

BR-REPORT-01/02; UC-M-12. Phụ thuộc P1-S3/P2-S1 và P4 cho tình huống học bù. Đối chiếu [kế hoạch tổng](phase-007-attendance-progress-reports.md), [S2 Manager](slice-002-manager-attendance-report.md), [mapping API](../../api-contract/README.md#p7-s1) và [tiến độ](../../progress/phase/phase-007-attendance-progress-reports.md).

Mentor chính active vào báo cáo từ lớp, đọc chuyên cần theo enrollment, mở summary/history học viên và stored progress lớp/unit học viên. Mentor chỉ có scope SESSION không được đọc báo cáo CLASS. Không sửa điểm danh/progress, suy quy tắc hoàn thành, điểm quiz, chứng chỉ hoặc dashboard mới.

Design đích chưa có: `docs/design/attendance-progress-reports/mentor-attendance-report/design.md`. Layout, route cụ thể và testID chờ Claude. Q-P1-01 cho báo cáo/KPI, policy cache/offline và lựa chọn mặc định tiếp tục chờ chốt theo kế hoạch tổng; duyệt tổng không tự đóng các câu hỏi này.

## Checklist UI TDD sau khi đủ đầu vào và chỉ thị implement

- [ ] Giữ classId và role từ entry P1; chỉ mở cho Mentor chính có quyền CLASS. Deep link, đổi phân công, account inactive hoặc mất phiên phải che/chặn dữ liệu theo auth boundary.
- [ ] Đề xuất tab đầu là chuyên cần, không range, page 1/pageSize 20. Chỉ tải phần đang dùng; chưa mở progress/học viên thì chưa tải phần đó, không gọi detail từng hàng.
- [ ] Hiển thị present/absent/unmarked/excluded/makeupPending, finalizedEligibleCount và rate theo nguồn. Rate null khác 0 thật; physical attendanceStatus khác creditedAttendanceStatus, null không biến thành ABSENT.
- [ ] Hàng summary theo enrollmentId; học viên đăng ký lại có thể nhiều enrollment. Khi mở summary học viên ghi đúng scope STUDENT_CLASS_HISTORY, không diễn đạt là chỉ enrollment đang chọn.
- [ ] History giữ metadata root/credit/placement và trạng thái phù hợp design; key có enrollmentId/sessionId. Không đếm đôi replacement/placement hoặc tự tính summary từ history một trang.
- [ ] Đề xuất progress mặc định không unit filter. Summary chỉ có stored/untracked/invalid unit counts; không suy thành tỷ lệ hoàn thành. Unit dùng key enrollmentId/classUnitId, giữ decimal string/null và hai chiều trackingStatus/dataQuality.
- [ ] Phân biệt UNTRACKED, STORED có percent null, 0.00 hợp lệ và INVALID_PERCENT; không clamp sai số. CompletionPolicy UNDEFINED và assignmentSummary NOT_IMPLEMENTED không biến thành 0%, 0 bài hoặc đủ điều kiện chứng chỉ.
- [ ] Range attendance và unit filter progress độc lập; history/progress/class list có paging riêng. Đổi query reset trang liên quan; không join các page theo vị trí hàng, không dựng KPI từ total hoặc trung bình rate.
- [ ] Đủ chưa tải/loading/empty/success/error/refresh-error/offline/denied và lỗi từng phần học viên. Skeleton bám nội dung; content/empty trước warning; offline không Retry.
- [ ] Đổi lớp/student/filter/account ngăn response cũ ghi đè hoặc hiển thị sai nhãn. Load more chống trùng, giữ hàng cùng query và retry đúng trang lỗi; cache RAM/offline theo policy được chốt.
- [ ] Hiển thị asOf/timeZone theo từng nguồn, không giả các request riêng là cùng snapshot. Điều hướng/Back/tab trực tiếp; kiểm vi/en, theme, tên dài, chữ lớn, vùng chạm và accessibility theo design.
- [ ] Test fail theo test case design → model/fixture/UI mock pass; mock rõ ràng, chưa gọi API P7 trước duyệt UI toàn phase.

## API sau duyệt UI toàn phase

- [ ] Nhập snapshot/contract và schema cho `GET /mentor/classes/:classId/attendance-summary`, `GET /mentor/classes/:classId/students/:studentId/attendance-summary` và `GET /mentor/classes/:classId/students/:studentId/attendance` từ source được chỉ rõ trong kế hoạch tổng.
- [ ] Nhập schema/service cho `GET /mentor/classes/:classId/progress` và `GET /mentor/classes/:classId/students/:studentId/progress`; không dùng management/Student endpoint để vượt quyền primaryOnly.
- [ ] Attendance class/history nhận page/pageSize và cặp from/to; summary học viên chỉ range. Bỏ cả hai hoặc gửi đủ ISO instant có timezone, from < to, tối đa 93 ngày; kiểm giao khoảng ở biên, ngày kết thúc theo UTC+7.
- [ ] Progress summary chỉ nhận page/pageSize/unitId tùy chọn; progress học viên chỉ page/pageSize. Không áp range attendance lên stored progress; pageSize 1–100.
- [ ] Validate items/total/page/pageSize, nullable counts/rate theo DTO, readonly, asOf/timeZone và aggregationScope. Không tự sửa rate hoặc dựng công thức credit tại client; lỗi schema không fallback mock/empty thành công.
- [ ] Validate progress decimal string/null, trackingStatus, dataQuality, completionPolicy/policyVersion và assignmentSummary. Không gộp trạng thái thiếu record với trạng thái record có percent thiếu/sai.
- [ ] Query key chứa account/role, classId, resource, studentId/unitId, range và page. Dùng shared cookie HTTP/auth/error, giữ requestId; xử lý validation, 401/403/404, network/timeout và 5xx theo contract thật.
- [ ] Refresh/invalidate attendance sau P2 correction/recovery và P4/P5 replacement/placement khi quay lại; không cập nhật progress theo attendance hoặc optimistic count. Chỉ tải lại query đang dùng theo policy/focus.
- [ ] Test quyền primary/substitute/người ngoài, class/student mismatch, lớp đóng, stale response, cache/account boundary và no-store/policy. Không persist hoặc log PII/báo cáo khi chưa có policy cho phép.

## Kiểm chứng và hoàn thành

Dataset gồm nhiều trang, học viên nhiều enrollment, mẫu số 0, rate 0 thật/100/làm tròn, replacement chain, placement pending/completed/reassigned, physical khác credit, progress stored/untracked/invalid và lớp đóng. Kiểm thiếu một mốc range, timezone, 93 ngày/vượt giới hạn và range không ảnh hưởng progress.

Maestro đi từ lớp P1 → chuyên cần → học viên → progress → unit học viên → Back, đổi range/filter và tải thêm; kiểm denied cho Mentor dạy thay/deep link, logout/đổi tài khoản và nguồn thay đổi từ P2/P4/P5. Nội dung/luồng cụ thể theo design và dataset thật; nhánh thiếu fixture ghi blocked/skipped.

Chỉ dùng command tổng `npm run test:e2e:phase-7` khi được tạo lúc triển khai; hiện chưa tồn tại. Theo kế hoạch tổng, chạy lint/typecheck/Jest, native build và Maestro toàn phase/hồi quy trên bản hiện tại; lưu ảnh native/log, backend/dataset, thiết bị/OS và kết quả từng flow. Chưa có test hoặc kết quả pass. Hoàn chỉnh slice cần đủ UI/API, kiểm chứng và nghiệm thu; duyệt kế hoạch không tăng tiến độ UI/API.
