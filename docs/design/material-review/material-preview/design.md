# P3-S6 — material-preview · Xem nội dung và file riêng tư theo vai trò

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-FILE-01, BR-FILE-02, BR-MAT-06; UC-M-08, UC-MG-04. Endpoint tham chiếu: `GET /mentor/classes/:classId/materials/:materialId/preview?expectedRevision=`; `GET /mentor/classes/:classId/materials/:materialId/assets/:fileId/access?expectedRevision=`; hai route tương ứng dưới `/manager/materials/:materialId`; `GET` chi tiết tài liệu theo role.

## 1. Mục tiêu

Mentor và Quản lý xem đúng phiên bản nội dung của một tài liệu. File là private: URL có chữ ký, sống rất ngắn, chỉ xin khi cần, không lưu. Theo Q-P3-01: ảnh, PDF, video xem trong app; loại khác mở bằng ứng dụng ngoài.

**Lựa chọn ban đầu:** mở màn thì xin đúng một URL cho file được chỉ định, hoặc đọc ARTICLE. Không tải trước file nào khác.

**Vì sao dùng route GET có `expectedRevision`** thay vì `POST .../files/:fileId/access`: backend từ chối nếu phiên bản đã đổi, nên nội dung Quản lý xem chắc chắn là bản sắp duyệt. Route GET cũng không cần `Origin`.

## 2. Chọn cách xem

Loại xem lấy từ `kind` của file trong response chi tiết đã có ở S3/S5. S6 đọc lại chi tiết khi mở để lấy `kind`, `originalFilename`, và đối chiếu `revision`; params chỉ giữ định danh.

| `contentType` | `kind` | Cách xem | Mục |
| --- | --- | --- | --- |
| ARTICLE | — | WebView chỉ đọc | 5 |
| FILE | IMAGE | `Image` trong app, chụm để phóng | 3 |
| FILE | PDF | Trình xem PDF | 3 |
| VIDEO | VIDEO | Trình phát video | 3.1 |
| FILE | DOCUMENT, PRESENTATION, SPREADSHEET, AUDIO, SOURCE_CODE | Thẻ tệp + mở ngoài | 4 |
| Đính kèm từ S3/S5 | Mọi loại | Không vào S6; mở ngoài trực tiếp theo mục 4 | 4 |

`kind` lạ: schema coi là phản hồi sai định dạng, không tự đoán từ đuôi file.

## 3. Bố cục

```
┌──────────────────────────────┐
│▓ ←  Unit 8 – Worksheet       ▓│
│▓    Phiên bản 3               ▓│
├──────────────────────────────┤
│                              │
│      [ trình xem chiếm       │
│        toàn bộ phần còn lại ]│
│                              │
│                              │
└──────────────────────────────┘
```

- Header giữ tiêu đề và phiên bản. Không có nút tải về: file là private, và tải về sẽ tạo bản sao lâu dài trên máy. Đây là lựa chọn của design, người dùng có thể đổi khi duyệt UI.
- **Ảnh:** nền `--mdy-surface-muted`, vừa khung, chụm phóng 1–4 lần, chạm hai lần để về 1. Cấu hình không giữ lâu trên đĩa.
- **PDF:** cuộn dọc, có dòng "Trang {n}/{tổng}". File tạm (nếu thư viện cần) bị xóa khi rời màn.
- URL được xin một lần khi mở. Đã hiển thị xong thì không cần xin lại; URL hết hạn không ảnh hưởng nội dung đã tải.
- Rời màn: xóa URL khỏi bộ nhớ, dừng tải, xóa file tạm. Quay lại: xin URL mới.

### 3.1 Video và hết hạn URL

Trình phát gửi Range request trong suốt quá trình xem, nên URL có thể hết hạn **khi đang phát hoặc khi tua** (G-P3-11).

1. Phát với điều khiển gốc. Lưu vị trí hiện tại.
2. Trình phát báo lỗi: xin URL mới, cùng `expectedRevision`.
3. Đổi nguồn, tua về vị trí đã lưu, tiếp tục phát. Hiện "Đang kết nối lại…" trong lúc đó.
4. Giới hạn **3 lần liên tiếp không có tiến triển**. Quá giới hạn: "Không phát tiếp được." + "Thử lại".
5. Nếu xin URL trả 409 conflict: dừng, xử lý như mục 6. Không phát tiếp bản cũ.

Không xin URL định kỳ theo đồng hồ; chỉ xin khi lỗi. Video tải dần theo trình phát, không tải trước cả file.

## 4. Mở bằng ứng dụng ngoài

**Thẻ tệp:**

```
┌──────────────────────────────┐
│▓ ←  Line graphs              ▓│
│▓    Phiên bản 2               ▓│
├──────────────────────────────┤
│        ┌────┐                │
│        │PPTX│                │  FileBadge lớn
│        └────┘                │
│   Line-graphs.pptx           │
│   PowerPoint · 6,8 MB        │
│                              │
│   Loại tệp này mở bằng ứng   │
│   dụng khác trên máy.        │
│                              │
│  [ ↗ Mở bằng ứng dụng khác ]  │
└──────────────────────────────┘
```

- Màn mở **không** xin URL. Bấm nút mới xin, rồi `Linking.openURL` ngay, vì URL chỉ sống rất ngắn. Mỗi lần bấm là một URL mới.
- Máy không có ứng dụng phù hợp: "Không có ứng dụng mở được tệp này."
- **File đính kèm** ở S3, S5: bấm là thực hiện đúng hai bước trên, với `assets/:fileId/access?expectedRevision=`. Server ký `attachment`, nên hệ thống có thể tải về. Đây là hành vi của hệ điều hành, ngoài kiểm soát của app.
- Sau khi rời app, URL đã nằm trong ứng dụng ngoài. Thời hạn ngắn là biện pháp giới hạn duy nhất. Đây là đánh đổi đã chọn ở Q-P3-01.

## 5. ARTICLE

Đọc `contentHtml` từ `GET` chi tiết. Server đã sanitize (thẻ cho phép gồm tiêu đề, đoạn, danh sách, bảng, `blockquote`, `code`, `pre`, `a`, `img`, `figure`). App **không** tự sanitize lại và **không** coi đây là web tin cậy.

WebView cấu hình:

| Thiết lập | Giá trị | Lý do |
| --- | --- | --- |
| JavaScript | Tắt | Không cần; giảm rủi ro |
| Cookie | Không dùng cookie chung, không cookie bên thứ ba | G-P3-10 |
| Truy cập file, content, mixed content | Tắt | |
| Cache | Tắt hoặc incognito | Nội dung riêng tư |
| Điều hướng | Chặn mọi điều hướng trừ tài liệu đang tải | Link không mở trong WebView |
| Content-Security-Policy | `default-src 'none'; img-src` chỉ host storage của URL đã nhận; `style-src 'unsafe-inline'` | Chặn tải ngoài |

- **Link:** chạm vào link `http`, `https`, `mailto` hiện dialog "Mở liên kết này?" kèm địa chỉ đầy đủ, rồi `Linking.openURL`. Không có `href` thì không làm gì.
- **Ảnh inline:** thẻ là `<img data-file-id>` không có `src`. Trước khi nạp HTML: lấy tập `data-file-id`, gọi `assets/:fileId/access?expectedRevision=`, tối đa 4 request song song, gắn `src`, rồi mới nạp. Vì JS tắt nên không có bước gắn sau.
- **Ảnh lỗi:** giữ `alt`; hiện `Alert` warning trên đầu "Một số hình chưa tải được." + "Tải lại" (xin lại toàn bộ URL và nạp lại). Phần chữ vẫn đọc được.
- **Giao diện:** CSS cục bộ theo token, chữ 15/1.6, màu theo sáng/tối, ảnh và bảng không tràn ngang. Không có style từ server (`parseStyleAttributes` tắt).
- **Kích thước:** ≤ 48 KiB HTML và ≤ 50 ảnh theo backend; không cần phân trang.

## 6. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| PV-A | Đang đọc chi tiết, xin URL | Skeleton khung xem; header đã có tiêu đề từ params |
| PV-B | Đang hiển thị | Theo mục 3, 4, 5 |
| PV-C | Đang tải nội dung (PDF, ảnh) | Spinner giữa khung; có tiến trình nếu thư viện báo |
| PV-D | Lỗi lần đầu khi xin URL hoặc đọc | `StatusBlock` + "Thử lại" (xin URL mới) |
| PV-E | Tải file lỗi sau khi có URL (hỏng, hết hạn) | "Không mở được tệp." + "Thử lại" (xin URL mới). **Không dùng lại URL cũ** |
| PV-F | 409 `MATERIAL_REVIEW_CONFLICT` | Dừng hiển thị, xóa nội dung, `RevisionNotice` "Tài liệu vừa có phiên bản mới." + "Quay lại". S3, S5 refetch khi focus. Không tự chuyển sang bản mới: người duyệt phải biết nội dung đã đổi |
| PV-G | `revision` đọc được khác `params.revision` | Như PV-F; không xin URL |
| PV-H | 409 `FILE_NOT_READY` (Manager) | "Tệp chưa sẵn sàng để xem." + "Quay lại" |
| PV-I | 404 | "Không tìm thấy tệp này." + "Quay lại". Với Mentor, gồm cả trường hợp file không READY (G-P3-08) |
| PV-J | 403 `MATERIAL_ACCESS_DENIED` | Xóa nội dung; `StatusBlock` không quyền |
| PV-K | 503 | `storageDown` + "Thử lại" |
| PV-L | Offline: chưa có nội dung | "Cần kết nối mạng để mở tệp."; không "Thử lại" |
| PV-M | Offline: đang xem | Nội dung đã tải vẫn xem được; video báo lỗi theo mục 3.1 và chờ có mạng; không có dữ liệu cũ dạng khác |
| PV-N | 401 | Về Login; xóa URL và file tạm |
| PV-O | Đăng xuất khi đang xem | Dừng phát; xóa URL, file tạm |
| PV-P | Lỗi mạng tầng native tới storage (cleartext, sai host) | PV-E + mã hỗ trợ nếu có; không xem là mất quyền (G-P3-12) |

Thứ tự kiểm khi mở: đọc chi tiết → đối chiếu `revision` → xin URL. Với Mentor, SESSION scope chỉ mở được tài liệu đã công bố; server quyết định.

## 7. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.preview.page` | Trang {{current}}/{{total}} | Page {{current}}/{{total}} |
| `materials.preview.reconnecting` | Đang kết nối lại… | Reconnecting… |
| `materials.preview.cannotContinue` | Không phát tiếp được. | Couldn't keep playing. |
| `materials.preview.cannotOpen` | Không mở được tệp. | Couldn't open the file. |
| `materials.preview.retry` | Thử lại | Retry |
| `materials.preview.back` | Quay lại | Go back |
| `materials.preview.newVersion` | Tài liệu vừa có phiên bản mới. | This material has a new version. |
| `materials.preview.notReady` | Tệp chưa sẵn sàng để xem. | This file isn't ready to view. |
| `materials.preview.notFound` | Không tìm thấy tệp này. | Couldn't find this file. |
| `materials.preview.needOnline` | Cần kết nối mạng để mở tệp. | You need a connection to open this file. |
| `materials.preview.externalHint` | Loại tệp này mở bằng ứng dụng khác trên máy. | This file type opens in another app. |
| `materials.preview.openExternal` | Mở bằng ứng dụng khác | Open in another app |
| `materials.preview.noApp` | Không có ứng dụng mở được tệp này. | No app can open this file. |
| `materials.preview.linkTitle` | Mở liên kết này? | Open this link? |
| `materials.preview.linkOpen` / `.linkCancel` | Mở / Hủy | Open / Cancel |
| `materials.preview.imagesFailed` | Một số hình chưa tải được. | Some images couldn't load. |
| `materials.preview.imagesRetry` | Tải lại | Reload |

## 8. Accessibility

- Trình xem PDF và video có nhãn "Tài liệu {tiêu đề}", "Video {tiêu đề}". Nút điều khiển video dùng của trình phát gốc, đọc được.
- ARTICLE: WebView đọc được bằng trình đọc màn hình; tiêu đề thẻ `h1`–`h6` giữ nguyên; ảnh đọc theo `alt`.
- Phóng chữ hệ thống áp dụng cho ARTICLE qua CSS tính theo font scale.

## 9. testID

`preview-screen`, `preview-back`, `preview-subtitle`, `preview-image`, `preview-pdf`, `preview-page`, `preview-video`, `preview-reconnecting`, `preview-article`, `preview-images-failed`, `preview-images-retry`, `preview-external-card`, `preview-open-external`, `preview-no-app`, `preview-link-dialog`, `preview-error`, `preview-retry`, `preview-new-version`, `preview-not-ready`, `preview-not-found`, `preview-denied`, `preview-offline`.

## 10. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S6-01 | Mentor, FILE PDF, revision 3 | Mở | `GET /mentor/classes/:classId/materials/:id/preview?expectedRevision=3`; hiện PDF |
| TC-P3-S6-02 | Quản lý, FILE PDF, revision 3 | Mở | `GET /manager/materials/:id/preview?expectedRevision=3`; không có route Mentor |
| TC-P3-S6-03 | Mở màn | Xem request | Đúng 1 URL; không xin URL đính kèm |
| TC-P3-S6-04 | IMAGE | Mở | `preview-image`; chụm phóng được; ảnh không được giữ lâu trên đĩa (kiểm native) |
| TC-P3-S6-05 | VIDEO | Phát | Có điều khiển; không tải cả file trước |
| TC-P3-S6-06 | Video đang phát, URL hết hạn | Tua | Xin URL mới cùng `expectedRevision`; tiếp tục đúng vị trí; hiện "Đang kết nối lại…" (kiểm native) |
| TC-P3-S6-07 | URL mới liên tục lỗi 3 lần | | `cannotContinue` + "Thử lại"; không lặp vô hạn |
| TC-P3-S6-08 | Video: xin URL mới trả 409 | | `preview-new-version`; dừng phát |
| TC-P3-S6-09 | DOCUMENT | Mở | `preview-external-card`; **không** có request URL khi chưa bấm |
| TC-P3-S6-10 | | Bấm mở ngoài | Xin URL rồi `openURL`; bấm lần 2 xin URL mới |
| TC-P3-S6-11 | Không có app phù hợp | Bấm | `noApp`; không crash |
| TC-P3-S6-12 | Đính kèm ở S3 | Bấm | `assets/:fileId/access?expectedRevision=`; mở ngoài; không vào S6 |
| TC-P3-S6-13 | Tìm nút tải về | Xem | Không có |
| TC-P3-S6-14 | ARTICLE có 3 ảnh | Mở | GET chi tiết; 3 request asset, tối đa 4 song song; không có request URL chính |
| TC-P3-S6-15 | ARTICLE có `<a href>`, chạm link | | Dialog có địa chỉ đầy đủ; không điều hướng trong WebView |
| TC-P3-S6-16 | ARTICLE: HTML có `<script>`, `onerror` (mock trực tiếp) | Mở | Không chạy JS; không có request ngoài host storage |
| TC-P3-S6-17 | 1 ảnh inline lỗi | | `preview-images-failed`; chữ vẫn hiện; "Tải lại" xin lại URL |
| TC-P3-S6-18 | Sáng/tối, font 1.3 | Xem ARTICLE | Đúng màu; không tràn ngang |
| TC-P3-S6-19 | Mở với `revision` 3, server revision 4 | Mở | `preview-new-version`; không xin URL; không hiện bản mới |
| TC-P3-S6-20 | Xin URL trả 409 conflict | | `preview-new-version`; Back: S5 refetch; dialog duyệt dùng revision mới |
| TC-P3-S6-21 | Quản lý: 409 `FILE_NOT_READY` | | `preview-not-ready` |
| TC-P3-S6-22 | Mentor: 404 | | `preview-not-found` |
| TC-P3-S6-23 | Mentor scope SESSION, tài liệu đã công bố | Mở | Xem được |
| TC-P3-S6-24 | 403 `MATERIAL_ACCESS_DENIED` | | Xóa nội dung; `preview-denied` |
| TC-P3-S6-25 | 503 | | `storageDown` + "Thử lại" |
| TC-P3-S6-26 | Tải PDF lỗi | "Thử lại" | Xin URL mới; không dùng URL cũ |
| TC-P3-S6-27 | Rời màn, quay lại | | Xin URL mới; file tạm đã xóa (kiểm native) |
| TC-P3-S6-28 | Offline, chưa mở | | `preview-offline`; không "Thử lại" |
| TC-P3-S6-29 | Đăng xuất khi đang phát | | Dừng phát; đăng nhập tài khoản khác không còn URL, file tạm |
| TC-P3-S6-30 | Xem file | Kiểm log và storage | URL không có trong log; không lưu MMKV; request tới storage không có `Cookie` (G-P3-10) |
| TC-P3-S6-31 | Lỗi mạng tới storage (cleartext) | | PV-E; **không** xem là mất quyền; không xóa dữ liệu S3/S5 |

Ứng viên Maestro E2E: TC-P3-S6-01, -02, -04, -09, -14, -19. TC-P3-S6-06, -27, -30 cần bằng chứng native và log, không chỉ Maestro.
