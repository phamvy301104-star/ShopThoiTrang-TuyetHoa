const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách liên hệ (Admin)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const pool = await getPool();
        
        const countResult = await pool.request()
            .query('SELECT COUNT(*) as total FROM lien_he');
        const total = countResult.recordset[0].total;

        const listResult = await pool.request()
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT * FROM lien_he 
                ORDER BY ngay_gui DESC
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
        console.error('Lỗi lấy danh sách liên hệ:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Gửi liên hệ (Public)
router.post('/', async (req, res) => {
    try {
        const { ho_ten, email, chu_de, noi_dung } = req.body;

        if (!ho_ten || !email || !chu_de || !noi_dung) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin' });
        }

        const pool = await getPool();
        await pool.request()
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('email', sql.NVarChar, email)
            .input('chu_de', sql.NVarChar, chu_de)
            .input('noi_dung', sql.NVarChar, noi_dung)
            .query(`
                INSERT INTO lien_he (ho_ten, email, chu_de, noi_dung, trang_thai, ngay_gui)
                VALUES (@ho_ten, @email, @chu_de, @noi_dung, N'chua_doc', GETDATE())
            `);

        res.json({ message: 'Gửi liên hệ thành công' });
    } catch (error) {
        console.error('Lỗi gửi liên hệ:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết liên hệ
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM lien_he WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy liên hệ' });
        }

        // Đánh dấu đã đọc
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE lien_he SET trang_thai = N'da_doc' WHERE id = @id");

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết liên hệ:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Xóa liên hệ
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM lien_he WHERE id = @id');

        res.json({ message: 'Xóa liên hệ thành công' });
    } catch (error) {
        console.error('Lỗi xóa liên hệ:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
