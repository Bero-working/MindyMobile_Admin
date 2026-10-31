# P0-S2 — Login

`POST /auth/login` JSON `{email, password}`. UI trim email bằng schema hiện có, giữ nguyên password. 200 trả `{user, accessTokenExpiresAt}` cùng hai cookie HttpOnly. Validate schema rồi `GET /auth/me`, xác nhận cookie và user id khớp trước khi đưa user cho UI role gate.

401 → invalidCredentials (backend cũng dùng mã này cho tài khoản không ACTIVE); 429 → tooManyAttempts. Không refresh hoặc retry tự động login, không dùng dữ liệu mock. Me sau login lỗi phải chặn workspace; me trả user khác → invalidResponse. Password chỉ tồn tại trong input/request, không persist hoặc log. [Schema/error chung](README.md).
