const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách danh mục
router.get('/', async (req, res) => {
    try {
        const showAll = req.query.all === 'true';
        const pool = await getPool();
        
        let query = 'SELECT * FROM danh_muc';
        if (!showAll) {
            query += ' WHERE trang_thai = 1';
        }
        query += ' ORDER BY ten_danh_muc';
        
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết danh mục
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM danh_muc WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy danh mục' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thêm danh mục (Admin)
router.post('/', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;

        if (!ten_danh_muc) {
            return res.status(400).json({ error: 'Vui lòng nhập tên danh mục' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ten_danh_muc', sql.NVarChar, ten_danh_muc)
            .input('mo_ta', sql.NVarChar, mo_ta)
            .query(`
                INSERT INTO danh_muc (ten_danh_muc, mo_ta)
                OUTPUT INSERTED.id
                VALUES (@ten_danh_muc, @mo_ta)
            `);

        res.status(201).json({ 
            message: 'Thêm danh mục thành công',
            id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Lỗi thêm danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Cập nhật danh mục (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta, trang_thai } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('ten_danh_muc', sql.NVarChar, ten_danh_muc)
            .input('mo_ta', sql.NVarChar, mo_ta)
            .input('trang_thai', sql.Bit, trang_thai === 'true' || trang_thai === true ? 1 : 0)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE danh_muc SET ten_danh_muc = @ten_danh_muc, mo_ta = @mo_ta, trang_thai = @trang_thai WHERE id = @id');

        res.json({ message: 'Cập nhật danh mục thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Xóa danh mục (Admin - soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        
        // Kiểm tra có sản phẩm nào trong danh mục không
        const checkResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT COUNT(*) as count FROM san_pham WHERE danh_muc_id = @id AND trang_thai = 1');

        if (checkResult.recordset[0].count > 0) {
            return res.status(400).json({ error: 'Không thể xóa danh mục đang có sản phẩm' });
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE danh_muc SET trang_thai = 0 WHERE id = @id');

        res.json({ message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error('Lỗi xóa danh mục:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
