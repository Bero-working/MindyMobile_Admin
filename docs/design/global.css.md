# Token và CSS mẫu Mindy

Nguồn tham chiếu design theo [ADR-010](../adr/ADR-010-global-design-tokens-css.md); tên/định dạng theo [ADR-014](../adr/ADR-014-design-css-markdown-and-runtime-location.md). CSS dưới đây được giữ nguyên từ tài liệu trước chuyển đổi. Đây là CSS mẫu dành cho trình duyệt; stylesheet NativeWind của app nằm tại `src/global.css`. Các xung đột token và câu hỏi theme/design tiếp tục giữ nguyên.

## CSS tham chiếu

```css
/* =============================================================================
 * Mindy — global.css
 * Nguồn chuẩn token + CSS mẫu theo ADR-010 (docs/adr/ADR-010-global-design-tokens-css.md)
 *
 * Trích từ 3 mẫu trong docs/design (bundle Claude Design, đã giải nén để đối chiếu):
 *   [L] Login.html               — màn "Đăng nhập"
 *   [M] Mentor Mobile UI.html    — app Mentor (trang chủ, trang con, sheet, thông báo)
 *   [H] Thiết kế Home UI.html    — "Trang chủ quản lý"
 * Ngày trích: 30/10/2026.
 *
 * Quy tắc:
 *   - Chỉ chứa giá trị có trong mẫu. Không tự thêm dark palette / defaultTheme (Q-THEME-01).
 *   - Giá trị mâu thuẫn được giữ nguyên theo từng mẫu và ghi ở mục "XUNG ĐỘT CHỜ DUYỆT"
 *     cuối file; người phụ trách design quyết định, không tự chọn/trộn.
 *   - File này là tài liệu tham chiếu cho trình duyệt. KHÔNG phải stylesheet runtime của app
 *     React Native; khi triển khai, ánh xạ token sang theme CSS variables/NativeWind (ADR-003).
 *   - Bỏ qua phần khung thiết bị (android-frame.jsx, 412×892) và image-slot: là scaffold
 *     của công cụ design, không phải design của sản phẩm.
 *   - Tiền tố class: .mdy-  ;  tiền tố token: --mdy-
 * ========================================================================== */

/* -----------------------------------------------------------------------------
 * 0. FONT  [L][M][H]
 * Mẫu nhúng woff2 Be Vietnam Pro (400/500/600/700; subset vietnamese, latin-ext, latin)
 * và Material Symbols Rounded (font biến thiên, ligature). Nguồn gốc: Google Fonts.
 * --------------------------------------------------------------------------- */
@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

/* =============================================================================
 * 1. TOKENS
 * ========================================================================== */
:root {
  /* ---- 1.1 Màu thương hiệu (teal) ------------------------------------------ */
  --mdy-brand-900: #123236; /* đầu gradient header; pressed của nút primary */
  --mdy-brand-800: #1f4f55; /* primary: nút, icon nhấn, chip đang chọn, track switch bật */
  --mdy-brand-700: #2b6a71; /* cuối gradient header; nút primary khi loading */
  --mdy-link: #1f5f66; /* link, nút text, chữ chip "Sắp tới" */
  --mdy-link-hover: #123c41;

  /* Chữ/icon đặt trên nền brand (header) */
  --mdy-on-brand: #fff;
  --mdy-on-brand-muted: #c7dcd9; /* phụ đề header */
  --mdy-on-brand-accent: #9fe3d6; /* [M] chấm có buổi học trên lịch tuần (nền tối) */

  /* Tint teal trên nền sáng */
  --mdy-brand-tint-1: #eef4f3; /* hàng đang chọn, thông báo chưa đọc, pressed nhẹ */
  --mdy-brand-tint-2: #e4efed; /* pressed nút text, nền icon/chip trung tính teal */
  --mdy-brand-tint-3: #d9e6e4; /* nền avatar chữ cái */
  --mdy-brand-tint-4: #d7e9e5; /* quầng sáng nền màn (radial) */
  --mdy-brand-border: #cfe0dd; /* viền nút outline */
  --mdy-brand-border-soft: #d6e3e1; /* viền ô tiện ích, viền chip filter */
  --mdy-brand-dashed: #b9cfcb; /* viền nét đứt ô "thêm" */
  --mdy-brand-dashed-2: #a9c7c2; /* [M] viền nét đứt khối nháp */
  --mdy-brand-icon-muted: #8fb0ab; /* icon "add" trong ô nét đứt */
  --mdy-brand-disabled: #c9d6d4; /* [H] nền nút primary disabled */
  --mdy-progress-track: #e7ebe9; /* [M] rãnh thanh tiến độ */

  /* ---- 1.2 Trung tính (ấm) --------------------------------------------------- */
  --mdy-ink: #1c1b19; /* chữ chính; nền toast */
  --mdy-text-secondary: #6b6862; /* chữ phụ, icon trong input */
  --mdy-text-tertiary: #8a867e; /* chữ mờ, nhãn nhóm, footer */
  --mdy-text-placeholder: #a19d95; /* [L] placeholder input */
  --mdy-icon-disabled: #b5b1a9; /* radio/sao chưa chọn */

  --mdy-canvas: #e8e6e1; /* nền trang trình duyệt quanh khung máy */
  --mdy-bg: #f6f5f2; /* nền màn hình */
  --mdy-bg-sheet: #fbfaf8; /* nền bottom sheet */
  --mdy-surface: #fff; /* input, nút secondary, thẻ trắng */
  --mdy-surface-muted: #efede8; /* pressed trung tính; chip trạng thái trung tính (Nháp/Đã hủy) */
  --mdy-surface-muted-2: #f1efeb; /* pressed nút secondary; sọc placeholder */
  --mdy-surface-stripe: #ebe8e2; /* [H] sọc placeholder thứ 2 */
  --mdy-border: #e3e0da; /* viền input/nút secondary, đường kẻ "hoặc" */
  --mdy-divider: #ebe9e4; /* đường chia cột trong thẻ */
  --mdy-handle: #cfccc5; /* tay kéo sheet */
  --mdy-switch-off: #d7d4ce; /* [M] track switch tắt */

  /* Quầng sáng ấm của nền màn */
  --mdy-warm-glow: #f2e4d0;

  /* ---- 1.3 Màu trạng thái (cặp nền/chữ dùng cho chip, icon tròn) ------------- */
  --mdy-success-fg: #1d6b3a; /* Có mặt, Đã duyệt, Đã thanh toán, Đang diễn ra */
  --mdy-success-bg: #e3f0e6;
  --mdy-success-bg-soft: #eef6f0; /* [H] hộp thông tin "có người dạy thay" */

  --mdy-warning-fg: #8a4b06; /* Chờ duyệt, Chờ xác nhận, Ưu tiên */
  --mdy-warning-bg: #fbecd3;
  --mdy-warning-bg-soft: #fdf5e8; /* [H] thẻ cảnh báo */
  --mdy-warning-border: #f0dcb8; /* [H] */

  --mdy-danger-fg: #9a2f12; /* lỗi, Vắng, Từ chối */
  --mdy-danger-bg: #f8e1da; /* chip/icon tròn trạng thái lỗi */
  --mdy-danger-bg-soft: #fbeee9; /* hộp thông báo lỗi trong form */
  --mdy-danger-border: #e8c9bf; /* viền input lỗi */
  --mdy-danger-disabled: #d8c4bd; /* [H] nền nút "Từ chối" disabled */

  --mdy-info-fg: #274a8a; /* [M][H] loại file DOCX */
  --mdy-info-bg: #e1e8f6;

  --mdy-badge: #c2410c; /* badge số chưa đọc, nhãn "MỚI" */
  --mdy-star: #c98a12; /* sao tiện ích yêu thích đang bật */
  --mdy-toast-icon: #9fd3c9; /* icon check trong toast (nền tối) */

  /* ---- 1.4 Alpha / lớp phủ --------------------------------------------------- */
  --mdy-white-a95: rgba(255, 255, 255, 0.95);
  --mdy-white-a90: rgba(255, 255, 255, 0.9);
  --mdy-white-a80: rgba(255, 255, 255, 0.8);
  --mdy-white-a68: rgba(255, 255, 255, 0.68);
  --mdy-white-a60: rgba(255, 255, 255, 0.6);
  --mdy-white-a45: rgba(255, 255, 255, 0.45);
  --mdy-white-a35: rgba(255, 255, 255, 0.35);
  --mdy-white-a26: rgba(255, 255, 255, 0.26);
  --mdy-white-a24: rgba(255, 255, 255, 0.24);
  --mdy-white-a14: rgba(255, 255, 255, 0.14);
  --mdy-white-a10: rgba(255, 255, 255, 0.1);

  --mdy-scrim-sheet: rgba(20, 24, 24, 0.4); /* scrim sau bottom sheet */
  --mdy-scrim-popover: rgba(18, 30, 32, 0.32); /* scrim sau popover thông báo */

  /* ---- 1.5 Gradient ---------------------------------------------------------- */
  --mdy-gradient-header: linear-gradient(
    180deg,
    #123236 0%,
    #1f4f55 55%,
    #2b6a71 100%
  );
  --mdy-gradient-brand-diag: linear-gradient(
    140deg,
    #2b6a71,
    #1f4f55
  ); /* khối brand */
  --mdy-gradient-progress: linear-gradient(
    90deg,
    #2b6a71,
    #1f4f55
  ); /* [M] thanh tiến độ */
  --mdy-gradient-glass: linear-gradient(
    140deg,
    rgba(255, 255, 255, 0.9),
    rgba(255, 255, 255, 0.68)
  );
  --mdy-gradient-glass-on-brand: linear-gradient(
    140deg,
    rgba(255, 255, 255, 0.26),
    rgba(255, 255, 255, 0.1)
  );
  --mdy-gradient-placeholder: repeating-linear-gradient(
    135deg,
    #f1efeb 0,
    #f1efeb 8px,
    #ebe8e2 8px,
    #ebe8e2 16px
  ); /* [H] khung ảnh chưa có */

  /* Nền màn: 2 quầng sáng + --mdy-bg. Vị trí khác nhau giữa mẫu — xem XUNG ĐỘT #1 */
  --mdy-bg-screen-login:
    radial-gradient(circle at 0% 60%, #d7e9e5 0, rgba(215, 233, 229, 0) 45%),
    radial-gradient(circle at 100% 90%, #f2e4d0 0, rgba(242, 228, 208, 0) 45%),
    #f6f5f2;
  --mdy-bg-screen-app:
    radial-gradient(circle at 0% 45%, #d7e9e5 0, rgba(215, 233, 229, 0) 45%),
    radial-gradient(circle at 100% 75%, #f2e4d0 0, rgba(242, 228, 208, 0) 45%),
    #f6f5f2;

  /* ---- 1.6 Typography -------------------------------------------------------- */
  --mdy-font-sans: 'Be Vietnam Pro', system-ui, sans-serif;
  --mdy-font-mono: ui-monospace, Menlo, monospace; /* [H] mã/số tham chiếu */
  --mdy-font-icon: 'Material Symbols Rounded';

  --mdy-fs-9: 9px; /* nhãn "MỚI" */
  --mdy-fs-10: 10px; /* nhãn đuôi file trong ô icon */
  --mdy-fs-11: 11px; /* chip trạng thái, badge số, chú thích số liệu */
  --mdy-fs-12: 12px; /* lỗi field, nhãn nhóm, meta */
  --mdy-fs-13: 13px; /* chữ phụ, label input, nút text */
  --mdy-fs-14: 14px; /* nội dung, nút 44px, toast */
  --mdy-fs-15: 15px; /* input, nút 52px, tiêu đề thẻ lớp */
  --mdy-fs-16: 16px; /* tiêu đề thẻ */
  --mdy-fs-17: 17px; /* tiêu đề section, tên người dùng header */
  --mdy-fs-18: 18px; /* tiêu đề trang con, số thống kê nhỏ */
  --mdy-fs-20: 20px; /* tiêu đề thẻ đăng nhập, số thống kê */
  --mdy-fs-22: 22px;
  --mdy-fs-24: 24px;
  --mdy-fs-26: 26px;
  --mdy-fs-28: 28px; /* [H] */
  --mdy-fs-30: 30px; /* [L] logo chữ "Mindy" */

  --mdy-fw-regular: 400;
  --mdy-fw-medium: 500;
  --mdy-fw-semibold: 600; /* mặc định cho tiêu đề và nút */
  --mdy-fw-bold: 700; /* logo, số liệu, nhãn "MỚI" */

  --mdy-lh-1: 1;
  --mdy-lh-1-1: 1.1;
  --mdy-lh-1-3: 1.3;
  --mdy-lh-1-35: 1.35;
  --mdy-lh-1-4: 1.4;
  --mdy-lh-1-45: 1.45;
  --mdy-lh-1-5: 1.5;

  --mdy-ls-tight: -0.01em; /* [L] logo */
  --mdy-ls-caps: 0.04em; /* nhãn nhóm, nhãn "MỚI", đuôi file */

  /* ---- 1.7 Icon (Material Symbols Rounded) ----------------------------------- */
  --mdy-icon-wght-light: 'FILL' 0, 'wght' 300; /* mặc định */
  --mdy-icon-wght-regular: 'FILL' 0, 'wght' 400;
  --mdy-icon-wght-medium: 'FILL' 0, 'wght' 500;
  --mdy-icon-wght-semibold: 'FILL' 0, 'wght' 600;
  --mdy-icon-filled:
    'FILL' 1, 'wght' 400; /* trạng thái bật: checkbox, sao, chuông */
  --mdy-icon-14: 14px;
  --mdy-icon-16: 16px;
  --mdy-icon-18: 18px;
  --mdy-icon-20: 20px;
  --mdy-icon-22: 22px;
  --mdy-icon-24: 24px;
  --mdy-icon-26: 26px;

  /* ---- 1.8 Spacing (gap/padding) --------------------------------------------- */
  --mdy-space-1: 1px;
  --mdy-space-2: 2px;
  --mdy-space-3: 3px;
  --mdy-space-4: 4px;
  --mdy-space-6: 6px;
  --mdy-space-8: 8px;
  --mdy-space-10: 10px;
  --mdy-space-12: 12px;
  --mdy-space-14: 14px;
  --mdy-space-16: 16px; /* lề ngang màn hình */
  --mdy-space-18: 18px;
  --mdy-space-20: 20px;
  --mdy-space-24: 24px;
  --mdy-space-32: 32px;
  --mdy-screen-gutter: 16px;

  /* ---- 1.9 Kích thước -------------------------------------------------------- */
  --mdy-size-chip-sm: 22px; /* chip trạng thái, knob switch */
  --mdy-size-chip: 24px; /* chip "Ưu tiên" */
  --mdy-size-btn-xs: 32px; /* nút text nhỏ */
  --mdy-size-btn-icon-sm: 36px; /* nút icon lọc */
  --mdy-size-btn-icon: 40px; /* nút icon tròn, ô icon file */
  --mdy-size-btn-sm: 44px; /* nút hành động trong thẻ; nút chuông */
  --mdy-size-btn-md: 48px; /* [H] nút trong thẻ ưu tiên */
  --mdy-size-btn-lg: 52px; /* input, nút chính toàn chiều rộng, avatar header */
  --mdy-size-tile: 56px; /* ô tiện ích tròn */
  --mdy-size-tile-w: 60px; /* bề rộng cột tiện ích */
  --mdy-size-day: 64px; /* [M] ô ngày lịch tuần */
  --mdy-size-switch-w: 48px;
  --mdy-size-switch-h: 28px;
  --mdy-size-progress: 6px;
  --mdy-size-handle-w: 32px;
  --mdy-size-handle-h: 4px;
  --mdy-size-spinner: 18px;
  --mdy-size-screen-h: 812px; /* chiều cao vùng màn trong khung mẫu */

  /* ---- 1.10 Border / radius -------------------------------------------------- */
  --mdy-border-w: 1px;
  --mdy-border-w-dashed: 1.5px;
  --mdy-border-w-strong: 2px; /* viền badge, spinner */

  --mdy-radius-2: 2px; /* tay kéo sheet */
  --mdy-radius-3: 3px; /* thanh tiến độ */
  --mdy-radius-5: 5px; /* nhãn "MỚI" */
  --mdy-radius-10: 10px; /* badge số 20px */
  --mdy-radius-11: 11px; /* chip 22px */
  --mdy-radius-12: 12px; /* hộp lỗi, ô icon file, chip 24px */
  --mdy-radius-14: 14px; /* toast, switch */
  --mdy-radius-16: 16px; /* ô tiện ích dạng thẻ */
  --mdy-radius-18: 18px; /* ô ngày, tab */
  --mdy-radius-20: 20px; /* thẻ kính (card) */
  --mdy-radius-22: 22px; /* nút 44px */
  --mdy-radius-24: 24px; /* nút 48px */
  --mdy-radius-26: 26px; /* input/nút 52px */
  --mdy-radius-28: 28px; /* đáy header, đỉnh sheet/panel */
  --mdy-radius-pill: 99px;
  --mdy-radius-full: 50%;

  /* ---- 1.11 Shadow / blur ---------------------------------------------------- */
  --mdy-shadow-glass:
    inset 0 1px 0 rgba(255, 255, 255, 1),
    inset 0 -1px 1px rgba(31, 79, 85, 0.06), 0 8px 24px rgba(31, 79, 85, 0.1);
  --mdy-shadow-glass-tile:
    inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 8px 20px rgba(31, 79, 85, 0.12);
  --mdy-shadow-glass-on-brand: inset 0 1px 0 rgba(255, 255, 255, 0.45);
  --mdy-shadow-header: 0 10px 24px -8px rgba(18, 50, 54, 0.35);
  --mdy-shadow-fab: 0 6px 16px rgba(18, 50, 54, 0.25); /* nút đóng popover */
  --mdy-shadow-knob: 0 1px 3px rgba(0, 0, 0, 0.2);
  --mdy-shadow-popover: drop-shadow(0 18px 28px rgba(18, 50, 54, 0.28))
    drop-shadow(0 2px 6px rgba(18, 50, 54, 0.08)); /* dùng với filter: */

  --mdy-blur-glass: blur(18px) saturate(170%);
  --mdy-blur-glass-on-brand: blur(14px);

  /* ---- 1.12 Layer (z-index trong màn) ---------------------------------------- */
  --mdy-z-content: 1; /* phần nội dung đè lên header */
  --mdy-z-mascot: 2; /* ảnh linh vật đè lên thẻ */
  --mdy-z-subpage: 4; /* trang con trượt ngang */
  --mdy-z-sheet-scrim: 6;
  --mdy-z-sheet: 7;
  --mdy-z-toast: 8;
  --mdy-z-popover-scrim: 9;
  --mdy-z-popover: 10;
  --mdy-z-popover-close: 11;

  /* ---- 1.13 Motion ----------------------------------------------------------- */
  --mdy-dur-press: 0.12s;
  --mdy-dur-fast: 0.2s;
  --mdy-dur-base: 0.25s;
  --mdy-dur-scrim: 0.28s;
  --mdy-dur-slide: 0.32s;
  --mdy-dur-spin: 0.8s;
  --mdy-ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1); /* trang con, sheet */
  --mdy-ease-overshoot: cubic-bezier(
    0.2,
    0.9,
    0.25,
    1.12
  ); /* popover thông báo */
  --mdy-ease-out: ease-out;

  --mdy-press-scale-sm: 0.94; /* ô tiện ích, nút tròn */
  --mdy-press-scale-md: 0.97;
  --mdy-press-scale-lg: 0.98; /* nút trong thẻ */
  --mdy-press-scale-xl: 0.99; /* cả thẻ bấm được */
}

/* =============================================================================
 * 2. NỀN TẢNG  [L][M][H] — khối <style> chung của 3 mẫu
 * ========================================================================== */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

body {
  margin: 0;
  background: var(--mdy-canvas);
  font-family: var(--mdy-font-sans);
  -webkit-font-smoothing: antialiased;
}

a {
  color: var(--mdy-link);
}

a:hover {
  color: var(--mdy-link-hover);
}

*::-webkit-scrollbar {
  display: none;
}

input::placeholder {
  color: var(--mdy-text-placeholder);
}

/* Icon font — giữ nguyên class Google cung cấp, bổ sung mặc định của mẫu */
.material-symbols-rounded,
.mdy-icon {
  font-family: var(--mdy-font-icon);
  font-weight: normal;
  font-style: normal;
  font-size: var(--mdy-icon-22);
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  font-variation-settings: var(--mdy-icon-wght-light);
  -webkit-font-feature-settings: 'liga';
  -webkit-font-smoothing: antialiased;
}

.mdy-icon--regular {
  font-variation-settings: var(--mdy-icon-wght-regular);
}
.mdy-icon--medium {
  font-variation-settings: var(--mdy-icon-wght-medium);
}
.mdy-icon--semibold {
  font-variation-settings: var(--mdy-icon-wght-semibold);
}
.mdy-icon--filled {
  font-variation-settings: var(--mdy-icon-filled);
}

/* =============================================================================
 * 3. LAYOUT MÀN HÌNH
 * ========================================================================== */

/* Vùng màn — nền quầng sáng (biến thể theo mẫu ở mục 5) */
.mdy-screen {
  position: relative;
  height: var(--mdy-size-screen-h);
  background: var(--mdy-bg-screen-app);
  font-family: var(--mdy-font-sans);
  color: var(--mdy-ink);
  overflow: hidden;
}

.mdy-scroll {
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
  scrollbar-width: none;
}

/* Header gradient teal, bo đáy 28px */
.mdy-header {
  background: var(--mdy-gradient-header);
  box-shadow: var(--mdy-shadow-header);
  border-radius: 0 0 var(--mdy-radius-28) var(--mdy-radius-28);
  display: flex;
  flex-direction: column;
  color: var(--mdy-on-brand);
}

.mdy-header__title {
  font-size: var(--mdy-fs-17);
  font-weight: var(--mdy-fw-semibold);
}

.mdy-header__subtitle {
  font-size: var(--mdy-fs-13);
  color: var(--mdy-on-brand-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Vùng nội dung kéo lên chồng header */
.mdy-overlap {
  position: relative;
  z-index: var(--mdy-z-content);
  display: flex;
  flex-direction: column;
  padding: 0 var(--mdy-screen-gutter);
}

/* Ảnh linh vật (mascot) trang trí */
.mdy-mascot {
  position: absolute;
  height: auto;
  pointer-events: none;
}

/* Tiêu đề section: "Tiện ích yêu thích", ... */
.mdy-section-head {
  padding: var(--mdy-space-24) var(--mdy-space-16) 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mdy-section-title {
  font-size: var(--mdy-fs-17);
  font-weight: var(--mdy-fw-semibold);
}

/* Nhãn nhóm viết hoa nhỏ */
.mdy-group-label {
  font-size: var(--mdy-fs-12);
  font-weight: var(--mdy-fw-semibold);
  color: var(--mdy-text-tertiary);
  letter-spacing: var(--mdy-ls-caps);
  padding: 0 var(--mdy-space-4);
}

/* Panel bo đỉnh 28px nằm dưới header trang con */
.mdy-panel {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: var(--mdy-z-content);
  border-radius: var(--mdy-radius-28) var(--mdy-radius-28) 0 0;
  background: var(--mdy-bg-screen-app);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Trang con trượt ngang từ phải */
.mdy-subpage {
  position: absolute;
  inset: 0;
  z-index: var(--mdy-z-subpage);
  background: var(--mdy-bg-screen-app);
  transition: transform var(--mdy-dur-slide) var(--mdy-ease-standard);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* =============================================================================
 * 4. THÀNH PHẦN DÙNG CHUNG
 * ========================================================================== */

/* ---- 4.1 Thẻ kính (glass card) — dùng nhiều nhất trong cả 3 mẫu ------------ */
.mdy-glass {
  display: flex;
  flex-direction: column;
  border-radius: var(--mdy-radius-20);
  background: var(--mdy-gradient-glass);
  backdrop-filter: var(--mdy-blur-glass);
  -webkit-backdrop-filter: var(--mdy-blur-glass);
  border: var(--mdy-border-w) solid var(--mdy-white-a95);
  box-shadow: var(--mdy-shadow-glass);
}

.mdy-glass--pressable {
  cursor: pointer;
}
.mdy-glass--pressable:active {
  transform: scale(var(--mdy-press-scale-xl));
}

/* Khối nét đứt (nháp / thêm mới) */
.mdy-dashed-card {
  display: flex;
  flex-direction: column;
  gap: var(--mdy-space-14);
  padding: var(--mdy-space-16);
  border-radius: var(--mdy-radius-20);
  border: var(--mdy-border-w-dashed) dashed var(--mdy-brand-dashed-2);
  background: var(--mdy-white-a60);
}

/* ---- 4.2 Nút ---------------------------------------------------------------- */
.mdy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--mdy-space-8);
  border: none;
  cursor: pointer;
  font:
    var(--mdy-fw-semibold) var(--mdy-fs-15) 'Be Vietnam Pro',
    sans-serif;
  height: var(--mdy-size-btn-lg);
  border-radius: var(--mdy-radius-26);
}

.mdy-btn--md {
  height: var(--mdy-size-btn-md);
  border-radius: var(--mdy-radius-24);
  font-size: var(--mdy-fs-14);
}

.mdy-btn--sm {
  height: var(--mdy-size-btn-sm);
  border-radius: var(--mdy-radius-22);
  font-size: var(--mdy-fs-14);
}

.mdy-btn--sm:active,
.mdy-btn--md:active {
  transform: scale(var(--mdy-press-scale-lg));
}

/* Primary */
.mdy-btn--primary {
  background: var(--mdy-brand-800);
  color: var(--mdy-on-brand);
}
.mdy-btn--primary:active {
  background: var(--mdy-brand-900);
}
.mdy-btn--primary.is-loading {
  background: var(--mdy-brand-700);
}
.mdy-btn--primary:disabled {
  background: var(--mdy-brand-disabled);
  cursor: default;
}

/* Secondary (nền trắng, viền trung tính) — [L] "Tiếp tục với Google" */
.mdy-btn--secondary {
  background: var(--mdy-surface);
  color: var(--mdy-ink);
  border: var(--mdy-border-w) solid var(--mdy-border);
  gap: var(--mdy-space-10);
}
.mdy-btn--secondary:active {
  background: var(--mdy-surface-muted-2);
}

/* Outline teal — "Phòng 301", "Gỡ xuất bản" */
.mdy-btn--outline {
  background: var(--mdy-surface);
  color: var(--mdy-brand-800);
  border: var(--mdy-border-w) solid var(--mdy-brand-border);
}

/* Danger — [H] "Từ chối" */
.mdy-btn--danger {
  background: var(--mdy-danger-fg);
  color: var(--mdy-on-brand);
}
.mdy-btn--danger:disabled {
  background: var(--mdy-danger-disabled);
  cursor: default;
}

/* Nút text — "Quên mật khẩu?", "Sửa", "Xem lịch" */
.mdy-btn-text {
  display: flex;
  align-items: center;
  gap: var(--mdy-space-4);
  height: var(--mdy-size-btn-xs);
  padding: 0 var(--mdy-space-6);
  border: none;
  background: transparent;
  border-radius: var(--mdy-radius-16);
  cursor: pointer;
  color: var(--mdy-link);
  font:
    var(--mdy-fw-semibold) var(--mdy-fs-13) 'Be Vietnam Pro',
    sans-serif;
}
.mdy-btn-text:active {
  background: var(--mdy-brand-tint-2);
}

/* Nút icon tròn trên nền sáng */
.mdy-btn-icon {
  flex: none;
  width: var(--mdy-size-btn-icon);
  height: var(--mdy-size-btn-icon);
  border-radius: var(--mdy-radius-full);
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mdy-text-secondary);
  padding: 0;
}
.mdy-btn-icon:active {
  background: var(--mdy-surface-muted);
}
.mdy-btn-icon--tint {
  background: var(--mdy-brand-tint-2);
  color: var(--mdy-brand-800);
}

/* Nút icon kính trên header (chuông, quay lại) */
.mdy-btn-glass {
  position: relative;
  flex: none;
  width: var(--mdy-size-btn-sm);
  height: var(--mdy-size-btn-sm);
  border-radius: var(--mdy-radius-full);
  box-sizing: border-box;
  background: var(--mdy-gradient-glass-on-brand);
  backdrop-filter: var(--mdy-blur-glass-on-brand);
  -webkit-backdrop-filter: var(--mdy-blur-glass-on-brand);
  border: var(--mdy-border-w) solid var(--mdy-white-a35);
  box-shadow: var(--mdy-shadow-glass-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mdy-on-brand);
}
.mdy-btn-glass:active {
  background: var(--mdy-white-a24);
}

/* Spinner trong nút */
.mdy-spinner {
  width: var(--mdy-size-spinner);
  height: var(--mdy-size-spinner);
  border-radius: var(--mdy-radius-full);
  box-sizing: border-box;
  border: var(--mdy-border-w-strong) solid var(--mdy-white-a35);
  border-top-color: var(--mdy-on-brand);
  animation: spin var(--mdy-dur-spin) linear infinite;
}
.mdy-spinner--on-light {
  border-color: var(--mdy-border);
  border-top-color: var(--mdy-brand-800);
}

/* ---- 4.3 Form ([L]) --------------------------------------------------------- */
.mdy-field {
  display: flex;
  flex-direction: column;
  gap: var(--mdy-space-6);
}

.mdy-field__label {
  font-size: var(--mdy-fs-13);
  font-weight: var(--mdy-fw-medium);
  padding: 0 var(--mdy-space-4);
}

.mdy-field__control {
  height: var(--mdy-size-btn-lg);
  border-radius: var(--mdy-radius-26);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: var(--mdy-space-10);
  padding: 0 var(--mdy-space-18);
  background: var(--mdy-surface);
  border: var(--mdy-border-w) solid var(--mdy-border);
}
.mdy-field__control--with-action {
  padding: 0 var(--mdy-space-6) 0 var(--mdy-space-18); /* có nút hiện mật khẩu */
}
.mdy-field__control.is-invalid {
  border-color: var(--mdy-danger-border);
}
.mdy-field__control > .mdy-icon {
  color: var(--mdy-text-secondary);
}

.mdy-field__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font:
    var(--mdy-fw-regular) var(--mdy-fs-15) 'Be Vietnam Pro',
    sans-serif;
  color: var(--mdy-ink);
}

.mdy-field__error {
  font-size: var(--mdy-fs-12);
  color: var(--mdy-danger-fg);
  padding: 0 var(--mdy-space-4);
}

/* Hộp lỗi trong form */
.mdy-alert-error {
  display: flex;
  gap: var(--mdy-space-8);
  align-items: flex-start;
  font-size: var(--mdy-fs-13);
  line-height: var(--mdy-lh-1-45);
  color: var(--mdy-danger-fg);
  background: var(--mdy-danger-bg-soft);
  border-radius: var(--mdy-radius-12);
  padding: var(--mdy-space-10) var(--mdy-space-12);
}
.mdy-alert-error--compact {
  gap: var(--mdy-space-6);
  font-size: var(--mdy-fs-12);
  padding: var(--mdy-space-8) var(--mdy-space-10);
}

/* Đường kẻ "hoặc" */
.mdy-or {
  display: flex;
  align-items: center;
  gap: var(--mdy-space-12);
  font-size: var(--mdy-fs-12);
  color: var(--mdy-text-tertiary);
}
.mdy-or::before,
.mdy-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--mdy-border);
}

/* Switch ([M] mở/khoá chương) */
.mdy-switch {
  flex: none;
  width: var(--mdy-size-switch-w);
  height: var(--mdy-size-switch-h);
  border-radius: var(--mdy-radius-14);
  border: none;
  background: var(--mdy-switch-off);
  padding: var(--mdy-space-3);
  box-sizing: border-box;
  display: flex;
  justify-content: flex-start;
  cursor: pointer;
  transition: background var(--mdy-dur-fast);
}
.mdy-switch.is-on {
  background: var(--mdy-brand-800);
  justify-content: flex-end;
}
.mdy-switch__knob {
  width: var(--mdy-size-chip-sm);
  height: var(--mdy-size-chip-sm);
  border-radius: var(--mdy-radius-full);
  background: var(--mdy-surface);
  box-shadow: var(--mdy-shadow-knob);
}

/* ---- 4.4 Chip / badge ------------------------------------------------------- */
/* Chip trạng thái: dùng data-tone="success|warning|danger|info|brand|neutral" */
.mdy-chip {
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: var(--mdy-space-4);
  height: var(--mdy-size-chip-sm);
  padding: 0 var(--mdy-space-8);
  border-radius: var(--mdy-radius-11);
  font-size: var(--mdy-fs-11);
  font-weight: var(--mdy-fw-semibold);
}
.mdy-chip .mdy-icon {
  font-size: var(--mdy-icon-14);
  font-variation-settings: var(--mdy-icon-wght-medium);
}
.mdy-chip--md {
  height: var(--mdy-size-chip);
  padding: 0 var(--mdy-space-10) 0 var(--mdy-space-8);
  border-radius: var(--mdy-radius-12);
  font-size: var(--mdy-fs-12);
}
.mdy-chip--md .mdy-icon {
  font-size: var(--mdy-icon-16);
}
.mdy-chip--pill {
  height: auto;
  padding: var(--mdy-space-4) 9px;
  border-radius: var(--mdy-radius-pill);
}

.mdy-chip[data-tone='success'] {
  background: var(--mdy-success-bg);
  color: var(--mdy-success-fg);
}
.mdy-chip[data-tone='warning'] {
  background: var(--mdy-warning-bg);
  color: var(--mdy-warning-fg);
}
.mdy-chip[data-tone='danger'] {
  background: var(--mdy-danger-bg);
  color: var(--mdy-danger-fg);
}
.mdy-chip[data-tone='info'] {
  background: var(--mdy-info-bg);
  color: var(--mdy-info-fg);
}
.mdy-chip[data-tone='brand'] {
  background: var(--mdy-brand-tint-2);
  color: var(--mdy-link);
}
.mdy-chip[data-tone='neutral'] {
  background: var(--mdy-surface-muted);
  color: var(--mdy-text-secondary);
}

/* Chip filter trên nền kính */
.mdy-filter-chip {
  border: var(--mdy-border-w) solid var(--mdy-brand-border-soft);
  background: var(--mdy-white-a80);
  color: var(--mdy-brand-800);
  cursor: pointer;
}
.mdy-filter-chip.is-selected {
  border-color: var(--mdy-brand-800);
  background: var(--mdy-brand-800);
  color: var(--mdy-on-brand);
}

/* Badge số chưa đọc (đặt trên nút chuông) */
.mdy-count-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  min-width: 20px;
  height: 20px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: var(--mdy-radius-10);
  background: var(--mdy-badge);
  color: var(--mdy-on-brand);
  font-size: var(--mdy-fs-11);
  font-weight: var(--mdy-fw-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  border: var(--mdy-border-w-strong) solid var(--mdy-brand-800);
}

/* Nhãn "MỚI" */
.mdy-new-tag {
  height: 18px;
  padding: 0 var(--mdy-space-6);
  border-radius: var(--mdy-radius-5);
  background: var(--mdy-badge);
  color: var(--mdy-on-brand);
  font-size: var(--mdy-fs-9);
  font-weight: var(--mdy-fw-bold);
  letter-spacing: var(--mdy-ls-caps);
  display: flex;
  align-items: center;
}

/* ---- 4.5 Avatar / ô icon / tiện ích ----------------------------------------- */
.mdy-avatar {
  width: var(--mdy-size-btn-lg);
  height: var(--mdy-size-btn-lg);
  border-radius: var(--mdy-radius-full);
  border: none;
  background: var(--mdy-brand-tint-3);
  color: var(--mdy-brand-800);
  display: flex;
  align-items: center;
  justify-content: center;
  font:
    var(--mdy-fw-semibold) var(--mdy-fs-18) 'Be Vietnam Pro',
    sans-serif;
  flex: none;
  padding: 0;
}

/* Ô icon file (PDF/MP4/DOCX…): màu nền/chữ lấy theo tone trạng thái */
.mdy-file-icon {
  width: var(--mdy-size-btn-icon);
  height: var(--mdy-size-btn-icon);
  border-radius: var(--mdy-radius-12);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  font-size: var(--mdy-fs-10);
  font-weight: var(--mdy-fw-bold);
  letter-spacing: var(--mdy-ls-caps);
}

/* Tiện ích yêu thích: cột 60px, ô tròn kính 56px */
.mdy-util {
  flex: none;
  width: var(--mdy-size-tile-w);
  border: none;
  background: transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mdy-space-8);
  cursor: pointer;
  padding: 0;
  font-family: 'Be Vietnam Pro', sans-serif;
  color: var(--mdy-ink);
  transition: transform var(--mdy-dur-press);
}
.mdy-util:active {
  transform: scale(var(--mdy-press-scale-sm));
}
.mdy-util__tile {
  position: relative;
  width: var(--mdy-size-tile);
  height: var(--mdy-size-tile);
  border-radius: var(--mdy-radius-full);
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--mdy-blur-glass);
  -webkit-backdrop-filter: var(--mdy-blur-glass);
  border: var(--mdy-border-w) solid var(--mdy-white-a90);
  box-shadow: var(--mdy-shadow-glass-tile);
}
.mdy-util__tile .mdy-icon {
  font-size: var(--mdy-icon-26);
}
.mdy-util__tile--add {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  border: var(--mdy-border-w-dashed) dashed var(--mdy-brand-dashed);
}
.mdy-util__tile--add .mdy-icon {
  font-size: var(--mdy-icon-24);
  color: var(--mdy-brand-icon-muted);
}
.mdy-util__star {
  color: var(--mdy-icon-disabled);
}
.mdy-util__star.is-on {
  color: var(--mdy-star);
  font-variation-settings: var(--mdy-icon-filled);
}

/* ---- 4.6 Danh sách / tiến độ / chia cột ------------------------------------- */
.mdy-row {
  background: transparent;
}
.mdy-row.is-selected,
.mdy-row.is-unread {
  background: var(--mdy-brand-tint-1);
}

.mdy-progress {
  height: var(--mdy-size-progress);
  border-radius: var(--mdy-radius-3);
  background: var(--mdy-progress-track);
  overflow: hidden;
}
.mdy-progress__bar {
  height: 100%;
  border-radius: var(--mdy-radius-3);
  background: var(--mdy-gradient-progress);
}

.mdy-col-divider {
  padding-right: var(--mdy-space-16);
  border-right: var(--mdy-border-w) solid var(--mdy-divider);
}

.mdy-image-placeholder {
  border: var(--mdy-border-w) solid var(--mdy-border);
  background: var(--mdy-gradient-placeholder);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ---- 4.7 Lớp phủ: bottom sheet, popover thông báo, toast --------------------- */
.mdy-scrim {
  position: absolute;
  inset: 0;
  z-index: var(--mdy-z-sheet-scrim);
  background: var(--mdy-scrim-sheet);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--mdy-dur-base);
}
.mdy-scrim.is-open {
  opacity: 1;
  pointer-events: auto;
}

.mdy-sheet {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--mdy-z-sheet);
  max-height: 88%;
  background: var(--mdy-bg-sheet);
  border-radius: var(--mdy-radius-28) var(--mdy-radius-28) 0 0;
  transform: translateY(100%);
  transition: transform var(--mdy-dur-slide) var(--mdy-ease-standard);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.mdy-sheet.is-open {
  transform: translateY(0);
}
.mdy-sheet__handle {
  width: var(--mdy-size-handle-w);
  height: var(--mdy-size-handle-h);
  border-radius: var(--mdy-radius-2);
  background: var(--mdy-handle);
}

.mdy-popover-scrim {
  position: absolute;
  inset: 0;
  z-index: var(--mdy-z-popover-scrim);
  background: var(--mdy-scrim-popover);
  transition: opacity var(--mdy-dur-scrim) var(--mdy-ease-out);
}

/* Popover thông báo phóng ra từ nút chuông (góc phải trên) */
.mdy-popover {
  position: absolute;
  z-index: var(--mdy-z-popover);
  left: var(--mdy-screen-gutter);
  right: var(--mdy-screen-gutter);
  transform-origin: calc(100% - 22px) -10px;
  filter: var(--mdy-shadow-popover);
  transition:
    transform var(--mdy-dur-slide) var(--mdy-ease-overshoot),
    opacity var(--mdy-dur-fast) var(--mdy-ease-out);
}

.mdy-popover-close {
  position: absolute;
  z-index: var(--mdy-z-popover-close);
  right: var(--mdy-screen-gutter);
  width: var(--mdy-size-btn-sm);
  height: var(--mdy-size-btn-sm);
  border-radius: var(--mdy-radius-full);
  box-sizing: border-box;
  background: #ffffff;
  border: none;
  box-shadow: var(--mdy-shadow-fab);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--mdy-brand-800);
  transition: opacity var(--mdy-dur-fast) var(--mdy-ease-out);
}

.mdy-toast {
  position: absolute;
  left: var(--mdy-screen-gutter);
  right: var(--mdy-screen-gutter);
  bottom: var(--mdy-space-24);
  z-index: var(--mdy-z-toast);
  background: var(--mdy-ink);
  color: var(--mdy-on-brand);
  border-radius: var(--mdy-radius-14);
  padding: var(--mdy-space-14) var(--mdy-space-16);
  font-size: var(--mdy-fs-14);
  display: flex;
  align-items: center;
  gap: var(--mdy-space-10);
  opacity: 0;
  transform: translateY(12px);
  transition:
    opacity var(--mdy-dur-base),
    transform var(--mdy-dur-base);
  pointer-events: none;
}
.mdy-toast.is-visible {
  opacity: 1;
  transform: translateY(0);
}
.mdy-toast .mdy-icon {
  font-size: var(--mdy-icon-20);
  color: var(--mdy-toast-icon);
}

/* =============================================================================
 * 5. STYLE RIÊNG TỪNG MẪU (có phạm vi)
 * ========================================================================== */

/* ---- 5.1 [L] Đăng nhập ------------------------------------------------------ */
.mdy-login {
  background: var(--mdy-bg-screen-login);
  display: flex;
  flex-direction: column;
}
.mdy-login .mdy-header {
  flex: none;
  position: relative;
  padding: 56px 24px 96px;
  gap: var(--mdy-space-6);
  overflow: hidden;
}
.mdy-login__brand {
  font-size: var(--mdy-fs-30);
  font-weight: var(--mdy-fw-bold);
  letter-spacing: var(--mdy-ls-tight);
}
.mdy-login__tagline {
  font-size: var(--mdy-fs-15);
  line-height: var(--mdy-lh-1-45);
  color: var(--mdy-on-brand-muted);
  max-width: 200px;
  text-wrap: pretty;
}
.mdy-login .mdy-mascot {
  right: 20px;
  bottom: 63px;
  width: 96px;
}
.mdy-login .mdy-overlap {
  flex: 1;
  min-height: 0;
  margin-top: -64px;
}
.mdy-login .mdy-glass {
  gap: var(--mdy-space-16);
  padding: 24px 16px 20px;
}
.mdy-login__card-title {
  font-size: var(--mdy-fs-20);
  font-weight: var(--mdy-fw-semibold);
}
.mdy-login__card-sub {
  font-size: var(--mdy-fs-13);
  color: var(--mdy-text-secondary);
}
.mdy-login__footer {
  margin-top: auto;
  padding: 20px 8px 24px;
  text-align: center;
  font-size: var(--mdy-fs-12);
  line-height: var(--mdy-lh-1-5);
  color: var(--mdy-text-tertiary);
  text-wrap: pretty;
}

/* ---- 5.2 [M][H] Trang chủ (Mentor + Quản lý) -------------------------------- */
.mdy-home .mdy-header {
  padding: 20px 16px 120px;
  gap: var(--mdy-space-20);
}
.mdy-home .mdy-overlap {
  margin-top: -50px;
}
.mdy-home .mdy-mascot {
  left: -17px;
  top: -57px;
  width: 125px;
  z-index: var(--mdy-z-mascot);
}
.mdy-home .mdy-glass--hero {
  position: relative;
  z-index: var(--mdy-z-content);
  padding: 24px 16px 16px;
}
.mdy-home .mdy-favs {
  display: flex;
  gap: var(--mdy-space-16);
  padding: 14px 16px 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

/* ---- 5.3 [M] Trang con Mentor: header + lịch tuần --------------------------- */
.mdy-mentor-subpage .mdy-header__title {
  font-size: var(--mdy-fs-18);
}
.mdy-mentor-subpage .mdy-panel {
  margin-top: -28px;
}
.mdy-week {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--mdy-space-4);
}
.mdy-week__day {
  height: var(--mdy-size-day);
  border-radius: var(--mdy-radius-18);
  border: none;
  background: transparent;
  color: var(--mdy-on-brand);
}
.mdy-week__day.is-today {
  background: var(--mdy-white-a14);
}
.mdy-week__day.is-selected {
  background: var(--mdy-surface);
  color: var(--mdy-brand-900);
}
.mdy-week__dot {
  background: var(--mdy-on-brand-accent);
}
.mdy-week__day.is-selected .mdy-week__dot {
  background: var(--mdy-brand-800);
}

/* ---- 5.4 [H] Tab trên header quản lý ---------------------------------------- */
.mdy-manager-tab {
  flex: none;
  padding: 0 22px;
  border-radius: var(--mdy-radius-18) var(--mdy-radius-18) 0 0;
  border: none;
  font:
    var(--mdy-fw-semibold) var(--mdy-fs-14) 'Be Vietnam Pro',
    sans-serif;
  cursor: pointer;
  white-space: nowrap;
  transition: height var(--mdy-dur-fast);
}

/* =============================================================================
 * 6. XUNG ĐỘT CHỜ DUYỆT (không tự chọn — người phụ trách design quyết định)
 * -----------------------------------------------------------------------------
 * #1 Vị trí quầng sáng nền màn:
 *      [L]    teal 0% 60%, ấm 100% 90%   → --mdy-bg-screen-login
 *      [M][H] teal 0% 45%, ấm 100% 75%   → --mdy-bg-screen-app
 *    Có thể là chủ đích (màn đăng nhập khác bố cục). Cần xác nhận giữ 2 biến thể hay gộp.
 *
 * #2 Accent sáng trên nền teal tối: #9fd3c9 (icon toast [L][M][H]) và #9fe3d6 (chấm lịch [M]).
 *    Hai giá trị gần nhau cho cùng vai trò "điểm nhấn trên nền tối"; chưa rõ có chủ đích.
 *
 * #3 Bo góc chip dạng viên thuốc biểu diễn khác nhau: 11px (cao 22), 12px (cao 24), 99px
 *    (padding 4px 9px). Cả ba đều cho hình pill; cần chốt 1 token radius cho chip.
 *
 * #4 Màu trắng ghi hai cách #fff và #ffffff (cùng giá trị, chỉ khác cú pháp) — không phải
 *    xung đột thị giác; đã dùng --mdy-surface trừ .mdy-popover-close giữ nguyên #ffffff.
 *
 * #5 Nút chính có 3 cỡ: 52px [L][M][H], 48px [H], 44px [M][H]; pressed khác nhau:
 *    đổi nền #123236 (52/48px) và scale(.98) (44px). Cần xác nhận quy tắc cỡ/pressed.
 *
 * #6 Hai màu teal cho chữ nhấn: --mdy-brand-800 #1f4f55 (icon/nút) và --mdy-link #1f5f66
 *    (link/nút text). Giữ nguyên cả hai như mẫu.
 *
 * #7 Nền hộp nhạt cạnh tone lỗi: #f8e1da (chip/icon) và #fbeee9 (hộp lỗi form). Giữ 2 token.
 *
 * Ngoài phạm vi mẫu (chưa có căn cứ, không tạo token): dark palette, defaultTheme
 * (Q-THEME-01), breakpoint/responsive ngoài khung 412×892.
 * ========================================================================== */
```
