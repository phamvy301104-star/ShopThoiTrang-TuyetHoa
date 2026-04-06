const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../config/database');

// Lấy danh sách đơn hàng (Admin)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || '';
        const trangThai = req.query.trang_thai || '';

        const pool = await getPool();
        let whereClause = 'WHERE 1=1';
        const countReq = pool.request();
        const listReq = pool.request();

        if (search) {
            whereClause += ' AND (dh.ma_dh LIKE @search OR kh.ho_ten LIKE @search)';
            const searchVal = '%' + search + '%';
            countReq.input('search', sql.NVarChar, searchVal);
            listReq.input('search', sql.NVarChar, searchVal);
        }
        if (trangThai) {
            whereClause += ' AND dh.trang_thai = @trangThai';
            countReq.input('trangThai', sql.NVarChar, trangThai);
            listReq.input('trangThai', sql.NVarChar, trangThai);
        }

        const countResult = await countReq.query(`
            SELECT COUNT(*) as total FROM don_hang dh 
            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id ${whereClause}
        `);
        const total = countResult.recordset[0].total;

        listReq.input('offset', sql.Int, offset);
        listReq.input('limit', sql.Int, limit);
        const listResult = await listReq.query(`
            SELECT dh.*, kh.ho_ten as ten_khach, nv.ho_ten as ten_nv
            FROM don_hang dh
            LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id
            LEFT JOIN nhan_vien nv ON dh.nhan_vien_id = nv.id
            ${whereClause}
            ORDER BY dh.ngay_tao DESC
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
        console.error('Lỗi lấy danh sách đơn hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy đơn hàng của user hiện tại
router.get('/my-orders', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const pool = await getPool();
        
        const countResult = await pool.request()
            .input('tai_khoan_id', sql.Int, req.user.id)
            .query('SELECT COUNT(*) as total FROM don_hang WHERE tai_khoan_id = @tai_khoan_id');
        const total = countResult.recordset[0].total;

        const listResult = await pool.request()
            .input('tai_khoan_id', sql.Int, req.user.id)
            .input('offset', sql.Int, offset)
            .input('limit', sql.Int, limit)
            .query(`
                SELECT * FROM don_hang 
                WHERE tai_khoan_id = @tai_khoan_id
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
        console.error('Lỗi lấy đơn hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Lấy chi tiết đơn hàng
router.get('/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const donHangResult = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query(`
                SELECT dh.*, kh.ho_ten as ten_khach, kh.so_dien_thoai, kh.dia_chi as dia_chi_kh, 
                       nv.ho_ten as ten_nv
                FROM don_hang dh 
                LEFT JOIN khach_hang kh ON dh.khach_hang_id = kh.id 
                LEFT JOIN nhan_vien nv ON dh.nhan_vien_id = nv.id 
                WHERE dh.id = @id
            `);

        if (donHangResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        const chiTiets = await pool.request()
            .input('don_hang_id', sql.Int, req.params.id)
            .query(`
                SELECT ct.*, sp.ten_sp, sp.ma_sp, sp.hinh_anh
                FROM chi_tiet_don_hang ct 
                JOIN san_pham sp ON ct.san_pham_id = sp.id 
                WHERE ct.don_hang_id = @don_hang_id
            `);

        res.json({
            ...donHangResult.recordset[0],
            chiTiet: chiTiets.recordset
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết đơn hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

// Tạo đơn hàng (User checkout)
router.post('/', async (req, res) => {
    const pool = await getPool();
    const transaction = new sql.Transaction(pool);
    
    try {
        await transaction.begin();
        
        const { ho_ten, so_dien_thoai, dia_chi, phuong_thuc_tt, ghi_chu, items, ma_giam_gia } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ error: 'Giỏ hàng trống' });
        }

        if (!ho_ten || !so_dien_thoai || !dia_chi) {
            return res.status(400).json({ error: 'Vui lòng nhập đầy đủ thông tin giao hàng' });
        }

        // Tạo mã đơn hàng
        const maxIdResult = await new sql.Request(transaction)
            .query('SELECT ISNULL(MAX(id), 0) as maxId FROM don_hang');
        const maDH = 'DH' + String(maxIdResult.recordset[0].maxId + 1).padStart(6, '0');

        let tongTien = 0;
        const chiTietItems = [];

        // Kiểm tra và tính tổng tiền
        for (const item of items) {
            const spResult = await new sql.Request(transaction)
                .input('id', sql.Int, item.san_pham_id)
                .query('SELECT * FROM san_pham WHERE id = @id AND trang_thai = 1');

            if (spResult.recordset.length === 0) {
                await transaction.rollback();
                return res.status(400).json({ error: `Sản phẩm ID ${item.san_pham_id} không tồn tại` });
            }

            const sp = spResult.recordset[0];
            const soLuong = parseInt(item.so_luong) || 1;

            if (soLuong > sp.so_luong) {
                await transaction.rollback();
                return res.status(400).json({ 
                    error: `Sản phẩm "${sp.ten_sp}" chỉ còn ${sp.so_luong} trong kho` 
                });
            }

            const thanhTien = sp.gia_ban * soLuong;
            tongTien += thanhTien;
            chiTietItems.push({ 
                san_pham_id: sp.id, 
                so_luong: soLuong, 
                don_gia: sp.gia_ban, 
                thanh_tien: thanhTien 
            });
        }

        // Xử lý mã giảm giá
        let giamGia = 0;
        if (ma_giam_gia) {
            const couponResult = await new sql.Request(transaction)
                .input('ma', sql.NVarChar, ma_giam_gia)
                .query(`
                    SELECT * FROM ma_giam_gia 
                    WHERE ma = @ma AND trang_thai = 1 
                    AND ngay_bat_dau <= GETDATE() AND ngay_ket_thuc >= GETDATE()
                    AND (so_luong_da_dung < so_luong OR so_luong IS NULL)
                `);

            if (couponResult.recordset.length > 0) {
                const coupon = couponResult.recordset[0];
                if (coupon.loai_giam === 'phan_tram') {
                    giamGia = tongTien * (coupon.gia_tri / 100);
                    if (coupon.giam_toi_da && giamGia > coupon.giam_toi_da) {
                        giamGia = coupon.giam_toi_da;
                    }
                } else {
                    giamGia = coupon.gia_tri;
                }

                // Cập nhật số lượng đã dùng
                await new sql.Request(transaction)
                    .input('id', sql.Int, coupon.id)
                    .query('UPDATE ma_giam_gia SET so_luong_da_dung = so_luong_da_dung + 1 WHERE id = @id');
            }
        }

        const thanhToan = tongTien - giamGia;

        // Tìm hoặc tạo khách hàng từ thông tin giao hàng
        let khachHangId = null;
        const khResult = await new sql.Request(transaction)
            .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
            .query('SELECT id FROM khach_hang WHERE so_dien_thoai = @so_dien_thoai');
        
        if (khResult.recordset.length > 0) {
            khachHangId = khResult.recordset[0].id;
            // Cập nhật thông tin mới nhất
            await new sql.Request(transaction)
                .input('id', sql.Int, khachHangId)
                .input('ho_ten', sql.NVarChar, ho_ten)
                .input('dia_chi', sql.NVarChar, dia_chi)
                .query('UPDATE khach_hang SET ho_ten = @ho_ten, dia_chi = @dia_chi WHERE id = @id');
        } else {
            const khInsert = await new sql.Request(transaction)
                .input('ho_ten', sql.NVarChar, ho_ten)
                .input('so_dien_thoai', sql.NVarChar, so_dien_thoai)
                .input('dia_chi', sql.NVarChar, dia_chi)
                .query('INSERT INTO khach_hang (ho_ten, so_dien_thoai, dia_chi) OUTPUT INSERTED.id VALUES (@ho_ten, @so_dien_thoai, @dia_chi)');
            khachHangId = khInsert.recordset[0].id;
        }

        // Tạo đơn hàng
        const insertResult = await new sql.Request(transaction)
            .input('ma_dh', sql.NVarChar, maDH)
            .input('tai_khoan_id', sql.Int, req.user.id)
            .input('khach_hang_id', sql.Int, khachHangId)
            .input('tong_tien', sql.Decimal(15, 2), tongTien)
            .input('giam_gia', sql.Decimal(15, 2), giamGia)
            .input('thanh_toan', sql.Decimal(15, 2), thanhToan)
            .input('phuong_thuc_tt', sql.NVarChar, phuong_thuc_tt || 'tien_mat')
            .input('ghi_chu', sql.NVarChar(sql.MAX), ghi_chu)
            .query(`
                INSERT INTO don_hang (ma_dh, tai_khoan_id, khach_hang_id, tong_tien, giam_gia, thanh_toan, phuong_thuc_tt, ghi_chu) 
                OUTPUT INSERTED.id 
                VALUES (@ma_dh, @tai_khoan_id, @khach_hang_id, @tong_tien, @giam_gia, @thanh_toan, @phuong_thuc_tt, @ghi_chu)
            `);

        const donHangId = insertResult.recordset[0].id;

        // Thêm chi tiết đơn hàng và cập nhật số lượng
        for (const item of chiTietItems) {
            await new sql.Request(transaction)
                .input('don_hang_id', sql.Int, donHangId)
                .input('san_pham_id', sql.Int, item.san_pham_id)
                .input('so_luong', sql.Int, item.so_luong)
                .input('don_gia', sql.Decimal(15, 2), item.don_gia)
                .input('thanh_tien', sql.Decimal(15, 2), item.thanh_tien)
                .query(`
                    INSERT INTO chi_tiet_don_hang (don_hang_id, san_pham_id, so_luong, don_gia, thanh_tien) 
                    VALUES (@don_hang_id, @san_pham_id, @so_luong, @don_gia, @thanh_tien)
                `);

            await new sql.Request(transaction)
                .input('so_luong', sql.Int, item.so_luong)
                .input('id', sql.Int, item.san_pham_id)
                .query('UPDATE san_pham SET so_luong = so_luong - @so_luong WHERE id = @id');
        }

        await transaction.commit();

        res.status(201).json({ 
            message: 'Đặt hàng thành công',
            orderId: donHangId,
            maDonHang: maDH
        });
    } catch (error) {
        try { await transaction.rollback(); } catch(e) {}
        console.error('Lỗi tạo đơn hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra khi đặt hàng' });
    }
});

// Cập nhật trạng thái đơn hàng (Admin) - hỗ trợ cả PUT /:id và PUT /:id/status
router.put('/:id', async (req, res) => {
    req.params.id = req.params.id;
    return donHangStatusHandler(req, res);
});

router.put('/:id/status', async (req, res) => {
    return donHangStatusHandler(req, res);
});

async function donHangStatusHandler(req, res) {
    try {
        const { trang_thai } = req.body;
        const validStatuses = ['cho_xac_nhan', 'da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy'];
        
        if (!validStatuses.includes(trang_thai)) {
            return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        const pool = await getPool();

        // Kiểm tra trạng thái hiện tại
        const current = await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('SELECT trang_thai FROM don_hang WHERE id = @id');

        if (current.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        const currentStatus = current.recordset[0].trang_thai;

        // Kiểm tra luồng trạng thái hợp lệ
        const validTransitions = {
            'cho_xac_nhan': ['da_xac_nhan', 'da_huy'],
            'da_xac_nhan': ['dang_giao', 'da_huy'],
            'dang_giao': ['da_giao'],
            'da_giao': [],
            'da_huy': []
        };

        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(trang_thai)) {
            return res.status(400).json({ error: 'Không thể chuyển sang trạng thái này' });
        }

        // Hoàn trả số lượng khi hủy đơn
        if (trang_thai === 'da_huy') {
            const chiTiets = await pool.request()
                .input('don_hang_id', sql.Int, req.params.id)
                .query('SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');

            for (const ct of chiTiets.recordset) {
                await pool.request()
                    .input('so_luong', sql.Int, ct.so_luong)
                    .input('id', sql.Int, ct.san_pham_id)
                    .query('UPDATE san_pham SET so_luong = so_luong + @so_luong WHERE id = @id');
            }
        }

        await pool.request()
            .input('trang_thai', sql.NVarChar, trang_thai)
            .input('id', sql.Int, req.params.id)
            .query('UPDATE don_hang SET trang_thai = @trang_thai WHERE id = @id');

        const statusNames = {
            'da_xac_nhan': 'Đã xác nhận đơn hàng',
            'dang_giao': 'Đang giao hàng',
            'da_giao': 'Đã giao hàng thành công',
            'da_huy': 'Đã hủy đơn hàng'
        };

        res.json({ message: statusNames[trang_thai] || 'Cập nhật thành công' });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
}

// Hủy đơn hàng (User)
router.put('/:id/cancel', async (req, res) => {
    try {
        const pool = await getPool();

        // Kiểm tra đơn hàng thuộc về user và có thể hủy
        const current = await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('tai_khoan_id', sql.Int, req.user.id)
            .query('SELECT trang_thai FROM don_hang WHERE id = @id AND tai_khoan_id = @tai_khoan_id');

        if (current.recordset.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
        }

        if (!['cho_xac_nhan', 'da_xac_nhan'].includes(current.recordset[0].trang_thai)) {
            return res.status(400).json({ error: 'Không thể hủy đơn hàng này' });
        }

        // Hoàn trả số lượng
        const chiTiets = await pool.request()
            .input('don_hang_id', sql.Int, req.params.id)
            .query('SELECT * FROM chi_tiet_don_hang WHERE don_hang_id = @don_hang_id');

        for (const ct of chiTiets.recordset) {
            await pool.request()
                .input('so_luong', sql.Int, ct.so_luong)
                .input('id', sql.Int, ct.san_pham_id)
                .query('UPDATE san_pham SET so_luong = so_luong + @so_luong WHERE id = @id');
        }

        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query("UPDATE don_hang SET trang_thai = 'da_huy' WHERE id = @id");

        res.json({ message: 'Đã hủy đơn hàng thành công' });
    } catch (error) {
        console.error('Lỗi hủy đơn hàng:', error);
        res.status(500).json({ error: 'Có lỗi xảy ra' });
    }
});

module.exports = router;
