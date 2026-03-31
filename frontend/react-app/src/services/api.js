import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/dang-nhap';
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    login: (data) => api.post('/auth/login', data),
    register: (data) => api.post('/auth/register', data),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.post('/auth/change-password', data),
    updateProfile: (data) => api.put('/auth/profile', data)
};

// Product APIs
export const productAPI = {
    getAll: (params) => api.get('/san-pham', { params }),
    getNewest: (limit = 8) => api.get(`/san-pham/newest?limit=${limit}`),
    getById: (id) => api.get(`/san-pham/${id}`),
    getRelated: (id, limit = 4) => api.get(`/san-pham/${id}/related?limit=${limit}`),
    create: (data) => api.post('/admin/san-pham', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    update: (id, data) => api.put(`/admin/san-pham/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => api.delete(`/admin/san-pham/${id}`)
};

// Category APIs
export const categoryAPI = {
    getAll: (showAll = false) => api.get(`/danh-muc?all=${showAll}`),
    getById: (id) => api.get(`/danh-muc/${id}`),
    create: (data) => api.post('/admin/danh-muc', data),
    update: (id, data) => api.put(`/admin/danh-muc/${id}`, data),
    delete: (id) => api.delete(`/admin/danh-muc/${id}`)
};

// Order APIs
export const orderAPI = {
    getAll: (params) => api.get('/admin/don-hang', { params }),
    getMyOrders: (params) => api.get('/don-hang/my-orders', { params }),
    getById: (id) => api.get(`/don-hang/${id}`),
    create: (data) => api.post('/don-hang', data),
    updateStatus: (id, status) => api.put(`/admin/don-hang/${id}/status`, { trang_thai: status }),
    cancelOrder: (id) => api.put(`/don-hang/${id}/cancel`)
};

// Customer APIs
export const customerAPI = {
    getAll: (params) => api.get('/admin/khach-hang', { params }),
    getById: (id) => api.get(`/admin/khach-hang/${id}`),
    create: (data) => api.post('/admin/khach-hang', data),
    update: (id, data) => api.put(`/admin/khach-hang/${id}`, data),
    delete: (id) => api.delete(`/admin/khach-hang/${id}`)
};

// Employee APIs
export const employeeAPI = {
    getAll: (params) => api.get('/admin/nhan-vien', { params }),
    getById: (id) => api.get(`/admin/nhan-vien/${id}`),
    create: (data) => api.post('/admin/nhan-vien', data),
    update: (id, data) => api.put(`/admin/nhan-vien/${id}`, data),
    delete: (id) => api.delete(`/admin/nhan-vien/${id}`)
};

// Statistics APIs
export const statisticsAPI = {
    getDashboard: () => api.get('/admin/thong-ke/dashboard'),
    getRevenue: (params) => api.get('/admin/thong-ke/revenue', { params }),
    getTopProducts: (params) => api.get('/admin/thong-ke/top-products', { params }),
    getOrderStats: (params) => api.get('/admin/thong-ke/order-stats', { params })
};

// Coupon APIs
export const couponAPI = {
    getAll: () => api.get('/admin/ma-giam-gia'),
    getById: (id) => api.get(`/admin/ma-giam-gia/${id}`),
    check: (code, total) => api.post('/ma-giam-gia/check', { ma_giam_gia: code, tong_tien: total }),
    create: (data) => api.post('/admin/ma-giam-gia', data),
    update: (id, data) => api.put(`/admin/ma-giam-gia/${id}`, data),
    delete: (id) => api.delete(`/admin/ma-giam-gia/${id}`)
};

export default api;
