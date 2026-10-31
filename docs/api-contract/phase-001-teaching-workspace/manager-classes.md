# P1-S6 — Manager classes

GET `/manager/classes`, role MANAGER. Query page/pageSize/status/q; q được trim, UI debounce 300ms/maxLength=100. Response MentorClassPageDto theo controller manager operations, không dùng list tối giản `/management/classes`. Map thông tin lớp, ngày, hình thức, mentor và chỗ trống từ server. Không thêm branch selector hoặc action tạo lớp. Số từng trạng thái dùng total từ pageSize=1. Xem [quy tắc chung](README.md).
