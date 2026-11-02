# P3 — Mentor tải tài liệu → Manager duyệt/công bố

**Hiện hành 02/11/2026:** đã nhận chỉ thị triển khai trực tiếp UI/API P3, bỏ bước chờ duyệt UI theo [ADR-029](../../adr/ADR-029-phase-3-direct-api-implementation.md). Đã có mã 6 UI và service/API integration; API thật ARTICLE và PDF upload/READY/access đã kiểm. Chưa nghiệm thu; E2E đã dừng theo yêu cầu “Không cần test e2e, tôi sẽ yêu cầu sau”. Các dòng chờ design/UI trong bản ghi ban đầu bên dưới là lịch sử.

Ngày khởi tạo: 30/10/2026. Người ghi: Codex.
**02/11/2026 — mã UI/API đã triển khai 6/6; slice nghiệm thu 0/6, chưa Done.**
[Phạm vi/kế hoạch](../../implementation-plan.md#p3-material-review). Ưu tiên P0.
Đã có chỉ thị implement “Triển khai phase 3” sau kế hoạch tổng; đã tách 6 slice. Q-MAT-01 đã chốt: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối; approve đồng thời công bố. Đã có design Claude và policy RAM theo design. Cổng UI accept được bỏ theo chỉ thị ADR-029; còn kiểm chứng native/platform và người dùng nghiệm thu. E2E dừng theo yêu cầu mới nhất.
ADR liên quan: ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 — đều Accepted ngày 30/10/2026; các câu hỏi còn mở và cổng duyệt riêng giữ nguyên.
Đã có design và tích hợp API; không ghi UI đã được duyệt, chưa nghiệm thu.

## Hồ sơ triển khai

Đã tạo [hồ sơ phase 3](../../implement/phase-003-material-review/README.md) và [kế hoạch tổng](../../implement/phase-003-material-review/phase-003-material-review.md). Đã tách 6 tài liệu slice và triển khai UI/API theo ADR-029; bằng chứng và giới hạn tại hồ sơ API. Tiến độ và nhật ký phase tiếp tục cập nhật trong file này.

## Các mốc

| Mốc                        | Trạng thái                 | Ngày thực hiện | Ai làm/duyệt       | Test / lint / typecheck                        | Commit/PR | Ghi chú / BR-ADR                            |
| -------------------------- | -------------------------- | -------------- | ------------------ | ---------------------------------------------- | --------- | ------------------------------------------- |
| Kế hoạch tổng              | Đã nhận chỉ thị triển khai | 02/11/2026     | Codex / Người dùng | Kiểm tài liệu; không chạy test app             | —         | ADR-016/017; đã tách 6 slice; UI chờ design |
| Design toàn phase (Claude) | Có design                  | 02/11/2026     | Claude             | Có design chung và 6 slice/TC                  | —         | Giữ nguồn, scope chat ưu tiên theo ADR-029  |
| UI toàn phase              | Mã đã viết 6/6             | 02/11/2026     | Codex              | Có UI/schema/model/query tests; native còn chờ | —         | Không gán mọi TC pass                       |
| Người dùng duyệt UI        | Bỏ chờ theo chỉ thị        | 02/11/2026     | Người dùng         | Không ghi UI approved                          | —         | ADR-029                                     |
| API toàn phase             | Đã nối 6/6                 | 02/11/2026     | Codex              | API thật ARTICLE/PDF và HTTP simulation pass   | —         | Nhánh native storage còn chờ                |
| Cleanup + lint + test      | Todo                       | —              | Codex              | Chưa chạy                                      | —         | ESLint 0 error/0 warning, tsc, Jest         |
| E2E Maestro toàn phase     | Dừng theo yêu cầu          | 02/11/2026     | Người dùng         | Lượt thử chưa pass; không chạy tiếp            | —         | Sẽ thực hiện khi người dùng yêu cầu         |
| Nghiệm thu phase           | Todo                       | —              | Người dùng         | Chưa kiểm thử thiết bị/nghiệm thu              | —         | Chưa được đánh dấu Done                     |

## Slice

| Slice                          | UI         | API    | Design    | UI được duyệt       | Ghi chú                                             |
| ------------------------------ | ---------- | ------ | --------- | ------------------- | --------------------------------------------------- |
| P3-S1 — mentor-materials       | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |
| P3-S2 — material-editor        | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |
| P3-S3 — mentor-material-detail | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |
| P3-S4 — material-review-queue  | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |
| P3-S5 — material-review-detail | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |
| P3-S6 — material-preview       | Mã đã viết | Đã nối | Có design | Bỏ chờ theo chỉ thị | Bằng chứng/giới hạn theo hồ sơ API; chưa nghiệm thu |

## Nhật ký thực tế

**02/11/2026 — triển khai:** Người dùng yêu cầu “Triển khai phase 3” sau khi nhận kế hoạch tổng; ghi nhận cho phép triển khai và tách 6 kế hoạch slice. Người dùng chốt Q-MAT-01: Mentor FILE/VIDEO/ARTICLE, Manager duyệt/từ chối. Kiểm tra repo chưa có design P3/test case ở bất kỳ thư mục material nào; dừng UI phụ thuộc theo ADR-009, không tự thiết kế thay Claude. Chưa sửa runtime, tạo contract/API, chạy mutation hoặc test app. UI/API giữ 0/6.

**02/11/2026 — Codex:** Theo yêu cầu “Lập implement phase 3”, đã lập kế hoạch tổng và README phase; khảo sát source controller/DTO material/file của backend cạnh repo ở chế độ chỉ đọc. Kế hoạch giữ 6 slice, nêu Q-MAT-01/design/policy còn chờ, thứ tự UI → duyệt UI → API, upload/preview có revision, lazy loading và runner E2E duy nhất dự kiến `npm run test:e2e:phase-3`. Chưa tạo design/contract, chưa tách slice, chưa sửa runtime/backend hoặc chạy mutation/test ứng dụng; không tăng tiến độ UI/API, không ghi nhận duyệt hoặc nghiệm thu.

| Ngày       | Người              | Sự kiện                              | Bằng chứng / giới hạn                                                                                                                | BR/ADR thay đổi                                        |
| ---------- | ------------------ | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 30/10/2026 | Codex              | Khởi tạo kế hoạch và khung tiến độ   | Chỉ tài liệu nháp; chưa thực hiện các mốc; không có commit/PR vì workspace chưa có .git                                              | Khởi tạo, chưa có thay đổi luật đã duyệt               |
| 30/10/2026 | Người dùng / Codex | Duyệt ADR liên quan                  | Phản hồi: “Chốt tất cả adr 1->9”; câu hỏi còn mở và cổng design/UI/nghiệm thu giữ nguyên; không tăng tiến độ triển khai              | ADR-003, ADR-004, ADR-005, ADR-007, ADR-009 → Accepted |
| 30/10/2026 | Codex              | Thực hiện ADR-011                    | Chuyển file vào docs/progress/phase/; cập nhật liên kết; giữ nguyên nội dung nghiệp vụ, trạng thái và tiến độ UI/API                 | ADR-011 Accepted                                       |
| 30/10/2026 | Codex              | Đánh số tên file phase theo kế hoạch | Theo yêu cầu người dùng: phase-NNN-slug.md, P0 → 001 đến P8 → 009; cập nhật liên kết, giữ nguyên tiến độ                             | ADR-011 bổ sung quy ước tên                            |
| 30/10/2026 | Người dùng / Codex | Bổ sung cổng E2E Maestro             | Người dùng yêu cầu E2E sau mỗi phase trước nghiệm thu và chọn Maestro; mốc E2E Todo, chưa có kết quả chạy; giữ nguyên tiến độ UI/API | ADR-009 bổ sung đã duyệt                               |

## Ghi nhận khi thực hiện

Mỗi mốc cập nhật ngày, người làm/duyệt, command và kết quả test/lint/typecheck, môi trường thiết bị, commit/PR thật nếu có, điểm chờ và BR/ADR bị ảnh hưởng. Khi luật đã duyệt thay đổi, phải có ADR Accepted và ghi cả [changelog](../business-rules-changelog.md) trước code. Không chuyển Done chỉ vì đã viết mock UI hoặc có source backend.

## Triển khai trực tiếp và kiểm chứng — 02/11/2026

Đã có design Claude đủ phase và 6 slice. Theo chỉ thị bỏ chờ UI accept, đã triển khai module materials, 6 màn, role routes, entry points và API thật; scope Mentor FILE/VIDEO/ARTICLE, Manager approve/reject theo chat. Không ghi giả UI approved. [Contract](../../api-contract/phase-003-material-review/README.md), [hồ sơ API/giới hạn](../../implement/phase-003-material-review/api-integration.md), [kiểm chứng P3/P4/P5 và lỗi CASH](../../implement/phases-003-005-verification.md). Người dùng dừng E2E, sẽ yêu cầu sau; chưa nghiệm thu, không Done.
