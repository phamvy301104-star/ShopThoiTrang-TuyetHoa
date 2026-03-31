import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaFilter, FaCopy } from 'react-icons/fa';
import { couponAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CouponList = () => {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        ma_giam_gia: '',
        loai_giam: 'phan_tram',
        gia_tri: '',
        gia_tri_don_toi_thieu: 0,
        giam_toi_da: null,
        so_luong: '',
        ngay_bat_dau: '',
        ngay_ket_thuc: '',
        trang_thai: true
    });
    const [deleteModal, setDeleteModal] = useState({ show: false, coupon: null });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            const res = await couponAPI.getAll();
            setCoupons(res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách mã giảm giá');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                ma_giam_gia: coupon.ma_giam_gia,
                loai_giam: coupon.loai_giam || 'phan_tram',
                gia_tri: coupon.gia_tri,
                gia_tri_don_toi_thieu: coupon.gia_tri_don_toi_thieu || 0,
                giam_toi_da: coupon.giam_toi_da || '',
                so_luong: coupon.so_luong,
                ngay_bat_dau: coupon.ngay_bat_dau?.split('T')[0] || '',
                ngay_ket_thuc: coupon.ngay_ket_thuc?.split('T')[0] || '',
                trang_thai: coupon.trang_thai
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                ma_giam_gia: '',
                loai_giam: 'phan_tram',
                gia_tri: '',
                gia_tri_don_toi_thieu: 0,
                giam_toi_da: '',
                so_luong: '',
                ngay_bat_dau: '',
                ngay_ket_thuc: '',
                trang_thai: true
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...formData,
                giam_toi_da: formData.giam_toi_da || null
            };

            if (editingCoupon) {
                await couponAPI.update(editingCoupon.id, data);
                toast.success('Cập nhật mã giảm giá thành công');
            } else {
                await couponAPI.create(data);
                toast.success('Thêm mã giảm giá thành công');
            }
            setShowModal(false);
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async () => {
        try {
            await couponAPI.delete(deleteModal.coupon.id);
            toast.success('Xóa mã giảm giá thành công');
            setDeleteModal({ show: false, coupon: null });
            fetchCoupons();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        toast.success('Đã sao chép mã');
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('vi-VN');
    };

    const isExpired = (endDate) => {
        if (!endDate) return false;
        return new Date(endDate) < new Date();
    };

    const getStatusBadge = (coupon) => {
        if (!coupon.trang_thai) {
            return <Badge bg="secondary">Tắt</Badge>;
        }
        if (isExpired(coupon.ngay_ket_thuc)) {
            return <Badge bg="danger">Hết hạn</Badge>;
        }
        if (coupon.da_su_dung >= coupon.so_luong) {
            return <Badge bg="warning">Hết lượt</Badge>;
        }
        return <Badge bg="success">Hoạt động</Badge>;
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý mã giảm giá</h4>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <FaPlus className="me-2" />
                    Thêm mã giảm giá
                </Button>
            </div>

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
                                    <th>Mã</th>
                                    <th>Giá trị</th>
                                    <th>Đơn tối thiểu</th>
                                    <th>Đã dùng</th>
                                    <th>Thời hạn</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '150px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((coupon) => (
                                    <tr key={coupon.id}>
                                        <td>
                                            <code className="bg-light px-2 py-1 rounded">{coupon.ma_giam_gia}</code>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="p-0 ms-2"
                                                onClick={() => copyToClipboard(coupon.ma_giam_gia)}
                                            >
                                                <FaCopy />
                                            </Button>
                                        </td>
                                        <td className="text-danger fw-bold">
                                            {coupon.loai_giam === 'phan_tram'
                                                ? `${coupon.gia_tri}%`
                                                : formatCurrency(coupon.gia_tri)
                                            }
                                            {coupon.giam_toi_da && coupon.loai_giam === 'phan_tram' && (
                                                <small className="d-block text-muted">
                                                    Tối đa: {formatCurrency(coupon.giam_toi_da)}
                                                </small>
                                            )}
                                        </td>
                                        <td>{formatCurrency(coupon.gia_tri_don_toi_thieu || 0)}</td>
                                        <td>{coupon.da_su_dung || 0} / {coupon.so_luong}</td>
                                        <td>
                                            <small>
                                                {formatDate(coupon.ngay_bat_dau)} - {formatDate(coupon.ngay_ket_thuc)}
                                            </small>
                                        </td>
                                        <td>{getStatusBadge(coupon)}</td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleOpenModal(coupon)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setDeleteModal({ show: true, coupon })}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {coupons.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-4 text-muted">
                                            Chưa có mã giảm giá nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingCoupon ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mã giảm giá <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.ma_giam_gia}
                                        onChange={(e) => setFormData({ ...formData, ma_giam_gia: e.target.value.toUpperCase() })}
                                        required
                                        placeholder="VD: SALE10"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Loại giảm giá</Form.Label>
                                    <Form.Select
                                        value={formData.loai_giam}
                                        onChange={(e) => setFormData({ ...formData, loai_giam: e.target.value })}
                                    >
                                        <option value="phan_tram">Phần trăm (%)</option>
                                        <option value="co_dinh">Số tiền cố định (VNĐ)</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Giá trị giảm <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.gia_tri}
                                        onChange={(e) => setFormData({ ...formData, gia_tri: e.target.value })}
                                        required
                                        min="0"
                                        max={formData.loai_giam === 'phan_tram' ? 100 : undefined}
                                    />
                                    <Form.Text className="text-muted">
                                        {formData.loai_giam === 'phan_tram' ? 'Tối đa 100%' : 'Nhập số tiền (VNĐ)'}
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Giảm tối đa (nếu %)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.giam_toi_da}
                                        onChange={(e) => setFormData({ ...formData, giam_toi_da: e.target.value })}
                                        disabled={formData.loai_giam !== 'phan_tram'}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Đơn tối thiểu</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.gia_tri_don_toi_thieu}
                                        onChange={(e) => setFormData({ ...formData, gia_tri_don_toi_thieu: e.target.value })}
                                        min="0"
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Số lượng <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.so_luong}
                                        onChange={(e) => setFormData({ ...formData, so_luong: e.target.value })}
                                        required
                                        min="1"
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ngày bắt đầu <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.ngay_bat_dau}
                                        onChange={(e) => setFormData({ ...formData, ngay_bat_dau: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Ngày kết thúc <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.ngay_ket_thuc}
                                        onChange={(e) => setFormData({ ...formData, ngay_ket_thuc: e.target.value })}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        {editingCoupon && (
                            <Form.Group>
                                <Form.Check
                                    type="checkbox"
                                    label="Kích hoạt mã giảm giá"
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
                            {editingCoupon ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, coupon: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa mã <strong>{deleteModal.coupon?.ma_giam_gia}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, coupon: null })}>
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

export default CouponList;
