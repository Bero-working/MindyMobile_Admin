# Lịch sử quy tắc nghiệp vụ

[Quy tắc duy nhất](../business-rules.md). Ngày khởi tạo: 30/10/2026. Chưa có baseline nghiệp vụ được phê duyệt; không có thay đổi sau duyệt.

| Ngày       | Mã BR                              | Cũ → mới                                                            | Lý do / nguồn                                                               | ADR                                                       | Phase/slice bị ảnh hưởng                      | Trạng thái                         |
| ---------- | ---------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------- | ---------------------------------- |
| 30/10/2026 | Toàn bộ BR trong business-rules.md | Chưa có tài liệu → bản nháp có nguồn/trạng thái                     | Yêu cầu ban đầu và câu trả lời cho phép tạo draft; đối chiếu BE docs/source | ADR-001–ADR-009 Proposed, không phải quyết định Accepted  | Toàn bộ roadmap; không tính tiến độ implement | Khởi tạo draft                     |
| 30/10/2026 | BR-AUTH-02                         | Phương thức đăng nhập chưa chốt → P0 email/mật khẩu, Google sau MVP | Người dùng trả lời câu hỏi trực tiếp trước khi tạo baseline                 | Chưa đổi kiến trúc đã duyệt; ADR-005/ADR-009 còn Proposed | P0-S2                                         | Có căn cứ, chưa phê duyệt baseline |
| 30/10/2026 | BR-DATA-02, BR-OFF-02              | Có đề xuất persist → ghi rõ chưa chốt, không tự bật                 | Người dùng chọn “Chưa chốt chính sách lưu trên thiết bị”                    | ADR-004/ADR-006 Proposed                                  | P0-S4, P2-S1                                  | Chờ xác nhận                       |

## Quy tắc ghi tiếp

Với BR đã duyệt, không sửa thầm lặng: ADR Proposed → chờ người dùng → Accepted → ghi ngày, BR, cũ/mới, lý do, ADR và phase/slice cụ thể → cập nhật phase đang chạy → implement. Bổ sung draft cũng ghi nguồn và trạng thái, không gọi là phê duyệt.

Không gán số ADR Auth trước khi có file thật và đủ legacy. Không dùng chỉ số UI mock/test pass để kết luận thay đổi nghiệp vụ đã được duyệt.
