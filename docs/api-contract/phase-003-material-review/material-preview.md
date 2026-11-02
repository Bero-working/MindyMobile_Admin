# P3-S6 — Private preview

Ngày đối chiếu: 02/11/2026. [Contract chung](README.md) · [Nguồn nguyên bản](../legacy/2026-11-02-materials/README.md).

Route: `GET /mentor/classes/:classId/materials/:materialId/preview; GET /mentor/classes/:classId/materials/:materialId/assets/:fileId/access; Manager tương ứng /manager/materials/:materialId`.

Query expectedRevision bắt buộc. Đọc detail trước, revision khác thì dừng; file phải là reference của material. Response materialId/fileId/revision/role/url/expiresAt. Backend có route POST files/access không pin revision: mobile không dùng thay GET này. Signed URL chỉ RAM; dùng hostname tách API, từ chối cùng hostname giữa các cổng và HTTPS downgrade. PDF/ảnh tải cache riêng và xóa; video Range URL làm mới khi lỗi có giới hạn, giữ vị trí; Office/audio/source/attachments mở ứng dụng ngoài khi người dùng bấm (URL mới mỗi lần). ARTICLE WebView JS/cookie/file access/cache tắt, CSP hạn chế host ảnh đã được backend cho phép; inline refs được ký theo revision tối đa 4 request đồng thời. Không xem signed URL là link công khai lâu dài.

Lỗi, phiên, Origin, schema và uncertain theo contract chung. Bằng chứng từng nhánh được ghi riêng, không suy source thành runtime pass.
