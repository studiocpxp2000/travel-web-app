import { Navigate, useLocation } from 'react-router-dom';
import { usePromoterAuth } from '../../context/PromoterAuthContext';

export default function PromoterProtectedRoute({ children, redirectIfAuthenticated, loginRoute }) {
    const { user, loading, isAuthenticated } = usePromoterAuth();
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
        return <Navigate to={redirectIfAuthenticated} replace />;
    }

    // Normal Protection: Must be authenticated
    if (!isAuthenticated && !redirectIfAuthenticated) {
        return <Navigate to={loginRoute || '/promoter/login'} state={{ from: location }} replace />;
    }

    return children;
}
