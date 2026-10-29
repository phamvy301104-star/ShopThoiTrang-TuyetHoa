from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Account,
    Category,
    ContactMessage,
    Coupon,
    Customer,
    Employee,
    InventoryReceipt,
    InventoryReceiptItem,
    Order,
    OrderItem,
    Product,
    ShopSetting,
)

admin.site.site_header = "Quản trị Shop Thời Trang"
admin.site.site_title = "Quản trị Shop Thời Trang"
admin.site.index_title = "Quản lý toàn bộ cửa hàng"


@admin.register(Account)
class AccountAdmin(UserAdmin):
    list_display = ("username", "full_name", "email", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_active")
    fieldsets = UserAdmin.fieldsets + (
        ("Thông tin webshop", {"fields": ("full_name", "role", "phone", "address", "avatar", "birth_date", "gender", "height", "weight", "chest", "waist", "hips", "google_id")}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ("Thông tin webshop", {"fields": ("full_name", "role", "email")}),
        ("Quyền quản trị", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
    )


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class ReceiptItemInline(admin.TabularInline):
    model = InventoryReceiptItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("code", "customer", "total", "status", "payment_method", "created_at")
    list_filter = ("status", "payment_method", "created_at")
    search_fields = ("code", "customer__full_name", "customer__phone", "account__username")
    inlines = [OrderItemInline]


@admin.register(InventoryReceipt)
class InventoryReceiptAdmin(admin.ModelAdmin):
    list_display = ("code", "supplier", "total", "received_at")
    search_fields = ("code", "supplier")
    inlines = [ReceiptItemInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "category", "sale_price", "stock", "is_active")
    list_filter = ("category", "is_active", "gender")
    search_fields = ("code", "name")


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active", "created_at")
    search_fields = ("name",)


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ("full_name", "phone", "email", "created_at")
    search_fields = ("full_name", "phone", "email")


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ("code", "full_name", "position", "is_active")
    list_filter = ("is_active", "position")
    search_fields = ("code", "full_name", "email")


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "quantity", "used_count", "is_active")
    list_filter = ("discount_type", "is_active")
    search_fields = ("code",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("subject", "full_name", "email", "is_replied", "sent_at")
    list_filter = ("is_replied", "sent_at")
    search_fields = ("subject", "full_name", "email")


admin.site.register(ShopSetting)
