import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { FaBox, FaShoppingCart, FaUsers, FaChartLine } from 'react-icons/fa';
import { statisticAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await statisticAPI.getDashboard();
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const statusColors = {
        'cho_xac_nhan': 'warning',
        'da_xac_nhan': 'info',
        'dang_giao': 'primary',
        'da_giao': 'success',
        'da_huy': 'danger'
    };

    const statusLabels = {
        'cho_xac_nhan': 'Chờ xác nhận',
        'da_xac_nhan': 'Đã xác nhận',
        'dang_giao': 'Đang giao',
        'da_giao': 'Đã giao',
        'da_huy': 'Đã hủy'
    };

    if (loading) {
        return (
            <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            <h4 className="mb-4">Dashboard</h4>

            {/* Stats Cards */}
            <Row className="g-4 mb-4">
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100 bg-primary text-white">
                        <Card.Body className="d-flex align-items-center">
                            <FaBox size={40} className="me-3 opacity-75" />
                            <div>
                                <h3 className="mb-0">{stats?.tongSanPham || 0}</h3>
                                <small>Sản phẩm</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100 bg-success text-white">
                        <Card.Body className="d-flex align-items-center">
                            <FaShoppingCart size={40} className="me-3 opacity-75" />
                            <div>
                                <h3 className="mb-0">{stats?.tongDonHang || 0}</h3>
                                <small>Đơn hàng</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100 bg-warning text-white">
                        <Card.Body className="d-flex align-items-center">
                            <FaUsers size={40} className="me-3 opacity-75" />
                            <div>
                                <h3 className="mb-0">{stats?.tongKhachHang || 0}</h3>
                                <small>Khách hàng</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6} lg={3}>
                    <Card className="border-0 shadow-sm h-100 bg-info text-white">
                        <Card.Body className="d-flex align-items-center">
                            <FaChartLine size={40} className="me-3 opacity-75" />
                            <div>
                                <h5 className="mb-0">{formatPrice(stats?.doanhThu || 0)}</h5>
                                <small>Doanh thu</small>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Row className="g-4">
                {/* Recent Orders */}
                <Col lg={8}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <div className="d-flex justify-content-between align-items-center">
                                <strong>Đơn hàng mới nhất</strong>
                                <Link to="/admin/don-hang" className="btn btn-sm btn-outline-primary">
                                    Xem tất cả
                                </Link>
                            </div>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table responsive hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Mã ĐH</th>
                                        <th>Khách hàng</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày tạo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.donHangMoi?.map((order) => (
                                        <tr key={order.id}>
                                            <td>
                                                <Link to={`/admin/don-hang/${order.id}`}>
                                                    {order.ma_dh}
                                                </Link>
                                            </td>
                                            <td>{order.ten_khach || order.ho_ten || 'Khách lẻ'}</td>
                                            <td>{formatPrice(order.thanh_toan)}</td>
                                            <td>
                                                <Badge bg={statusColors[order.trang_thai]}>
                                                    {statusLabels[order.trang_thai]}
                                                </Badge>
                                            </td>
                                            <td>{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</td>
                                        </tr>
                                    ))}
                                    {!stats?.donHangMoi?.length && (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                Chưa có đơn hàng nào
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Top Products */}
                <Col lg={4}>
                    <Card className="shadow-sm">
                        <Card.Header className="bg-white">
                            <strong>Sản phẩm bán chạy</strong>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table hover className="mb-0">
                                <thead className="bg-light">
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th className="text-end">Đã bán</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats?.topSanPham?.map((product) => (
                                        <tr key={product.id}>
                                            <td className="text-truncate" style={{ maxWidth: '200px' }}>
                                                {product.ten_sp}
                                            </td>
                                            <td className="text-end">{product.so_luong_ban}</td>
                                        </tr>
                                    ))}
                                    {!stats?.topSanPham?.length && (
                                        <tr>
                                            <td colSpan="2" className="text-center text-muted py-4">
                                                Chưa có dữ liệu
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* Quick Stats */}
                    <Card className="shadow-sm mt-4">
                        <Card.Header className="bg-white">
                            <strong>Thống kê nhanh</strong>
                        </Card.Header>
                        <Card.Body>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span>Đơn chờ xác nhận:</span>
                                <Badge bg="warning">{stats?.donChoXacNhan || 0}</Badge>
                            </div>
                            <div className="d-flex justify-content-between py-2 border-bottom">
                                <span>Đơn đã giao:</span>
                                <Badge bg="success">{stats?.donDaGiao || 0}</Badge>
                            </div>
                            <div className="d-flex justify-content-between py-2">
                                <span>Người dùng:</span>
                                <Badge bg="info">{stats?.tongNguoiDung || 0}</Badge>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default Dashboard;
