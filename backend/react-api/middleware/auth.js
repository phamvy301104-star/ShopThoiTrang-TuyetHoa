const jwt = require('jsonwebtoken');

// Middleware xác thực JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        }
        req.user = user;
        next();
    });
};

// Middleware kiểm tra quyền admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.vai_tro === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Không có quyền truy cập' });
};

// Middleware kiểm tra quyền nhân viên (admin hoặc nhân viên)
const isStaff = (req, res, next) => {
    if (req.user && (req.user.vai_tro === 'admin' || req.user.vai_tro === 'nhanvien')) {
        return next();
    }
    return res.status(403).json({ error: 'Không có quyền truy cập. Chỉ admin và nhân viên được phép.' });
};

// Middleware kiểm tra quyền (admin hoặc user)
const isUser = (req, res, next) => {
    if (req.user && (req.user.vai_tro === 'admin' || req.user.vai_tro === 'nguoidung')) {
        return next();
    }
    return res.status(403).json({ error: 'Không có quyền truy cập' });
};

module.exports = { authenticateToken, isAdmin, isStaff, isUser };
