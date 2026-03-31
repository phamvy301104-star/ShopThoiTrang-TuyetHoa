const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Thống kê tổng quan (Dashboard)
router.get('/dashboard', async (req, res) => {
    try {
        const pool = await getPool();

        // Thống kê cơ bản
        const stats = await pool.request().query(`
            SELECT 
                (SELECT COUNT(*) FROM san_pham WHERE trang_thai = 1) as tongSanPham,
                (SELECT COUNT(*) FROM don_hang) as tongDonHang,
                (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'cho_xac_nhan') as donChoXacNhan,
                (SELECT COUNT(*) FROM don_hang WHERE trang_thai = 'da_giao') as donDaGiao,
                (SELECT ISNULL(SUM(thanh_toan), 0) FROM don_hang WHERE trang_thai = 'da_giao') as doanhThu,
                (SELECT COUNT(*) FROM khach_hang) as tongKhachHang,
                (SELECT COUNT(*) FROM tai_khoan WHERE vai_tro = 'nguoidung') as tongNguoiDung
        `);

        // Doanh thu 7 ngày gần nhất
        const revenueByDay = await pool.request().query(`
            SELECT 
                CONVERT(varchar, ngay_tao, 23) as ngay,
                SUM(thanh_toan) as doanh_thu,
                COUNT(*) as so_don
            FROM don_hang 
            WHERE trang_thai = 'da_giao' 
                AND ngay_tao >= DATEADD(day, -7, GETDATE())
            GROUP BY CONVERT(varchar, ngay_tao, 23)
            ORDER BY ngay DESC
        `);

        // Top sản phẩm bán chạy
        const topProducts = await pool.request().query(`
            SELECT TOP 5 
                sp.id, sp.ten_sp, sp.hinh_anh,
                SUM(ct.so_luong) as so_luong_ban,
                SUM(ct.thanh_tien) as doanh_thu
            FROM chi_tiet_don_hang ct
            JOIN san_pham sp ON ct.san_pham_id = sp.id
            JOIN don_hang dh ON ct.don_hang_id = dh.id
            WHERE dh.trang_thai = 'da_giao'
            GROUP BY sp.id, sp.ten_sp, sp.hinh_anh
            ORDER BY so_luong_ban DESC
        `);

        // Đơn hàng mới nhất
        const recentOrders = await pool.request().query(`
            SELECT TOP 5 dh.*, kh.ho_ten as ten_khach
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
            ORDER BY dh.ngay_tao DESC
        `);

        res.json({
            ...stats.recordset[0],
            doanhThuTheoNgay: revenueByDay.recordset,
            topSanPham: topProducts.recordset,
            donHangMoi: recentOrders.recordset
        });
    } catch (error) {
        console.error('Lỗi lấy thống kê dashboard:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thống kê doanh thu theo khoảng thời gian
router.get('/revenue', async (req, res) => {
    try {
        const { from, to, group_by } = req.query;
        const pool = await getPool();

        let groupFormat = 'CONVERT(varchar, ngay_tao, 23)'; // Default by day
        if (group_by === 'month') {
            groupFormat = "FORMAT(ngay_tao, 'yyyy-MM')";
        } else if (group_by === 'year') {
            groupFormat = 'YEAR(ngay_tao)';
        }

        let query = `
            SELECT 
                ${groupFormat} as thoi_gian,
                SUM(thanh_toan) as doanh_thu,
                COUNT(*) as so_don_hang
            FROM don_hang 
            WHERE trang_thai = 'da_giao'
        `;

        const request = pool.request();
        if (from) {
            query += ' AND ngay_tao >= @from';
            request.input('from', sql.Date, from);
        }
        if (to) {
            query += ' AND ngay_tao <= @to';
            request.input('to', sql.Date, to);
        }

        query += ` GROUP BY ${groupFormat} ORDER BY thoi_gian DESC`;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi thống kê doanh thu:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thống kê sản phẩm
router.get('/products', async (req, res) => {
    try {
        const { from, to } = req.query;
        const pool = await getPool();

        let query = `
            SELECT 
                sp.id, sp.ma_sp, sp.ten_sp, sp.hinh_anh,
                dm.ten_danh_muc,
                ISNULL(SUM(ct.so_luong), 0) as so_luong_ban,
                ISNULL(SUM(ct.thanh_tien), 0) as doanh_thu,
                sp.so_luong as ton_kho
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            LEFT JOIN chi_tiet_don_hang ct ON sp.id = ct.san_pham_id
            LEFT JOIN don_hang dh ON ct.don_hang_id = dh.id AND dh.trang_thai = 'da_giao'
        `;

        const request = pool.request();
        let whereClause = ' WHERE sp.trang_thai = 1';

        if (from) {
            whereClause += ' AND (dh.ngay_tao IS NULL OR dh.ngay_tao >= @from)';
            request.input('from', sql.Date, from);
        }
        if (to) {
            whereClause += ' AND (dh.ngay_tao IS NULL OR dh.ngay_tao <= @to)';
            request.input('to', sql.Date, to);
        }

        query += whereClause + `
            GROUP BY sp.id, sp.ma_sp, sp.ten_sp, sp.hinh_anh, dm.ten_danh_muc, sp.so_luong
            ORDER BY so_luong_ban DESC
        `;

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi thống kê sản phẩm:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thống kê theo danh mục
router.get('/categories', async (req, res) => {
    try {
        const pool = await getPool();

        const result = await pool.request().query(`
            SELECT 
                dm.id, dm.ten_danh_muc,
                COUNT(DISTINCT sp.id) as so_san_pham,
                ISNULL(SUM(ct.so_luong), 0) as so_luong_ban,
                ISNULL(SUM(ct.thanh_tien), 0) as doanh_thu
            FROM danh_muc dm
            LEFT JOIN san_pham sp ON dm.id = sp.danh_muc_id AND sp.trang_thai = 1
            LEFT JOIN chi_tiet_don_hang ct ON sp.id = ct.san_pham_id
            LEFT JOIN don_hang dh ON ct.don_hang_id = dh.id AND dh.trang_thai = 'da_giao'
            WHERE dm.trang_thai = 1
            GROUP BY dm.id, dm.ten_danh_muc
            ORDER BY doanh_thu DESC
        `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi thống kê danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
