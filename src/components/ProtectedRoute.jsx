import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, user, loading } = useAuth();

    // Still loading auth state from localStorage
    if (loading) return null;

    // Not logged in → redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role check (e.g. "ADMIN")
    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace state={{ alert: "Unauthorized access. This area is for administrators only.", type: "danger" }} />;
    }

    return children;
};

export default ProtectedRoute;
