from decimal import Decimal, InvalidOperation
from functools import wraps

from django.contrib import messages
from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Count, F, Q, Sum
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from .forms import ProfileForm
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
)


def staff_required(view_func):
    @login_required
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        if not request.user.is_staff:
            messages.error(request, "Bạn không có quyền truy cập khu vực quản trị.")
            return redirect("home")
        return view_func(request, *args, **kwargs)

    return wrapped


def home(request):
    categories = Category.objects.filter(is_active=True)
    products = Product.objects.filter(is_active=True, stock__gt=0).select_related("category")[:8]
    return render(request, "shop/home.html", {"categories": categories, "products": products})


def shop(request):
    products = Product.objects.filter(is_active=True, stock__gt=0).select_related("category")
    query = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "").strip()
    gender = request.GET.get("gender", "").strip()
    if query:
        products = products.filter(Q(name__icontains=query) | Q(code__icontains=query))
    if category_id.isdigit():
        products = products.filter(category_id=int(category_id))
    if gender:
        products = products.filter(gender=gender)
    page_obj = Paginator(products, 12).get_page(request.GET.get("page"))
    return render(
        request,
        "shop/shop.html",
        {
            "page_obj": page_obj,
            "categories": Category.objects.filter(is_active=True),
            "query": query,
            "selected_category": category_id,
            "selected_gender": gender,
        },
    )


def product_detail(request, product_id):
    product = get_object_or_404(Product, pk=product_id, is_active=True)
    related = Product.objects.filter(
        is_active=True, stock__gt=0, category=product.category
    ).exclude(pk=product.pk)[:4]
    return render(request, "shop/product_detail.html", {"product": product, "related": related})


def login_view(request):
    if request.user.is_authenticated:
        return redirect("admin:index" if request.user.is_staff else "home")
    if request.method == "POST":
        username = request.POST.get("ten_dang_nhap", "").strip()
        password = request.POST.get("mat_khau", "")
        user = authenticate(request, username=username, password=password)
        if user is not None and user.is_active:
            if user.is_staff:
                messages.error(
                    request,
                    "Tài khoản quản trị vui lòng đăng nhập tại cổng quản trị viên.",
                )
                return render(request, "shop/auth/login.html")
            login(request, user)
            return redirect("home")
        messages.error(request, "Tên đăng nhập hoặc mật khẩu không đúng.")
    return render(request, "shop/auth/login.html")


def register_view(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        full_name = request.POST.get("ho_ten", "").strip()
        username = request.POST.get("ten_dang_nhap", "").strip()
        password = request.POST.get("mat_khau", "")
        confirmation = request.POST.get("xac_nhan", "")
        if not full_name or not username or not password:
            messages.error(request, "Vui lòng nhập đầy đủ thông tin.")
        elif len(password) < 8:
            messages.error(request, "Mật khẩu phải có ít nhất 8 ký tự.")
        elif password != confirmation:
            messages.error(request, "Mật khẩu xác nhận không khớp.")
        elif Account.objects.filter(username=username).exists():
            messages.error(request, "Tên đăng nhập đã tồn tại.")
        else:
            user = Account.objects.create_user(
                username=username,
                password=password,
                full_name=full_name,
                role=Account.Role.CUSTOMER,
            )
            messages.success(request, "Đăng ký thành công. Vui lòng đăng nhập.")
            return redirect("login")
    return render(request, "shop/auth/register.html")


def logout_view(request):
    if request.method == "POST":
        logout(request)
    return redirect("home")


@login_required
def change_password(request):
    form = PasswordChangeForm(request.user, request.POST or None)
    if request.method == "POST" and form.is_valid():
        user = form.save()
        update_session_auth_hash(request, user)
        messages.success(request, "Đổi mật khẩu thành công.")
        return redirect("profile")
    return render(request, "shop/auth/change_password.html", {"form": form})


def _cart_items(request):
    cart = request.session.get("cart", {})
    product_ids = [int(key) for key in cart if str(key).isdigit()]
    products = Product.objects.filter(pk__in=product_ids, is_active=True)
    items = []
    for product in products:
        quantity = min(max(int(cart.get(str(product.pk), 0)), 1), product.stock)
        if quantity:
            items.append({"product": product, "quantity": quantity, "line_total": product.sale_price * quantity})
    return items


def cart(request):
    items = _cart_items(request)
    return render(
        request,
        "shop/cart.html",
        {"items": items, "subtotal": sum((item["line_total"] for item in items), Decimal("0"))},
    )


def cart_add(request):
    if request.method != "POST":
        return redirect("shop")
    product_id = request.POST.get("san_pham_id", "")
    try:
        product_id = int(product_id)
        quantity = int(request.POST.get("so_luong", "1"))
    except (TypeError, ValueError):
        messages.error(request, "Thông tin sản phẩm không hợp lệ.")
        return redirect("shop")
    product = get_object_or_404(Product, pk=product_id, is_active=True)
    if quantity < 1 or quantity > product.stock:
        messages.error(request, "Số lượng không hợp lệ hoặc vượt quá tồn kho.")
        return redirect("product_detail", product_id=product.pk)
    cart_data = request.session.get("cart", {})
    key = str(product.pk)
    new_quantity = int(cart_data.get(key, 0)) + quantity
    if new_quantity > product.stock:
        messages.error(request, "Số lượng trong giỏ vượt quá tồn kho.")
    else:
        cart_data[key] = new_quantity
        request.session["cart"] = cart_data
        messages.success(request, "Đã thêm sản phẩm vào giỏ hàng.")
    return redirect("cart")


def cart_update(request):
    if request.method == "POST":
        try:
            product_id = str(int(request.POST.get("san_pham_id", "")))
            quantity = int(request.POST.get("so_luong", "0"))
        except (TypeError, ValueError):
            messages.error(request, "Thông tin số lượng không hợp lệ.")
            return redirect("cart")
        cart_data = request.session.get("cart", {})
        product = Product.objects.filter(pk=product_id, is_active=True).first()
        if quantity <= 0:
            cart_data.pop(product_id, None)
        elif product is None or quantity > product.stock:
            messages.error(request, "Số lượng vượt quá tồn kho.")
        else:
            cart_data[product_id] = quantity
        request.session["cart"] = cart_data
    return redirect("cart")


def cart_remove(request, product_id):
    if request.method == "POST":
        cart_data = request.session.get("cart", {})
        cart_data.pop(str(product_id), None)
        request.session["cart"] = cart_data
        messages.success(request, "Đã xóa sản phẩm khỏi giỏ hàng.")
    return redirect("cart")


def checkout(request):
    items = _cart_items(request)
    if not items:
        messages.error(request, "Giỏ hàng đang trống.")
        return redirect("cart")
    subtotal = sum((item["line_total"] for item in items), Decimal("0"))
    if request.method == "POST":
        full_name = request.POST.get("ho_ten", "").strip()
        phone = request.POST.get("so_dien_thoai", "").strip()
        email = request.POST.get("email", "").strip()
        address = request.POST.get("dia_chi", "").strip()
        payment_method = request.POST.get("phuong_thuc_tt", Order.PaymentMethod.CASH)
        if not full_name or not phone or not address:
            messages.error(request, "Vui lòng nhập họ tên, số điện thoại và địa chỉ.")
            return render(request, "shop/checkout.html", {"items": items, "subtotal": subtotal})
        if payment_method not in Order.PaymentMethod.values:
            messages.error(request, "Phương thức thanh toán không hợp lệ.")
            return render(request, "shop/checkout.html", {"items": items, "subtotal": subtotal})

        coupon = None
        discount = Decimal("0")
        coupon_code = request.POST.get("ma_giam_gia", "").strip().upper()
        if coupon_code:
            coupon = Coupon.objects.filter(
                code=coupon_code,
                is_active=True,
                starts_at__lte=timezone.now(),
            ).filter(Q(ends_at__isnull=True) | Q(ends_at__gte=timezone.now())).first()
            if coupon is None or coupon.used_count >= coupon.quantity or subtotal < coupon.minimum_order:
                messages.error(request, "Mã giảm giá không hợp lệ, hết hạn hoặc chưa đạt mức đơn tối thiểu.")
                return render(request, "shop/checkout.html", {"items": items, "subtotal": subtotal})
            discount = subtotal * coupon.value / Decimal("100") if coupon.discount_type == Coupon.DiscountType.PERCENT else coupon.value
            discount = min(discount, subtotal)

        try:
            with transaction.atomic():
                customer = Customer.objects.filter(phone=phone).first()
                if customer is None:
                    customer = Customer.objects.create(
                        phone=phone, full_name=full_name, email=email, address=address
                    )
                else:
                    customer.full_name = full_name
                    customer.email = email
                    customer.address = address
                    customer.save(update_fields=["full_name", "email", "address"])
                order = Order.objects.create(
                    code=f"DH{timezone.now():%y%m%d%H%M%S%f}",
                    customer=customer,
                    account=request.user if request.user.is_authenticated else None,
                    coupon=coupon,
                    subtotal=subtotal,
                    discount=discount,
                    total=max(subtotal - discount, Decimal("0")),
                    payment_method=payment_method,
                    note=request.POST.get("ghi_chu", "").strip(),
                )
                for item in items:
                    product = Product.objects.select_for_update().get(pk=item["product"].pk)
                    if product.stock < item["quantity"]:
                        raise ValueError(f"Sản phẩm {product.name} không đủ tồn kho.")
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item["quantity"],
                        unit_price=product.sale_price,
                        line_total=product.sale_price * item["quantity"],
                    )
                    product.stock -= item["quantity"]
                    product.save(update_fields=["stock"])
                if coupon:
                    coupon.used_count += 1
                    coupon.save(update_fields=["used_count"])
        except (ValueError, Product.DoesNotExist) as error:
            messages.error(request, str(error))
            return redirect("cart")

        request.session["cart"] = {}
        if not request.user.is_authenticated:
            request.session["guest_order_id"] = order.pk
        messages.success(request, f"Đặt hàng thành công. Mã đơn hàng: {order.code}")
        return redirect("order_detail", order_id=order.pk)

    return render(request, "shop/checkout.html", {"items": items, "subtotal": subtotal})


@login_required
def my_orders(request):
    orders = Order.objects.filter(account=request.user).prefetch_related("items")
    page_obj = Paginator(orders, 10).get_page(request.GET.get("page"))
    return render(request, "shop/orders.html", {"page_obj": page_obj})


def order_detail(request, order_id):
    order = get_object_or_404(Order.objects.prefetch_related("items__product"), pk=order_id)
    owns_order = request.user.is_authenticated and order.account_id == request.user.pk
    is_guest_order = (
        not request.user.is_authenticated
        and order.account_id is None
        and request.session.get("guest_order_id") == order.pk
    )
    if not (owns_order or is_guest_order):
        messages.error(request, "Bạn không có quyền xem đơn hàng này.")
        return redirect("login" if not request.user.is_authenticated else "my_orders")
    return render(request, "shop/order_detail.html", {"order": order})


@login_required
def cancel_order(request, order_id):
    if request.method != "POST":
        return redirect("my_orders")
    with transaction.atomic():
        order = get_object_or_404(Order.objects.select_for_update(), pk=order_id, account=request.user)
        if order.status != Order.Status.PENDING:
            messages.error(request, "Chỉ có thể hủy đơn hàng đang chờ xác nhận.")
            return redirect("order_detail", order_id=order.pk)
        for item in order.items.select_related("product"):
            product = Product.objects.select_for_update().get(pk=item.product_id)
            product.stock += item.quantity
            product.save(update_fields=["stock"])
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
    messages.success(request, "Đã hủy đơn hàng.")
    return redirect("my_orders")


@login_required
def contact(request):
    if request.method == "POST":
        full_name = request.POST.get("ho_ten", "").strip()
        subject = request.POST.get("chu_de", "").strip()
        content = request.POST.get("noi_dung", "").strip()
        if not full_name or not subject or not content:
            messages.error(request, "Vui lòng nhập đầy đủ họ tên, chủ đề và nội dung.")
        else:
            ContactMessage.objects.create(
                account=request.user,
                full_name=full_name,
                email=request.POST.get("email", request.user.email).strip(),
                subject=subject,
                message=content,
            )
            messages.success(request, "Gửi liên hệ thành công. Chúng tôi sẽ phản hồi sớm nhất.")
            return redirect("contact")
    history = ContactMessage.objects.filter(account=request.user)[:10]
    return render(request, "shop/contact.html", {"history": history})


@login_required
def profile(request):
    form = ProfileForm(request.POST or None, request.FILES or None, instance=request.user)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Đã cập nhật thông tin cá nhân.")
        return redirect("profile")
    return render(request, "shop/profile.html", {"form": form})


@staff_required
def dashboard(request):
    today = timezone.localdate()
    context = {
        "product_count": Product.objects.count(),
        "order_count": Order.objects.count(),
        "customer_count": Customer.objects.count(),
        "employee_count": Employee.objects.count(),
        "receipt_count": InventoryReceipt.objects.count(),
        "today_revenue": Order.objects.filter(status=Order.Status.DELIVERED, created_at__date=today).aggregate(total=Sum("total"))["total"] or Decimal("0"),
        "recent_orders": Order.objects.select_related("customer").all()[:8],
        "low_stock": Product.objects.filter(is_active=True, stock__lte=5).order_by("stock")[:8],
    }
    return render(request, "shop/dashboard.html", context)


@staff_required
def store_management(request):
    context = {
        "product_count": Product.objects.count(),
        "category_count": Category.objects.count(),
        "order_count": Order.objects.count(),
        "pending_order_count": Order.objects.filter(status=Order.Status.PENDING).count(),
        "customer_count": Customer.objects.count(),
        "low_stock_count": Product.objects.filter(is_active=True, stock__lte=5).count(),
        "recent_orders": Order.objects.select_related("customer")[:5],
    }
    return render(request, "shop/store_management.html", context)


@staff_required
def manage_orders(request):
    orders = Order.objects.select_related("customer").all()
    status = request.GET.get("status", "").strip()
    query = request.GET.get("q", "").strip()
    if status in Order.Status.values:
        orders = orders.filter(status=status)
    else:
        status = ""
    if query:
        orders = orders.filter(
            Q(code__icontains=query)
            | Q(customer__full_name__icontains=query)
            | Q(customer__phone__icontains=query)
        )
    page_obj = Paginator(orders, 20).get_page(request.GET.get("page"))
    return render(
        request,
        "shop/staff/orders.html",
        {"page_obj": page_obj, "status_choices": Order.Status.choices, "selected_status": status, "query": query},
    )


@staff_required
def manage_order_detail(request, order_id):
    order = get_object_or_404(
        Order.objects.select_related("customer").prefetch_related("items__product"),
        pk=order_id,
    )
    return render(
        request,
        "shop/staff/order_detail.html",
        {"order": order, "status_choices": Order.Status.choices},
    )


@staff_required
def update_order_status(request, order_id):
    if request.method != "POST":
        return redirect("manage_order_detail", order_id=order_id)

    next_status = request.POST.get("status", "")
    if next_status not in Order.Status.values:
        messages.error(request, "Trạng thái đơn hàng không hợp lệ.")
        return redirect("manage_order_detail", order_id=order_id)

    allowed_transitions = {
        Order.Status.PENDING: {Order.Status.CONFIRMED, Order.Status.CANCELLED},
        Order.Status.CONFIRMED: {Order.Status.SHIPPING, Order.Status.CANCELLED},
        Order.Status.SHIPPING: {Order.Status.DELIVERED},
        Order.Status.DELIVERED: set(),
        Order.Status.CANCELLED: set(),
    }
    with transaction.atomic():
        order = get_object_or_404(Order.objects.select_for_update(), pk=order_id)
        if next_status not in allowed_transitions[order.status]:
            messages.error(request, "Không thể chuyển đơn hàng sang trạng thái đã chọn.")
            return redirect("manage_order_detail", order_id=order.pk)
        if next_status == Order.Status.CANCELLED:
            for item in order.items.all():
                product = Product.objects.select_for_update().get(pk=item.product_id)
                product.stock += item.quantity
                product.save(update_fields=["stock"])
        order.status = next_status
        order.save(update_fields=["status"])

    messages.success(request, "Đã cập nhật trạng thái đơn hàng.")
    return redirect("manage_order_detail", order_id=order.pk)


@staff_required
def inventory_receipts(request):
    receipts = InventoryReceipt.objects.prefetch_related("items__product").order_by(
        "-received_at", "-pk"
    )
    page_obj = Paginator(receipts, 20).get_page(request.GET.get("page"))
    return render(request, "shop/staff/inventory_receipts.html", {"page_obj": page_obj})


@staff_required
def inventory_receipt_create(request):
    products = Product.objects.order_by("name")
    if request.method == "POST":
        supplier = request.POST.get("supplier", "").strip()
        try:
            product_id = int(request.POST.get("product", ""))
            quantity = int(request.POST.get("quantity", ""))
            unit_price = Decimal(request.POST.get("unit_price", ""))
            if quantity < 1 or unit_price < 0:
                raise ValueError
            product = products.get(pk=product_id)
        except (InvalidOperation, TypeError, ValueError, Product.DoesNotExist):
            messages.error(request, "Vui lòng chọn sản phẩm và nhập số lượng, giá nhập hợp lệ.")
            return render(
                request,
                "shop/staff/inventory_receipt_form.html",
                {"products": products, "form_data": request.POST},
            )

        line_total = unit_price * quantity
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=product.pk)
            employee = Employee.objects.filter(account=request.user, is_active=True).first()
            receipt = InventoryReceipt.objects.create(
                code=f"PN{timezone.now():%y%m%d%H%M%S%f}",
                employee=employee,
                supplier=supplier,
                total=line_total,
                note=request.POST.get("note", "").strip(),
            )
            InventoryReceiptItem.objects.create(
                receipt=receipt,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                line_total=line_total,
            )
            product.stock += quantity
            product.cost_price = unit_price
            product.save(update_fields=["stock", "cost_price"])

        messages.success(request, f"Đã nhập thêm {quantity} sản phẩm vào kho.")
        return redirect("inventory_receipts")

    return render(
        request,
        "shop/staff/inventory_receipt_form.html",
        {"products": products, "form_data": {}},
    )


@staff_required
def statistics(request):
    today = timezone.localdate()
    try:
        month = int(request.GET.get("thang", today.month))
        year = int(request.GET.get("nam", today.year))
        if month not in range(1, 13) or year not in range(2000, 2201):
            raise ValueError
    except (TypeError, ValueError):
        month, year = today.month, today.year

    start = today.replace(year=year, month=month, day=1)
    end = start.replace(year=year + (month == 12), month=1 if month == 12 else month + 1, day=1)
    delivered_orders = Order.objects.filter(status=Order.Status.DELIVERED)
    month_orders = delivered_orders.filter(ordered_at__date__gte=start, ordered_at__date__lt=end)
    revenue_by_month = [
        {
            "month": month_number,
            "revenue": delivered_orders.filter(
                ordered_at__year=year, ordered_at__month=month_number
            ).aggregate(value=Sum("total"))["value"] or Decimal("0"),
            "order_count": delivered_orders.filter(
                ordered_at__year=year, ordered_at__month=month_number
            ).count(),
        }
        for month_number in range(1, 13)
    ]
    context = {
        "month": month,
        "year": year,
        "months": range(1, 13),
        "month_revenue": month_orders.aggregate(value=Sum("total"))["value"] or Decimal("0"),
        "revenue_by_month": revenue_by_month,
        "best_sellers": OrderItem.objects.filter(
            order__in=month_orders
        ).values("product__code", "product__name", "product__sale_price").annotate(
            quantity=Sum("quantity"), revenue=Sum("line_total")
        ).order_by("-quantity")[:10],
        "category_revenue": OrderItem.objects.filter(
            order__in=delivered_orders.filter(ordered_at__year=year),
            product__category__isnull=False,
        ).values("product__category__name").annotate(
            revenue=Sum("line_total")
        ).order_by("-revenue"),
        "stock_products": Product.objects.filter(is_active=True).select_related("category").annotate(
            stock_value=F("stock") * F("cost_price")
        ).order_by("stock")[:20],
        "top_customers": Customer.objects.filter(
            orders__status=Order.Status.DELIVERED
        ).annotate(
            order_count=Count("orders", filter=Q(orders__ordered_at__year=year)),
            amount_spent=Sum("orders__total", filter=Q(orders__ordered_at__year=year, orders__status=Order.Status.DELIVERED)),
        ).filter(amount_spent__gt=0).order_by("-amount_spent")[:10],
    }
    return render(request, "shop/statistics.html", context)
