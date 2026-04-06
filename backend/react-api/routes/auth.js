const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sql, getPool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Đăng ký
router.post('/register', async (req, res) => {
    try {
        const { ho_ten, ten_dang_nhap, mat_khau, xac_nhan } = req.body;

        if (!ho_ten || !ten_dang_nhap || !mat_khau) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        if (mat_khau.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        if (mat_khau !== xac_nhan) {
            return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
        }

        const pool = await getPool();

        // Kiểm tra tên đăng nhập đã tồn tại chưa
        const checkResult = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap');

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('vai_tro', sql.NVarChar, 'nguoidung')
            .query('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @vai_tro)');

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;

        if (!ten_dang_nhap || !mat_khau) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT * FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap AND trang_thai = 1');

        if (result.recordset.length === 0) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);

        if (!isMatch) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        // Tạo JWT token
        const token = jwt.sign(
            {
                id: user.id,
                ten_dang_nhap: user.ten_dang_nhap,
                ho_ten: user.ho_ten,
                vai_tro: user.vai_tro
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user.id,
                ten_dang_nhap: user.ten_dang_nhap,
                ho_ten: user.ho_ten,
                vai_tro: user.vai_tro
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra, vui lòng thử lại' });
    }
});

// Lấy thông tin user hiện tại
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT id, ten_dang_nhap, ho_ten, vai_tro, email, so_dien_thoai, dia_chi FROM tai_khoan WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Đổi mật khẩu
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi, xac_nhan } = req.body;

        if (!mat_khau_cu || !mat_khau_moi || !xac_nhan) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        if (mat_khau_moi !== xac_nhan) {
            return res.status(400).json({ error: 'Mật khẩu mới không khớp' });
        }

        if (mat_khau_moi.length < 6) {
            return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.user.id)
            .query('SELECT mat_khau FROM tai_khoan WHERE id = @id');

        const isMatch = await bcrypt.compare(mat_khau_cu, result.recordset[0].mat_khau);
        if (!isMatch) {
            return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
        }

        const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
        await pool.request()
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('id', sql.Int, req.user.id)
            .query('UPDATE tai_khoan SET mat_khau = @mat_khau WHERE id = @id');

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Lỗi đổi mật khẩu:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Cập nhật thông tin cá nhân
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, dia_chi } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('email', sql.NVarChar, email)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('id', sql.Int, req.user.id)
            .query('UPDATE tai_khoan SET ho_ten = @ho_ten, email = @email, so_dien_thoai = @so_dien_thoai, dia_chi = @dia_chi WHERE id = @id');

        res.json({ message: 'Cập nhật thông tin thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật profile:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
