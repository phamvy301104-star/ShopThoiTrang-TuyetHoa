const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp)'));
    }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Lấy danh sách sản phẩm (public - dùng cho cả user và admin)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const danhMucId = req.query.danh_muc || '';
        const gioiTinh = req.query.gioi_tinh || '';
        const showAll = req.query.all === 'true'; // Admin xem tất cả, kể cả ẩn

        const pool = await getPool();

        let whereClause = showAll ? 'WHERE 1=1' : 'WHERE sp.trang_thai = 1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (sp.ten_sp LIKE @search OR sp.ma_sp LIKE @search)';
            const searchVal = '%' + search + '%';
            countReq.input('search', sql.NVarChar, searchVal);
            listReq.input('search', sql.NVarChar, searchVal);
        }
        if (danhMucId) {
            whereClause += ' AND sp.danh_muc_id = @danhMucId';
            countReq.input('danhMucId', sql.Int, parseInt(danhMucId));
            listReq.input('danhMucId', sql.Int, parseInt(danhMucId));
        }
        if (gioiTinh) {
            whereClause += ' AND sp.gioi_tinh = @gioiTinh';
            countReq.input('gioiTinh', sql.NVarChar, gioiTinh);
            listReq.input('gioiTinh', sql.NVarChar, gioiTinh);
        }

        const countResult = await countReq.query(`SELECT COUNT(*) as total FROM san_pham sp ${whereClause}`);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT sp.*, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
            ${whereClause}
            ORDER BY sp.ngay_tao DESC
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
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy sản phẩm mới nhất (cho trang chủ)
router.get('/newest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const pool = await getPool();
        
        const result = await pool.request()
            .input('limit', sql.Int, limit)
            .query(`
                SELECT TOP (@limit) sp.*, dm.ten_danh_muc
                FROM san_pham sp
                LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                WHERE sp.trang_thai = 1 AND sp.so_luong > 0
                ORDER BY sp.ngay_tao DESC
            `);

        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy sản phẩm mới:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết sản phẩm
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT sp.*, dm.ten_danh_muc
                FROM san_pham sp
                LEFT JOIN danh_muc dm ON sp.danh_muc_id = dm.id
                WHERE sp.id = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
        }

        // Lấy sản phẩm liên quan
        const sp = result.recordset[0];
        const related = await pool.request()
            .input('danh_muc_id', sql.Int, sp.danh_muc_id)
            .input('id', sql.Int, sp.id)
            .query(`
                SELECT TOP 4 * FROM san_pham
                WHERE danh_muc_id = @danh_muc_id AND id != @id AND trang_thai = 1 AND so_luong > 0
                ORDER BY ngay_tao DESC
            `);

        res.json({
            ...sp,
            sanPhamLienQuan: related.recordset
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thêm sản phẩm mới (Admin)
router.post('/', upload.single('hinh_anh'), async (req, res) => {
    try {
        const { ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta, gioi_tinh } = req.body;
        const hinh_anh = req.file ? '/uploads/' + req.file.filename : null;

        const pool = await getPool();
        const result = await pool.request()
            .input('ma_sp', sql.NVarChar, ma_sp)
            .input('ten_sp', sql.NVarChar, ten_sp)
            .input('danh_muc_id', sql.Int, danh_muc_id || null)
            .input('gia_nhap', sql.Decimal(15, 2), gia_nhap || 0)
            .input('gia_ban', sql.Decimal(15, 2), gia_ban || 0)
            .input('so_luong', sql.Int, so_luong || 0)
            .input('kich_thuoc', sql.NVarChar, kich_thuoc)
            .input('mau_sac', sql.NVarChar, mau_sac)
            .input('chat_lieu', sql.NVarChar, chat_lieu)
            .input('hinh_anh', sql.NVarChar, hinh_anh)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh || 'Unisex')
            .query(`
                INSERT INTO san_pham (ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, hinh_anh, mo_ta, gioi_tinh)
                OUTPUT INSERTED.id
                VALUES (@ma_sp, @ten_sp, @danh_muc_id, @gia_nhap, @gia_ban, @so_luong, @kich_thuoc, @mau_sac, @chat_lieu, @hinh_anh, @mo_ta, @gioi_tinh)
            `);

        res.status(201).json({ 
            message: 'Thêm sản phẩm thành công',
            id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Lỗi thêm sản phẩm:', error);
        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ error: 'Mã sản phẩm đã tồn tại' });
        }
        res.status(500).json({ error: 'Có lỗi xảy ra khi thêm sản phẩm' });
    }
});

// Cập nhật sản phẩm (Admin)
router.put('/:id', upload.single('hinh_anh'), async (req, res) => {
    try {
        const { ma_sp, ten_sp, danh_muc_id, gia_nhap, gia_ban, so_luong, kich_thuoc, mau_sac, chat_lieu, mo_ta, gioi_tinh, trang_thai } = req.body;
        
        const pool = await getPool();
        
        let updateSql = `
            UPDATE san_pham SET 
                ma_sp = @ma_sp, ten_sp = @ten_sp, danh_muc_id = @danh_muc_id, 
                gia_nhap = @gia_nhap, gia_ban = @gia_ban, so_luong = @so_luong, 
                kich_thuoc = @kich_thuoc, mau_sac = @mau_sac, chat_lieu = @chat_lieu, 
                mo_ta = @mo_ta, gioi_tinh = @gioi_tinh, trang_thai = @trang_thai
        `;

        const request = pool.request()
            .input('ma_sp', sql.NVarChar, ma_sp)
            .input('ten_sp', sql.NVarChar, ten_sp)
            .input('danh_muc_id', sql.Int, danh_muc_id || null)
            .input('gia_nhap', sql.Decimal(15, 2), gia_nhap || 0)
            .input('gia_ban', sql.Decimal(15, 2), gia_ban || 0)
            .input('so_luong', sql.Int, so_luong || 0)
            .input('kich_thuoc', sql.NVarChar, kich_thuoc)
            .input('mau_sac', sql.NVarChar, mau_sac)
            .input('chat_lieu', sql.NVarChar, chat_lieu)
            .input('mo_ta', sql.NVarChar(sql.MAX), mo_ta)
            .input('gioi_tinh', sql.NVarChar, gioi_tinh || 'Unisex')
            .input('trang_thai', sql.Bit, trang_thai === 'true' || trang_thai === true ? 1 : 0)
            .input('id', sql.Int, req.params.id);

        if (req.file) {
            updateSql += ', hinh_anh = @hinh_anh';
            request.input('hinh_anh', sql.NVarChar, '/uploads/' + req.file.filename);
        }

        updateSql += ' WHERE id = @id';
        await request.query(updateSql);

        res.json({ message: 'Cập nhật sản phẩm thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật sản phẩm:', error);
        if (error.number === 2627 || error.number === 2601) {
            return res.status(400).json({ error: 'Mã sản phẩm đã tồn tại' });
        }
        res.status(500).json({ error: 'Có lỗi xảy ra khi cập nhật sản phẩm' });
    }
});

// Xóa sản phẩm (Admin - soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('UPDATE san_pham SET trang_thai = 0 WHERE id = @id');

        res.json({ message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Lỗi xóa sản phẩm:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
