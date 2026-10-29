import shutil
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from shop.models import Category, Product


CATALOG = (
    {
        "code": "NAM-AO-001",
        "name": "Áo thun cotton basic",
        "category": "Áo nam",
        "price": "189000",
        "cost": "95000",
        "stock": 18,
        "size": "S-XL",
        "color": "Trắng",
        "material": "Cotton 100%",
        "gender": "Nam",
        "image": "classic-shirt.jpg",
        "description": "Áo thun cotton mềm, thoáng mát, dễ phối cùng quần jeans hoặc quần short.",
    },
    {
        "code": "NAM-AO-002",
        "name": "Áo polo nam phối viền",
        "category": "Áo nam",
        "price": "329000",
        "cost": "175000",
        "stock": 12,
        "size": "M-XXL",
        "color": "Đen",
        "material": "Cotton pique",
        "gender": "Nam",
        "image": "mens-fashion.jpg",
        "description": "Áo polo cổ bẻ lịch sự, chất vải pique co giãn nhẹ, phù hợp đi làm và dạo phố.",
    },
    {
        "code": "NAM-AO-003",
        "name": "Áo sơ mi linen tay dài",
        "category": "Áo nam",
        "price": "429000",
        "cost": "235000",
        "stock": 9,
        "size": "M-XXL",
        "color": "Be",
        "material": "Linen pha cotton",
        "gender": "Nam",
        "image": "classic-shirt.jpg",
        "description": "Sơ mi linen nhẹ và thoáng, phom vừa, thích hợp cho những ngày cần vẻ ngoài chỉn chu.",
    },
    {
        "code": "NAM-QUAN-001",
        "name": "Quần jeans nam dáng straight",
        "category": "Quần nam",
        "price": "549000",
        "cost": "310000",
        "stock": 10,
        "size": "29-34",
        "color": "Xanh denim",
        "material": "Denim cotton",
        "gender": "Nam",
        "image": "denim.jpg",
        "description": "Quần jeans dáng straight cổ điển, dễ phối áo thun, polo và sơ mi.",
    },
    {
        "code": "NAM-QUAN-002",
        "name": "Quần kaki nam slim fit",
        "category": "Quần nam",
        "price": "459000",
        "cost": "250000",
        "stock": 8,
        "size": "29-34",
        "color": "Nâu",
        "material": "Kaki cotton co giãn",
        "gender": "Nam",
        "image": "mens-fashion.jpg",
        "description": "Quần kaki slim fit có độ co giãn thoải mái, phù hợp mặc đi làm hoặc đi chơi.",
    },
    {
        "code": "NAM-GIAY-001",
        "name": "Giày sneaker nam Urban",
        "category": "Giày nam",
        "price": "699000",
        "cost": "390000",
        "stock": 7,
        "size": "39-44",
        "color": "Đỏ-trắng",
        "material": "Vải lưới, đế cao su",
        "gender": "Nam",
        "image": "red-sneakers.jpg",
        "description": "Sneaker đế êm, nhẹ chân, phù hợp đi học, đi làm và vận động hằng ngày.",
    },
    {
        "code": "NAM-GIAY-002",
        "name": "Giày chạy bộ nam Flex",
        "category": "Giày nam",
        "price": "849000",
        "cost": "490000",
        "stock": 6,
        "size": "40-45",
        "color": "Đỏ",
        "material": "Vải mesh, đế EVA",
        "gender": "Nam",
        "image": "red-sneakers.jpg",
        "description": "Giày chạy bộ đệm nhẹ, thoáng khí, hỗ trợ bàn chân khi tập luyện.",
    },
    {
        "code": "NU-AO-001",
        "name": "Áo thun nữ dáng relaxed",
        "category": "Áo nữ",
        "price": "199000",
        "cost": "105000",
        "stock": 16,
        "size": "S-XL",
        "color": "Đen",
        "material": "Cotton mềm",
        "gender": "Nữ",
        "image": "womens-fashion.jpg",
        "description": "Áo thun nữ phom relaxed thoải mái, dễ kết hợp với chân váy hoặc jeans.",
    },
    {
        "code": "NU-AO-002",
        "name": "Áo blouse nữ cổ vuông",
        "category": "Áo nữ",
        "price": "359000",
        "cost": "195000",
        "stock": 11,
        "size": "S-XL",
        "color": "Kem",
        "material": "Cotton pha",
        "gender": "Nữ",
        "image": "womens-fashion.jpg",
        "description": "Áo blouse cổ vuông thanh lịch, chất vải nhẹ, hợp phối cùng chân váy và quần ống rộng.",
    },
    {
        "code": "NU-VAY-001",
        "name": "Váy midi nữ dáng xòe",
        "category": "Váy nữ",
        "price": "529000",
        "cost": "295000",
        "stock": 8,
        "size": "S-XL",
        "color": "Hồng pastel",
        "material": "Voan lót cotton",
        "gender": "Nữ",
        "image": "womens-fashion.jpg",
        "description": "Váy midi dáng xòe nhẹ, họa tiết nhã nhặn, phù hợp dạo phố và dịp gặp gỡ.",
    },
    {
        "code": "NU-QUAN-001",
        "name": "Quần jeans nữ ống rộng",
        "category": "Quần nữ",
        "price": "579000",
        "cost": "325000",
        "stock": 9,
        "size": "26-31",
        "color": "Xanh denim",
        "material": "Denim cotton",
        "gender": "Nữ",
        "image": "denim.jpg",
        "description": "Quần jeans ống rộng cạp cao giúp tôn dáng, dễ phối với áo thun và blouse.",
    },
    {
        "code": "NU-GIAY-001",
        "name": "Giày sneaker nữ pastel",
        "category": "Giày nữ",
        "price": "649000",
        "cost": "360000",
        "stock": 7,
        "size": "35-39",
        "color": "Trắng-hồng",
        "material": "Da tổng hợp, đế cao su",
        "gender": "Nữ",
        "image": "womens-shoes.jpg",
        "description": "Sneaker nữ đế nhẹ, phối màu dịu, dễ mang cùng váy hoặc quần jeans.",
    },
    {
        "code": "NU-GIAY-002",
        "name": "Giày búp bê Mary Jane",
        "category": "Giày nữ",
        "price": "489000",
        "cost": "265000",
        "stock": 5,
        "size": "35-39",
        "color": "Đen",
        "material": "Da tổng hợp",
        "gender": "Nữ",
        "image": "womens-shoes.jpg",
        "description": "Giày Mary Jane quai cài cổ điển, đế thấp êm chân, phù hợp đi học và đi làm.",
    },
    {
        "code": "UNISEX-AO-001",
        "name": "Áo hoodie unisex Everyday",
        "category": "Áo unisex",
        "price": "599000",
        "cost": "340000",
        "stock": 6,
        "size": "M-XXL",
        "color": "Đỏ",
        "material": "Nỉ cotton",
        "gender": "Unisex",
        "image": "mens-fashion.jpg",
        "description": "Hoodie unisex chất nỉ mềm, phom rộng vừa, hợp mặc khi thời tiết mát.",
    },
)

CATEGORIES = {
    "Áo nam": "Áo thun, polo và sơ mi dành cho nam.",
    "Quần nam": "Quần jeans và quần kaki dành cho nam.",
    "Giày nam": "Sneaker và giày thể thao dành cho nam.",
    "Áo nữ": "Áo thun, blouse và kiểu áo nữ.",
    "Váy nữ": "Váy và đầm dành cho nữ.",
    "Quần nữ": "Quần jeans và quần thời trang dành cho nữ.",
    "Giày nữ": "Sneaker, giày búp bê và giày nữ các loại.",
    "Áo unisex": "Trang phục phom unisex.",
}


class Command(BaseCommand):
    help = "Thêm danh mục và sản phẩm mẫu vào cửa hàng (có thể chạy nhiều lần)."

    def handle(self, *args, **options):
        source_dir = Path(settings.BASE_DIR) / "frontend" / "public" / "images" / "products"
        media_dir = Path(settings.MEDIA_ROOT) / "products"
        media_dir.mkdir(parents=True, exist_ok=True)

        image_names = {item["image"] for item in CATALOG}
        for image_name in image_names:
            source = source_dir / image_name
            if not source.is_file():
                raise CommandError(f"Không tìm thấy ảnh sản phẩm: {source}")
            destination = media_dir / image_name
            if not destination.is_file():
                shutil.copy2(source, destination)

        created_count = 0
        with transaction.atomic():
            categories = {}
            for name, description in CATEGORIES.items():
                category, _ = Category.objects.get_or_create(
                    name=name,
                    defaults={"description": description, "is_active": True},
                )
                categories[name] = category

            for item in CATALOG:
                defaults = {
                    "name": item["name"],
                    "category": categories[item["category"]],
                    "cost_price": item["cost"],
                    "sale_price": item["price"],
                    "stock": item["stock"],
                    "size": item["size"],
                    "color": item["color"],
                    "material": item["material"],
                    "image": f"products/{item['image']}",
                    "description": item["description"],
                    "gender": item["gender"],
                    "is_active": True,
                }
                _, created = Product.objects.get_or_create(
                    code=item["code"],
                    defaults=defaults,
                )
                created_count += int(created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Đã thêm {created_count} sản phẩm mới; tổng cộng có "
                f"{Product.objects.filter(is_active=True, stock__gt=0).count()} sản phẩm đang bán."
            )
        )
