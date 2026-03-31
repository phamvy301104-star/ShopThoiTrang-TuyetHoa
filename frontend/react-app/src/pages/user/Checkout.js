import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, couponAPI } from '../../services/api';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Checkout = () => {
    const { cart, cartTotal, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        ho_ten: user?.ho_ten || '',
        so_dien_thoai: user?.so_dien_thoai || '',
        dia_chi: user?.dia_chi || '',
        phuong_thuc_tt: 'cod',
        ghi_chu: ''
    });

    const [couponCode, setCouponCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode) return;
        
        try {
            const res = await couponAPI.check({ ma: couponCode, tong_tien: cartTotal });
            setDiscount(res.data.discount);
            toast.success(`Áp dụng mã giảm giá thành công! Giảm ${formatPrice(res.data.discount)}`);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Mã giảm giá không hợp lệ');
            setDiscount(0);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (cart.length === 0) {
            setError('Giỏ hàng trống');
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                ...formData,
                ma_giam_gia: couponCode || null,
                items: cart.map(item => ({
                    san_pham_id: item.id,
                    so_luong: item.quantity
                }))
            };

            const res = await orderAPI.create(orderData);
            clearCart();
            toast.success('Đặt hàng thành công!');
            navigate(`/don-hang/${res.data.orderId}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Có lỗi xảy ra khi đặt hàng');
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        navigate('/gio-hang');
        return null;
    }

    const finalTotal = cartTotal - discount;

    return (
        <Container className="py-4">
            <h2 className="mb-4">Thanh toán</h2>
            
            {error && <Alert variant="danger">{error}</Alert>}

            <Row>
                <Col lg={7}>
                    <Card className="mb-4">
                        <Card.Header>
                            <strong>Thông tin giao hàng</strong>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ tên người nhận <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.ho_ten}
                                        onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Số điện thoại <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.so_dien_thoai}
                                        onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Địa chỉ giao hàng <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={formData.dia_chi}
                                        onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Phương thức thanh toán</Form.Label>
                                    <Form.Select
                                        value={formData.phuong_thuc_tt}
                                        onChange={(e) => setFormData({ ...formData, phuong_thuc_tt: e.target.value })}
                                    >
                                        <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                                        <option value="banking">Chuyển khoản ngân hàng</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Ghi chú</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        placeholder="Ghi chú cho đơn hàng (tùy chọn)"
                                        value={formData.ghi_chu}
                                        onChange={(e) => setFormData({ ...formData, ghi_chu: e.target.value })}
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" size="lg" className="w-100" disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={5}>
                    <Card className="mb-4">
                        <Card.Header>
                            <strong>Đơn hàng của bạn</strong>
                        </Card.Header>
                        <Card.Body>
                            <Table size="sm" className="mb-3">
                                <tbody>
                                    {cart.map((item) => (
                                        <tr key={item.id}>
                                            <td style={{ width: '60px' }}>
                                                <img
                                                    src={item.hinh_anh ? `${API_URL}${item.hinh_anh}` : 'https://via.placeholder.com/50'}
                                                    alt={item.ten_sp}
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td>
                                                <small className="d-block">{item.ten_sp}</small>
                                                <small className="text-muted">x{item.quantity}</small>
                                            </td>
                                            <td className="text-end">
                                                <small>{formatPrice(item.gia_ban * item.quantity)}</small>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            <hr />

                            <div className="d-flex gap-2 mb-3">
                                <Form.Control
                                    type="text"
                                    placeholder="Mã giảm giá"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                />
                                <Button variant="outline-primary" onClick={handleApplyCoupon}>
                                    Áp dụng
                                </Button>
                            </div>

                            <div className="d-flex justify-content-between mb-2">
                                <span>Tạm tính:</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            
                            {discount > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Giảm giá:</span>
                                    <span>-{formatPrice(discount)}</span>
                                </div>
                            )}
                            
                            <div className="d-flex justify-content-between mb-2">
                                <span>Phí vận chuyển:</span>
                                <span className="text-success">Miễn phí</span>
                            </div>

                            <hr />

                            <div className="d-flex justify-content-between">
                                <strong>Tổng cộng:</strong>
                                <strong className="text-primary fs-5">{formatPrice(finalTotal)}</strong>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Checkout;
