import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLES } from '../../hooks/useAuthHooks';

export default function ProtectedRoute({ children, allowedRoles = [], redirectIfAuthenticated, loginRoute }) {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
            </div>
        );
    }

    // Handle "guest" routes (e.g. login pages) where authenticated users should be redirected away
    if (redirectIfAuthenticated && isAuthenticated) {
        // Only redirect if the user actually has the role relevant to this login page
        // or effectively "any" authenticated user if matched
        const hasMatchingRole = allowedRoles.length === 0 || allowedRoles.includes(user.role);

        if (hasMatchingRole) {
            return <Navigate to={redirectIfAuthenticated} replace />;
        }
    }

    // Normal Protection: Must be authenticated
    if (!isAuthenticated && !redirectIfAuthenticated) {
        // Use provided loginRoute or infer default
        let path = loginRoute;
        if (!path) {
            const isSuperAdminRoute = location.pathname.startsWith('/superadmin');
            path = isSuperAdminRoute ? '/superadmin/login' : '/login';
        }
        return <Navigate to={path} state={{ from: location }} replace />;
    }

    // Role Check for protected routes
    if (!redirectIfAuthenticated && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        // Redirect based on user role to their dashboard/home
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
