# Phase 1 — Kế hoạch hoàn thiện UI Home sau đăng nhập

Ngày lập: 31/10/2026 (Asia/Bangkok). Người lập: Codex.

**Cập nhật 31/10/2026:** Người dùng “Triển khai Home UI trong phase 1” mở cổng triển khai Home theo design Claude hiện hành mục 3/6 và H-A–H-I. Đã chuyển sang HomeTile/lưới 4 cột, nhóm theo role và linh vật; kết quả kiểm chứng hiện hành xem `ui-verification.md`. UI/API vẫn chờ cổng riêng.

**Lịch sử lập kế hoạch: kế hoạch bổ sung theo yêu cầu “Bây giờ trong phase 1 lập thêm implement về hoàn thiện UI home sau khi login vào”. Chưa triển khai phần hoàn thiện Home trong lượt này.** Kế hoạch cần được người dùng đọc và yêu cầu triển khai theo [ADR-016](../../adr/ADR-016-plan-before-implementation.md). Việc bổ sung kế hoạch không phải approve UI P1 hoặc cho phép tích hợp API.

## 1. Mục tiêu và vị trí trong phase

Hoàn thiện màn đầu tiên sau khi đăng nhập/khôi phục phiên thành công: người dùng nhận biết tài khoản, vai trò và mở được luồng công việc đúng quyền; hình thức nhất quán với Hồ sơ, Cài đặt và 7 màn Teaching Workspace.

Home là phần khung workspace của P1, theo [design cấp phase mục 3–4](../../design/teaching-workspace/design.md), bổ sung vào UI-01/UI-06/UI-07 của [kế hoạch tổng](phase-001-teaching-workspace.md). Không tạo slice S8; mẫu số P1 giữ 7. Nếu design sau này thay ranh giới hoặc nghiệp vụ đã duyệt thì xử lý qua ADR trước phần phụ thuộc.

Phụ thuộc: auth/bootstrap P0; design Home do Claude sở hữu; route S1/S2/S6 và primitives/theme/i18n đã có. Phần Home hoàn thiện phải được đưa vào lượt review UI toàn phase trước API.

## 2. Hiện trạng đã đối chiếu

| Thành phần | Hiện có | Nội dung cần hoàn thiện/kiểm chứng |
| --- | --- | --- |
| `src/modules/auth/screens/WorkspaceScreen.tsx` | Header gradient, avatar, tên, vai trò/email, nút Settings; thẻ tiện ích theo role | Đối chiếu bố cục, khoảng cách, typography, xuống dòng và vùng chạm theo design Home |
| Nội dung Home trong development | Mentor có Lịch dạy/Lớp của tôi; Manager có Lớp học | Rà card padding 6 và overlap −50 theo design; hiện `Card` còn dùng spacing mặc định P0 |
| Nhánh ngoài chế độ mock | Vẫn hiện placeholder workspace P0 khi `teachingMockEnabled` false | Ghi rõ hai chế độ review và bản tích hợp; chỉ thay nhánh release khi các đích P1 đã nối API, không mở route mock trong production |
| Điều hướng | Home → S1/S2/S6, avatar → Profile, bánh răng → Settings | Kiểm tra sau login và restore; back từ màn con, hết phiên, logout/đổi tài khoản; role lấy từ phiên hiện hành |
| Kiểm chứng trước đó | P1 có Jest và smoke 7 màn; Home được đi qua như cửa vào | Cần checklist/ảnh và assertion riêng cho Home của cả hai role, theme, ngôn ngữ và font scale |

`docs/design/Thiết kế Home UI.html` là prototype tham khảo đã được Claude phân tích trong design cấp phase, không thay thế design có trạng thái/test case. Không sao các phần prototype chưa nằm trong phạm vi P1 sang sản phẩm.

## 3. Phạm vi UI cần đạt

### Header tài khoản

- Hiển thị tên, avatar chữ cái, vai trò và email từ phiên đã xác minh; avatar mở Hồ sơ, nút bánh răng mở Cài đặt.
- Giữ các testID `workspace-mentor-root`, `workspace-manager-root`, `workspace-account-button`, `workspace-settings-button` để hồi quy P0.
- Xử lý tên/email dài, màn hẹp, safe area, cỡ chữ lớn; vùng bấm và accessibility label đúng design. Tên/role không bị che bởi avatar hoặc nút Settings.
- Theme system/light/dark và vi/en đổi từ Settings rồi quay lại phải áp dụng ngay; chuyển động tuân thủ reduced motion.

### Nội dung công việc theo role

| Vai trò | Tiện ích | Đích | testID |
| --- | --- | --- | --- |
| MENTOR | Lịch dạy — Xem buổi dạy theo tuần | TeachingSchedule / S1 | `workspace-open-schedule` |
| MENTOR | Lớp của tôi — Lớp được giao cho bạn | MentorClasses / S2 | `workspace-open-classes` |
| MANAGER | Lớp học — Theo dõi lớp và lịch học | ManagerClasses / S6 | `workspace-open-manager-classes` |

Hoàn thiện GlassCard/ListRow, icon, khoảng cách, trạng thái pressed và việc đọc bằng screen reader theo design. Trang chủ dùng được khi offline sau khi đã vào workspace bằng phiên hợp lệ; màn đích tự hiển thị trạng thái tải/lỗi của mình. Home không tự tải danh sách lớp hoặc tạo KPI từ fixture.

Phần dashboard mở rộng (số liệu tổng hợp, thẻ ưu tiên, tiện ích yêu thích/tất cả tiện ích, chuông thông báo) hiện chưa nằm trong design Home P1. Nếu yêu cầu hoàn thiện bao gồm những phần này, cần Claude bổ sung design/test case và chốt phạm vi/nguồn dữ liệu trước phần triển khai tương ứng; không xem lượt lập kế hoạch này là quyết định mở rộng đã được duyệt.

### Vòng đời và trạng thái

| Tình huống | Kỳ vọng |
| --- | --- |
| Login thành công / restore phiên hợp lệ | Mở Home đúng role, thông tin tài khoản và các tiện ích tương ứng |
| Bootstrap còn đang xác minh, hết phiên hoặc role không được phép | Giữ luồng Bootstrap/Login/Denied P0; không dựng Home từ role cache |
| Mentor chưa có lớp hoặc Manager chưa có dữ liệu lớp | Home vẫn có tiện ích; empty state thuộc màn đích |
| Offline sau khi đã vào Home | Avatar/Settings và điều hướng vẫn thao tác được; Home không cần request riêng |
| Đổi ngôn ngữ/theme, quay lại từ màn con | Home cập nhật đúng nội dung/giao diện, không tạo workspace trùng |
| Logout hoặc chuyển tài khoản | Thông tin tài khoản/cây UI cũ bị loại bỏ, không back vào Home phiên trước |
| Loading/error/conflict dữ liệu Home | Không có request/mutation riêng theo design hiện tại; trạng thái xác thực thuộc P0, trạng thái danh sách thuộc S1/S2/S6 |

## 4. Task triển khai dự kiến

Các task dưới đây chưa thực hiện trong lượt lập kế hoạch này.

| Task | Công việc | Phụ thuộc | Đầu ra/điều kiện hoàn thành |
| --- | --- | --- | --- |
| HOME-00 | Rà design mục 3, prototype tham khảo, source Home và hồi quy P0/P1; lập danh sách lệch UI | Kế hoạch được đọc và có chỉ thị triển khai | Mapping yêu cầu → source → kiểm chứng; điểm cần Claude bổ sung được ghi rõ |
| HOME-01 | Đối chiếu/nhận design Home hoàn thiện và test case từ Claude khi có phần thiếu | HOME-00 | Đủ bố cục, vi/en, theme, accessibility, trạng thái; Codex không tự sửa design |
| HOME-02 | Bổ sung test hành vi Home trước thay đổi code | HOME-01 hoặc design hiện hữu đủ cho phần thực hiện | Test fail đúng hành vi cần sửa; giữ test P0 và các luồng P1 |
| HOME-03 | Hoàn thiện header, GlassCard/ListRow và bố cục theo role bằng primitives hiện có | HOME-02 | Mock UI pass, giữ testID, không thêm dependency khi chưa có căn cứ |
| HOME-04 | Rà login/restore/back/Profile/Settings/logout, vi/en/theme, reduced motion và dữ liệu tài khoản | HOME-03 | Điều hướng/phiên đúng; không mở route role khác hoặc rò dữ liệu phiên cũ |
| HOME-05 | Cleanup, lint/format/typecheck/Jest và build Android | HOME-04 | Kết quả thực được lưu; không dùng kết quả lần trước để ghi pass cho thay đổi mới |
| HOME-06 | Bổ sung/chạy Maestro Home và hồi quy bị ảnh hưởng; chụp/rà ảnh native | HOME-05 | Bằng chứng hai role, chế độ hiển thị, lỗi/phiên liên quan; báo rõ giới hạn iOS |
| HOME-REVIEW | Cập nhật ui-review/ui-verification/progress, đưa Home vào review UI toàn phase | HOME-06 | Người dùng có bản cụ thể để duyệt; chưa tự approve UI/API/nghiệm thu |

Có thể tách component Home riêng nếu việc sửa làm `WorkspaceScreen` khó đọc; giữ public boundary module, route Native Stack lazy và cấu trúc kiến trúc hiện có. Quyết định tách file dựa trên code khi triển khai, không bắt buộc tạo component chỉ để đủ task.

## 5. Kế hoạch kiểm chứng

Bảng này là checklist dự kiến, không phải test case mới do Claude viết hoặc kết quả pass.

| Nhóm | Nội dung cần chứng minh | Hình thức dự kiến |
| --- | --- | --- |
| Role/điểm vào | Mentor chỉ có hai tiện ích Mentor; Manager chỉ có Lớp học; login và restore mở đúng Home | Jest/RNTL + Maestro |
| Điều hướng | Đúng đích S1/S2/S6; avatar/Profile, Settings, back; không nhân màn Home | Jest/RNTL + native |
| Phiên/quyền | Bootstrap chưa xác minh, Denied, hết phiên, logout, account A → B không lộ tên/role/cây màn trước | Hồi quy auth + Maestro theo điều kiện tái hiện |
| Trạng thái dữ liệu | Home không gọi API danh sách/KPI; offline không khóa tiện ích; empty/lỗi xử lý ở màn đích | Jest/RNTL + native |
| Giao diện | vi/en × light/dark; system theme; tên/email dài; màn hẹp và font scale 1.3 | Jest có style thật + ảnh Android |
| Accessibility/motion | Vùng chạm, nhãn đọc, thứ tự focus; reduced motion | Kiểm native, ghi bằng chứng; không suy từ screenshot |
| Chế độ build | Development nhận diện mock; production không có P1 mock và không gãy route | Kiểm cấu hình/route + build phù hợp |

Sau code, chạy `npm run check` và build native phù hợp. Mở rộng flow `.maestro/phase-001-teaching-workspace/ui-mock/phase-1-ui.yaml`/lệnh `npm run test:e2e:phase-1:ui` cho review UI. Đối chiếu bộ P0 khi Home ảnh hưởng login/Settings/logout. Sau approve UI và tích hợp API, cập nhật bộ E2E tích hợp P1 theo ADR-020; smoke mock không thay bộ nghiệm thu đó.

Ảnh dự kiến cần có: Home Mentor/Manager sáng tiếng Việt, tối tiếng Anh, tên/email dài và font scale; ảnh thực chỉ được liên kết sau khi chụp. Bằng chứng cập nhật tại [ui-verification.md](ui-verification.md), [ui-review.md](ui-review.md), [e2e-ui.md](e2e-ui.md) và [progress P1](../../progress/phase/phase-001-teaching-workspace.md).

## 6. Cổng và điều kiện hoàn thành

1. Người dùng đọc kế hoạch bổ sung, yêu cầu triển khai; phần nào cần thay design phải có đầu vào Claude trước code phần đó.
2. Hoàn thiện UI mock Home, kiểm chứng và trình cùng UI P1. Không coi yêu cầu lập kế hoạch là approve 7 màn hiện tại.
3. Chỉ sau approve UI toàn phase mới nối API P1 và chuyển Home sang các đích thật trong build tích hợp. Home theo baseline không có contract/endpoint riêng.
4. Build/lint/test/native pass là bằng chứng kỹ thuật; chỉ người dùng approve UI và nghiệm thu phase. Mẫu số slice vẫn 7, API vẫn 0/7 trong lượt tài liệu này.


## 7. Thực hiện theo chỉ thị 31/10/2026

HOME-00/01: design Claude hiện hành đã đủ nhóm, HomeTile, linh vật, trạng thái và H-A–H-I; dùng design đó thay checklist ListRow/padding 6 của bản kế hoạch cũ. Không sửa design hoặc mở rộng dashboard.

HOME-02/03/04: test mới ban đầu fail 5 case do thiếu tiêu đề nhóm/linh vật; triển khai `HomeTile`, nhãn nhóm vi/en, ảnh mascot nguyên bản trong asset runtime, header co giãn theo tên dài. Tile 4 cột, icon 56/26, nhãn tự xuống dòng, pressed scale .94/opacity .8 theo reduced motion. Giữ route/testID, guard build và fallback P0; Home không thêm request hoặc KPI. Test gồm restore theo role, Settings quay về Home, tên/email dài, nhãn/a11y và reduced motion; hồi quy phiên/logout dùng bộ P0.

HOME-05/06/REVIEW: xem phần Home trong `ui-verification.md`, `ui-review.md`, `e2e-ui.md` cho kết quả thực và giới hạn. Chưa approve UI toàn phase, chưa tích hợp API, chưa nghiệm thu.
