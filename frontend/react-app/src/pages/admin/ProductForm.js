import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { FaSave, FaArrowLeft } from 'react-icons/fa';
import { productAPI, categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        ma_sp: '',
        ten_sp: '',
        danh_muc_id: '',
        gia_nhap: '',
        gia_ban: '',
        so_luong: '',
        kich_thuoc: '',
        mau_sac: '',
        chat_lieu: '',
        gioi_tinh: 'Unisex',
        mo_ta: '',
        trang_thai: true
    });

    const [imageFile, setImageFile] = useState(null);

    useEffect(() => {
        fetchCategories();
        if (isEdit) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res = await categoryAPI.getAll(true);
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProduct = async () => {
        try {
            const res = await productAPI.getById(id);
            const product = res.data;
            setFormData({
                ma_sp: product.ma_sp || '',
                ten_sp: product.ten_sp || '',
                danh_muc_id: product.danh_muc_id || '',
                gia_nhap: product.gia_nhap || '',
                gia_ban: product.gia_ban || '',
                so_luong: product.so_luong || '',
                kich_thuoc: product.kich_thuoc || '',
                mau_sac: product.mau_sac || '',
                chat_lieu: product.chat_lieu || '',
                gioi_tinh: product.gioi_tinh || 'Unisex',
                mo_ta: product.mo_ta || '',
                trang_thai: product.trang_thai
            });
            if (product.hinh_anh) {
                setImagePreview(`${API_URL}${product.hinh_anh}`);
            }
        } catch (error) {
            toast.error('Không tìm thấy sản phẩm');
            navigate('/admin/san-pham');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                data.append(key, formData[key]);
            });
            if (imageFile) {
                data.append('hinh_anh', imageFile);
            }

            if (isEdit) {
                await productAPI.update(id, data);
                toast.success('Cập nhật sản phẩm thành công');
            } else {
                await productAPI.create(data);
                toast.success('Thêm sản phẩm thành công');
            }
            navigate('/admin/san-pham');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h4>
                <Button variant="secondary" onClick={() => navigate('/admin/san-pham')}>
                    <FaArrowLeft className="me-2" />
                    Quay lại
                </Button>
            </div>

            <Card>
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={8}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Mã sản phẩm <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ma_sp"
                                                value={formData.ma_sp}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tên sản phẩm <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="ten_sp"
                                                value={formData.ten_sp}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Danh mục</Form.Label>
                                            <Form.Select
                                                name="danh_muc_id"
                                                value={formData.danh_muc_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">-- Chọn danh mục --</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>{cat.ten_danh_muc}</option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Giới tính</Form.Label>
                                            <Form.Select
                                                name="gioi_tinh"
                                                value={formData.gioi_tinh}
                                                onChange={handleChange}
                                            >
                                                <option value="Nam">Nam</option>
                                                <option value="Nữ">Nữ</option>
                                                <option value="Unisex">Unisex</option>
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Giá nhập</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="gia_nhap"
                                                value={formData.gia_nhap}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Giá bán <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="gia_ban"
                                                value={formData.gia_ban}
                                                onChange={handleChange}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Số lượng</Form.Label>
                                            <Form.Control
                                                type="number"
                                                name="so_luong"
                                                value={formData.so_luong}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Kích thước</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="kich_thuoc"
                                                value={formData.kich_thuoc}
                                                onChange={handleChange}
                                                placeholder="S, M, L, XL..."
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Màu sắc</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="mau_sac"
                                                value={formData.mau_sac}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Chất liệu</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="chat_lieu"
                                                value={formData.chat_lieu}
                                                onChange={handleChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Mô tả</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={4}
                                        name="mo_ta"
                                        value={formData.mo_ta}
                                        onChange={handleChange}
                                    />
                                </Form.Group>

                                {isEdit && (
                                    <Form.Group className="mb-3">
                                        <Form.Check
                                            type="checkbox"
                                            label="Hiển thị sản phẩm"
                                            name="trang_thai"
                                            checked={formData.trang_thai}
                                            onChange={handleChange}
                                        />
                                    </Form.Group>
                                )}
                            </Col>

                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Hình ảnh</Form.Label>
                                    <Form.Control
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview && (
                                        <div className="mt-3">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="img-fluid rounded"
                                                style={{ maxHeight: '300px' }}
                                            />
                                        </div>
                                    )}
                                </Form.Group>
                            </Col>
                        </Row>

                        <hr />

                        <div className="d-flex gap-2">
                            <Button type="submit" variant="primary" disabled={loading}>
                                <FaSave className="me-2" />
                                {loading ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm mới')}
                            </Button>
                            <Button variant="secondary" onClick={() => navigate('/admin/san-pham')}>
                                Hủy
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </>
    );
};

export default ProductForm;
