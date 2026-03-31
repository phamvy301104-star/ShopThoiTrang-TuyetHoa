import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Form, Pagination, Badge, Modal } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSearch, FaEye } from 'react-icons/fa';
import { productAPI, categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [pagination, setPagination] = useState({});
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ search: '', danh_muc: '', page: 1 });
    const [deleteModal, setDeleteModal] = useState({ show: false, product: null });
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, [filters]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await productAPI.getAll({ ...filters, all: true, limit: 10 });
            setProducts(res.data.data);
            setPagination(res.data.pagination);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Lỗi tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getAll(true);
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDelete = async () => {
        try {
            await productAPI.delete(deleteModal.product.id);
            toast.success('Xóa sản phẩm thành công');
            setDeleteModal({ show: false, product: null });
            fetchProducts();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Quản lý sản phẩm</h4>
                <Button as={Link} to="/admin/san-pham/them" variant="primary">
                    <FaPlus className="me-2" />
                    Thêm sản phẩm
                </Button>
            </div>

            {/* Filters */}
            <Card className="mb-4">
                <Card.Body>
                    <div className="row g-3">
                        <div className="col-md-4">
                            <Form.Control
                                type="text"
                                placeholder="Tìm theo tên hoặc mã SP..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            />
                        </div>
                        <div className="col-md-3">
                            <Form.Select
                                value={filters.danh_muc}
                                onChange={(e) => setFilters({ ...filters, danh_muc: e.target.value, page: 1 })}
                            >
                                <option value="">Tất cả danh mục</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.ten_danh_muc}</option>
                                ))}
                            </Form.Select>
                        </div>
                        <div className="col-md-2">
                            <Button variant="secondary" onClick={() => setFilters({ search: '', danh_muc: '', page: 1 })}>
                                Xóa lọc
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Products Table */}
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
                                    <th style={{ width: '80px' }}>Ảnh</th>
                                    <th>Mã SP</th>
                                    <th>Tên sản phẩm</th>
                                    <th>Danh mục</th>
                                    <th>Giá bán</th>
                                    <th>Tồn kho</th>
                                    <th>Trạng thái</th>
                                    <th style={{ width: '120px' }}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td>
                                            <img
                                                src={product.hinh_anh ? `${API_URL}${product.hinh_anh}` : 'https://via.placeholder.com/50'}
                                                alt={product.ten_sp}
                                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                                className="rounded"
                                            />
                                        </td>
                                        <td>{product.ma_sp}</td>
                                        <td>{product.ten_sp}</td>
                                        <td>{product.ten_danh_muc || '-'}</td>
                                        <td>{formatPrice(product.gia_ban)}</td>
                                        <td>
                                            <Badge bg={product.so_luong > 10 ? 'success' : product.so_luong > 0 ? 'warning' : 'danger'}>
                                                {product.so_luong}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Badge bg={product.trang_thai ? 'success' : 'secondary'}>
                                                {product.trang_thai ? 'Hiện' : 'Ẩn'}
                                            </Badge>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline-primary"
                                                size="sm"
                                                className="me-1"
                                                onClick={() => navigate(`/admin/san-pham/sua/${product.id}`)}
                                            >
                                                <FaEdit />
                                            </Button>
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => setDeleteModal({ show: true, product })}
                                            >
                                                <FaTrash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {products.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="text-center py-4 text-muted">
                                            Không có sản phẩm nào
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    )}
                </Card.Body>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <Card.Footer className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                            Hiển thị {products.length} / {pagination.total} sản phẩm
                        </small>
                        <Pagination className="mb-0">
                            <Pagination.Prev
                                disabled={pagination.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                            />
                            {[...Array(pagination.totalPages)].map((_, idx) => (
                                <Pagination.Item
                                    key={idx + 1}
                                    active={idx + 1 === pagination.page}
                                    onClick={() => setFilters({ ...filters, page: idx + 1 })}
                                >
                                    {idx + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={pagination.page === pagination.totalPages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                            />
                        </Pagination>
                    </Card.Footer>
                )}
            </Card>

            {/* Delete Modal */}
            <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, product: null })}>
                <Modal.Header closeButton>
                    <Modal.Title>Xác nhận xóa</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Bạn có chắc muốn xóa sản phẩm <strong>{deleteModal.product?.ten_sp}</strong>?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDeleteModal({ show: false, product: null })}>
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

export default ProductList;
