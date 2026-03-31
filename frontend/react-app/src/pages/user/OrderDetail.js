import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Table, Badge, Button } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const UserOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const trangThaiOptions = [
        { value: 'cho_xac_nhan', label: 'Chờ xác nhận', variant: 'warning' },
        { value: 'da_xac_nhan', label: 'Đã xác nhận', variant: 'info' },
        { value: 'dang_giao', label: 'Đang giao', variant: 'primary' },
        { value: 'da_giao', label: 'Đã giao', variant: 'success' },
        { value: 'da_huy', label: 'Đã hủy', variant: 'danger' }
    ];

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const res = await orderAPI.getById(id);
            setOrder(res.data);
        } catch (error) {
            toast.error('Không tìm thấy đơn hàng');
            navigate('/don-hang');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        
        try {
            await orderAPI.cancelOrder(id);
            toast.success('Đã hủy đơn hàng');
            fetchOrder();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Không thể hủy đơn hàng');
        }
    };

    const getStatusBadge = (status) => {
        const statusInfo = trangThaiOptions.find(s => s.value === status);
        return statusInfo ? (
            <Badge bg={statusInfo.variant} className="fs-6">{statusInfo.label}</Badge>
        ) : (
            <Badge bg="secondary">{status}</Badge>
        );
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <div className="spinner-border text-primary" role="status" />
            </Container>
        );
    }

    if (!order) return null;

    return (
        <Container className="py-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Link to="/don-hang" className="btn btn-outline-secondary me-3">
                        <FaArrowLeft className="me-2" />
                        Quay lại
                    </Link>
                    <span className="h4 mb-0">Chi tiết đơn hàng #{order.id}</span>
                </div>
                {order.trang_thai === 'cho_xac_nhan' && (
                    <Button variant="outline-danger" onClick={handleCancelOrder}>
                        Hủy đơn hàng
                    </Button>
                )}
            </div>

            <Row>
                <Col lg={8}>
                    {/* Order Items */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Sản phẩm đã đặt</h5>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th className="text-center">Số lượng</th>
                                        <th className="text-end">Đơn giá</th>
                                        <th className="text-end">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.chi_tiet?.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        src={item.hinh_anh || '/placeholder.png'}
                                                        alt={item.ten_san_pham}
                                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                                        className="rounded me-3"
                                                    />
                                                    <div>
                                                        <Link to={`/san-pham/${item.san_pham_id}`}>
                                                            {item.ten_san_pham}
                                                        </Link>
                                                        {item.kich_co && (
                                                            <small className="d-block text-muted">Size: {item.kich_co}</small>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">{item.so_luong}</td>
                                            <td className="text-end">{formatCurrency(item.don_gia)}</td>
                                            <td className="text-end fw-bold">
                                                {formatCurrency(item.so_luong * item.don_gia)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <Card.Body>
                            <Row>
                                <Col md={6}>
                                    {order.ghi_chu && (
                                        <>
                                            <h6>Ghi chú</h6>
                                            <p className="text-muted">{order.ghi_chu}</p>
                                        </>
                                    )}
                                </Col>
                                <Col md={6}>
                                    <div className="text-end">
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Tạm tính:</span>
                                            <span>{formatCurrency(order.tong_tien_hang || order.tong_tien)}</span>
                                        </div>
                                        {order.giam_gia > 0 && (
                                            <div className="d-flex justify-content-between mb-2 text-success">
                                                <span>Giảm giá:</span>
                                                <span>-{formatCurrency(order.giam_gia)}</span>
                                            </div>
                                        )}
                                        <div className="d-flex justify-content-between mb-2">
                                            <span>Phí vận chuyển:</span>
                                            <span>{formatCurrency(order.phi_van_chuyen || 0)}</span>
                                        </div>
                                        <hr />
                                        <div className="d-flex justify-content-between">
                                            <strong>Tổng cộng:</strong>
                                            <strong className="text-danger fs-5">
                                                {formatCurrency(order.tong_tien)}
                                            </strong>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={4}>
                    {/* Order Status */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Trạng thái đơn hàng</h5>
                        </Card.Header>
                        <Card.Body className="text-center">
                            {getStatusBadge(order.trang_thai)}
                            <div className="mt-3 text-muted">
                                <small>Đặt lúc: {formatDate(order.ngay_dat)}</small>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Shipping Info */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Thông tin giao hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-2">
                                <strong>Họ tên:</strong> {order.ho_ten}
                            </p>
                            <p className="mb-2">
                                <strong>SĐT:</strong> {order.so_dien_thoai}
                            </p>
                            {order.email && (
                                <p className="mb-2">
                                    <strong>Email:</strong> {order.email}
                                </p>
                            )}
                            <p className="mb-0">
                                <strong>Địa chỉ:</strong> {order.dia_chi}
                            </p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default UserOrderDetail;
