# ADR-012 — Bất biến ADR đã duyệt và thứ tự ưu tiên

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Duyệt adr 12”. Ghi nhận trạng thái duyệt và đóng băng file tại lần chuyển trạng thái này; mọi thay đổi sau đó phải có ADR mới.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Một số ADR Accepted đã được bổ sung trực tiếp sau duyệt, gồm quy định tên file trong ADR-011 và cổng Maestro E2E trong ADR-009. Cách làm này thay đổi bản quyết định đã được duyệt và gây khó khăn khi xác định lịch sử, hiệu lực.

Người dùng yêu cầu giữ nguyên ADR đã duyệt, ghi thay đổi bằng ADR mới và ưu tiên quyết định mới hơn. Nguồn: chỉ thị trực tiếp nêu trên, [sổ ADR](README.md) và [ADR-009](ADR-009-phase-tdd-and-ownership.md).

## Decision

### Bất biến sau khi duyệt

- ADR đã approve, tương ứng Accepted, phải giữ nguyên toàn bộ file từ thời điểm duyệt: nội dung quyết định, trạng thái, ngày, nguồn, liên kết và giải thích.
- Không sửa, thêm phụ lục, xóa, đổi tên hoặc ghi đè file Accepted, kể cả để sửa lỗi trình bày, ghi tiến độ hoặc cập nhật trạng thái bị thay thế.
- ADR Proposed được chỉnh sửa trước duyệt. Chỉ chuyển sang Accepted theo phản hồi rõ ràng của người dùng; ghi nguồn/ngày duyệt rồi đóng băng file.
- Tiến độ và kết quả thực hiện ghi trong hồ sơ/progress. Quan hệ thay thế và trạng thái hiệu lực hiện tại ghi trong sổ ADR, không ghi thêm vào file đã duyệt.

### Thay đổi bằng ADR mới

- Mọi sửa đổi, bổ sung, đính chính, hủy hoặc khôi phục quyết định đã Accepted phải tạo ADR mới với số kế tiếp; không tái sử dụng số hoặc thay file cũ.
- ADR mới phải liên kết ADR bị ảnh hưởng, nêu phần thay thế/bổ sung, lý do, quy tắc mới, phạm vi tác động và phần cũ tiếp tục có hiệu lực.
- ADR mới bắt đầu ở Proposed; thay đổi chỉ có hiệu lực sau khi người dùng duyệt. Số ADR lớn hơn không tự làm đề xuất có hiệu lực.
- Sau duyệt, đồng bộ sổ ADR, changelog, kế hoạch và phase liên quan trước code. Giữ file ADR cũ nguyên trạng.

### ADR mới được ưu tiên

- Khi các ADR đã Accepted quy định khác nhau về cùng một vấn đề, ADR mới hơn luôn được ưu tiên trong phạm vi xung đột. Mới/cũ xác định bằng số ADR tăng dần, không theo thời gian sửa file.
- Proposed/Rejected không ghi đè Accepted. ADR mới về vấn đề khác không vô hiệu hóa các quyết định cũ không liên quan.
- Thay thế một phần: áp dụng ADR mới cho phần xung đột, phần còn lại của ADR cũ vẫn có hiệu lực. Thay thế toàn bộ phải ghi rõ phạm vi đó.
- ADR mới phải nêu quan hệ thay thế. Nếu phát hiện thiếu mapping sau duyệt, ghi quan hệ trong sổ ADR; không sửa hai file đã đóng băng. Nếu phạm vi xung đột chưa rõ, chốt điểm đó trước khi triển khai phần phụ thuộc.
- Muốn quay lại quyết định cũ phải tạo ADR mới ghi rõ việc khôi phục; không xóa quyết định mới hơn hoặc viết lại lịch sử.

### Quản lý hiệu lực trong sổ ADR

Sổ ADR là mục lục có thể cập nhật. Ghi hiệu lực và liên kết thay thế ở đây: `Accepted — hiệu lực toàn bộ`, `Accepted — bị thay thế một phần bởi ADR-NNN`, hoặc `Superseded by ADR-NNN`. Trạng thái trong file cũ vẫn giữ nguyên như lúc duyệt; hiệu lực hiện tại tra trong sổ ADR và ADR Accepted mới hơn liên quan.

### Áp dụng và chuyển tiếp

ADR này bổ sung quy tắc quản lý ADR và thay thế cách cập nhật trực tiếp quyết định Accepted trước đây, gồm việc ghi trạng thái superseded vào file cũ. Giữ nguyên các cổng design/UI/E2E/nghiệm thu và luật nghiệp vụ khác.

Không tự khôi phục hoặc sửa lại các ADR đã bị chỉnh trước yêu cầu này; ghi nhận chúng là lịch sử hiện có. Từ chỉ thị hiện tại, mọi thay đổi tiếp theo đối với quyết định đã duyệt phải được ghi bằng ADR mới. ADR-012 cũng bất biến sau khi được duyệt.

## Alternatives

Thêm phụ lục vào ADR Accepted; sửa file cũ và chỉ giữ lịch sử Git; cho cả ADR Proposed mới hơn ghi đè bản đã duyệt. Không chọn vì không giữ nguyên bản duyệt hoặc cho phép đề xuất chưa duyệt thay đổi quyết định có hiệu lực.

## Consequences

Mỗi quyết định đã duyệt có bản cố định và chuỗi thay thế rõ ràng; số ADR tăng khi có thay đổi. Khi tra cứu phải đối chiếu sổ ADR và ADR Accepted mới nhất liên quan. Đính chính nằm trong file đã đóng băng cũng phải qua ADR mới.

## BR-slice bị ảnh hưởng

Không thay đổi BR nghiệp vụ. Áp dụng quản lý quyết định cho mọi ADR và phase P0–P8; liên quan vòng đời tại [sổ ADR](README.md) và quy trình cập nhật quyết định tại [ADR-009](ADR-009-phase-tdd-and-ownership.md).

## Điều kiện chuyển trạng thái

Proposed → Accepted/Rejected theo phản hồi rõ ràng của người dùng. Khi Accepted, ghi nguồn/ngày duyệt rồi đóng băng file. Sau đó, mọi thay đổi phải có ADR mới; hiệu lực và quan hệ thay thế chỉ cập nhật trong sổ ADR, không sửa ADR-012.
