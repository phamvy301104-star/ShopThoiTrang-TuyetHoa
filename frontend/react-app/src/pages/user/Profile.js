import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        ho_ten: user?.ho_ten || '',
        email: user?.email || '',
        so_dien_thoai: user?.so_dien_thoai || '',
        dia_chi: user?.dia_chi || ''
    });
    const [passwordData, setPasswordData] = useState({
        mat_khau_cu: '',
        mat_khau_moi: '',
        xac_nhan_mat_khau: ''
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await authAPI.updateProfile(formData);
            setUser({ ...user, ...res.data });
            toast.success('Cập nhật thông tin thành công');
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwordData.mat_khau_moi !== passwordData.xac_nhan_mat_khau) {
            toast.error('Mật khẩu xác nhận không khớp');
            return;
        }

        if (passwordData.mat_khau_moi.length < 6) {
            toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                mat_khau_cu: passwordData.mat_khau_cu,
                mat_khau_moi: passwordData.mat_khau_moi
            });
            toast.success('Đổi mật khẩu thành công');
            setPasswordData({
                mat_khau_cu: '',
                mat_khau_moi: '',
                xac_nhan_mat_khau: ''
            });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="py-5">
            <h3 className="mb-4">Tài khoản của tôi</h3>

            <Row>
                <Col lg={6} className="mb-4">
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Thông tin cá nhân</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleUpdateProfile}>
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
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        disabled
                                    />
                                    <Form.Text className="text-muted">
                                        Email không thể thay đổi
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Số điện thoại</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        value={formData.so_dien_thoai}
                                        onChange={(e) => setFormData({ ...formData, so_dien_thoai: e.target.value })}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Địa chỉ</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.dia_chi}
                                        onChange={(e) => setFormData({ ...formData, dia_chi: e.target.value })}
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>

                <Col lg={6}>
                    <Card>
                        <Card.Header>
                            <h5 className="mb-0">Đổi mật khẩu</h5>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Mật khẩu hiện tại</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={passwordData.mat_khau_cu}
                                        onChange={(e) => setPasswordData({ ...passwordData, mat_khau_cu: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Mật khẩu mới</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={passwordData.mat_khau_moi}
                                        onChange={(e) => setPasswordData({ ...passwordData, mat_khau_moi: e.target.value })}
                                        required
                                        minLength={6}
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                                    <Form.Control
                                        type="password"
                                        value={passwordData.xac_nhan_mat_khau}
                                        onChange={(e) => setPasswordData({ ...passwordData, xac_nhan_mat_khau: e.target.value })}
                                        required
                                    />
                                </Form.Group>

                                <Button type="submit" variant="primary" disabled={loading}>
                                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default Profile;
