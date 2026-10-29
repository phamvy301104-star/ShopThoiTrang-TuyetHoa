from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("trang-chu/", views.home, name="home"),
    path("cua-hang/", views.shop, name="shop"),
    path("san-pham-chi-tiet/<int:product_id>/", views.product_detail, name="product_detail"),
    path("dang-nhap/", views.login_view, name="login"),
    path("dang-ky/", views.register_view, name="register"),
    path("dang-xuat/", views.logout_view, name="logout"),
    path("doi-mat-khau/", views.change_password, name="change_password"),
    path("gio-hang/", views.cart, name="cart"),
    path("gio-hang/them/", views.cart_add, name="cart_add"),
    path("gio-hang/cap-nhat/", views.cart_update, name="cart_update"),
    path("gio-hang/xoa/<int:product_id>/", views.cart_remove, name="cart_remove"),
    path("dat-hang/", views.checkout, name="checkout"),
    path("don-hang-cua-toi/", views.my_orders, name="my_orders"),
    path("don-hang-cua-toi/<int:order_id>/", views.order_detail, name="order_detail"),
    path("don-hang-cua-toi/huy/<int:order_id>/", views.cancel_order, name="cancel_order"),
    path("lien-he-user/", views.contact, name="contact"),
    path("thong-tin/", views.profile, name="profile"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("quan-ly/", views.store_management, name="store_management"),
    path("quan-ly/don-hang/", views.manage_orders, name="manage_orders"),
    path("quan-ly/don-hang/<int:order_id>/", views.manage_order_detail, name="manage_order_detail"),
    path("quan-ly/don-hang/<int:order_id>/cap-nhat/", views.update_order_status, name="update_order_status"),
    path("quan-ly/nhap-hang/", views.inventory_receipts, name="inventory_receipts"),
    path("quan-ly/nhap-hang/them/", views.inventory_receipt_create, name="inventory_receipt_create"),
    path("thong-ke/", views.statistics, name="statistics"),
]
