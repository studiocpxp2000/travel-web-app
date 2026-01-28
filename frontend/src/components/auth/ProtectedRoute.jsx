import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        // Redirect to appropriate login page based on the route
        const isSuperAdminRoute = location.pathname.startsWith('/superadmin');
        const loginPath = isSuperAdminRoute ? '/superadmin/login' : '/login';
        return <Navigate to={loginPath} state={{ from: location }} replace />;
    }

    // Check role-based access if roles are specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect based on user role
        const redirectPath = getDefaultRedirect(user.role);
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}

function getDefaultRedirect(role) {
    switch (role) {
        case 'SUPER_ADMIN':
            return '/superadmin';
        case 'ADMIN_ORG':
            return '/admin';
        case 'PROMOTER':
            return '/promoter';
        default:
            return '/';
    }
}
