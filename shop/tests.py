from pathlib import Path
from tempfile import TemporaryDirectory

from django.contrib import admin
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import TestCase, override_settings
from django.urls import reverse

from .models import Account, Category, InventoryReceipt, Order, OrderItem, Product


class StorefrontTests(TestCase):
    def setUp(self):
        self.user = Account.objects.create_user(
            username="buyer",
            password="Test-password-123",
            full_name="Người mua",
            role=Account.Role.CUSTOMER,
        )
        self.category = Category.objects.create(name="Áo")
        self.product = Product.objects.create(
            code="AO001",
            name="Áo thun",
            category=self.category,
            sale_price="120000",
            stock=5,
        )

    def test_storefront_pages_render(self):
        home_response = self.client.get(reverse("home"))
        self.assertEqual(home_response.status_code, 200)
        self.assertContains(home_response, "images/home-fashion-banner.jpg")
        self.assertContains(home_response, reverse("admin:index"), count=1)
        response = self.client.get(reverse("shop"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Áo thun")
        self.assertEqual(
            self.client.get(reverse("product_detail", args=[self.product.pk])).status_code,
            200,
        )

    def test_admin_login_page_is_reachable(self):
        response = self.client.get(reverse("admin:index"))
        self.assertRedirects(
            response,
            f"{reverse('admin:login')}?next={reverse('admin:index')}",
        )
        self.assertEqual(self.client.get(reverse("admin:login")).status_code, 200)

    def test_customer_login_form_rejects_admin_accounts(self):
        administrator = Account.objects.create_superuser(
            username="separate-admin",
            password="Admin-password-123",
            full_name="Quản trị viên",
        )
        response = self.client.post(
            reverse("login"),
            {
                "ten_dang_nhap": administrator.username,
                "mat_khau": "Admin-password-123",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "đăng nhập tại cổng quản trị viên")
        self.assertContains(response, reverse("admin:index"))
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_admin_account_can_sign_in_through_admin_portal(self):
        administrator = Account.objects.create_superuser(
            username="admin-portal",
            password="Admin-password-123",
            full_name="Quản trị viên",
        )
        response = self.client.post(
            reverse("admin:login"),
            {
                "username": administrator.username,
                "password": "Admin-password-123",
                "next": reverse("admin:index"),
            },
        )

        self.assertRedirects(response, reverse("admin:index"))
        self.assertEqual(int(self.client.session["_auth_user_id"]), administrator.pk)

    def test_superuser_can_manage_all_registered_store_models(self):
        administrator = Account.objects.create_superuser(
            username="store-admin",
            password="Admin-password-123",
            full_name="Quản trị cửa hàng",
        )
        self.client.force_login(administrator)
        admin_urls = [
            "admin:shop_account_changelist",
            "admin:shop_category_changelist",
            "admin:shop_contactmessage_changelist",
            "admin:shop_coupon_changelist",
            "admin:shop_customer_changelist",
            "admin:shop_employee_changelist",
            "admin:shop_inventoryreceipt_changelist",
            "admin:shop_order_changelist",
            "admin:shop_product_changelist",
            "admin:shop_shopsetting_changelist",
            "admin:auth_group_changelist",
        ]

        self.assertTrue(administrator.is_staff)
        self.assertTrue(administrator.is_superuser)
        for model in (
            Account,
            Category,
            InventoryReceipt,
            Order,
            Product,
        ):
            self.assertTrue(admin.site.is_registered(model))
        for admin_url in admin_urls:
            with self.subTest(admin_url=admin_url):
                self.assertEqual(self.client.get(reverse(admin_url)).status_code, 200)
        account_add_response = self.client.get(reverse("admin:shop_account_add"))
        self.assertEqual(account_add_response.status_code, 200)
        self.assertContains(account_add_response, 'name="is_superuser"')

    def test_seed_catalog_adds_mens_womens_and_shoe_products_idempotently(self):
        with TemporaryDirectory() as media_root, override_settings(MEDIA_ROOT=media_root):
            call_command("seed_catalog", verbosity=0)
            first_count = Product.objects.count()
            call_command("seed_catalog", verbosity=0)

        self.assertEqual(first_count, 15)
        self.assertEqual(Product.objects.count(), first_count)
        self.assertTrue(Category.objects.filter(name="Giày nam").exists())
        self.assertTrue(Category.objects.filter(name="Giày nữ").exists())
        self.assertTrue(Product.objects.filter(gender="Nam", category__name__startswith="Giày").exists())
        self.assertTrue(Product.objects.filter(gender="Nữ", category__name__startswith="Giày").exists())
        self.assertTrue((Path("frontend/public/images/products") / "red-sneakers.jpg").is_file())

    def test_checkout_decrements_stock_and_cancel_restores_it(self):
        self.client.force_login(self.user)
        self.client.post(
            reverse("cart_add"),
            {"san_pham_id": self.product.pk, "so_luong": 2},
        )
        response = self.client.post(
            reverse("checkout"),
            {
                "ho_ten": "Người mua",
                "so_dien_thoai": "0900000000",
                "email": "buyer@example.com",
                "dia_chi": "Hà Nội",
                "phuong_thuc_tt": Order.PaymentMethod.CASH,
            },
        )
        order = Order.objects.get(account=self.user)
        self.assertRedirects(response, reverse("order_detail", args=[order.pk]))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(order.total, 240000)

        response = self.client.post(reverse("cancel_order", args=[order.pk]))
        self.assertRedirects(response, reverse("my_orders"))
        self.product.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(order.status, Order.Status.CANCELLED)

    def test_guest_can_add_to_cart_and_place_order(self):
        response = self.client.post(
            reverse("cart_add"),
            {"san_pham_id": self.product.pk, "so_luong": 2},
        )
        self.assertRedirects(response, reverse("cart"))
        cart_response = self.client.get(reverse("cart"))
        self.assertContains(cart_response, "Áo thun")
        self.assertContains(cart_response, "Giỏ hàng")
        self.assertContains(cart_response, 'badge bg-danger">2')

        response = self.client.post(
            reverse("checkout"),
            {
                "ho_ten": "Khách mua",
                "so_dien_thoai": "0912345678",
                "email": "guest@example.com",
                "dia_chi": "Hồ Chí Minh",
                "phuong_thuc_tt": Order.PaymentMethod.CASH,
            },
        )
        order = Order.objects.get(customer__phone="0912345678")
        self.assertIsNone(order.account)
        self.assertRedirects(response, reverse("order_detail", args=[order.pk]))
        self.assertEqual(self.client.session.get("cart"), {})
        detail_response = self.client.get(reverse("order_detail", args=[order.pk]))
        self.assertEqual(detail_response.status_code, 200)
        self.assertContains(detail_response, order.code)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_guest_cannot_view_another_guest_order(self):
        order = Order.objects.create(
            code="DH-GUEST-PRIVATE",
            subtotal="120000",
            total="120000",
        )
        response = self.client.get(reverse("order_detail", args=[order.pk]))
        self.assertRedirects(response, reverse("login"))

    def test_dashboard_requires_staff_access(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("dashboard"))
        self.assertRedirects(response, reverse("home"))

        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        response = self.client.get(reverse("dashboard"))
        self.assertEqual(response.status_code, 200)

    def test_register_creates_customer_account(self):
        response = self.client.post(
            reverse("register"),
            {
                "ho_ten": "Khách mới",
                "ten_dang_nhap": "new-buyer",
                "mat_khau": "New-password-123",
                "xac_nhan": "New-password-123",
            },
        )
        self.assertRedirects(response, reverse("login"))
        account = Account.objects.get(username="new-buyer")
        self.assertEqual(account.role, Account.Role.CUSTOMER)
        self.assertTrue(account.check_password("New-password-123"))

    def test_profile_rejects_non_image_upload(self):
        self.client.force_login(self.user)
        response = self.client.post(
            reverse("profile"),
            {
                "full_name": self.user.full_name,
                "email": self.user.email,
                "phone": "",
                "address": "",
                "avatar": SimpleUploadedFile("not-an-image.png", b"not image", content_type="image/png"),
            },
        )
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertFalse(self.user.avatar)

    def test_staff_statistics_page_renders(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        self.client.force_login(self.user)
        response = self.client.get(reverse("statistics"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Thống kê và báo cáo")

    def test_staff_management_pages_render(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        self.client.force_login(self.user)
        self.assertEqual(self.client.get(reverse("store_management")).status_code, 200)
        self.assertEqual(self.client.get(reverse("manage_orders")).status_code, 200)
        self.assertEqual(self.client.get(reverse("inventory_receipts")).status_code, 200)
        self.assertContains(self.client.get(reverse("store_management")), "Quản lý cửa hàng")

    def test_staff_cancelling_order_restores_stock_once(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        self.client.force_login(self.user)
        order = Order.objects.create(
            code="DH-STAFF-001",
            account=self.user,
            subtotal="240000",
            total="240000",
        )
        self.product.stock = 3
        self.product.save(update_fields=["stock"])
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price="120000",
            line_total="240000",
        )

        response = self.client.post(
            reverse("update_order_status", args=[order.pk]),
            {"status": Order.Status.CANCELLED},
        )
        self.assertRedirects(response, reverse("manage_order_detail", args=[order.pk]))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

        self.client.post(
            reverse("update_order_status", args=[order.pk]),
            {"status": Order.Status.CANCELLED},
        )
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_staff_inventory_receipt_increases_product_stock(self):
        self.user.is_staff = True
        self.user.save(update_fields=["is_staff"])
        self.client.force_login(self.user)
        response = self.client.post(
            reverse("inventory_receipt_create"),
            {
                "supplier": "Nhà cung cấp",
                "product": self.product.pk,
                "quantity": "4",
                "unit_price": "55000",
                "note": "Nhập hàng kiểm thử",
            },
        )
        self.assertRedirects(response, reverse("inventory_receipts"))
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 9)
        self.assertEqual(self.product.cost_price, 55000)
        self.assertEqual(InventoryReceipt.objects.count(), 1)
