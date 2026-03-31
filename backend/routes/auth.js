const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sql, getPool } = require('../config/database');

// ==================== GOOGLE OAUTH CONFIG ====================
// Thay CLIENT_ID và CLIENT_SECRET bằng thông tin từ Google Cloud Console
// https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET';
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

// Passport serialization
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Google Strategy
if (GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID') {
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const pool = await getPool();
            const googleId = profile.id;
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
            const ho_ten = profile.displayName || '';
            const hinh_dai_dien = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

            // Tim tai khoan bang google_id
            let result = await pool.request()
                .input('google_id', sql.NVarChar, googleId)
                .query('SELECT * FROM tai_khoan WHERE google_id = @google_id AND trang_thai = 1');

            if (result.recordset.length > 0) {
                // Da co tai khoan -> dang nhap
                const user = result.recordset[0];
                return done(null, {
                    id: user.id,
                    ten_dang_nhap: user.ten_dang_nhap,
                    ho_ten: user.ho_ten,
                    vai_tro: user.vai_tro
                });
            }

            // Tim bang email
            if (email) {
                result = await pool.request()
                    .input('email', sql.NVarChar, email)
                    .query('SELECT * FROM tai_khoan WHERE email = @email AND trang_thai = 1');

                if (result.recordset.length > 0) {
                    // Lien ket google_id vao tai khoan co san
                    const user = result.recordset[0];
                    await pool.request()
                        .input('google_id', sql.NVarChar, googleId)
                        .input('id', sql.Int, user.id)
                        .query('UPDATE tai_khoan SET google_id = @google_id WHERE id = @id');
                    return done(null, {
                        id: user.id,
                        ten_dang_nhap: user.ten_dang_nhap,
                        ho_ten: user.ho_ten,
                        vai_tro: user.vai_tro
                    });
                }
            }

            // Tao tai khoan moi (nguoidung)
            const ten_dang_nhap = 'gg_' + googleId.substring(0, 10);
            const insertResult = await pool.request()
                .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
                .input('mat_khau', sql.NVarChar, '') 
                .input('ho_ten', sql.NVarChar, ho_ten)
                .input('email', sql.NVarChar, email)
                .input('hinh_dai_dien', sql.NVarChar, hinh_dai_dien)
                .input('vai_tro', sql.NVarChar, 'nguoidung')
                .input('google_id', sql.NVarChar, googleId)
                .query(`INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, email, hinh_dai_dien, vai_tro, google_id)
                        OUTPUT INSERTED.id
                        VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @email, @hinh_dai_dien, @vai_tro, @google_id)`);

            const newId = insertResult.recordset[0].id;
            return done(null, {
                id: newId,
                ten_dang_nhap: ten_dang_nhap,
                ho_ten: ho_ten,
                vai_tro: 'nguoidung'
            });
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));
}

// Middleware kiem tra dang nhap
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/dang-nhap');
}

// Middleware kiem tra quyen admin
function isAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.vai_tro === 'admin') {
        return next();
    }
    res.redirect('/trang-chu');
}

// Middleware kiem tra quyen nhan vien (admin + nhanvien)
function isStaff(req, res, next) {
    if (req.session && req.session.user && 
        (req.session.user.vai_tro === 'admin' || req.session.user.vai_tro === 'nhanvien')) {
        return next();
    }
    res.redirect('/trang-chu');
}

// GET - Trang dang nhap
router.get('/dang-nhap', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.vai_tro === 'admin' || req.session.user.vai_tro === 'nhanvien') return res.redirect('/dashboard');
        return res.redirect('/trang-chu');
    }
    res.render('auth/login', { 
        layout: 'layouts/main',
        messages: req.flash()
    });
});

// POST - Xu ly dang nhap
router.post('/dang-nhap', async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;
        
        if (!ten_dang_nhap || !mat_khau) {
            req.flash('error', 'Vui long nhap day du thong tin');
            return res.redirect('/dang-nhap');
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT * FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap AND trang_thai = 1');

        if (result.recordset.length === 0) {
            req.flash('error', 'Ten dang nhap hoac mat khau khong dung');
            return res.redirect('/dang-nhap');
        }

        const user = result.recordset[0];
        const isMatch = await bcrypt.compare(mat_khau, user.mat_khau);

        if (!isMatch) {
            req.flash('error', 'Ten dang nhap hoac mat khau khong dung');
            return res.redirect('/dang-nhap');
        }

        req.session.user = {
            id: user.id,
            ten_dang_nhap: user.ten_dang_nhap,
            ho_ten: user.ho_ten,
            vai_tro: user.vai_tro
        };

        if (user.vai_tro === 'admin' || user.vai_tro === 'nhanvien') {
            res.redirect('/dashboard');
        } else {
            res.redirect('/trang-chu');
        }
    } catch (error) {
        console.error('Loi dang nhap:', error);
        req.flash('error', 'Co loi xay ra, vui long thu lai');
        res.redirect('/dang-nhap');
    }
});

// GET - Dang xuat
router.get('/dang-xuat', (req, res) => {
    req.session.destroy();
    res.redirect('/dang-nhap');
});

// GET - Trang dang ky
router.get('/dang-ky', (req, res) => {
    if (req.session && req.session.user) {
        if (req.session.user.vai_tro === 'admin') return res.redirect('/dashboard');
        return res.redirect('/trang-chu');
    }
    res.render('auth/register', {
        layout: 'layouts/main',
        messages: req.flash()
    });
});

// POST - Xu ly dang ky
router.post('/dang-ky', async (req, res) => {
    try {
        const { ho_ten, ten_dang_nhap, mat_khau, xac_nhan } = req.body;

        if (!ho_ten || !ten_dang_nhap || !mat_khau) {
            req.flash('error', 'Vui long nhap day du thong tin');
            return res.redirect('/dang-ky');
        }

        if (mat_khau.length < 6) {
            req.flash('error', 'Mat khau phai co it nhat 6 ky tu');
            return res.redirect('/dang-ky');
        }

        if (mat_khau !== xac_nhan) {
            req.flash('error', 'Mat khau xac nhan khong khop');
            return res.redirect('/dang-ky');
        }

        const pool = await getPool();

        // Kiem tra ten dang nhap da ton tai chua
        const checkResult = await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .query('SELECT id FROM tai_khoan WHERE ten_dang_nhap = @ten_dang_nhap');

        if (checkResult.recordset.length > 0) {
            req.flash('error', 'Ten dang nhap da ton tai');
            return res.redirect('/dang-ky');
        }

        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        await pool.request()
            .input('ten_dang_nhap', sql.NVarChar, ten_dang_nhap)
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('ho_ten', sql.NVarChar, ho_ten)
            .input('vai_tro', sql.NVarChar, 'nguoidung')
            .query('INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, ho_ten, vai_tro) VALUES (@ten_dang_nhap, @mat_khau, @ho_ten, @vai_tro)');

        req.flash('success', 'Dang ky thanh cong! Vui long dang nhap.');
        res.redirect('/dang-nhap');
    } catch (error) {
        console.error('Loi dang ky:', error);
        req.flash('error', 'Co loi xay ra, vui long thu lai');
        res.redirect('/dang-ky');
    }
});

// GET - Doi mat khau
router.get('/doi-mat-khau', isAuthenticated, (req, res) => {
    const layoutName = req.session.user.vai_tro === 'admin' ? 'layouts/main' : 'layouts/user';
    res.render('auth/change-password', {
        layout: layoutName,
        user: req.session.user,
        currentPage: '',
        pageTitle: 'Doi mat khau',
        messages: req.flash()
    });
});

// POST - Xu ly doi mat khau
router.post('/doi-mat-khau', isAuthenticated, async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi, xac_nhan } = req.body;

        if (mat_khau_moi !== xac_nhan) {
            req.flash('error', 'Mat khau moi khong khop');
            return res.redirect('/doi-mat-khau');
        }

        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.Int, req.session.user.id)
            .query('SELECT * FROM tai_khoan WHERE id = @id');
        const isMatch = await bcrypt.compare(mat_khau_cu, result.recordset[0].mat_khau);

        if (!isMatch) {
            req.flash('error', 'Mat khau cu khong dung');
            return res.redirect('/doi-mat-khau');
        }

        const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);
        await pool.request()
            .input('mat_khau', sql.NVarChar, hashedPassword)
            .input('id', sql.Int, req.session.user.id)
            .query('UPDATE tai_khoan SET mat_khau = @mat_khau WHERE id = @id');

        req.flash('success', 'Doi mat khau thanh cong');
        res.redirect('/doi-mat-khau');
    } catch (error) {
        console.error('Loi doi mat khau:', error);
        req.flash('error', 'Co loi xay ra');
        res.redirect('/doi-mat-khau');
    }
});

// ==================== GOOGLE OAUTH ROUTES ====================
// GET - Dang nhap bang Google
router.get('/auth/google', (req, res, next) => {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        req.flash('error', 'Chuc nang dang nhap Google chua duoc cau hinh');
        return res.redirect('/dang-nhap');
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// GET - Google callback
router.get('/auth/google/callback', (req, res, next) => {
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
        return res.redirect('/dang-nhap');
    }
    passport.authenticate('google', { failureRedirect: '/dang-nhap', failureFlash: 'Dang nhap Google that bai' })(req, res, () => {
        req.session.user = req.user;
        res.redirect('/trang-chu');
    });
});

module.exports = { router, isAuthenticated, isAdmin, isStaff };
