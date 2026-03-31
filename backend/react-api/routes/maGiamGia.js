const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách mã giảm giá
router.get('/', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT * FROM ma_giam_gia ORDER BY ngay_tao DESC');

        res.json(result.recordset);
    } catch (error) {
        console.error('Lỗi lấy mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Kiểm tra mã giảm giá (public - cho user checkout)
router.post('/check', async (req, res) => {
    try {
        const { ma, tong_tien } = req.body;

        if (!ma) {
            return res.status(400).json({ error: 'Vui lòng nhập mã giảm giá' });
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ma', sql.NVarChar, ma)
            .query(`
                SELECT * FROM ma_giam_gia 
                WHERE ma = @ma AND trang_thai = 1 
                AND ngay_bat_dau <= GETDATE() AND ngay_ket_thuc >= GETDATE()
                AND (so_luong_da_dung < so_luong OR so_luong IS NULL)
            `);

        if (result.recordset.length === 0) {
            return res.status(400).json({ error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' });
        }

        const coupon = result.recordset[0];
        let discount = 0;

        // Kiểm tra đơn tối thiểu
        if (coupon.don_toi_thieu && tong_tien < coupon.don_toi_thieu) {
            return res.status(400).json({ 
                error: `Đơn hàng tối thiểu ${coupon.don_toi_thieu.toLocaleString()}đ để sử dụng mã này` 
            });
        }

        if (coupon.loai_giam === 'phan_tram') {
            discount = tong_tien * (coupon.gia_tri / 100);
            if (coupon.giam_toi_da && discount > coupon.giam_toi_da) {
                discount = coupon.giam_toi_da;
            }
        } else {
            discount = coupon.gia_tri;
        }

        res.json({
            valid: true,
            ma: coupon.ma,
            loai_giam: coupon.loai_giam,
            gia_tri: coupon.gia_tri,
            giam_toi_da: coupon.giam_toi_da,
            discount: discount,
            mo_ta: coupon.mo_ta
        });
    } catch (error) {
        console.error('Lỗi kiểm tra mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết mã giảm giá
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT * FROM ma_giam_gia WHERE id = @id');

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy mã giảm giá' });
        }

        res.json(result.recordset[0]);
    } catch (error) {
        console.error('Lỗi lấy chi tiết mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Thêm mã giảm giá (Admin)
router.post('/', async (req, res) => {
    try {
        const { ma, mo_ta, loai_giam, gia_tri, giam_toi_da, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc } = req.body;

        if (!ma || !gia_tri) {
            return res.status(400).json({ error: 'Vui lòng nhập mã và giá trị giảm' });
        }

        const pool = await getPool();
        
        // Kiểm tra mã đã tồn tại
        const checkResult = await pool.request()
            .input('ma', sql.NVarChar, ma)
            .query('SELECT id FROM ma_giam_gia WHERE ma = @ma');

        if (checkResult.recordset.length > 0) {
            return res.status(400).json({ error: 'Mã giảm giá đã tồn tại' });
        }

        const result = await pool.request()
            .input('ma', sql.NVarChar, ma)
            .input('mo_ta', sql.NVarChar, mo_ta)
            .input('loai_giam', sql.NVarChar, loai_giam || 'tien')
            .input('gia_tri', sql.Decimal(15, 2), gia_tri)
            .input('giam_toi_da', sql.Decimal(15, 2), giam_toi_da || null)
            .input('don_toi_thieu', sql.Decimal(15, 2), don_toi_thieu || null)
            .input('so_luong', sql.Int, so_luong || null)
            .input('ngay_bat_dau', sql.Date, ngay_bat_dau || new Date())
            .input('ngay_ket_thuc', sql.Date, ngay_ket_thuc)
            .query(`
                INSERT INTO ma_giam_gia (ma, mo_ta, loai_giam, gia_tri, giam_toi_da, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc)
                OUTPUT INSERTED.id
                VALUES (@ma, @mo_ta, @loai_giam, @gia_tri, @giam_toi_da, @don_toi_thieu, @so_luong, @ngay_bat_dau, @ngay_ket_thuc)
            `);

        res.status(201).json({
            message: 'Thêm mã giảm giá thành công',
            id: result.recordset[0].id
        });
    } catch (error) {
        console.error('Lỗi thêm mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Cập nhật mã giảm giá (Admin)
router.put('/:id', async (req, res) => {
    try {
        const { mo_ta, loai_giam, gia_tri, giam_toi_da, don_toi_thieu, so_luong, ngay_bat_dau, ngay_ket_thuc, trang_thai } = req.body;

        const pool = await getPool();
        await pool.request()
            .input('mo_ta', sql.NVarChar, mo_ta)
            .input('loai_giam', sql.NVarChar, loai_giam)
            .input('gia_tri', sql.Decimal(15, 2), gia_tri)
            .input('giam_toi_da', sql.Decimal(15, 2), giam_toi_da || null)
            .input('don_toi_thieu', sql.Decimal(15, 2), don_toi_thieu || null)
            .input('so_luong', sql.Int, so_luong || null)
            .input('ngay_bat_dau', sql.Date, ngay_bat_dau)
            .input('ngay_ket_thuc', sql.Date, ngay_ket_thuc)
            .input('trang_thai', sql.Bit, trang_thai === 'true' || trang_thai === true ? 1 : 0)
            .input('id', sql.Int, req.params.id)
            .query(`
                UPDATE ma_giam_gia SET 
                    mo_ta = @mo_ta, loai_giam = @loai_giam, gia_tri = @gia_tri,
                    giam_toi_da = @giam_toi_da, don_toi_thieu = @don_toi_thieu,
                    so_luong = @so_luong, ngay_bat_dau = @ngay_bat_dau, 
                    ngay_ket_thuc = @ngay_ket_thuc, trang_thai = @trang_thai
                WHERE id = @id
            `);

        res.json({ message: 'Cập nhật mã giảm giá thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Xóa mã giảm giá (Admin)
router.delete('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM ma_giam_gia WHERE id = @id');

        res.json({ message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        console.error('Lỗi xóa mã giảm giá:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
