const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách nhân viên
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';

        const pool = await getPool();
        let whereClause = 'WHERE trang_thai = 1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (ho_ten LIKE @search OR ma_nv LIKE @search OR so_dien_thoai LIKE @search)';
            const searchVal = '%' + search + '%';
            countReq.input('search', sql.NVarChar, searchVal);
            listReq.input('search', sql.NVarChar, searchVal);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM nhan_vien ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT * FROM nhan_vien ${whereClause}
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
        console.error('Lỗi lấy danh sách nhân viên:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết nhân viên
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM nhan_vien WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết nhân viên:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thêm nhân viên
router.post('/', async (req, res) => {
    try {
        const { ma_nv, ho_ten, so_dien_thoai, email, dia_chi, chuc_vu, luong } = req.body;

        if (!ho_ten || !ma_nv) {
            return res.status(400).json({ error: 'Vui lòng nhập mã và họ tên nhân viên' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ma_nv', sql.NVarChar, ma_nv)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('chuc_vu', sql.NVarChar, chuc_vu)
            .input('luong', sql.Decimal(15, 2), luong || 0)
            .query(`
                INSERT INTO nhan_vien (ma_nv, ho_ten, so_dien_thoai, email, dia_chi, chuc_vu, luong)
                OUTPUT INSERTED.id
                VALUES (@ma_nv, @ho_ten, @so_dien_thoai, @email, @dia_chi, @chuc_vu, @luong)
            `);

        res.status(201).json({
            message: 'Thêm nhân viên thành công',
            id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Lỗi thêm nhân viên:', error);
        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ error: 'Mã nhân viên đã tồn tại' });
        }
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Cập nhật nhân viên
router.put('/:id', async (req, res) => {
    try {
        const { ma_nv, ho_ten, so_dien_thoai, email, dia_chi, chuc_vu, luong, trang_thai } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('ma_nv', sql.NVarChar, ma_nv)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .input('email', sql.NVarChar, email)
            .input('dia_chi', sql.NVarChar, dia_chi)
            .input('chuc_vu', sql.NVarChar, chuc_vu)
            .input('luong', sql.Decimal(15, 2), luong || 0)
            .input('trang_thai', sql.Bit, trang_thai === 'true' || trang_thai === true ? 1 : 0)
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE nhan_vien SET 
                    ma_nv = @ma_nv, ho_ten = @ho_ten, so_dien_thoai = @so_dien_thoai,
                    email = @email, dia_chi = @dia_chi, chuc_vu = @chuc_vu, 
                    luong = @luong, trang_thai = @trang_thai
                WHERE id = @id
            `);

        res.json({ message: 'Cập nhật nhân viên thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật nhân viên:', error);
        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ error: 'Mã nhân viên đã tồn tại' });
        }
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Xóa nhân viên (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE nhan_vien SET trang_thai = 0 WHERE id = @id');

        res.json({ message: 'Xóa nhân viên thành công' });
    } catch (error) {
        console.error('Lỗi xóa nhân viên:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
