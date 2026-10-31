# P0-S1 — Bootstrap

`GET /auth/me` với credentials; 200 là UserDto trực tiếp. Không tin user/role local. 401 → `POST /auth/refresh` không body; 200 trả `{user, accessTokenExpiresAt}` và xoay cookie. Các restore đồng thời dùng chung refresh promise, không refresh vòng lặp.

Refresh 401 → login với sessionExpired. Me 404 USER_NOT_FOUND hoặc user status không ACTIVE → login với accountInactive. Offline/timeout/server/DTO sai → bootstrap error có retry; không tự chuyển sang login hoặc workspace khi chưa xác minh được phiên. Signed-out xóa cache Query.

Refresh token chỉ gửi theo native cookie path `/api/v1/auth/refresh`; không lưu token hoặc role trong MMKV. [Schema/error chung](README.md).
