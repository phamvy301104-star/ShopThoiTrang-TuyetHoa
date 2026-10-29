from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Account(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Quản trị viên"
        STAFF = "nhanvien", "Nhân viên"
        CUSTOMER = "nguoidung", "Khách hàng"

    full_name = models.CharField("Họ tên", max_length=100)
    role = models.CharField("Vai trò", max_length=20, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField("Số điện thoại", max_length=15, blank=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    avatar = models.ImageField("Ảnh đại diện", upload_to="avatars/", blank=True)
    birth_date = models.DateField("Ngày sinh", null=True, blank=True)
    gender = models.CharField("Giới tính", max_length=10, blank=True)
    height = models.DecimalField("Chiều cao", max_digits=5, decimal_places=1, null=True, blank=True)
    weight = models.DecimalField("Cân nặng", max_digits=5, decimal_places=1, null=True, blank=True)
    chest = models.DecimalField("Vòng 1", max_digits=5, decimal_places=1, null=True, blank=True)
    waist = models.DecimalField("Vòng 2", max_digits=5, decimal_places=1, null=True, blank=True)
    hips = models.DecimalField("Vòng 3", max_digits=5, decimal_places=1, null=True, blank=True)
    google_id = models.CharField(max_length=255, blank=True)

    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "Tài khoản"
        verbose_name_plural = "Tài khoản"

    def __str__(self):
        return self.full_name or self.username


class Category(models.Model):
    name = models.CharField("Tên danh mục", max_length=100)
    description = models.CharField("Mô tả", max_length=255, blank=True)
    is_active = models.BooleanField("Đang hoạt động", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Danh mục"
        verbose_name_plural = "Danh mục"

    def __str__(self):
        return self.name


class Product(models.Model):
    code = models.CharField("Mã sản phẩm", max_length=20, unique=True)
    name = models.CharField("Tên sản phẩm", max_length=200)
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    cost_price = models.DecimalField("Giá nhập", max_digits=15, decimal_places=2, default=0)
    sale_price = models.DecimalField("Giá bán", max_digits=15, decimal_places=2, default=0)
    stock = models.PositiveIntegerField("Số lượng", default=0)
    size = models.CharField("Kích thước", max_length=10, blank=True)
    color = models.CharField("Màu sắc", max_length=50, blank=True)
    material = models.CharField("Chất liệu", max_length=100, blank=True)
    image = models.ImageField("Ảnh sản phẩm", upload_to="products/", blank=True)
    description = models.TextField("Mô tả", blank=True)
    gender = models.CharField("Giới tính", max_length=20, default="Unisex")
    is_active = models.BooleanField("Đang bán", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sản phẩm"
        verbose_name_plural = "Sản phẩm"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Customer(models.Model):
    full_name = models.CharField("Họ tên", max_length=100)
    phone = models.CharField("Số điện thoại", max_length=15, blank=True)
    email = models.EmailField("Email", blank=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    gender = models.CharField("Giới tính", max_length=10, default="Khac")
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"

    def __str__(self):
        return self.full_name


class Employee(models.Model):
    code = models.CharField("Mã nhân viên", max_length=20, unique=True)
    full_name = models.CharField("Họ tên", max_length=100)
    phone = models.CharField("Số điện thoại", max_length=15, blank=True)
    email = models.EmailField("Email", blank=True)
    address = models.CharField("Địa chỉ", max_length=255, blank=True)
    gender = models.CharField("Giới tính", max_length=10, default="Khac")
    position = models.CharField("Chức vụ", max_length=50, blank=True)
    salary = models.DecimalField("Lương", max_digits=15, decimal_places=2, default=0)
    start_date = models.DateField("Ngày vào làm", null=True, blank=True)
    is_active = models.BooleanField("Đang làm việc", default=True)
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL, related_name="employee_records")
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        verbose_name = "Nhân viên"
        verbose_name_plural = "Nhân viên"

    def __str__(self):
        return f"{self.code} - {self.full_name}"


class Coupon(models.Model):
    class DiscountType(models.TextChoices):
        PERCENT = "phan_tram", "Phần trăm"
        AMOUNT = "tien", "Số tiền"

    code = models.CharField("Mã giảm giá", max_length=50, unique=True)
    description = models.CharField("Mô tả", max_length=255, blank=True)
    discount_type = models.CharField("Loại giảm", max_length=20, choices=DiscountType.choices, default=DiscountType.PERCENT)
    value = models.DecimalField("Giá trị", max_digits=15, decimal_places=2, default=0)
    minimum_order = models.DecimalField("Đơn tối thiểu", max_digits=15, decimal_places=2, default=0)
    quantity = models.PositiveIntegerField("Số lượng", default=1)
    used_count = models.PositiveIntegerField("Đã sử dụng", default=0)
    starts_at = models.DateTimeField("Ngày bắt đầu", default=timezone.now)
    ends_at = models.DateTimeField("Ngày kết thúc", null=True, blank=True)
    is_active = models.BooleanField("Đang hoạt động", default=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        verbose_name = "Mã giảm giá"
        verbose_name_plural = "Mã giảm giá"

    def __str__(self):
        return self.code


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = "cho_xac_nhan", "Chờ xác nhận"
        CONFIRMED = "da_xac_nhan", "Đã xác nhận"
        SHIPPING = "dang_giao", "Đang giao"
        DELIVERED = "da_giao", "Đã giao"
        CANCELLED = "da_huy", "Đã hủy"

    class PaymentMethod(models.TextChoices):
        CASH = "tien_mat", "Tiền mặt"
        TRANSFER = "chuyen_khoan", "Chuyển khoản"
        CARD = "the", "Thẻ"

    code = models.CharField("Mã đơn hàng", max_length=20, unique=True)
    customer = models.ForeignKey(Customer, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    employee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name="orders")
    ordered_at = models.DateTimeField("Ngày đặt", default=timezone.now)
    subtotal = models.DecimalField("Tổng tiền", max_digits=15, decimal_places=2, default=0)
    discount = models.DecimalField("Giảm giá", max_digits=15, decimal_places=2, default=0)
    total = models.DecimalField("Thanh toán", max_digits=15, decimal_places=2, default=0)
    payment_method = models.CharField("Phương thức thanh toán", max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    status = models.CharField("Trạng thái", max_length=20, choices=Status.choices, default=Status.PENDING)
    note = models.TextField("Ghi chú", blank=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Đơn hàng"
        verbose_name_plural = "Đơn hàng"

    def __str__(self):
        return self.code


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField("Số lượng", validators=[MinValueValidator(1)])
    unit_price = models.DecimalField("Đơn giá", max_digits=15, decimal_places=2)
    line_total = models.DecimalField("Thành tiền", max_digits=15, decimal_places=2)

    class Meta:
        verbose_name = "Chi tiết đơn hàng"
        verbose_name_plural = "Chi tiết đơn hàng"

    def __str__(self):
        return f"{self.order.code} - {self.product.name}"


class InventoryReceipt(models.Model):
    code = models.CharField("Mã phiếu", max_length=20, unique=True)
    employee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL, related_name="receipts")
    supplier = models.CharField("Nhà cung cấp", max_length=200, blank=True)
    received_at = models.DateTimeField("Ngày nhập", default=timezone.now)
    total = models.DecimalField("Tổng tiền", max_digits=15, decimal_places=2, default=0)
    note = models.TextField("Ghi chú", blank=True)
    created_at = models.DateTimeField("Ngày tạo", auto_now_add=True)

    class Meta:
        verbose_name = "Phiếu nhập hàng"
        verbose_name_plural = "Phiếu nhập hàng"

    def __str__(self):
        return self.code


class InventoryReceiptItem(models.Model):
    receipt = models.ForeignKey(InventoryReceipt, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="receipt_items")
    quantity = models.PositiveIntegerField("Số lượng", validators=[MinValueValidator(1)])
    unit_price = models.DecimalField("Đơn giá", max_digits=15, decimal_places=2)
    line_total = models.DecimalField("Thành tiền", max_digits=15, decimal_places=2)

    class Meta:
        verbose_name = "Chi tiết phiếu nhập"
        verbose_name_plural = "Chi tiết phiếu nhập"


class ShopSetting(models.Model):
    key = models.CharField("Khóa", max_length=100, unique=True)
    value = models.TextField("Giá trị", blank=True)
    updated_at = models.DateTimeField("Ngày cập nhật", auto_now=True)

    class Meta:
        verbose_name = "Cài đặt"
        verbose_name_plural = "Cài đặt"

    def __str__(self):
        return self.key


class ContactMessage(models.Model):
    account = models.ForeignKey(Account, null=True, blank=True, on_delete=models.SET_NULL, related_name="contact_messages")
    full_name = models.CharField("Họ tên", max_length=100)
    email = models.EmailField("Email", blank=True)
    subject = models.CharField("Chủ đề", max_length=200)
    message = models.TextField("Nội dung")
    reply = models.TextField("Phản hồi", blank=True)
    is_replied = models.BooleanField("Đã phản hồi", default=False)
    sent_at = models.DateTimeField("Ngày gửi", auto_now_add=True)

    class Meta:
        ordering = ["-sent_at"]
        verbose_name = "Liên hệ"
        verbose_name_plural = "Liên hệ"

    def __str__(self):
        return self.subject
