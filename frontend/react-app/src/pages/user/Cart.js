import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Table, Button, Card } from 'react-bootstrap';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Cart = () => {
    const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleCheckout = () => {
        if (!isAuthenticated) {
            navigate('/dang-nhap', { state: { from: '/thanh-toan' } });
        } else {
            navigate('/thanh-toan');
        }
    };

    if (cart.length === 0) {
        return (
            <Container className="py-5 text-center">
                <FaShoppingBag size={64} className="text-muted mb-3" />
                <h3>Giỏ hàng trống</h3>
                <p className="text-muted">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <Button as={Link} to="/cua-hang" variant="primary">
                    <FaArrowLeft className="me-2" />
                    Tiếp tục mua sắm
                </Button>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <h2 className="mb-4">Giỏ hàng của bạn</h2>
            
            <div className="row">
                <div className="col-lg-8">
                    <Card>
                        <Table responsive className="mb-0">
                            <thead>
                                <tr>
                                    <th style={{ width: '100px' }}>Ảnh</th>
                                    <th>Sản phẩm</th>
                                    <th style={{ width: '150px' }}>Đơn giá</th>
                                    <th style={{ width: '150px' }}>Số lượng</th>
                                    <th style={{ width: '150px' }}>Thành tiền</th>
                                    <th style={{ width: '50px' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <img
                                                src={item.hinh_anh ? `${API_URL}${item.hinh_anh}` : 'https://via.placeholder.com/80'}
                                                alt={item.ten_sp}
                                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                                className="rounded"
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/80'; }}
                                            />
                                        </td>
                                        <td>
                                            <Link to={`/san-pham/${item.id}`} className="text-decoration-none">
                                                <strong>{item.ten_sp}</strong>
                                            </Link>
                                            <br />
                                            <small className="text-muted">{item.ma_sp}</small>
                                        </td>
                                        <td>{formatPrice(item.gia_ban)}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <FaMinus />
                                                </Button>
                                                <span className="mx-3">{item.quantity}</span>
                                                <Button 
                                                    variant="outline-secondary" 
                                                    size="sm"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.so_luong}
                                                >
                                                    <FaPlus />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="fw-bold text-primary">
                                            {formatPrice(item.gia_ban * item.quantity)}
                                        </td>
                                        <td>
                                            <Button 
                                                variant="outline-danger" 
                                                size="sm"
                                                onClick={() => removeFromCart(item.id)}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </Card>
                </div>

                <div className="col-lg-4">
                    <Card>
                        <Card.Header>
                            <strong>Tổng đơn hàng</strong>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tạm tính:</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2">
                                <span>Phí vận chuyển:</span>
                                <span className="text-success">Miễn phí</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between mb-3">
                                <strong>Tổng cộng:</strong>
                                <strong className="text-primary fs-5">{formatPrice(cartTotal)}</strong>
                            </div>
                            <Button 
                                variant="primary" 
                                size="lg" 
                                className="w-100"
                                onClick={handleCheckout}
                            >
                                Tiến hành thanh toán
                            </Button>
                            <Button 
                                as={Link} 
                                to="/cua-hang" 
                                variant="outline-secondary" 
                                className="w-100 mt-2"
                            >
                                <FaArrowLeft className="me-2" />
                                Tiếp tục mua sắm
                            </Button>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default Cart;
