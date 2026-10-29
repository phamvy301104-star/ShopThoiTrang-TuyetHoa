def cart_summary(request):
    cart = request.session.get("cart", {})
    quantities = (
        item.get("quantity", 0) if isinstance(item, dict) else item
        for item in cart.values()
    )
    return {"cart_count": sum(int(quantity) for quantity in quantities)}
