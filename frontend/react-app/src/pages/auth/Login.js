import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
    const [formData, setFormData] = useState({ ten_dang_nhap: '', mat_khau: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await login(formData);
            if (data.user.vai_tro === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Đăng nhập thất bại');
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
                            <h3 className="text-center mb-4">Đăng nhập</h3>
                            
                            {error && <Alert variant="danger">{error}</Alert>}
                            
                            <Form onSubmit={handleSubmit}>
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
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" className="w-100" disabled={loading}>
                                    {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </Button>
                            </Form>

                            <div className="text-center mt-3">
                                <span>Chưa có tài khoản? </span>
                                <Link to="/dang-ky">Đăng ký ngay</Link>
                            </div>
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </Container>
    );
};

export default Login;
