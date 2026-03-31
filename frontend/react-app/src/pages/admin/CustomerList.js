import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { customerAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ keyword: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        so_dien_thoai: '',
        dia_chi: '',
        mat_khau: '',
        trang_thai: true
    });
    const [deleteModal, setDeleteModal] = useState({ show: false, customer: null });

    useEffect(() => {
        fetchCustomers();
    }, [pagination.page, filters]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const res = await customerAPI.getAll({
                page: pagination.page,
                limit: 10,
                ...filters
            });
            setCustomers(res.data.customers || res.data);
            setPagination(prev => ({
                ...prev,
                totalPages: res.data.totalPages || 1
            }));
        } catch (error) {
            toast.error('Lỗi tải danh sách khách hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (customer = null) => {
        if (customer) {
            setEditingCustomer(customer);
            setFormData({
                ho_ten: customer.ho_ten,
                email: customer.email,
                so_dien_thoai: customer.so_dien_thoai || '',
                dia_chi: customer.dia_chi || '',
                mat_khau: '',
                trang_thai: customer.trang_thai
            });
        } else {
            setEditingCustomer(null);
            setFormData({
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                dia_chi: '',
                mat_khau: '',
                trang_thai: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData };
            if (!data.mat_khau) delete data.mat_khau;

            if (editingCustomer) {
                await customerAPI.update(editingCustomer.id, data);
                toast.success('Cập nhật khách hàng thành công');
            } else {
                await customerAPI.create(data);
                toast.success('Thêm khách hàng thành công');
            }
            setShowModal(false);
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async () => {
        try {
            await customerAPI.delete(deleteModal.customer.id);
            toast.success('Xóa khách hàng thành công');
            setDeleteModal({ show: false, customer: null });
            fetchCustomers();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý khách hàng</h4>
                <div>
                    <Button
                        variant={showFilters ? 'primary' : 'outline-primary'}
                        className="me-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FaFilter className="me-2" />
                        Bộ lọc
                    </Button>
                    <Button variant="primary" onClick={() => handleOpenModal()}>
                        <FaPlus className="me-2" />
                        Thêm khách hàng
                    </Button>
                </div>
            </div>

            {showFilters && (
                <Card className="mb-4">
                    <Card.Body>
                        <Row>
                            <Col md={10}>
                                <Form.Group>
                                    <Form.Label>Tìm kiếm</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Họ tên, email, SĐT..."
                                        value={filters.keyword}
                                        onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={2} className="d-flex align-items-end">
                                <Button
                                    variant="secondary"
                                    className="w-100"
                                    onClick={() => setFilters({ keyword: '' })}
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
                                    <th>ID</th>
                                    <th>Họ tên</th>
                                    <th>Email</th>
                                    <th>Số điện thoại</th>
                                    <th>Địa chỉ</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '120px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((cus) => (
                                    <tr key={cus.id}>
                                        <td>{cus.id}</td>
                                        <td>{cus.ho_ten}</td>
                                        <td>{cus.email}</td>
                                        <td>{cus.so_dien_thoai || '-'}</td>
                                        <td>{cus.dia_chi || '-'}</td>
                                        <td>
                                            <Badge bg={cus.trang_thai ? 'success' : 'danger'}>
                                                {cus.trang_thai ? 'Hoạt động' : 'Khóa'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleOpenModal(cus)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setDeleteModal({ show: true, customer: cus })}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {customers.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            Không có khách hàng nào
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

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ tên <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.ho_ten}
                                        onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Số điện thoại</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.so_dien_thoai}
                                        onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>
                                        Mật khẩu {!editingCustomer && <span className="text-danger">*</span>}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.mat_khau}
                                        onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                                        required={!editingCustomer}
                                        placeholder={editingCustomer ? 'Để trống nếu không đổi' : ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={2}
                                value={formData.dia_chi}
                                onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                            />
                        </Form.Group>
                        {editingCustomer && (
                            <Form.Group>
                                <Form.Check
                                    type="checkbox"
                                    label="Tài khoản hoạt động"
                                    checked={formData.trang_thai}
                                    onChange={(e) => setFormData({ ...formData, trang_thai: e.target.checked })}
                                />
                            </Form.Group>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingCustomer ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, customer: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa khách hàng <strong>{deleteModal.customer?.ho_ten}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, customer: null })}>
                        Hủy
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Xóa
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CustomerList;
