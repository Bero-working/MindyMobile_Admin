# P3-S2 — material-editor · Tạo, sửa bản nháp và tải file

Ngày: 02/11/2026. Người thiết kế: Claude. Design cấp phase: [../design.md](../design.md).
BR/UC: BR-MAT-02, BR-MAT-03, BR-MAT-05, BR-FILE-01, BR-FILE-03; UC-M-08. Endpoint tham chiếu: `POST /mentor/classes/:classId/units/:unitId/materials`; `PATCH` và `GET /mentor/classes/:classId/materials/:materialId`; `POST /files/upload-intents`; `POST /files/:fileId/complete`; `GET /files/:fileId`; PUT tới `uploadUrl`.

## 1. Mục tiêu

Mentor chính chọn một file, tải lên, đợi kiểm tra xong, nhập tiêu đề và lưu thành bản nháp của một chương. Hoặc sửa bản nháp, bản bị từ chối của mình. Màn này **không gửi duyệt**: gửi ở S3.

Theo Q-MAT-01a chỉ có FILE và VIDEO. Theo Q-P3-02 không có file đính kèm, `availableAt`, `sessionId`, `sortOrder`. Mẫu [M] không có form này; bố cục ghép từ `UploadCard`, `Field`, `MultilineField`.

**Lựa chọn ban đầu:** tạo mới: chưa chọn loại, chưa có file, form trống. Sửa: tải chi tiết, điền tiêu đề và mô tả từ server, hiện tệp hiện tại.

## 2. Bố cục

**Tạo mới, chưa có file** (theo sheet "Tải lên" của [M]):

```
┌──────────────────────────────┐
│▓ ←  Tải tài liệu lên         ▓│
│▓    Chương 8 · Line graphs   ▓│
├──────────────────────────────┤
│ Chọn loại tài liệu           │
│ ┌──────────────────────────┐ │
│ │ ▤ Tài liệu             › │ │  description
│ │   PDF, Word, PowerPoint…  │ │
│ ├──────────────────────────┤ │
│ │ ▶ Video                › │ │  movie
│ │   MP4, tối đa 200 MB      │ │
│ ├──────────────────────────┤ │
│ │ ▧ Hình ảnh             › │ │  image
│ │   JPG, PNG                │ │
│ └──────────────────────────┘ │
│ File tải lên được lưu ở chế  │  12 secondary
│ độ nháp. Gửi duyệt để học    │
│ viên xem được.               │
└──────────────────────────────┘
```

**Sau khi chọn file:**

```
┌──────────────────────────────┐
│▓ ←  Tải tài liệu lên         ▓│
│▓    Chương 8 · Line graphs   ▓│
├──────────────────────────────┤
│ ┌──────────────────────────┐ │
│ │ ┌───┐ Worksheet-8.pdf     │ │  UploadCard
│ │ │PDF│ 1,2 MB   Đang tải 64%│ │
│ │ └───┘ ▓▓▓▓▓▓▓░░░░         │ │
│ │ Giữ màn hình này khi đang │ │
│ │ tải lên.                  │ │
│ └──────────────────────────┘ │
│ Tiêu đề *                    │
│ ┌──────────────────────────┐ │
│ │ Worksheet-8              │ │  điền sẵn từ tên file
│ └──────────────────────────┘ │
│                       11/250 │
│ Mô tả                        │
│ ┌──────────────────────────┐ │
│ │                          │ │  MultilineField
│ └──────────────────────────┘ │
│                       0/5000 │
├──────────────────────────────┤
│               ( Lưu bản nháp )│  thanh dính đáy
└──────────────────────────────┘
```

- **Hình ảnh** và **Tài liệu** đều tạo `contentType` FILE. **Video** tạo `contentType` VIDEO. Loại không đổi được sau khi tạo, vì PATCH không nhận `contentType`.
- **Tiêu đề:** sau khi chọn file, điền sẵn tên file bỏ đuôi nếu người dùng chưa gõ. Đổi file không ghi đè tiêu đề đã gõ.
- **Đếm ký tự** theo code point. Vượt giới hạn: bộ đếm `--mdy-danger-fg`, dòng lỗi, khóa Lưu, **không cắt nội dung**.
- **Mô tả:** không bắt buộc. Xóa hết rồi lưu gửi `description: null`.
- **Màn SESSION hoặc mất quyền:** S1 không mở màn này. Mở trực tiếp vẫn bị server từ chối: mục 7.

## 3. `UploadCard`

| Trạng thái | Dòng trạng thái | Thao tác |
| --- | --- | --- |
| Đang chuẩn bị | Đang chuẩn bị… | "Đổi tệp" |
| Đang tải | Đang tải {n}% + thanh tiến trình, kèm "Giữ màn hình này khi đang tải lên." | "Hủy" |
| Đang hoàn tất | Đang gửi xác nhận… | Không có |
| Đang kiểm tra | Đang kiểm tra tệp… (spinner) | "Đổi tệp" |
| Sẵn sàng | ✓ Sẵn sàng, tone success | "Đổi tệp" |
| Kiểm tra lâu | Vẫn đang kiểm tra. Bạn có thể đợi hoặc kiểm tra lại. | "Kiểm tra lại", "Đổi tệp" |
| Lỗi tải | Không tải lên được. | "Thử lại", "Đổi tệp" |
| Tệp hỏng | Tệp không hợp lệ. Hãy chọn tệp khác. | "Chọn tệp khác", mã hỗ trợ nếu có |
| Hết hạn | Lượt tải đã hết hạn. | "Tải lại", "Đổi tệp" |
| Offline trong lúc tải | Mất kết nối. | "Thử lại" hiện khi có mạng |
| Tệp hiện tại (chế độ sửa) | Tên file · dung lượng | "Đổi tệp" |

"Hủy" và "Đổi tệp" dừng PUT đang chạy, bỏ `fileId` đó ở phía client. Không có API hủy; intent tự hết hạn ở server. `file.kind` khi READY mới là loại thật do server kiểm; chỉ hiển thị `FileBadge` theo đuôi file trước đó.

## 4. Hành vi

### 4.1 Kiểm cục bộ trước khi upload

Chạy ngay sau khi chọn, trước khi gọi API, để báo lỗi sớm. Server vẫn là bên quyết định cuối. Bảng phải khớp [file-upload-policy](../../../../../Mindy-BE/src/modules/files/domain/file-upload-policy.ts); Codex đối chiếu ở API-00.

| Loại đã chọn | Đuôi | `declaredMimeType` | Giới hạn |
| --- | --- | --- | --- |
| Tài liệu | `.pdf` | `application/pdf` | 25 MiB |
| Tài liệu | `.docx`, `.pptx`, `.xlsx` | MIME Office tương ứng | 25 MiB |
| Tài liệu | `.mp3` | `audio/mpeg` | 25 MiB |
| Tài liệu | `.txt`, `.md`, `.csv`, `.json`, `.js`, `.css` | `text/plain`, `text/markdown`, `text/csv`, `application/json`, `text/javascript`, `text/css` | 25 MiB |
| Tài liệu | `.ts`, `.py`, `.java`, `.c`, `.cpp`, `.h`, `.sql` | `text/plain` | 25 MiB |
| Hình ảnh | `.png`, `.jpg`, `.jpeg` | `image/png`, `image/jpeg` | 25 MiB |
| Video | `.mp4` | `video/mp4` | 200 MiB |

- MIME **suy từ đuôi file**, không dùng giá trị bộ chọn trả về: Android có thể trả MIME khác, và server yêu cầu đuôi khớp MIME.
- Chọn `.mp4` ở mục Tài liệu: "Hãy chọn mục Video để tải file MP4." Backend từ chối FILE có kind VIDEO. Không tự đổi loại.
- Ngoài bảng (ZIP, HEIC, DOC cũ…): "Loại tệp này chưa được hỗ trợ." Không gửi request.
- Tên file dài hơn 250 ký tự, có dấu `/`, `\`, ký tự điều khiển hoặc khoảng trắng đầu cuối: "Tên tệp không hợp lệ. Hãy đổi tên rồi chọn lại." Không tự đổi tên.
- Kích thước 0 hoặc không đọc được: "Không đọc được tệp này."
- Không có URL ngoài: không có ô nhập link video (BR-FILE-03).

### 4.2 Luồng tải

1. `POST /files/upload-intents` với `courseUnitId`, `classId`, `classUnitId`, `originalFilename`, `declaredMimeType`, `declaredSizeBytes`.
2. PUT file tới `uploadUrl` với đúng `requiredHeaders`, đọc theo luồng từ đĩa, không cookie, không Origin (design chung mục 7).
3. `POST /files/:fileId/complete` với body `{}`: trường lạ bị từ chối. Mất response thì gọi lại an toàn: 200 READY, 202 PROCESSING.
4. Khi PROCESSING: `GET /files/:fileId` mỗi 2 giây trong 30 giây đầu, sau đó mỗi 5 giây. Chỉ chạy khi màn đang focus và app ở foreground. Đến 3 phút thì dừng và chuyển "Kiểm tra lâu".
5. READY: mở khóa Lưu. FAILED hoặc DELETED: "Tệp hỏng". Không dịch `errorCode` (G-P3-13).

Quay lại lỗi PUT:

| Tình huống | Hành vi |
| --- | --- |
| Lỗi mạng, trước `uploadUrlExpiresAt` | "Thử lại" PUT lại cùng URL, từ đầu file |
| Storage trả 403/400, hoặc đã qua hạn | "Thử lại" xin intent mới. `fileId` cũ bị bỏ |
| `complete` trả `UPLOAD_EXPIRED` | "Hết hạn"; "Tải lại" xin intent mới |
| 429 khi xin intent | `quota`. Không tự thử lại |
| 503 | `storageDown` + "Thử lại" |

**Không tự thử lại vòng lặp**: mỗi intent mới chiếm hạn mức (G-P3-11). Không gán cứng thời lượng trong code hay chữ.

### 4.3 Nút Lưu

| Điều kiện | Nút "Lưu bản nháp" |
| --- | --- |
| Tạo mới, tệp chưa READY | Khóa, kèm dòng "Lưu được khi tệp đã sẵn sàng." |
| Tiêu đề rỗng sau trim hoặc quá 250; mô tả quá 5000 | Khóa, lỗi tại ô |
| Sửa bản DRAFT, không có gì đổi | Khóa |
| Sửa bản REJECTED | **Mở cả khi chưa đổi gì**: đây là đường duy nhất về DRAFT để gửi lại (BR-MAT-03). Nhãn "Lưu thành bản nháp mới" |
| Đang đổi file, tệp mới chưa READY | Khóa |
| Offline | Khóa, `needOnline` |
| Có lệnh chưa rõ kết quả | Khóa |

**Chế độ sửa** gửi `expectedRevision` và chỉ các trường đã đổi. Bản REJECTED không đổi gì thì gửi `title` hiện tại. Không gửi `attachmentFileIds`, `sortOrder`, `availableAt`, `sessionId` để giữ nguyên giá trị đã có. Tiêu đề trim trước khi gửi; mô tả gửi nguyên văn.

**Sửa bản REJECTED:** hiện `Alert` danger trên đầu với lý do từ chối. Lý do biến mất sau khi lưu vì server xóa.

**Sửa VIDEO:** "Đổi tệp" chỉ cho MP4. **Sửa FILE:** "Đổi tệp" không cho MP4.

**Lưu thành công:** `navigation.replace` sang S3 với tài liệu vừa lưu, Toast "Đã lưu bản nháp". Back từ S3 về S1, không về form. Invalidate theo design chung mục 10.1.

**ARTICLE:** không vào được màn này: S3 ẩn nút Sửa. Mở trực tiếp với `materialId` là ARTICLE: `StatusBlock` "Bài viết chỉ sửa được trên web." + "Quay lại", không gọi PATCH.

### 4.4 Rời màn

Dialog ở mục 6.5 của [design P2](../../attendance-and-notes/design.md) khi form đã đổi hoặc đang upload. Tiêu đề "Thoát mà chưa lưu?", thân "Tệp đang tải và nội dung bạn nhập sẽ bị bỏ." Refetch khi focus không ghi đè nội dung đang gõ.

## 5. Xung đột

PATCH trả 409 `MATERIAL_REVIEW_CONFLICT`. Không có last-write-wins, không tự rebase (BR-MAT-05):

1. Tải lại chi tiết, giữ nguyên nội dung đang gõ.
2. Vẫn `canEdit`: hiện `FocusPanel` "Tài liệu vừa thay đổi" với tiêu đề mới của server và hai nút **"Dùng bản mới"** (bỏ nội dung đang gõ) và **"Giữ của tôi"** (cập nhật `expectedRevision`, vẫn phải bấm Lưu lại).
3. Không còn `canEdit` (đã gửi duyệt ở thiết bị khác): form chỉ đọc, dải "Tài liệu đã được gửi duyệt nên không sửa được nữa.", nút "Về chi tiết".

## 6. Lệnh chưa rõ kết quả

Timeout hoặc mất mạng sau khi bấm Lưu. Giữ form, khóa nút, `IntentBanner` với `unknownResult` và nút **"Kiểm tra"**. Không có nút gửi lại mù.

**Tạo mới (G-P3-02).** "Kiểm tra" gọi danh sách chương với `reviewStatus=DRAFT`, `pageSize` 100, duyệt đủ trang theo `total`, tìm hàng có `file.id` = `fileId` đang giữ:

| Kết quả | Hành vi |
| --- | --- |
| Tìm thấy | Coi như đã lưu: sang S3 hàng đó |
| Không thấy | "Chưa lưu được. Bạn có thể lưu lại." Mở khóa nút |
| Lỗi đọc | Giữ banner, cho kiểm tra lại |

**Sửa.** "Kiểm tra" đọc lại chi tiết:

| Kết quả | Hành vi |
| --- | --- |
| `revision` = expected + 1 và đúng nội dung đã gửi | Coi như đã lưu |
| `revision` = expected | Chưa ghi: mở khóa nút |
| Khác | Xử lý xung đột mục 5 |

## 7. Trạng thái

| # | Trạng thái | Hiển thị |
| --- | --- | --- |
| ED-A | Tạo mới, chưa chọn | Mục 2 |
| ED-B | Sửa: đang tải | Skeleton card và hai ô |
| ED-C | Sửa: lỗi tải, chưa có dữ liệu | `StatusBlock` + "Thử lại" |
| ED-D | Sửa: 404 | `StatusBlock` không tìm thấy |
| ED-E | Đang chọn file, người dùng hủy bộ chọn | Giữ nguyên, không báo lỗi |
| ED-F | Tệp bị từ chối cục bộ | Lỗi dưới mục loại hoặc trên `UploadCard`; không gửi request |
| ED-G | Đang tải, đang kiểm tra, sẵn sàng, lỗi | Mục 3 |
| ED-H | Đang lưu | Nút `busy`; Back bị chặn |
| ED-I | 422 | Dải danger, giữ form; lỗi tiêu đề đặt tại ô |
| ED-J | 409 `FILE_NOT_READY` khi lưu | `fileNotReady`; về "Đang kiểm tra" và đọc lại file |
| ED-K | 403 mất quyền trong lúc nhập | Xóa form; `StatusBlock` không quyền. Không đổi id |
| ED-L | 403 `ORIGIN_NOT_ALLOWED` | Lỗi chung + mã hỗ trợ; giữ form |
| ED-M | Offline | Mục 10.2 design chung |
| ED-N | App vào nền rồi quay lại khi đang tải | Nếu upload còn chạy thì tiếp tục; nếu đã lỗi thì "Lỗi tải" |
| ED-O | App bị tắt | Mất form và lượt tải; không có khôi phục |

## 8. Nội dung chữ

| Key gợi ý | vi | en |
| --- | --- | --- |
| `materials.editor.titleNew` | Tải tài liệu lên | Upload material |
| `materials.editor.titleEdit` | Sửa tài liệu | Edit material |
| `materials.editor.chooseKind` | Chọn loại tài liệu | Choose a material type |
| `materials.editor.kindFile` / `.kindFileHint` | Tài liệu / PDF, Word, PowerPoint, Excel, âm thanh, văn bản | Document / PDF, Word, PowerPoint, Excel, audio, text |
| `materials.editor.kindVideo` / `.kindVideoHint` | Video / MP4, tối đa 200 MB | Video / MP4, up to 200 MB |
| `materials.editor.kindImage` / `.kindImageHint` | Hình ảnh / JPG, PNG, tối đa 25 MB | Image / JPG, PNG, up to 25 MB |
| `materials.editor.draftNote` | File tải lên được lưu ở chế độ nháp. Gửi duyệt để học viên xem được. | Uploads are saved as drafts. Submit for review so students can see them. |
| `materials.editor.preparing` | Đang chuẩn bị… | Preparing… |
| `materials.editor.uploading` | Đang tải {{percent}}% | Uploading {{percent}}% |
| `materials.editor.keepOpen` | Giữ màn hình này khi đang tải lên. | Keep this screen open while uploading. |
| `materials.editor.completing` | Đang gửi xác nhận… | Confirming… |
| `materials.editor.checking` | Đang kiểm tra tệp… | Checking file… |
| `materials.editor.ready` | Sẵn sàng | Ready |
| `materials.editor.slowCheck` | Vẫn đang kiểm tra. Bạn có thể đợi hoặc kiểm tra lại. | Still checking. You can wait or check again. |
| `materials.editor.checkAgain` | Kiểm tra lại | Check again |
| `materials.editor.uploadFailed` | Không tải lên được. | Upload failed. |
| `materials.editor.fileBad` | Tệp không hợp lệ. Hãy chọn tệp khác. | This file isn't valid. Choose another one. |
| `materials.editor.expired` | Lượt tải đã hết hạn. | This upload has expired. |
| `materials.editor.offline` | Mất kết nối. | Connection lost. |
| `materials.editor.retry` / `.reupload` / `.cancel` / `.change` / `.chooseOther` | Thử lại / Tải lại / Hủy / Đổi tệp / Chọn tệp khác | Retry / Upload again / Cancel / Change file / Choose another |
| `materials.editor.useVideo` | Hãy chọn mục Video để tải file MP4. | Choose Video to upload an MP4 file. |
| `materials.editor.unsupported` | Loại tệp này chưa được hỗ trợ. | This file type isn't supported. |
| `materials.editor.tooLarge` | Tệp vượt quá {{limit}} MB. | This file is larger than {{limit}} MB. |
| `materials.editor.badName` | Tên tệp không hợp lệ. Hãy đổi tên rồi chọn lại. | This file name isn't valid. Rename it and choose again. |
| `materials.editor.unreadable` | Không đọc được tệp này. | Couldn't read this file. |
| `materials.editor.fieldTitle` | Tiêu đề | Title |
| `materials.editor.fieldDescription` | Mô tả | Description |
| `materials.editor.titleRequired` | Nhập tiêu đề. | Enter a title. |
| `materials.editor.tooLong` | Vượt quá {{max}} ký tự. | Over the {{max}} character limit. |
| `materials.editor.save` | Lưu bản nháp | Save draft |
| `materials.editor.saveRejected` | Lưu thành bản nháp mới | Save as new draft |
| `materials.editor.saveWhenReady` | Lưu được khi tệp đã sẵn sàng. | You can save once the file is ready. |
| `materials.editor.saved` | Đã lưu bản nháp | Draft saved |
| `materials.editor.rejectedReason` | Lý do từ chối: {{reason}} | Rejection reason: {{reason}} |
| `materials.editor.conflictUseLatest` / `.conflictKeepMine` | Dùng bản mới / Giữ của tôi | Use latest / Keep mine |
| `materials.editor.submittedElsewhere` | Tài liệu đã được gửi duyệt nên không sửa được nữa. | This material was submitted, so it can no longer be edited. |
| `materials.editor.notSaved` | Chưa lưu được. Bạn có thể lưu lại. | Not saved. You can save again. |
| `materials.editor.articleWeb` | Bài viết chỉ sửa được trên web. | Articles can only be edited on the web. |
| `materials.editor.leaveBody` | Tệp đang tải và nội dung bạn nhập sẽ bị bỏ. | Your upload and what you've entered will be lost. |

## 9. Accessibility

- Ba mục loại role `button`, đọc cả dòng phụ.
- Thanh tiến trình role `progressbar` có giá trị; đọc theo mốc 25/50/75/100. READY đọc "Tệp đã sẵn sàng".
- Nút khóa có lý do đọc được: dòng `saveWhenReady` liên kết với nút.

## 10. testID

`editor-screen`, `editor-back`, `editor-kind-file`, `editor-kind-video`, `editor-kind-image`, `editor-local-error`, `editor-upload-card`, `editor-upload-status`, `editor-upload-progress`, `editor-upload-retry`, `editor-upload-cancel`, `editor-upload-change`, `editor-upload-check`, `editor-title`, `editor-title-count`, `editor-description`, `editor-description-count`, `editor-rejected-reason`, `editor-save`, `editor-save-hint`, `editor-conflict`, `editor-use-latest`, `editor-keep-mine`, `editor-unknown`, `editor-check`, `editor-error`, `editor-denied`, `editor-not-found`, `editor-article-blocked`, `leave-dialog`, `leave-stay`, `leave-discard`.

## 11. Test case

| ID | Tiền điều kiện / mock | Thao tác | Kết quả mong đợi |
| --- | --- | --- | --- |
| TC-P3-S2-01 | Mở tạo mới | Xem request | Không gọi API nào; có 3 mục loại |
| TC-P3-S2-02 | Chọn Tài liệu, PDF 1 MB | | `declaredMimeType=application/pdf`, đúng `courseUnitId`, `classId`, `classUnitId`, tên, kích thước |
| TC-P3-S2-03 | Bộ chọn trả `application/octet-stream` với `.pdf` | | Vẫn khai `application/pdf` |
| TC-P3-S2-04 | Chọn Tài liệu, file MP4 | | `useVideo`; không gọi API |
| TC-P3-S2-05 | Chọn ZIP, HEIC | | `unsupported`; không gọi API |
| TC-P3-S2-06 | PDF 26 MiB | | `tooLarge` 25; không gọi API |
| TC-P3-S2-07 | MP4 201 MiB | | `tooLarge` 200; không gọi API |
| TC-P3-S2-08 | MP4 150 MiB | Chọn Video | Được tải; bộ nhớ JS không đọc cả file (kiểm native) |
| TC-P3-S2-09 | Người dùng hủy bộ chọn | | Giữ nguyên; không có lỗi |
| TC-P3-S2-10 | Tên file có dấu `/` hoặc khoảng trắng cuối | | `badName`; không tự sửa tên |
| TC-P3-S2-11 | PUT | Kiểm request | Đúng `requiredHeaders`; **không** `Cookie`, `Origin`, `Authorization` |
| TC-P3-S2-12 | `complete` | Kiểm request | Body `{}`; không có trường thừa |
| TC-P3-S2-13 | `complete` trả 202, rồi READY | | Polling dừng; nút Lưu mở |
| TC-P3-S2-14 | `complete` mất response | Thử lại | Gọi lại `complete`; không xin intent mới |
| TC-P3-S2-15 | Đang PROCESSING | Xem nút | Lưu khóa kèm `saveWhenReady` |
| TC-P3-S2-16 | PROCESSING quá 3 phút | | Dừng polling; "Kiểm tra lâu"; "Kiểm tra lại" gọi 1 lần |
| TC-P3-S2-17 | FAILED | | `fileBad`; Lưu khóa; không có "Thử lại" trên cùng file |
| TC-P3-S2-18 | Rời màn khi PROCESSING | | Polling dừng; không có request nền |
| TC-P3-S2-19 | PUT lỗi mạng, URL còn hạn | Thử lại | PUT lại cùng URL; không xin intent mới |
| TC-P3-S2-20 | PUT 403 | Thử lại | Xin intent mới, `fileId` mới |
| TC-P3-S2-21 | 429 | | `quota`; không tự thử lại |
| TC-P3-S2-22 | 503 | | `storageDown` + "Thử lại" |
| TC-P3-S2-23 | READY, tiêu đề "  A  " | Lưu | Gửi `title` "A", `contentType`, `fileId`; không gửi `sortOrder`, `availableAt`, `sessionId` |
| TC-P3-S2-24 | Tiêu đề chỉ khoảng trắng | | Lỗi tại ô; Lưu khóa; không có request |
| TC-P3-S2-25 | Tiêu đề 251 ký tự, mô tả 5001 ký tự | | Bộ đếm danger; không cắt nội dung; Lưu khóa |
| TC-P3-S2-26 | Đã chọn file, chưa gõ tiêu đề | | Tiêu đề = tên file bỏ đuôi |
| TC-P3-S2-27 | Đã gõ tiêu đề, đổi file | | Giữ tiêu đề đã gõ |
| TC-P3-S2-28 | Lưu thành công | Back | Sang S3; Back về S1; không về form |
| TC-P3-S2-29 | POST tạo mất response | Xem | `editor-unknown`, có "Kiểm tra"; **không** có "Gửi lại"; Lưu khóa |
| TC-P3-S2-30 | "Kiểm tra", thấy hàng cùng `file.id` | | Sang S3 hàng đó; không gọi POST lần 2 |
| TC-P3-S2-31 | "Kiểm tra", không thấy | | `notSaved`; Lưu mở; POST lần sau chỉ tạo 1 bản |
| TC-P3-S2-32 | Sửa DRAFT revision 3, đổi mô tả | Lưu | PATCH chỉ có `description`, `expectedRevision` 3 |
| TC-P3-S2-33 | Sửa DRAFT, không đổi gì | | Lưu khóa |
| TC-P3-S2-34 | Sửa REJECTED, không đổi gì | | Hiện lý do; "Lưu thành bản nháp mới" mở; PATCH gửi `title`, về DRAFT |
| TC-P3-S2-35 | Tài liệu có file đính kèm từ web | Sửa, Lưu | PATCH không có `attachmentFileIds` |
| TC-P3-S2-36 | Xóa hết mô tả | Lưu | `description: null` |
| TC-P3-S2-37 | PATCH 409, vẫn `canEdit` | | `editor-conflict`; nội dung giữ nguyên; không tự gửi |
| TC-P3-S2-38 | "Giữ của tôi" | Lưu | `expectedRevision` mới |
| TC-P3-S2-39 | PATCH 409, đã gửi duyệt ở nơi khác | | Form chỉ đọc; `submittedElsewhere` |
| TC-P3-S2-40 | PATCH mất response, server đã tăng revision | "Kiểm tra" | Coi như đã lưu; không PATCH lần 2 |
| TC-P3-S2-41 | Mở với `materialId` là ARTICLE | | `editor-article-blocked`; không có PATCH |
| TC-P3-S2-42 | 403 `MATERIAL_ACCESS_DENIED` | Lưu | Xóa form; `editor-denied` |
| TC-P3-S2-43 | Form đã đổi | Back | `leave-dialog`; "Ở lại" giữ; "Bỏ thay đổi" rời màn và dừng upload |
| TC-P3-S2-44 | Offline | Xem | Chọn file và Lưu khóa; gõ được; đang tải thì chuyển "Mất kết nối" |
| TC-P3-S2-45 | Có mạng lại sau khi offline | | **Không tự gửi**; nút hiện để người dùng bấm |
| TC-P3-S2-46 | Refetch khi focus trong lúc gõ | | Không ghi đè nội dung |
| TC-P3-S2-47 | Tìm ô link video, ô hẹn giờ, chọn buổi, thêm đính kèm, soạn bài viết | Xem | Không có |

Ứng viên Maestro E2E: TC-P3-S2-02, -04, -13, -23, -28, -34, -37.
