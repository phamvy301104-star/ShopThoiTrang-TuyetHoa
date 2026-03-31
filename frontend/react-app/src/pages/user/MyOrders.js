import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye } from 'react-icons/fa';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const trangThaiOptions = [
        { value: 'cho_xac_nhan', label: 'Chờ xác nhận', variant: 'warning' },
        { value: 'da_xac_nhan', label: 'Đã xác nhận', variant: 'info' },
        { value: 'dang_giao', label: 'Đang giao', variant: 'primary' },
        { value: 'da_giao', label: 'Đã giao', variant: 'success' },
        { value: 'da_huy', label: 'Đã hủy', variant: 'danger' }
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await orderAPI.getMyOrders();
            setOrders(res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này?')) return;
        
        try {
            await orderAPI.cancelOrder(orderId);
            toast.success('Đã hủy đơn hàng');
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Không thể hủy đơn hàng');
        }
    };

    const getStatusBadge = (status) => {
        const statusInfo = trangThaiOptions.find(s => s.value === status);
        return statusInfo ? (
            <Badge bg={statusInfo.variant}>{statusInfo.label}</Badge>
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

    return (
        <Container className="py-5">
            <h3 className="mb-4">Đơn hàng của tôi</h3>

            <Card>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : orders.length > 0 ? (
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Mã đơn</th>
                                    <th>Ngày đặt</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '150px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>#{order.id}</strong></td>
                                        <td>{formatDate(order.ngay_dat)}</td>
                                        <td className="text-danger fw-bold">
                                            {formatCurrency(order.tong_tien)}
                                        </td>
                                        <td>{getStatusBadge(order.trang_thai)}</td>
                                        <td>
                                            <Link
                                                to={`/don-hang/${order.id}`}
                                                className="btn btn-sm btn-outline-info me-1"
                                            >
                                                <FaEye className="me-1" />
                                                Chi tiết
                                            </Link>
                                            {order.trang_thai === 'cho_xac_nhan' && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleCancelOrder(order.id)}
                                                >
                                                    Hủy
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="text-center py-5">
                            <p className="text-muted mb-3">Bạn chưa có đơn hàng nào</p>
                            <Link to="/san-pham" className="btn btn-primary">
                                Mua sắm ngay
                            </Link>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Container>
    );
};

export default MyOrders;
