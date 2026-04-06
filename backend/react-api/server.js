require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRouter = require('./routes/auth');
const sanPhamRouter = require('./routes/sanPham');
const danhMucRouter = require('./routes/danhMuc');
const donHangRouter = require('./routes/donHang');
const khachHangRouter = require('./routes/khachHang');
const nhanVienRouter = require('./routes/nhanVien');
const thongKeRouter = require('./routes/thongKe');
const maGiamGiaRouter = require('./routes/maGiamGia');
const lienHeRouter = require('./routes/lienHe');

// Import middleware
const { authenticateToken, isAdmin, isStaff } = require('./middleware/auth');

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/san-pham', sanPhamRouter);
app.use('/api/danh-muc', danhMucRouter);
app.use('/api/ma-giam-gia', maGiamGiaRouter);
app.use('/api/lien-he', lienHeRouter);

// User routes (cần đăng nhập)
app.use('/api/don-hang/my-orders', authenticateToken, donHangRouter);
app.use('/api/don-hang', authenticateToken, donHangRouter);

// Admin routes - Nhân viên có thể truy cập
app.use('/api/admin/san-pham', authenticateToken, isStaff, sanPhamRouter);
app.use('/api/admin/danh-muc', authenticateToken, isStaff, danhMucRouter);
app.use('/api/admin/don-hang', authenticateToken, isStaff, donHangRouter);
app.use('/api/admin/khach-hang', authenticateToken, isStaff, khachHangRouter);
app.use('/api/admin/lien-he', authenticateToken, isStaff, lienHeRouter);

// Admin routes - Chỉ admin mới được truy cập
app.use('/api/admin/nhan-vien', authenticateToken, isAdmin, nhanVienRouter);
app.use('/api/admin/thong-ke', authenticateToken, isAdmin, thongKeRouter);
app.use('/api/admin/ma-giam-gia', authenticateToken, isAdmin, maGiamGiaRouter);

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Có lỗi xảy ra trên server' });
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint không tồn tại' });
});

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
    console.log(`\n🚀 API Server đang chạy tại http://localhost:${PORT}`);
    console.log('📚 API Endpoints:');
    console.log('   - POST /api/auth/login');
    console.log('   - POST /api/auth/register');
    console.log('   - GET  /api/san-pham');
    console.log('   - GET  /api/danh-muc');
    console.log('   - GET  /api/don-hang (auth required)');
    console.log('   - GET  /api/admin/* (admin only)\n');
});
