# P3-S4 — Hàng chờ duyệt của Manager

**02/11/2026 — đã có design và mã UI/API theo chỉ thị triển khai trực tiếp (ADR-029).** [Hồ sơ kiểm chứng/giới hạn](api-integration.md). Checklist bên dưới là ma trận tiêu chí, không quy đổi tất cả nhánh thành pass. E2E dừng theo yêu cầu người dùng; chưa nghiệm thu.

Ngày tách: **02/11/2026 (Asia/Bangkok)**. Người dùng yêu cầu “Triển khai phase 3” sau khi nhận kế hoạch tổng; đã có chỉ thị triển khai. **Chờ design Claude và test case trước UI TDD** theo ADR-009; UI/API chưa bắt đầu.

## 1. Phạm vi và đầu vào

- BR-MAT-03; UC-MG-04. Phụ thuộc: P0-S1.
- [Kế hoạch tổng](phase-003-material-review.md), [tiến độ P3](../../progress/phase/phase-003-material-review.md).
- Design dự kiến: `docs/design/material-review/material-review-queue/design.md`; hiện chưa tồn tại. Chưa có mã TC nguồn để mapping; không tự viết design hoặc bịa TC.
- Q-MAT-01 đã chốt ngày 02/11/2026: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối; approve đồng thời công bố. Policy dữ liệu/offline còn chờ; chốt phần ảnh hưởng trước code.

## 2. Task UI mock

- [ ] Nhận design chung và đủ 6 slice/TC; mapping TC thật → test fail trước implementation.
- [ ] Đề xuất mặc định PENDING_REVIEW; chỉ tải trạng thái/filter đang dùng sau khi design chốt.
- [ ] Filter theo DTO thật, phân trang và total từ server; không suy tổng toàn queue từ một trang.
- [ ] Giữ rows đúng query khi refresh/load more lỗi; thay filter/account không hiển thị response cũ.
- [ ] Mở detail đúng material; sau quyết định cập nhật queue liên quan; không tự thêm Manager authoring.
- [ ] Loading/empty/error/offline/no-permission/success theo design; vi/en, light/dark, accessibility, keyboard và spacing/token.
- [ ] Back/tab trực tiếp theo ADR-025; dữ liệu/account isolation; kiểm entry point và hồi quy liên quan.
- [ ] UI tests pass, cleanup/lint/typecheck/Jest và native evidence phù hợp; bàn giao cùng 6 slice để người dùng approve UI toàn phase.

## 3. API sau duyệt UI toàn phase

- [ ] Nhập legacy nguyên bản và lập contract riêng; đối chiếu route/DTO/guard/errors theo mục 7 kế hoạch tổng.
- [ ] Schema/service/query/mutation tests fail → pass, scope và account isolation; không fallback mock.
- [ ] Tích hợp theo mục 8 kế hoạch tổng; kiểm revision, quyền, invalidation và lỗi mạng đúng phần liên quan.

Chưa tạo contract/service/hook thật hoặc gửi request nghiệp vụ. Contract dự kiến thuộc `docs/api-contract/phase-003-material-review/`.

## 4. Kiểm chứng và hoàn thành

- [ ] Mapping toàn bộ TC design thật tới UI/API/native evidence, ghi rõ blocked/skipped/failed.
- [ ] Chạy case liên quan ở ma trận mục 9 kế hoạch tổng và hồi quy entry point.
- [ ] E2E tích hợp qua command duy nhất dự kiến `npm run test:e2e:phase-3`, hiện chưa có runner.
- [ ] Ghi command/môi trường/source/dataset/kết quả thật vào hồ sơ; không lấy test cũ hoặc build thay Maestro.

Slice chưa hoàn tất; người dùng nghiệm thu phase sau khi toàn bộ cổng kiểm chứng đạt.
