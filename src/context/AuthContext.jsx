import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restore session from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('duyanan_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('duyanan_user');
            }
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // userData: { email, firstName, lastName, role, token }
        setUser(userData);
        localStorage.setItem('duyanan_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('duyanan_user');
    };

    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
