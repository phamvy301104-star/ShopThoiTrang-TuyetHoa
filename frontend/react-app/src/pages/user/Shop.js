import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Pagination } from 'react-bootstrap';
import { FaShoppingCart, FaFilter } from 'react-icons/fa';
import { productAPI, categoryAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Shop = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();

    const [filters, setFilters] = useState({
        search: searchParams.get('q') || '',
        danh_muc: searchParams.get('danh_muc') || '',
        gioi_tinh: searchParams.get('gioi_tinh') || '',
        page: parseInt(searchParams.get('page')) || 1
    });

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [filters]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await productAPI.getAll({
                search: filters.search,
                danh_muc: filters.danh_muc,
                gioi_tinh: filters.gioi_tinh,
                page: filters.page,
                limit: 12
            });
            setProducts(res.data.data);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getAll();
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        
        const params = new URLSearchParams();
        if (newFilters.search) params.set('q', newFilters.search);
        if (newFilters.danh_muc) params.set('danh_muc', newFilters.danh_muc);
        if (newFilters.gioi_tinh) params.set('gioi_tinh', newFilters.gioi_tinh);
        if (newFilters.page > 1) params.set('page', newFilters.page);
        setSearchParams(params);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4">Cửa hàng</h2>
            
            <Row>
                {/* Filters Sidebar */}
                <Col lg={3} className="mb-4">
                    <Card>
                        <Card.Header>
                            <FaFilter className="me-2" />
                            Bộ lọc
                        </Card.Header>
                        <Card.Body>
                            <Form.Group className="mb-3">
                                <Form.Label>Tìm kiếm</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Tên sản phẩm..."
                                    value={filters.search}
                                    onChange={(e) => handleFilterChange('search', e.target.value)}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Danh mục</Form.Label>
                                <Form.Select
                                    value={filters.danh_muc}
                                    onChange={(e) => handleFilterChange('danh_muc', e.target.value)}
                                >
                                    <option value="">Tất cả danh mục</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.ten_danh_muc}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <Form.Label>Giới tính</Form.Label>
                                <Form.Select
                                    value={filters.gioi_tinh}
                                    onChange={(e) => handleFilterChange('gioi_tinh', e.target.value)}
                                >
                                    <option value="">Tất cả</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                    <option value="Unisex">Unisex</option>
                                </Form.Select>
                            </Form.Group>

                            <Button 
                                variant="outline-secondary" 
                                className="w-100"
                                onClick={() => {
                                    setFilters({ search: '', danh_muc: '', gioi_tinh: '', page: 1 });
                                    setSearchParams({});
                                }}
                            >
                                Xóa bộ lọc
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Products Grid */}
                <Col lg={9}>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">Không tìm thấy sản phẩm nào</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-muted mb-3">
                                Hiển thị {products.length} / {pagination.total} sản phẩm
                            </p>
                            <Row className="g-4">
                                {products.map((product) => (
                                    <Col key={product.id} sm={6} md={4}>
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
                                                    disabled={product.so_luong === 0}
                                                >
                                                    {product.so_luong === 0 ? 'Hết hàng' : (
                                                        <>
                                                            <FaShoppingCart className="me-1" /> Thêm vào giỏ
                                                        </>
                                                    )}
                                                </Button>
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <div className="d-flex justify-content-center mt-4">
                                    <Pagination>
                                        <Pagination.Prev 
                                            disabled={pagination.page === 1}
                                            onClick={() => handleFilterChange('page', pagination.page - 1)}
                                        />
                                        {[...Array(pagination.totalPages)].map((_, idx) => (
                                            <Pagination.Item
                                                key={idx + 1}
                                                active={idx + 1 === pagination.page}
                                                onClick={() => handleFilterChange('page', idx + 1)}
                                            >
                                                {idx + 1}
                                            </Pagination.Item>
                                        ))}
                                        <Pagination.Next 
                                            disabled={pagination.page === pagination.totalPages}
                                            onClick={() => handleFilterChange('page', pagination.page + 1)}
                                        />
                                    </Pagination>
                                </div>
                            )}
                        </>
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default Shop;
