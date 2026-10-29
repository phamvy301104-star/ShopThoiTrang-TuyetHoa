# Webshop Thời Trang

Ứng dụng đang được chuyển sang Django templates để mở và phát triển trong PyCharm. Bản Django dùng SQLite và tạo cơ sở dữ liệu mới; dữ liệu SQL Server cũ không được chuyển sang.

## Chạy bằng PyCharm

Cách nhanh trên máy Windows có thể chạy trực tiếp file `setup_windows.bat` trong thư mục dự án. Script sẽ cài dependencies, tạo database bằng migrations, thêm dữ liệu mẫu và mở máy chủ.

1. Mở thư mục gốc `ShopThoiTrang-TuyetHoa` trong PyCharm.
2. Tạo môi trường Python trong Terminal nếu chưa có:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   python -m pip install -r requirements.txt
   ```

3. Tạo database và dữ liệu mẫu, sau đó chạy máy chủ:

   ```powershell
   python manage.py migrate
   python manage.py seed_catalog
   python manage.py createsuperuser
   python manage.py runserver
   ```

   `db.sqlite3` không được lưu trên GitHub, nên **bắt buộc chạy `python manage.py migrate` sau khi clone** trước lần mở trang đầu tiên.

4. Mở `http://127.0.0.1:8000/`. Chọn **Đăng nhập quản trị** trên thanh điều hướng hoặc mở `http://127.0.0.1:8000/django-admin/`.

### Khắc phục lỗi `no such table: shop_category`

Lỗi này có nghĩa database local chưa được tạo bảng. Trong Terminal của PyCharm, chạy từ thư mục có `manage.py`:

```powershell
python manage.py migrate
python manage.py seed_catalog
python manage.py runserver
```

Sau đó tải lại trang bằng `http://127.0.0.1:8000/`.

Đăng nhập quản trị cần tài khoản superuser; tạo tài khoản quản trị có toàn quyền lần đầu bằng `python manage.py createsuperuser`. Không có tài khoản/mật khẩu quản trị mặc định. Khu vực quản trị Django quản lý sản phẩm, danh mục, đơn hàng, khách hàng, nhân viên, tài khoản/nhóm quyền, mã giảm giá, liên hệ, phiếu nhập kho và cài đặt. Lệnh `seed_catalog` thêm danh mục và 14 sản phẩm mẫu quần áo nam/nữ, giày nam/nữ và unisex kèm ảnh; có thể chạy lại mà không nhân đôi dữ liệu. Tạo tài khoản người mua từ trang Đăng ký.

## Thành phần chính

- `shop/`: models, views, routes và Django admin.
- `templates/shop/`: giao diện Django templates.
- `webshopthoitrang/`: settings và cấu hình URL/WSGI.
- `frontend/public/`: CSS và tài nguyên tĩnh hiện được Django sử dụng.
- `db.sqlite3`: database local, được tạo tự động bởi Django migrations.

Mã Node.js, React và các EJS templates cũ đã được gỡ bỏ. Bản Django có trang chủ, cửa hàng, đơn hàng khách mua và khu vực quản lý cửa hàng cho nhân viên; khu vực quản lý hỗ trợ xử lý trạng thái đơn hàng, sản phẩm, danh mục, khách hàng, nhân viên, mã giảm giá, liên hệ, cài đặt và tạo phiếu nhập kho cập nhật tồn kho. Chatbot và tích hợp thanh toán trực tuyến chưa có trong bản Django.

Trong môi trường production, đặt `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0` và `DJANGO_ALLOWED_HOSTS` bằng biến môi trường riêng; không dùng secret mặc định dành cho phát triển local.
