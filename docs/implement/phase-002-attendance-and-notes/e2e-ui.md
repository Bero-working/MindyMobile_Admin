# Phase 2 — Maestro và ảnh UI mock

Ngày: 01/11/2026 (Asia/Bangkok). Android emulator-5554 / Pixel_8, Android 17, 1080×2400, font scale mặc định. Debug APK x86_64 build thành công, cài lại; source JS hiện hành qua Metro 8081. Chỉ dùng mock auth/teaching/attendance khi đã chọn Review P2.

## Flow nội bộ

- `.maestro/phase-002-attendance-and-notes/ui-review.yaml`: Mentor điểm danh → lưu → finalize → note; chuyển Manager → backlog → attendance → correction → audit → recovery.
- `.maestro/phase-002-attendance-and-notes/preview.yaml`: chụp attendance đã tải, kiểm Settings không bị che, chuyển en/dark cho backlog rồi khôi phục vi/light.
- `.maestro/phase-002-attendance-and-notes/manager-review.yaml`: chạy lại riêng nhánh Manager để kiểm tra và chụp ảnh. Đây là helper phát triển, không thêm npm command E2E thứ hai.

Lệnh nội bộ: `maestro test .maestro/phase-002-attendance-and-notes/ui-review.yaml --test-output-dir build-logs/phase-2-ui/maestro`, hoặc helper Manager khi điều tra lỗi. Command công khai E2E tích hợp tương lai vẫn duy nhất `npm run test:e2e:phase-2` theo ADR-026, chỉ tạo khi có API/dataset thực. Không lấy flow mock thay E2E tích hợp trước nghiệm thu.

## Lịch sử chạy

| Lượt | Kết quả / phát hiện |
| --- | --- |
| 2026-11-01_195202 | Fail khi tìm note-save: thao tác Hide Keyboard đã mở dirty Back dialog. Các bước điểm danh/lưu/finalize đã chạy. Ảnh đầu cho thấy badge review che footer; đã chuyển badge thành nút P2 nhỏ ở góc trên |
| 2026-11-01_195621 | Fail tại correction-reason trong lúc đang sửa source/Fast Refresh; ảnh lỗi đã về Home, không lấy lượt này chứng minh correction |
| 2026-11-01_200252 | Mentor đã lưu/chốt/note, Manager mở backlog/tab/correction. Hide Keyboard đóng sheet correction; đã thêm bước mở lại sheet nếu cần, giữ reason/draft |
| 2026-11-01_201019 | Helper Manager đã correction → audit; fail khi tìm Back context đang nằm ngoài viewport do giữ vị trí cuộn. Đã thêm scroll lên trước Back |
| 2026-11-01_201508 | **PASS exit 0 — full flow UI mock đủ 7 slice**: lưu/chốt/note, backlog/tab, correction có reason → audit thật của fake source, mở recovery. Không có mutation backend |
| 2026-11-01_202201 | **PASS exit 0 — preview trên source cuối**: attendance đã tải; badge không che Settings; en/dark backlog, khôi phục vi/light |

Flow có nhánh conditional xử lý dirty dialog hoặc sheet đã đóng sau Hide Keyboard. Nhánh không áp dụng được Maestro ghi SKIPPED; đây là nhánh điều kiện của automation, không phải đánh một test nghiệp vụ chưa chạy thành pass.

## Ảnh review

Ảnh cuối được copy về `build-logs/phase-2-ui/review/`: attendance, finalize, note, Home Manager, incomplete, Manager attendance, correction, audit và recovery. Chỉ copy ảnh thực sự đã chụp và xem; không dựng ảnh hoặc đưa thông tin tài khoản thật vào ảnh bàn giao.

## Giới hạn

Chưa có HTTP/contract P2, không chạy mutation backend. Native flow chứng minh tương tác với fake source; không chứng minh server permissions, idempotency header/cookie/Origin, recovery payment/evidence hoặc offline mạng thật. Đã xem backlog en/dark và luồng vi/light; chưa nghiệm thu iOS, TalkBack hoặc toàn bộ ma trận 7 slice × ngôn ngữ/theme/font 1.3. Các cổng này vẫn theo kế hoạch và Q-PLAT-01.

## Bộ ảnh đã xem

| Ảnh | Nội dung |
| --- | --- |
| [01-attendance.png](../../../build-logs/phase-2-ui/review/01-attendance.png) | S1 sau khi tải snapshot |
| [02-finalize.png](../../../build-logs/phase-2-ui/review/02-finalize.png) | Sheet finalize và cảnh báo UNMARKED |
| [03-note.png](../../../build-logs/phase-2-ui/review/03-note.png) | S2 note đã lưu |
| [04-manager-home.png](../../../build-logs/phase-2-ui/review/04-manager-home.png) | Home Manager, tổng việc và Settings không bị che |
| [05-incomplete.png](../../../build-logs/phase-2-ui/review/05-incomplete.png) | S3 backlog |
| [06-manager-attendance.png](../../../build-logs/phase-2-ui/review/06-manager-attendance.png) | S4 tab Điểm danh |
| [07-correction.png](../../../build-logs/phase-2-ui/review/07-correction.png) | S5 correction |
| [08-audits.png](../../../build-logs/phase-2-ui/review/08-audits.png) | S7 audit sau correction |
| [09-recovery.png](../../../build-logs/phase-2-ui/review/09-recovery.png) | S6 form trống |
| [11-incomplete-en-dark.png](../../../build-logs/phase-2-ui/review/11-incomplete-en-dark.png) | S3 tiếng Anh, dark mode |

## Cập nhật tiện ích và correction hai trạng thái

02/11/2026 — Theo yêu cầu bỏ danh sách buổi trung gian, `class-picker-review.yaml` hiện kiểm chọn lớp → roster có tabs ngay → lịch sử → roster → chọn lớp khác → Home; khẳng định filter status và card chọn buổi không hiện. Lượt **2026-11-02_100129** pass exit 0 tại `build-logs/phase-2-direct-tabs/maestro`. Đã xem [tab Sửa](../../../build-logs/phase-2-direct-tabs/review/02-correction-tab.png) và [tab Lịch sử](../../../build-logs/phase-2-direct-tabs/review/03-history-tab.png). Thay thế bằng chứng màn tabs chọn buổi của lượt 09:50 cho UI hiện hành.

02/11/2026 — `class-picker-review.yaml` pass exit 0 tại `build-logs/phase-2-class-picker/maestro/2026-11-02_095034`: Home → chọn lớp (chưa có tabs) → tabs Sửa/Lịch sử của lớp → audit → Back về lớp → chọn lớp khác không hiện buổi của lớp trước → Back về Home. Lượt 09:46 bị gián đoạn do Android ghi `killDueToPackageUpdate` giữa flow, không dùng lượt đó làm bằng chứng pass toàn luồng. Ảnh đã xem: [chọn lớp](../../../build-logs/phase-2-class-picker/review/01-select-class.png), [tabs theo lớp](../../../build-logs/phase-2-class-picker/review/02-class-attendance-tabs.png), [lớp khác không có buổi phù hợp](../../../build-logs/phase-2-class-picker/review/03-other-class-empty.png).

`utilities-review.yaml` pass exit 0 tại `build-logs/phase-2-utilities/maestro/2026-11-01_204424`: Home có hai tiện ích mới, filter cuộn ngang, header tabs, audit empty trong card và finalize màn riêng rồi loại buổi khỏi danh sách. Lượt này có trước thay đổi roster gọn.

Sau thay đổi roster, `correction-preview.yaml` pass exit 0 tại `build-logs/phase-2-utilities/maestro/2026-11-01_210141`. Đã xem [ảnh correction hiện hành](../../../build-logs/phase-2-utilities/review/04-correction.png): hai ô tổng, hàng gọn, avatar chữ cái và một chip Có mặt/Vắng. Các phần summary/bulk/pending cũ không còn. Lượt khởi động trước đó ở 20:57–21:00 fail vì chưa thấy nút Review P2; ảnh là màn trắng/loading bundle. Khởi động lại Metro với reset cache, chờ bundle hoàn tất rồi lượt cuối pass. Helper hiện chờ nút review tối đa 60 giây khi khởi động.
