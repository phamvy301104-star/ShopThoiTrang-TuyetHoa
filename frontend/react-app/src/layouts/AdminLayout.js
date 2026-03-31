import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Container, Nav, Navbar, Dropdown } from 'react-bootstrap';
import { FaUser, FaBox, FaList, FaShoppingCart, FaUsers, FaUserTie, FaChartBar, FaTag, FaCog, FaSignOutAlt, FaTachometerAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const AdminLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/dang-nhap');
    };

    const menuItems = [
        { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', exact: true },
        { path: '/admin/san-pham', icon: <FaBox />, label: 'Sản phẩm' },
        { path: '/admin/danh-muc', icon: <FaList />, label: 'Danh mục' },
        { path: '/admin/don-hang', icon: <FaShoppingCart />, label: 'Đơn hàng' },
        { path: '/admin/khach-hang', icon: <FaUsers />, label: 'Khách hàng' },
        { path: '/admin/nhan-vien', icon: <FaUserTie />, label: 'Nhân viên', adminOnly: true },
        { path: '/admin/thong-ke', icon: <FaChartBar />, label: 'Thống kê', adminOnly: true },
        { path: '/admin/ma-giam-gia', icon: <FaTag />, label: 'Mã giảm giá', adminOnly: true },
    ];

    const filteredMenuItems = menuItems.filter(item => 
        !item.adminOnly || user?.vai_tro === 'admin'
    );

    return (
        <div className="d-flex">
            {/* Sidebar */}
            <div className="sidebar bg-dark text-white" style={{ width: '250px', minHeight: '100vh' }}>
                <div className="p-3 border-bottom border-secondary">
                    <h5 className="mb-0">🛍️ Shop Thời Trang</h5>
                    <small className="text-muted">Admin Panel</small>
                </div>
                <Nav className="flex-column p-2">
                    {filteredMenuItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.exact}
                            className={({ isActive }) =>
                                `nav-link text-white d-flex align-items-center gap-2 py-2 px-3 rounded mb-1 ${isActive ? 'bg-primary' : 'hover-bg-secondary'}`
                            }
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </Nav>
            </div>

            {/* Main content */}
            <div className="flex-grow-1">
                {/* Top navbar */}
                <Navbar bg="white" className="border-bottom px-4 py-2">
                    <Navbar.Brand></Navbar.Brand>
                    <Nav className="ms-auto align-items-center">
                        <Dropdown align="end">
                            <Dropdown.Toggle variant="light" className="d-flex align-items-center gap-2">
                                <FaUser />
                                {user?.ho_ten || 'Admin'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                <Dropdown.Item onClick={() => navigate('/admin/doi-mat-khau')}>
                                    <FaCog className="me-2" />
                                    Đổi mật khẩu
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <FaSignOutAlt className="me-2" />
                                    Đăng xuất
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Nav>
                </Navbar>

                {/* Page content */}
                <Container fluid className="p-4">
                    <Outlet />
                </Container>
            </div>
        </div>
    );
};

export default AdminLayout;
