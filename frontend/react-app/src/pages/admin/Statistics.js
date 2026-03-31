import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { FaChartBar, FaChartLine, FaDownload } from 'react-icons/fa';
import { statisticsAPI } from '../../services/api';
import { toast } from 'react-toastify';

const Statistics = () => {
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [stats, setStats] = useState({
        revenue: [],
        topProducts: [],
        topCategories: [],
        orderStats: null
    });

    useEffect(() => {
        fetchStatistics();
    }, [dateRange]);

    const fetchStatistics = async () => {
        setLoading(true);
        try {
            const [revenueRes, topProductsRes, orderStatsRes] = await Promise.all([
                statisticsAPI.getRevenue(dateRange),
                statisticsAPI.getTopProducts({ ...dateRange, limit: 10 }),
                statisticsAPI.getOrderStats(dateRange)
            ]);

            setStats({
                revenue: revenueRes.data,
                topProducts: topProductsRes.data,
                orderStats: orderStatsRes.data
            });
        } catch (error) {
            toast.error('Lỗi tải thống kê');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
    };

    const totalRevenue = stats.revenue.reduce((sum, item) => sum + (item.doanh_thu || 0), 0);
    const totalOrders = stats.orderStats?.tong_don_hang || 0;
    const completedOrders = stats.orderStats?.don_hoan_thanh || 0;
    const cancelledOrders = stats.orderStats?.don_huy || 0;

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">
                    <FaChartBar className="me-2" />
                    Thống kê báo cáo
                </h4>
            </div>

            {/* Date Filter */}
            <Card className="mb-4">
                <Card.Body>
                    <Row className="align-items-end">
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Từ ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <Form.Group>
                                <Form.Label>Đến ngày</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex gap-2">
                                <Button variant="primary" onClick={fetchStatistics}>
                                    Xem thống kê
                                </Button>
                                <Button
                                    variant="outline-primary"
                                    onClick={() => setDateRange({
                                        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                                        endDate: new Date().toISOString().split('T')[0]
                                    })}
                                >
                                    Tháng này
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {loading ? (
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <Row className="mb-4">
                        <Col md={3}>
                            <Card className="text-center border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">Tổng doanh thu</h6>
                                    <h3 className="text-danger mb-0">{formatCurrency(totalRevenue)}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">Tổng đơn hàng</h6>
                                    <h3 className="text-primary mb-0">{totalOrders}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">Đơn hoàn thành</h6>
                                    <h3 className="text-success mb-0">{completedOrders}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="text-center border-0 shadow-sm">
                                <Card.Body>
                                    <h6 className="text-muted mb-2">Đơn đã hủy</h6>
                                    <h3 className="text-warning mb-0">{cancelledOrders}</h3>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Row>
                        {/* Revenue by Day */}
                        <Col lg={7}>
                            <Card className="mb-4">
                                <Card.Header className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">
                                        <FaChartLine className="me-2" />
                                        Doanh thu theo ngày
                                    </h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>Ngày</th>
                                                <th className="text-center">Số đơn</th>
                                                <th className="text-end">Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.revenue.length > 0 ? (
                                                stats.revenue.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(item.ngay).toLocaleDateString('vi-VN')}</td>
                                                        <td className="text-center">{item.so_don || 0}</td>
                                                        <td className="text-end text-danger fw-bold">
                                                            {formatCurrency(item.doanh_thu)}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-4 text-muted">
                                                        Không có dữ liệu
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {stats.revenue.length > 0 && (
                                            <tfoot className="bg-light">
                                                <tr>
                                                    <td><strong>Tổng cộng</strong></td>
                                                    <td className="text-center">
                                                        <strong>{stats.revenue.reduce((sum, i) => sum + (i.so_don || 0), 0)}</strong>
                                                    </td>
                                                    <td className="text-end text-danger">
                                                        <strong>{formatCurrency(totalRevenue)}</strong>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Top Products */}
                        <Col lg={5}>
                            <Card className="mb-4">
                                <Card.Header>
                                    <h5 className="mb-0">Top sản phẩm bán chạy</h5>
                                </Card.Header>
                                <Card.Body className="p-0">
                                    <Table responsive hover className="mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Sản phẩm</th>
                                                <th className="text-center">Đã bán</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.topProducts.length > 0 ? (
                                                stats.topProducts.map((product, index) => (
                                                    <tr key={product.id}>
                                                        <td>
                                                            <span className={`badge ${index < 3 ? 'bg-warning' : 'bg-secondary'}`}>
                                                                {index + 1}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <img
                                                                    src={product.hinh_anh || '/placeholder.png'}
                                                                    alt={product.ten_san_pham}
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                    className="rounded me-2"
                                                                />
                                                                <span className="text-truncate" style={{ maxWidth: '150px' }}>
                                                                    {product.ten_san_pham}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="text-center fw-bold">{product.so_luong_ban}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="text-center py-4 text-muted">
                                                        Không có dữ liệu
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </>
    );
};

export default Statistics;
