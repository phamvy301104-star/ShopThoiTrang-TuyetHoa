import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Badge, Dropdown } from 'react-bootstrap';
import { FaUser, FaShoppingCart, FaHome, FaStore, FaClipboardList, FaSignOutAlt, FaSignInAlt, FaUserPlus } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const UserLayout = () => {
    const { user, logout, isAuthenticated, isAdmin } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* Navbar */}
            <Navbar bg="white" expand="lg" className="shadow-sm sticky-top">
                <Container>
                    <Navbar.Brand as={NavLink} to="/" className="fw-bold text-primary">
                        🛍️ Shop Thời Trang
                    </Navbar.Brand>
                    <Navbar.Toggle />
                    <Navbar.Collapse>
                        <Nav className="me-auto">
                            <Nav.Link as={NavLink} to="/" className="d-flex align-items-center gap-1">
                                <FaHome /> Trang chủ
                            </Nav.Link>
                            <Nav.Link as={NavLink} to="/san-pham" className="d-flex align-items-center gap-1">
                                <FaStore /> Cửa hàng
                            </Nav.Link>
                            <Nav.Link as={NavLink} to="/lien-he" className="d-flex align-items-center gap-1">
                                Liên hệ
                            </Nav.Link>
                        </Nav>
                        <Nav className="align-items-center gap-2">
                            <Nav.Link as={NavLink} to="/gio-hang" className="position-relative">
                                <FaShoppingCart size={20} />
                                {cartCount > 0 && (
                                    <Badge bg="danger" pill className="position-absolute" style={{ top: '-5px', right: '-10px', fontSize: '10px' }}>
                                        {cartCount}
                                    </Badge>
                                )}
                            </Nav.Link>
                            
                            {isAuthenticated ? (
                                <Dropdown align="end">
                                    <Dropdown.Toggle variant="outline-primary" className="d-flex align-items-center gap-2">
                                        <FaUser />
                                        {user?.ho_ten}
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        {isAdmin && (
                                            <>
                                                <Dropdown.Item onClick={() => navigate('/admin')}>
                                                    Quản trị
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                            </>
                                        )}
                                        <Dropdown.Item onClick={() => navigate('/tai-khoan')}>
                                            <FaUser className="me-2" />
                                            Tài khoản
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={() => navigate('/don-hang')}>
                                            <FaClipboardList className="me-2" />
                                            Đơn hàng của tôi
                                        </Dropdown.Item>
                                        <Dropdown.Divider />
                                        <Dropdown.Item onClick={handleLogout} className="text-danger">
                                            <FaSignOutAlt className="me-2" />
                                            Đăng xuất
                                        </Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            ) : (
                                <>
                                    <Nav.Link as={NavLink} to="/dang-nhap" className="d-flex align-items-center gap-1">
                                        <FaSignInAlt /> Đăng nhập
                                    </Nav.Link>
                                    <Nav.Link as={NavLink} to="/dang-ky" className="d-flex align-items-center gap-1">
                                        <FaUserPlus /> Đăng ký
                                    </Nav.Link>
                                </>
                            )}
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* Main content */}
            <main className="flex-grow-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-dark text-white py-4 mt-5">
                <Container>
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <h5>🛍️ Shop Thời Trang</h5>
                            <p className="text-muted">Thời trang chất lượng cho mọi người</p>
                        </div>
                        <div className="col-md-4 mb-3">
                            <h6>Liên hệ</h6>
                            <p className="text-muted mb-1">📞 1900 1234</p>
                            <p className="text-muted mb-1">📧 contact@shop.com</p>
                            <p className="text-muted">📍 123 Đường ABC, TP.HCM</p>
                        </div>
                        <div className="col-md-4 mb-3">
                            <h6>Chính sách</h6>
                            <p className="text-muted mb-1">Chính sách đổi trả</p>
                            <p className="text-muted mb-1">Chính sách vận chuyển</p>
                            <p className="text-muted">Điều khoản sử dụng</p>
                        </div>
                    </div>
                    <hr className="border-secondary" />
                    <p className="text-center text-muted mb-0">© 2024 Shop Thời Trang. All rights reserved.</p>
                </Container>
            </footer>
        </div>
    );
};

export default UserLayout;
