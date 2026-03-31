const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'frontend', 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Session
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 giờ
}));

// Flash messages
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Import routes
const { router: authRouter, isAuthenticated, isAdmin, isStaff } = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const sanPhamRouter = require('./routes/sanPham');
const danhMucRouter = require('./routes/danhMuc');
const khachHangRouter = require('./routes/khachHang');
const donHangRouter = require('./routes/donHang');
const nhanVienRouter = require('./routes/nhanVien');
const nhapHangRouter = require('./routes/nhapHang');
const thongKeRouter = require('./routes/thongKe');
const timKiemRouter = require('./routes/timKiem');
const caiDatRouter = require('./routes/caiDat');
const maGiamGiaRouter = require('./routes/maGiamGia');
const lienHeRouter = require('./routes/lienHe');
const chatbotRouter = require('./routes/chatbot');
const userRouter = require('./routes/user');

// Routes
app.use('/', authRouter);
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.vai_tro === 'admin' || req.session.user.vai_tro === 'nhanvien') return res.redirect('/dashboard');
        return res.redirect('/trang-chu');
    }
    res.redirect('/dang-nhap');
});

// User routes (nguoi dung)
app.use('/', isAuthenticated, chatbotRouter);
app.use('/', isAuthenticated, userRouter);

// Staff routes (admin + nhanvien)
app.use('/', isAuthenticated, isStaff, dashboardRouter);
app.use('/san-pham', isAuthenticated, isStaff, sanPhamRouter);
app.use('/danh-muc', isAuthenticated, isStaff, danhMucRouter);
app.use('/khach-hang', isAuthenticated, isStaff, khachHangRouter);
app.use('/don-hang', isAuthenticated, isStaff, donHangRouter);
app.use('/nhap-hang', isAuthenticated, isStaff, nhapHangRouter);

// Admin-only routes (chi admin)
app.use('/thong-ke', isAuthenticated, isAdmin, thongKeRouter);
app.use('/tim-kiem', isAuthenticated, isAdmin, timKiemRouter);
app.use('/ma-giam-gia', isAuthenticated, isAdmin, maGiamGiaRouter);
app.use('/lien-he', isAuthenticated, isAdmin, lienHeRouter);
app.use('/nhan-vien', isAuthenticated, isAdmin, nhanVienRouter);
app.use('/cai-dat', isAuthenticated, isAdmin, caiDatRouter);

// 404
app.use((req, res) => {
    res.status(404).render('layouts/main', {
        body: '<div class="text-center py-5"><h1>404</h1><p>Trang không tồn tại</p><a href="/dashboard" class="btn btn-primary">Về trang chủ</a></div>',
        user: req.session ? req.session.user : null,
        currentPage: '',
        pageTitle: '404',
        messages: {}
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Có lỗi xảy ra trên server');
});

// Tạo thư mục uploads nếu chưa có
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'frontend', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  SHOP THỜI TRANG - HỆ THỐNG QUẢN LÝ`);
    console.log(`  Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`  Tài khoản Admin: Lan123 / Lan123`);
    console.log(`========================================\n`);
});
