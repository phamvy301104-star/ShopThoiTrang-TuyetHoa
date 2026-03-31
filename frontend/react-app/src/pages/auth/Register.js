import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const Register = () => {
    const [formData, setFormData] = useState({
        ho_ten: '',
        ten_dang_nhap: '',
        mat_khau: '',
        xac_nhan: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.mat_khau !== formData.xac_nhan) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        setLoading(true);

        try {
            await register(formData);
            toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/dang-nhap');
        } catch (err) {
            setError(err.response?.data?.error || 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <div className="row justify-content-center">
                <div className="col-md-5">
                    <Card className="shadow">
                        <Card.Body className="p-4">
                            <h3 className="text-center mb-4">Đăng ký</h3>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Họ tên</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.ho_ten}
                                        onChange={(e) => setFormData({ ...formData, ho_ten: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Tên đăng nhập</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.ten_dang_nhap}
                                        onChange={(e) => setFormData({ ...formData, ten_dang_nhap: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Mật khẩu</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.mat_khau}
                                        onChange={(e) => setFormData({ ...formData, mat_khau: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Xác nhận mật khẩu</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={formData.xac_nhan}
                                        onChange={(e) => setFormData({ ...formData, xac_nhan: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                                    {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                                </Button>
                            </Form>

                            <div className="text-center mt-3">
                                <span>Đã có tài khoản? </span>
                                <Link to="/dang-nhap">Đăng nhập</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default Register;
