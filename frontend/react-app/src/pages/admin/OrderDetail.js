import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, Row, Col, Table, Badge, Button, Form, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaPrint } from 'react-icons/fa';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const OrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statusModal, setStatusModal] = useState({ show: false, newStatus: '' });

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
        setLoading(true);
        try {
            const res = await orderAPI.getById(id);
            setOrder(res.data);
        } catch (error) {
            toast.error('Lỗi tải thông tin đơn hàng');
            navigate('/admin/don-hang');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        try {
            await orderAPI.updateStatus(id, statusModal.newStatus);
            toast.success('Cập nhật trạng thái thành công');
            setStatusModal({ show: false, newStatus: '' });
            fetchOrder();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
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
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    if (!order) return null;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <Link to="/admin/don-hang" className="btn btn-outline-secondary me-3">
                        <FaArrowLeft className="me-2" />
                        Quay lại
                    </Link>
                    <span className="h4 mb-0">Chi tiết đơn hàng #{order.id}</span>
                </div>
                <div>
                    <Button variant="outline-primary" className="me-2" onClick={() => window.print()}>
                        <FaPrint className="me-2" />
                        In đơn
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setStatusModal({ show: true, newStatus: order.trang_thai })}
                    >
                        Cập nhật trạng thái
                    </Button>
                </div>
            </div>

            <Row>
                <Col lg={8}>
                    {/* Order Items */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Sản phẩm đặt hàng</h5>
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
                                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                        className="rounded me-3"
                                                    />
                                                    <div>
                                                        <div>{item.ten_san_pham}</div>
                                                        {item.kich_co && (
                                                            <small className="text-muted">Size: {item.kich_co}</small>
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
                                <small>Ngày đặt: {formatDate(order.ngay_dat)}</small>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Customer Info */}
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Thông tin khách hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-2">
                                <strong>Họ tên:</strong> {order.ho_ten}
                            </p>
                            <p className="mb-2">
                                <strong>Số điện thoại:</strong> {order.so_dien_thoai}
                            </p>
                            {order.email && (
                                <p className="mb-2">
                                    <strong>Email:</strong> {order.email}
                                </p>
                            )}
                        </Card.Body>
                    </Card>

                    {/* Shipping Info */}
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Địa chỉ giao hàng</h5>
                        </Card.Header>
                        <Card.Body>
                            <p className="mb-0">{order.dia_chi}</p>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Status Update Modal */}
            <Modal show={statusModal.show} onHide={() => setStatusModal({ show: false, newStatus: '' })}>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật trạng thái đơn hàng #{order.id}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group>
                        <Form.Label>Trạng thái mới</Form.Label>
                        <Form.Select
                            value={statusModal.newStatus}
                            onChange={(e) => setStatusModal({ ...statusModal, newStatus: e.target.value })}
                        >
                            {trangThaiOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setStatusModal({ show: false, newStatus: '' })}>
                        Hủy
                    </Button>
                    <Button variant="primary" onClick={handleStatusChange}>
                        Cập nhật
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default OrderDetail;
