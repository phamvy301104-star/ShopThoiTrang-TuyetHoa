import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        ho_ten: '',
        email: '',
        so_dien_thoai: '',
        tieu_de: '',
        noi_dung: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/lien-he', formData);
            toast.success('Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.');
            setSubmitted(true);
            setFormData({
                ho_ten: '',
                email: '',
                so_dien_thoai: '',
                tieu_de: '',
                noi_dung: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <h2 className="text-center mb-5">Liên hệ với chúng tôi</h2>

            <Row>
                <Col lg={5} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="mb-4">Thông tin liên hệ</h4>

                            <div className="d-flex mb-4">
                                <div className="bg-primary text-white rounded-circle p-3 me-3">
                                    <FaMapMarkerAlt />
                                </div>
                                <div>
                                    <h6 className="mb-1">Địa chỉ</h6>
                                    <p className="text-muted mb-0">
                                        123 Đường ABC, Quận 1, TP.HCM
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex mb-4">
                                <div className="bg-primary text-white rounded-circle p-3 me-3">
                                    <FaPhone />
                                </div>
                                <div>
                                    <h6 className="mb-1">Điện thoại</h6>
                                    <p className="text-muted mb-0">
                                        0123 456 789
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex mb-4">
                                <div className="bg-primary text-white rounded-circle p-3 me-3">
                                    <FaEnvelope />
                                </div>
                                <div>
                                    <h6 className="mb-1">Email</h6>
                                    <p className="text-muted mb-0">
                                        support@shopthoitrang.com
                                    </p>
                                </div>
                            </div>

                            <div className="d-flex">
                                <div className="bg-primary text-white rounded-circle p-3 me-3">
                                    <FaClock />
                                </div>
                                <div>
                                    <h6 className="mb-1">Giờ làm việc</h6>
                                    <p className="text-muted mb-0">
                                        8:00 - 21:00 (Thứ 2 - Chủ nhật)
                                    </p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={7}>
                    <Card className="border-0 shadow-sm">
                        <Card.Body className="p-4">
                            <h4 className="mb-4">Gửi tin nhắn cho chúng tôi</h4>

                            {submitted && (
                                <Alert variant="success" dismissible onClose={() => setSubmitted(false)}>
                                    Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                                </Alert>
                            )}

                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Họ tên <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.ho_ten}
                                                onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                                                required
                                                placeholder="Nhập họ tên"
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
                                                placeholder="Nhập email"
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
                                                placeholder="Nhập số điện thoại"
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Tiêu đề <span className="text-danger">*</span></Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={formData.tieu_de}
                                                onChange={(e) => setFormData({ ...formData, tieu_de: e.target.value })}
                                                required
                                                placeholder="Nhập tiêu đề"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-4">
                                    <Form.Label>Nội dung <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={5}
                                        value={formData.noi_dung}
                                        onChange={(e) => setFormData({ ...formData, noi_dung: e.target.value })}
                                        required
                                        placeholder="Nhập nội dung tin nhắn"
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Contact;
