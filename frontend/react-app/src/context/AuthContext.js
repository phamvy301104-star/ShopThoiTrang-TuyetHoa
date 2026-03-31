import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const res = await authAPI.getMe();
                setUser(res.data);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    };

    const login = async (data) => {
        const res = await authAPI.login(data);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return res.data;
    };

    const register = async (data) => {
        const res = await authAPI.register(data);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateProfile = async (data) => {
        await authAPI.updateProfile(data);
        const res = await authAPI.getMe();
        setUser(res.data);
    };

    const isAdmin = user?.vai_tro === 'admin';
    const isStaff = user?.vai_tro === 'admin' || user?.vai_tro === 'nhanvien';
    const isAuthenticated = !!user;

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        isAdmin,
        isStaff,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
