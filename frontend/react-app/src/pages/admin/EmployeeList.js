import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaFilter } from 'react-icons/fa';
import { employeeAPI } from '../../services/api';
import { toast } from 'react-toastify';

const EmployeeList = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [filters, setFilters] = useState({ keyword: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        so_dien_thoai: '',
        dia_chi: '',
        mat_khau: '',
        vai_tro: 'nhan_vien',
        trang_thai: true
    });
    const [deleteModal, setDeleteModal] = useState({ show: false, employee: null });

    const vaiTroOptions = [
        { value: 'admin', label: 'Quản trị viên' },
        { value: 'nhan_vien', label: 'Nhân viên' }
    ];

    useEffect(() => {
        fetchEmployees();
    }, [pagination.page, filters]);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await employeeAPI.getAll({
                page: pagination.page,
                limit: 10,
                ...filters
            });
            setEmployees(res.data.employees || res.data);
            setPagination(prev => ({
                ...prev,
                totalPages: res.data.totalPages || 1
            }));
        } catch (error) {
            toast.error('Lỗi tải danh sách nhân viên');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (employee = null) => {
        if (employee) {
            setEditingEmployee(employee);
            setFormData({
                ho_ten: employee.ho_ten,
                email: employee.email,
                so_dien_thoai: employee.so_dien_thoai || '',
                dia_chi: employee.dia_chi || '',
                mat_khau: '',
                vai_tro: employee.vai_tro || 'nhan_vien',
                trang_thai: employee.trang_thai
            });
        } else {
            setEditingEmployee(null);
            setFormData({
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                dia_chi: '',
                mat_khau: '',
                vai_tro: 'nhan_vien',
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

            if (editingEmployee) {
                await employeeAPI.update(editingEmployee.id, data);
                toast.success('Cập nhật nhân viên thành công');
            } else {
                await employeeAPI.create(data);
                toast.success('Thêm nhân viên thành công');
            }
            setShowModal(false);
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async () => {
        try {
            await employeeAPI.delete(deleteModal.employee.id);
            toast.success('Xóa nhân viên thành công');
            setDeleteModal({ show: false, employee: null });
            fetchEmployees();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const getRoleBadge = (role) => {
        const roleInfo = vaiTroOptions.find(r => r.value === role);
        return (
            <Badge bg={role === 'admin' ? 'primary' : 'info'}>
                {roleInfo?.label || role}
            </Badge>
        );
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý nhân viên</h4>
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
                        Thêm nhân viên
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
                                    <th>Vai trò</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '120px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map((emp) => (
                                    <tr key={emp.id}>
                                        <td>{emp.id}</td>
                                        <td>{emp.ho_ten}</td>
                                        <td>{emp.email}</td>
                                        <td>{emp.so_dien_thoai || '-'}</td>
                                        <td>{getRoleBadge(emp.vai_tro)}</td>
                                        <td>
                                            <Badge bg={emp.trang_thai ? 'success' : 'danger'}>
                                                {emp.trang_thai ? 'Hoạt động' : 'Khóa'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleOpenModal(emp)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setDeleteModal({ show: true, employee: emp })}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {employees.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            Không có nhân viên nào
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
                        <Modal.Title>{editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên'}</Modal.Title>
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
                                        Mật khẩu {!editingEmployee && <span className="text-danger">*</span>}
                                    </Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.mat_khau}
                                        onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                                        required={!editingEmployee}
                                        placeholder={editingEmployee ? 'Để trống nếu không đổi' : ''}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Vai trò</Form.Label>
                                    <Form.Select
                                        value={formData.vai_tro}
                                        onChange={(e) => setFormData({ ...formData, vai_tro: e.target.value })}
                                    >
                                        {vaiTroOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Địa chỉ</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.dia_chi}
                                        onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        {editingEmployee && (
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
                            {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, employee: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa nhân viên <strong>{deleteModal.employee?.ho_ten}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, employee: null })}>
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

export default EmployeeList;
