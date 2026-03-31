import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaMinus, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { productAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        setLoading(true);
        try {
            const res = await productAPI.getById(id);
            setProduct(res.data);
            setRelatedProducts(res.data.sanPhamLienQuan || []);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
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

    if (!product) {
        return (
            <Container className="py-5 text-center">
                <h3>Không tìm thấy sản phẩm</h3>
                <Button as={Link} to="/cua-hang" variant="primary">
                    <FaArrowLeft className="me-2" />
                    Quay lại cửa hàng
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            {/* Breadcrumb */}
            <nav aria-label="breadcrumb" className="mb-4">
                <ol className="breadcrumb">
                    <li className="breadcrumb-item"><Link to="/">Trang chủ</Link></li>
                    <li className="breadcrumb-item"><Link to="/cua-hang">Cửa hàng</Link></li>
                    <li className="breadcrumb-item active">{product.ten_sp}</li>
                </ol>
            </nav>

            <Row className="mb-5">
                <Col md={6}>
                    <img
                        src={product.hinh_anh ? `${API_URL}${product.hinh_anh}` : 'https://via.placeholder.com/500x500?text=No+Image'}
                        alt={product.ten_sp}
                        className="img-fluid rounded shadow"
                        style={{ width: '100%', maxHeight: '500px', objectFit: 'cover' }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/500x500?text=No+Image'; }}
                    />
                </Col>
                <Col md={6}>
                    <h2>{product.ten_sp}</h2>
                    <p className="text-muted">Mã SP: {product.ma_sp}</p>
                    
                    <h3 className="text-primary mb-4">{formatPrice(product.gia_ban)}</h3>

                    <div className="mb-3">
                        <Badge bg={product.so_luong > 0 ? 'success' : 'danger'}>
                            {product.so_luong > 0 ? `Còn ${product.so_luong} sản phẩm` : 'Hết hàng'}
                        </Badge>
                    </div>

                    <table className="table table-borderless">
                        <tbody>
                            <tr>
                                <th style={{ width: '120px' }}>Danh mục:</th>
                                <td>{product.ten_danh_muc || 'Chưa phân loại'}</td>
                            </tr>
                            {product.kich_thuoc && (
                                <tr>
                                    <th>Kích thước:</th>
                                    <td>{product.kich_thuoc}</td>
                                </tr>
                            )}
                            {product.mau_sac && (
                                <tr>
                                    <th>Màu sắc:</th>
                                    <td>{product.mau_sac}</td>
                                </tr>
                            )}
                            {product.chat_lieu && (
                                <tr>
                                    <th>Chất liệu:</th>
                                    <td>{product.chat_lieu}</td>
                                </tr>
                            )}
                            {product.gioi_tinh && (
                                <tr>
                                    <th>Giới tính:</th>
                                    <td>{product.gioi_tinh}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {product.mo_ta && (
                        <div className="mb-4">
                            <h5>Mô tả:</h5>
                            <p>{product.mo_ta}</p>
                        </div>
                    )}

                    {product.so_luong > 0 && (
                        <div className="d-flex gap-3 align-items-center mb-4">
                            <div className="d-flex align-items-center border rounded">
                                <Button 
                                    variant="light" 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                >
                                    <FaMinus />
                                </Button>
                                <Form.Control
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(product.so_luong, parseInt(e.target.value) || 1)))}
                                    className="border-0 text-center"
                                    style={{ width: '60px' }}
                                />
                                <Button 
                                    variant="light" 
                                    onClick={() => setQuantity(Math.min(product.so_luong, quantity + 1))}
                                >
                                    <FaPlus />
                                </Button>
                            </div>
                            <Button 
                                variant="primary" 
                                size="lg"
                                onClick={handleAddToCart}
                            >
                                <FaShoppingCart className="me-2" />
                                Thêm vào giỏ hàng
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Related Products */}
            {relatedProducts.length > 0 && (
                <section>
                    <h4 className="mb-4">Sản phẩm liên quan</h4>
                    <Row className="g-4">
                        {relatedProducts.map((p) => (
                            <Col key={p.id} sm={6} md={3}>
                                <Card className="h-100 product-card">
                                    <Link to={`/san-pham/${p.id}`}>
                                        <Card.Img
                                            variant="top"
                                            src={p.hinh_anh ? `${API_URL}${p.hinh_anh}` : '/placeholder.jpg'}
                                            alt={p.ten_sp}
                                            style={{ height: '180px', objectFit: 'cover' }}
                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/200x200?text=No+Image'; }}
                                        />
                                    </Link>
                                    <Card.Body>
                                        <Card.Title as={Link} to={`/san-pham/${p.id}`} className="text-decoration-none text-dark">
                                            <h6 className="text-truncate">{p.ten_sp}</h6>
                                        </Card.Title>
                                        <p className="text-primary fw-bold mb-0">{formatPrice(p.gia_ban)}</p>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </section>
            )}
        </Container>
    );
};

export default ProductDetail;
