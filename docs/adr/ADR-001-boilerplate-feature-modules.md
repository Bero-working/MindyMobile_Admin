# ADR-001 — Giữ nền boilerplate và tổ chức feature module

## Status

**Accepted** — người dùng duyệt ngày 30/10/2026 (Asia/Bangkok) qua phản hồi: “Chốt tất cả adr 1->9”. Chấp nhận nội dung Decision của ADR này; các câu hỏi còn mở và cổng duyệt riêng tiếp tục giữ nguyên, phần phụ thuộc chưa được triển khai khi chưa đủ điều kiện.

## Ngày

30/10/2026 (Asia/Bangkok). Người soạn: Codex.

## Context

Checkout đang là React Native boilerplate 0.80.1/React 19.1.0 với src/shared, demo, Zustand và HTTP dummyjson. Người dùng yêu cầu feature-module, env/config/alias đồng bộ và ưu tiên Android MVP.

Nguồn: [danh mục căn cứ](../README.md#nguồn-và-thứ-tự-đối-chiếu), [hiện trạng/kiến trúc đích](../architecture.md).

## Decision

Đề xuất tái sử dụng checkout, tổ chức src/modules/<feature>/{screens,components,hooks,services,schemas,types,index.ts}, shared ở components/services/utils; chuyển cấu hình sang react-native-config và src/config/{env,app}.ts. Không nâng major RN hoặc tạo lại app khi chưa có căn cứ. Android nghiệm thu trước và iOS mốc sau cần xác nhận Q-PLAT-01. Q-ENV-01 phải chốt HTTP/HTTPS, port mapping và đường truy cập thiết bị trước API.

## Alternatives

Tạo app mới; giữ nguyên toàn bộ demo và config; nâng RN đồng thời. Các hướng này tăng phạm vi hoặc giữ cấu hình không phù hợp; chưa được chọn.

## Consequences

Phải rà code giữ lại, alias Babel/TS/Jest, Metro SVG + NativeWind, env và metadata. API_URL không được fallback sang dummyjson. Chưa quyết định dùng Zustand cho state nào ngoài server state; không dùng làm token store. Chưa git init vì workspace hiện không có .git.

## BR-slice bị ảnh hưởng

BR: `BR-SCOPE-01`, `BR-AUTH-02`, `BR-TIME-01` — xem [business-rules](../business-rules.md).
Slice: P0-S1–P0-S4; ảnh hưởng nền mọi phase — xem [kế hoạch](../implementation-plan.md).
Điểm còn thiếu: Q-ENV-01, Q-PLAT-01.

## Điều kiện chuyển trạng thái

Chỉ chuyển Accepted/Rejected theo phản hồi rõ ràng của người dùng, ghi ngày và nội dung quyết định. Nếu superseded, dẫn ADR thay thế đã tồn tại. Chấp nhận nguyên tắc chung không tự giải quyết các câu hỏi vẫn được đánh dấu chờ; phần phụ thuộc tiếp tục dừng.
