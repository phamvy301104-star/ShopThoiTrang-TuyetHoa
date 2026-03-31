const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách khách hàng
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const pool = await getPool();
        let whereClause = 'WHERE 1=1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (ho_ten LIKE @search OR so_dien_thoai LIKE @search OR email LIKE @search)';
            const searchVal = '%' + search + '%';
            countReq.input('search', sql.NVarChar, searchVal);
            listReq.input('search', sql.NVarChar, searchVal);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM khach_hang ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT * FROM khach_hang ${whereClause}
            ORDER BY ngay_tao DESC
            OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
        `);

        res.json({
            data: listResult.recordset,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách khách hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết khách hàng
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM khach_hang WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        }

        // Lấy lịch sử đơn hàng
        const orders = await pool.request()
            .input('khach_hang_id', sql.Int, req.params.id)
            .query(`
                SELECT TOP 10 * FROM don_hang 
                WHERE khach_hang_id = @khach_hang_id 
                ORDER BY ngay_tao DESC
            `);

        res.json({
            ...result.recordset[0],
            donHang: orders.recordset
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết khách hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thêm khách hàng
router.post('/', async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email, dia_chi, ghi_chu } = req.body;

        if (!ho_ten) {
            return res.status(400).json({ error: 'Vui lòng nhập họ tên' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu)
            .query(`
                INSERT INTO khach_hang (ho_ten, so_dien_thoai, email, dia_chi, ghi_chu)
                OUTPUT INSERTED.id
                VALUES (@ho_ten, @so_dien_thoai, @email, @dia_chi, @ghi_chu)
            `);

        res.status(201).json({
            message: 'Thêm khách hàng thành công',
            id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Lỗi thêm khách hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Cập nhật khách hàng
router.put('/:id', async (req, res) => {
    try {
        const { ho_ten, so_dien_thoai, email, dia_chi, ghi_chu } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu)
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE khach_hang SET 
                    ho_ten = @ho_ten, so_dien_thoai = @so_dien_thoai, 
                    email = @email, dia_chi = @dia_chi, ghi_chu = @ghi_chu
                WHERE id = @id
            `);

        res.json({ message: 'Cập nhật khách hàng thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật khách hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Xóa khách hàng (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        
        // Kiểm tra có đơn hàng không
        const checkResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM don_hang WHERE khach_hang_id = @id');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Không thể xóa khách hàng đã có đơn hàng' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM khach_hang WHERE id = @id');

        res.json({ message: 'Xóa khách hàng thành công' });
    } catch (error) {
        console.error('Lỗi xóa khách hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
