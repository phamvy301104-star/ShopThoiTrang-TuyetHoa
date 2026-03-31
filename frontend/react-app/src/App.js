import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// User Pages
import Home from './pages/user/Home';
import Shop from './pages/user/Shop';
import ProductDetail from './pages/user/ProductDetail';
import Cart from './pages/user/Cart';
import Checkout from './pages/user/Checkout';
import MyOrders from './pages/user/MyOrders';
import UserOrderDetail from './pages/user/OrderDetail';
import Profile from './pages/user/Profile';
import Contact from './pages/user/Contact';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import ProductList from './pages/admin/ProductList';
import ProductForm from './pages/admin/ProductForm';
import CategoryList from './pages/admin/CategoryList';
import OrderList from './pages/admin/OrderList';
import OrderDetail from './pages/admin/OrderDetail';
import CustomerList from './pages/admin/CustomerList';
import EmployeeList from './pages/admin/EmployeeList';
import CouponList from './pages/admin/CouponList';
import Statistics from './pages/admin/Statistics';

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireStaff = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/dang-nhap" replace />;
    }

    if (requireAdmin && user.vai_tro !== 'admin') {
        return <Navigate to="/admin" replace />;
    }

    if (requireStaff && user.vai_tro !== 'admin' && user.vai_tro !== 'nhanvien') {
        return <Navigate to="/" replace />;
    }

    return children;
};

// Guest Route Component (for login/register pages)
const GuestRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status" />
            </div>
        );
    }

    if (user) {
        // Redirect based on role
        if (user.vai_tro === 'admin' || user.vai_tro === 'nhanvien') {
            return <Navigate to="/admin" replace />;
        }
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Auth Routes */}
            <Route path="/dang-nhap" element={
                <GuestRoute>
                    <Login />
                </GuestRoute>
            } />
            <Route path="/dang-ky" element={
                <GuestRoute>
                    <Register />
                </GuestRoute>
            } />

            {/* User Routes */}
            <Route path="/" element={<UserLayout />}>
                <Route index element={<Home />} />
                <Route path="san-pham" element={<Shop />} />
                <Route path="san-pham/:id" element={<ProductDetail />} />
                <Route path="gio-hang" element={<Cart />} />
                <Route path="lien-he" element={<Contact />} />
                <Route path="thanh-toan" element={
                    <ProtectedRoute>
                        <Checkout />
                    </ProtectedRoute>
                } />
                <Route path="don-hang" element={
                    <ProtectedRoute>
                        <MyOrders />
                    </ProtectedRoute>
                } />
                <Route path="don-hang/:id" element={
                    <ProtectedRoute>
                        <UserOrderDetail />
                    </ProtectedRoute>
                } />
                <Route path="tai-khoan" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
                <ProtectedRoute requireStaff>
                    <AdminLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="san-pham" element={<ProductList />} />
                <Route path="san-pham/them" element={<ProductForm />} />
                <Route path="san-pham/sua/:id" element={<ProductForm />} />
                <Route path="danh-muc" element={<CategoryList />} />
                <Route path="don-hang" element={<OrderList />} />
                <Route path="don-hang/:id" element={<OrderDetail />} />
                <Route path="khach-hang" element={<CustomerList />} />
                <Route path="nhan-vien" element={
                    <ProtectedRoute requireAdmin>
                        <EmployeeList />
                    </ProtectedRoute>
                } />
                <Route path="ma-giam-gia" element={
                    <ProtectedRoute requireAdmin>
                        <CouponList />
                    </ProtectedRoute>
                } />
                <Route path="thong-ke" element={
                    <ProtectedRoute requireAdmin>
                        <Statistics />
                    </ProtectedRoute>
                } />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={
                <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: '100vh' }}>
                    <h1 className="display-1 text-muted">404</h1>
                    <p className="lead text-muted">Trang không tồn tại</p>
                    <a href="/" className="btn btn-primary">Về trang chủ</a>
                </div>
            } />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <CartProvider>
                    <AppRoutes />
                    <ToastContainer
                        position="top-right"
                        autoClose={3000}
                        hideProgressBar={false}
                        newestOnTop={false}
                        closeOnClick
                        rtl={false}
                        pauseOnFocusLoss
                        draggable
                        pauseOnHover
                    />
                </CartProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
