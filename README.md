# csv1

Website tĩnh để quản lý bảng thiết bị và xem trước PDF khi bấm vào cột `Loại thiết bị`.

## Cách dùng

1. Mở `index.html` bằng trình duyệt.
2. Chọn `User` để vào thẳng, hoặc chọn `Admin` và đăng nhập bằng tài khoản `giang`, mật khẩu `giang123`.
3. Chế độ `User` chỉ xem bảng và bấm `Loại thiết bị` để xem PDF.
4. Chế độ `Admin` được upload CSV, thêm/sửa/xóa dòng và gắn file PDF.
5. Bấm `Thêm dòng` để nhập tay dữ liệu, hoặc `Tải CSV` để nạp bảng có sẵn.
6. Bấm `Gắn PDF` trên từng dòng để upload file PDF tương ứng. Chế độ `Admin` sẽ giữ PDF gốc không watermark.
7. Tên file PDF sẽ được tự động điền vào cột `Loại thiết bị`; nếu chưa đúng thì admin sửa trực tiếp trong ô này.
8. Bấm vào giá trị trong cột `Loại thiết bị` để xem file PDF.

Dữ liệu và PDF được lưu trong IndexedDB của chính trình duyệt đang dùng. Nếu đổi máy, đổi trình duyệt, xóa site data hoặc dùng chế độ ẩn danh thì dữ liệu có thể không còn.

## Định dạng CSV

Hàng đầu tiên là header. App sẽ nhận các cột sau:

- `Loại thiết bị`
- `Tên nhà sản xuất`
- `SL`
- `Đời máy (Model)`
- `Công suất`
- `Đơn vị sở hữu`
- `Thời hạn kiểm định`
- `Biển số`

Tên cột có thể viết có dấu hoặc không dấu.
