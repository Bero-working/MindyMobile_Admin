# Sổ quyết định kiến trúc

Ngày khởi tạo: 30/10/2026. **0 ADR Proposed, 22 Accepted (gồm ADR-019 Accepted for implementation).** Ngày 30/10/2026 (Asia/Bangkok), người dùng xác nhận: “Chốt tất cả adr 1->9”. ADR-001–ADR-009 được chấp nhận; các câu hỏi còn mở và cổng duyệt riêng vẫn giữ nguyên. ADR-010 và ADR-011 được người dùng duyệt ngày 30/10/2026 qua phản hồi “Duyệt adr 10 và 11, sau đó hoàn thành adr 11 đi”. ADR-011 đã thực hiện. ADR-010 đã thực hiện ngày 30/10/2026: tạo `docs/design/global.css` từ 3 mẫu; 7 xung đột token chờ người phụ trách design quyết định.

| ADR                                                    | Nội dung                                             | Trạng thái |
| ------------------------------------------------------ | ---------------------------------------------------- | ---------- |
| [ADR-001](ADR-001-boilerplate-feature-modules.md)      | Giữ nền boilerplate và tổ chức feature module        | Accepted   |
| [ADR-002](ADR-002-strict-types-no-any-unknown.md)      | TypeScript strict và cấm kiểu any/unknown tường minh | Accepted   |
| [ADR-003](ADR-003-reusables-nativewind-theme.md)       | React Native Reusables, NativeWind và theme          | Accepted   |
| [ADR-004](ADR-004-query-mmkv-zod.md)                   | TanStack Query, MMKV, Zod và ranh giới dữ liệu       | Accepted   |
| [ADR-005](ADR-005-role-navigation-and-scope.md)        | Navigation một role và scope theo backend            | Accepted   |
| [ADR-006](ADR-006-attendance-offline-queue.md)         | Draft và queue điểm danh offline                     | Accepted   |
| [ADR-007](ADR-007-error-contract.md)                   | Chuẩn hóa lỗi theo contract thực                     | Accepted   |
| [ADR-008](ADR-008-money-time-domain-representation.md) | Biểu diễn tiền, điểm và thời gian                    | Accepted   |
| [ADR-009](ADR-009-phase-tdd-and-ownership.md)          | TDD theo phase, phân vai và các cổng duyệt           | Accepted   |
| [ADR-010](ADR-010-global-design-tokens-css.md)        | Tập trung token và CSS mẫu trong design/global.css   | Accepted — đường dẫn/định dạng bị thay thế bởi ADR-014 |
| [ADR-011](ADR-011-phase-progress-folder.md)           | Gom tài liệu phase vào docs/progress/phase           | Accepted   |
| [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md) | Bất biến ADR đã duyệt và ưu tiên ADR mới hơn | Accepted — hiệu lực toàn bộ |
| [ADR-013](ADR-013-reanimated-gesture-handler-native-stack.md) | Reanimated, Gesture Handler và Native Stack | Accepted — hiệu lực toàn bộ |
| [ADR-014](ADR-014-design-css-markdown-and-runtime-location.md) | Tài liệu CSS Markdown và stylesheet trong src | Accepted — hiệu lực toàn bộ |
| [ADR-015](ADR-015-zero-based-phase-numbering.md) | Đánh số phase từ 0 | Accepted |
| [ADR-016](ADR-016-plan-before-implementation.md) | Kế hoạch trước implement, UI trước API | Accepted |
| [ADR-017](ADR-017-phase-plan-name-and-slice-breakdown.md) | Tên kế hoạch và tách slice | Accepted |
| [ADR-018](ADR-018-secure-storage-network-and-lazy-loading.md) | Secure storage, network security và lazy loading | Accepted |
| [ADR-019](ADR-019-phase-0-cookie-auth.md) | API auth cookie phase 0 | Accepted for implementation |
| [ADR-020](ADR-020-e2e-suite-per-phase.md) | Bộ E2E tương ứng sau mỗi phase | Accepted — hiệu lực toàn bộ |
| [ADR-021](ADR-021-entry-side-navigation.md) | Hướng mở UI cho avatar, Back và điều hướng tiến | Accepted — hiệu lực toàn bộ |
| [ADR-022](ADR-022-frosted-glass-blur.md) | Kính mờ thật bằng thư viện blur native | Accepted — hiệu lực toàn bộ |

## Vòng đời

Theo ADR-012 Accepted: Proposed → Accepted/Rejected theo phản hồi rõ ràng của người dùng. Ghi nguồn/ngày duyệt khi chuyển Accepted rồi đóng băng file. Quan hệ Superseded/thay thế một phần chỉ cập nhật trong sổ ADR sau khi ADR thay thế đã Accepted; không sửa file ADR cũ. ADR Accepted mới hơn được ưu tiên trong phạm vi xung đột. Không coi một câu trả lời nghiệp vụ là chấp nhận tất cả ADR.

Mẫu mỗi ADR: Context / Decision / Alternatives / Consequences / Status / Ngày / BR-slice bị ảnh hưởng. Mọi thay đổi nghiệp vụ/kiến trúc hoặc lệch design phải có ADR Proposed và dừng phần phụ thuộc cho đến Accepted; sau đó cập nhật tài liệu, changelog và phase trước code.

## Auth cookie chưa tạo ADR

Theo giới hạn lần khởi tạo và yêu cầu đọc legacy trước khi quyết định, **chưa tạo ADR Auth**, chưa cấp mã giả hoặc liên kết tới file chưa tồn tại. [Kiến trúc](../architecture.md#auth-cookie-bằng-chứng-và-phần-chưa-quyết-định) chỉ ghi bằng chứng source và vấn đề cần xác minh.

Sau khi nhập legacy nguyên bản, ADR Auth phải bao gồm access/refresh cookie và path/header thực, Origin/CSRF có căn cứ, native jar, refresh/hết hạn, withCredentials, logout/clear cookie, secure storage có/không và thử thiết bị. Q-ENV-01 chưa giải quyết nên không coi đọc controller là đã kiểm chứng native.

## Phạm vi duyệt

Chưa cần duyệt triển khai khi câu hỏi phụ thuộc chưa rõ. Người dùng có thể duyệt/reject từng ADR hoặc yêu cầu sửa; Codex phải cập nhật trạng thái có căn cứ và ghi lịch sử trước dùng. Danh sách câu hỏi domain ở [business-rules](../business-rules.md#khoảng-thiếu-mâu-thuẫn-và-câu-hỏi-mở).

## Bổ sung ADR-009 — 30/10/2026

Người dùng trực tiếp yêu cầu E2E sau mỗi phase trước nghiệm thu và chỉ định Maestro. Đã bổ sung quyết định Accepted vào ADR-009 và đồng bộ kế hoạch, mốc E2E của 9 phase, changelog cùng [quy ước thực hiện](../implement/e2e-maestro.md). Không tạo thêm ADR hoặc tự chuyển phase Done.

## Quy tắc ADR bất biến — 30/10/2026

Theo chỉ thị trực tiếp của người dùng, từ yêu cầu này không sửa file ADR đã được approve; mọi thay đổi tiếp theo ghi bằng ADR mới. Đã tạo [ADR-012](ADR-012-immutable-approved-adrs-and-precedence.md) ở trạng thái Proposed để mô tả quy tắc, hiệu lực và chuyển tiếp. ADR mới chỉ được ưu tiên khi đã Accepted và trong cùng phạm vi xung đột; bản cũ giữ nguyên, quan hệ thay thế tra tại sổ ADR. Các đoạn vòng đời phía trên mô tả quy trình trước yêu cầu này; việc cập nhật hiệu lực về sau thực hiện tại sổ ADR, không sửa trạng thái trong file Accepted. Chưa chỉnh lại ADR-001–ADR-011 hoặc thay đổi quyết định nghiệp vụ.

## Duyệt ADR-012 — 30/10/2026

Người dùng xác nhận “Duyệt adr 12”: ADR-012 chuyển Proposed → Accepted. Đã ghi nguồn/ngày duyệt và đóng băng file. Các ghi nhận Proposed phía trên là lịch sử trước duyệt. ADR-012 ưu tiên hơn các quy tắc cũ trong ADR-001–ADR-011 về việc sửa file Accepted hoặc ghi trạng thái thay thế vào file cũ; chỉ phần quản lý vòng đời ADR bị thay thế, các quyết định còn lại giữ nguyên. Trạng thái hiệu lực và quan hệ thay thế được theo dõi tại sổ này; không sửa hồi tố ADR-001–ADR-011. Không thay đổi tiến độ hoặc cổng nghiệm thu phase.

## Đề xuất ADR-013 — 30/10/2026

Theo yêu cầu người dùng, tạo [ADR-013](ADR-013-reanimated-gesture-handler-native-stack.md) Proposed để thống nhất Reanimated cho animation UI, Gesture Handler cho gesture tùy chỉnh và Native Stack cho điều hướng stack. Bổ sung ADR-001/003/005/010 trong phạm vi công cụ triển khai; chưa thay đổi hiệu lực ADR Accepted, chưa migrate code/dependencies. Các file ADR-001–ADR-012 giữ nguyên theo ADR-012.

## Duyệt ADR-013 — 30/10/2026

Nguồn: người dùng “Duyệt 13”. ADR-013 Proposed → Accepted; đã ghi nguồn/ngày duyệt và đóng băng file theo ADR-012. Quyết định dùng Reanimated cho animation UI, Gesture Handler cho gesture tùy chỉnh, Native Stack cho stack navigation có hiệu lực. Bổ sung ADR-001/003/005/010 trong phạm vi công cụ triển khai; ADR-013 được ưu tiên nếu xung đột trong phạm vi này, các quyết định design/role/scope còn lại giữ nguyên. Không sửa các file ADR cũ. Các mục Proposed phía trên là lịch sử trước duyệt. Migration code/dependencies chưa thực hiện; việc duyệt không tự tăng tiến độ UI/API hoặc thay thế nghiệm thu.

## ADR-014 — 30/10/2026

Theo chỉ thị triển khai trực tiếp của người dùng, ADR-014 Accepted và được đóng băng: nguồn design hiện tại là [global.css.md](../design/global.css.md), runtime NativeWind là `src/global.css`. Thay phần đường dẫn/định dạng và lựa chọn không dùng Markdown của ADR-010; các quy tắc token/design còn lại giữ nguyên. ADR-003 được bổ sung vị trí runtime. Không chỉnh file ADR-010 hoặc ADR Accepted khác. Các đường dẫn `docs/design/global.css` trong ADR cũ là lịch sử; dùng mapping này để tra nguồn hiện tại.

## Xác nhận duyệt ADR-014 — 30/10/2026

Sau khi nhận báo cáo chuyển tài liệu design thành `docs/design/global.css.md` và stylesheet runtime vào `src/global.css`, người dùng xác nhận “duyệt”. Ghi nhận duyệt ADR-014 và thay đổi đã thực hiện; ADR-014 tiếp tục Accepted, giữ nguyên file đã đóng băng theo ADR-012. Không thay thế nghiệm thu toàn phase P0 hoặc tăng tiến độ UI/API.

## ADR-015 — Đánh số từ phase 0 · 30/10/2026

[ADR-015](ADR-015-zero-based-phase-numbering.md) Accepted theo chỉ thị trực tiếp của người dùng. ADR-011 bị thay thế một phần về mapping số: P0 → 000 đến P8 → 008; các đường dẫn trong file ADR-011 đóng băng là lịch sử. Tra đường dẫn hiện tại tại [danh mục triển khai](../implement/README.md). Không thay đổi nghiệp vụ hoặc cổng duyệt UI/API.

## ADR-016 — Kế hoạch trước implement · 30/10/2026

[ADR-016](ADR-016-plan-before-implementation.md) Accepted theo chỉ thị trực tiếp của người dùng: kế hoạch từng phase phải được người dùng đọc và yêu cầu implement trước code; UI mock toàn phase phải được approve trước API. Bổ sung cổng trước code cho ADR-009, giữ nguyên cổng duyệt UI/E2E/nghiệm thu. Không sửa các file ADR Accepted cũ. Phase 0 hiện chờ đọc [kế hoạch](../implement/phase-000-foundation-auth/phase-000-foundation-auth.md), bản nháp code đã có chưa được tính hoàn tất.

## ADR-017 — Tên kế hoạch và tách slice · 30/10/2026

[ADR-017](ADR-017-phase-plan-name-and-slice-breakdown.md) Accepted theo chỉ thị trực tiếp: kế hoạch tổng trùng tên folder phase; người dùng duyệt rồi mới tách kế hoạch chi tiết theo slice trong folder đó. Thay thế một phần ADR-016 về tên plan.md và bổ sung cổng trước tách slice; code vẫn chờ yêu cầu implement, API chờ approve UI. ADR-016 giữ nguyên file đóng băng.

## ADR-018 — Security và lazy loading · 30/10/2026

[ADR-018](ADR-018-secure-storage-network-and-lazy-loading.md) Accepted theo chỉ thị triển khai trực tiếp: thêm secure storage, Android network security, lazy component/router và native list viewability tương đương IntersectionObserver. Bổ sung ADR-001/003/004/005/013; không sửa ADR đóng băng hoặc mở cổng API auth. Kế hoạch/kết quả tại [hồ sơ hạ tầng](../implement/phase-000-foundation-auth/security-lazy-loading.md).

## ADR-019 — API auth phase 0 · 30/10/2026

[ADR-019](ADR-019-phase-0-cookie-auth.md) ghi chỉ thị “Duyệt UI, gắn API vào đi”, mở tích hợp bốn slice và dùng API HTTPS đã cấu hình. Native cookie jar, schema validation, me roundtrip, refresh single flight và logout retry có phạm vi/giới hạn kiểm chứng cụ thể; không sửa ADR Accepted cũ hoặc tự nghiệm thu phase. Xem [hồ sơ API](../implement/phase-000-foundation-auth/api-integration.md).

## ADR-020 — E2E riêng theo phase · 31/10/2026

[ADR-020](ADR-020-e2e-suite-per-phase.md) Accepted theo phản hồi người dùng “Duyệt adr 20”. Bổ sung ADR-009 về bộ Maestro E2E, flow tổng, lệnh npm và hồ sơ bằng chứng riêng từng phase; hiệu lực toàn bộ. Giữ nguyên file ADR-009 và các ADR đã đóng băng, cổng duyệt kế hoạch/UI và quyền nghiệm thu của người dùng. ADR-020 được đóng băng từ lần duyệt này theo ADR-012.


## Duyệt toàn bộ ADR — 31/10/2026

Nguồn: người dùng “Duyệt tất cả adr” ngày 31/10/2026 (Asia/Bangkok). Xác nhận chấp thuận toàn bộ ADR-001–ADR-022 hiện có. ADR-021 và ADR-022 chuyển Proposed → Accepted; đã ghi nguồn/ngày duyệt và đóng băng hai file theo ADR-012. ADR-001–ADR-020 giữ nguyên bản đã duyệt.

ADR-021 bổ sung ADR-005/013 về chiều chuyển màn và các ngoại lệ Avatar/Profile, MentorClasses, TeachingSchedule; quyết định mới được ưu tiên trong phạm vi này. ADR-022 bổ sung ADR-003/010/014 về blur native, alpha gradient và HomeTile; quyết định mới được ưu tiên trong phạm vi hiển thị kính. Các quyết định còn lại tiếp tục có hiệu lực theo mapping thay thế hiện có.

Các ghi nhận Proposed trước đây trong sổ và hồ sơ triển khai là lịch sử trước lần duyệt này. Việc duyệt ADR ghi nhận quyết định kiến trúc; các câu hỏi còn mở, giới hạn kiểm chứng và cổng duyệt UI/API/nghiệm thu phase vẫn theo hồ sơ tương ứng.

## ADR-023 — Mở màn hình từ nút được bấm · 31/10/2026

[ADR-023](ADR-023-button-origin-navigation.md) Proposed, ghi nhận chuỗi yêu cầu về hiệu ứng điều hướng. Chỉ thị mới nhất ngày 01/11/2026 bỏ animation cả khi mở và Back UI; code dùng điều hướng trực tiếp và bỏ lớp chuyển động tùy chỉnh. Chưa ghi nhận duyệt riêng ADR. Đề xuất thay toàn bộ quy tắc chuyển động của ADR-021; giữ nguyên file ADR-021 đã đóng băng.
