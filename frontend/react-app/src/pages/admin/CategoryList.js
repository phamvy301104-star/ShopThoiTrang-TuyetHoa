import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Modal, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({ ten_danh_muc: '', mo_ta: '', trang_thai: true });
    const [deleteModal, setDeleteModal] = useState({ show: false, category: null });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await categoryAPI.getAll(true);
            setCategories(res.data);
        } catch (error) {
            toast.error('Lỗi tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                ten_danh_muc: category.ten_danh_muc,
                mo_ta: category.mo_ta || '',
                trang_thai: category.trang_thai
            });
        } else {
            setEditingCategory(null);
            setFormData({ ten_danh_muc: '', mo_ta: '', trang_thai: true });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory.id, formData);
                toast.success('Cập nhật danh mục thành công');
            } else {
                await categoryAPI.create(formData);
                toast.success('Thêm danh mục thành công');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const handleDelete = async () => {
        try {
            await categoryAPI.delete(deleteModal.category.id);
            toast.success('Xóa danh mục thành công');
            setDeleteModal({ show: false, category: null });
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý danh mục</h4>
                <Button variant="primary" onClick={() => handleOpenModal()}>
                    <FaPlus className="me-2" />
                    Thêm danh mục
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
                                    <th>ID</th>
                                    <th>Tên danh mục</th>
                                    <th>Mô tả</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '120px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id}>
                                        <td>{cat.id}</td>
                                        <td>{cat.ten_danh_muc}</td>
                                        <td>{cat.mo_ta || '-'}</td>
                                        <td>
                                            <Badge bg={cat.trang_thai ? 'success' : 'secondary'}>
                                                {cat.trang_thai ? 'Hiện' : 'Ẩn'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => handleOpenModal(cat)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setDeleteModal({ show: true, category: cat })}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {categories.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-muted">
                                            Chưa có danh mục nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>
            </Card>

            {/* Add/Edit Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên danh mục <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                value={formData.ten_danh_muc}
                                onChange={(e) => setFormData({ ...formData, ten_danh_muc: e.target.value })}
                                required
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mô tả</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                value={formData.mo_ta}
                                onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                            />
                        </Form.Group>
                        {editingCategory && (
                            <Form.Group>
                                <Form.Check
                                    type="checkbox"
                                    label="Hiển thị danh mục"
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
                            {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* Delete Modal */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, category: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa danh mục <strong>{deleteModal.category?.ten_danh_muc}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, category: null })}>
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

export default CategoryList;
