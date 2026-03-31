import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaFilter } from 'react-icons/fa';
import { orderAPI } from '../../services/api';
import { toast } from 'react-toastify';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ keyword: '', trang_thai: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [statusModal, setStatusModal] = useState({ show: false, order: null, newStatus: '' });

    const trangThaiOptions = [
        { value: 'cho_xac_nhan', label: 'Chờ xác nhận', variant: 'warning' },
        { value: 'da_xac_nhan', label: 'Đã xác nhận', variant: 'info' },
        { value: 'dang_giao', label: 'Đang giao', variant: 'primary' },
        { value: 'da_giao', label: 'Đã giao', variant: 'success' },
        { value: 'da_huy', label: 'Đã hủy', variant: 'danger' }
    ];

    useEffect(() => {
        fetchOrders();
    }, [pagination.page, filters]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await orderAPI.getAll({
                page: pagination.page,
                limit: 10,
                ...filters
            });
            setOrders(res.data.orders || res.data);
            setPagination(prev => ({
                ...prev,
                totalPages: res.data.totalPages || 1
            }));
        } catch (error) {
            toast.error('Lỗi tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async () => {
        try {
            await orderAPI.updateStatus(statusModal.order.id, statusModal.newStatus);
            toast.success('Cập nhật trạng thái thành công');
            setStatusModal({ show: false, order: null, newStatus: '' });
            fetchOrders();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
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
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý đơn hàng</h4>
                <Button
                    variant={showFilters ? 'primary' : 'outline-primary'}
                    onClick={() => setShowFilters(!showFilters)}
                >
                    <FaFilter className="me-2" />
                    Bộ lọc
                </Button>
            </div>

            {showFilters && (
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Tìm kiếm</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Mã đơn hàng, tên khách hàng, SĐT..."
                                        value={filters.keyword}
                                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Trạng thái</Form.Label>
                                    <Form.Select
                                        value={filters.trang_thai}
                                        onChange={(e) => setFilters({ ...filters, trang_thai: e.target.value })}
                                    >
                                        <option value="">Tất cả</option>
                                        {trangThaiOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button
                                    variant="secondary"
                                    className="w-100"
                                    onClick={() => setFilters({ keyword: '', trang_thai: '' })}
                                >
                                    Xóa lọc
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>
            )}

            <Card>
                <Card.Body className="p-0">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status" />
                        </div>
                    ) : (
                        <Table responsive hover className="mb-0">
                            <thead className="bg-light">
                                <tr>
                                    <th>Mã ĐH</th>
                                    <th>Khách hàng</th>
                                    <th>SĐT</th>
                                    <th>Tổng tiền</th>
                                    <th>Trạng thái</th>
                                    <th>Ngày đặt</th>
                                    <th style={{ width: '140px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td><strong>#{order.id}</strong></td>
                                        <td>{order.ho_ten}</td>
                                        <td>{order.so_dien_thoai}</td>
                                        <td className="text-danger fw-bold">
                                            {formatCurrency(order.tong_tien)}
                                        </td>
                                        <td>{getStatusBadge(order.trang_thai)}</td>
                                        <td>{formatDate(order.ngay_dat)}</td>
                                        <td>
                                            <Link
                                                to={`/admin/don-hang/${order.id}`}
                                                className="btn btn-sm btn-outline-info me-1"
                                            >
                                                <FaEye />
                                            </Link>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                onClick={() => setStatusModal({
                                                    show: true,
                                                    order,
                                                    newStatus: order.trang_thai
                                                })}
                                            >
                                                <FaEdit />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            Không có đơn hàng nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <nav>
                        <ul className="pagination mb-0">
                            <li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                >
                                    Trước
                                </button>
                            </li>
                            {[...Array(pagination.totalPages)].map((_, i) => (
                                <li key={i + 1} className={`page-item ${pagination.page === i + 1 ? 'active' : ''}`}>
                                    <button
                                        className="page-link"
                                        onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
                                    >
                                        {i + 1}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}>
                                <button
                                    className="page-link"
                                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                >
                                    Sau
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}

            {/* Status Update Modal */}
            <Modal show={statusModal.show} onHide={() => setStatusModal({ show: false, order: null, newStatus: '' })}>
                <Modal.Header closeButton>
                    <Modal.Title>Cập nhật trạng thái đơn hàng #{statusModal.order?.id}</Modal.Title>
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
                    <Button variant="secondary" onClick={() => setStatusModal({ show: false, order: null, newStatus: '' })}>
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

export default OrderList;
