import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { FaShoppingCart } from 'react-icons/fa';
import { productAPI, categoryAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [productsRes, categoriesRes] = await Promise.all([
                productAPI.getNewest(8),
                categoryAPI.getAll()
            ]);
            setProducts(productsRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </Container>
        );
    }

    return (
        <>
            {/* Hero Banner */}
            <Carousel className="mb-5">
                <Carousel.Item>
                    <div className="bg-primary text-white py-5" style={{ minHeight: '400px' }}>
                        <Container className="d-flex flex-column justify-content-center h-100 py-5">
                            <h1 className="display-4 fw-bold">Chào mừng đến Shop Thời Trang</h1>
                            <p className="lead">Khám phá bộ sưu tập mới nhất của chúng tôi</p>
                            <div>
                                <Button as={Link} to="/cua-hang" variant="light" size="lg">
                                    Mua sắm ngay
                                </Button>
                            </div>
                        </Container>
                    </div>
                </Carousel.Item>
            </Carousel>

            <Container>
                {/* Categories */}
                <section className="mb-5">
                    <h2 className="text-center mb-4">Danh mục sản phẩm</h2>
                    <Row className="g-3">
                        {categories.slice(0, 6).map((cat) => (
                            <Col key={cat.id} md={4} lg={2}>
                                <Card 
                                    as={Link} 
                                    to={`/cua-hang?danh_muc=${cat.id}`} 
                                    className="text-center h-100 text-decoration-none hover-shadow"
                                >
                                    <Card.Body>
                                        <h6 className="mb-0">{cat.ten_danh_muc}</h6>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>

                {/* New Products */}
                <section className="mb-5">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h2>Sản phẩm mới</h2>
                        <Button as={Link} to="/cua-hang" variant="outline-primary">
                            Xem tất cả
                        </Button>
                    </div>
                    <Row className="g-4">
                        {products.map((product) => (
                            <Col key={product.id} sm={6} md={4} lg={3}>
                                <Card className="h-100 product-card">
                                    <Link to={`/san-pham/${product.id}`}>
                                        <Card.Img
                                            variant="top"
                                            src={product.hinh_anh ? `${API_URL}${product.hinh_anh}` : '/placeholder.jpg'}
                                            alt={product.ten_sp}
                                            style={{ height: '200px', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
                                        />
                                    </Link>
                                    <Card.Body className="d-flex flex-column">
                                        <Card.Title as={Link} to={`/san-pham/${product.id}`} className="text-decoration-none text-dark">
                                            <h6 className="mb-2 text-truncate">{product.ten_sp}</h6>
                                        </Card.Title>
                                        <p className="text-muted small mb-2">{product.ten_danh_muc}</p>
                                        <p className="text-primary fw-bold mb-3">{formatPrice(product.gia_ban)}</p>
                                        <Button 
                                            variant="primary" 
                                            size="sm" 
                                            className="mt-auto"
                                            onClick={() => addToCart(product)}
                                        >
                                            <FaShoppingCart className="me-1" /> Thêm vào giỏ
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>

                {/* Features */}
                <section className="py-5 bg-light rounded mb-5">
                    <Row className="text-center g-4">
                        <Col md={4}>
                            <div className="p-3">
                                <h4>🚚 Miễn phí vận chuyển</h4>
                                <p className="text-muted">Cho đơn hàng từ 500K</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="p-3">
                                <h4>🔄 Đổi trả miễn phí</h4>
                                <p className="text-muted">Trong vòng 30 ngày</p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="p-3">
                                <h4>💳 Thanh toán an toàn</h4>
                                <p className="text-muted">Bảo mật 100%</p>
                            </div>
                        </Col>
                    </Row>
                </section>
            </Container>
        </>
    );
};

export default Home;
