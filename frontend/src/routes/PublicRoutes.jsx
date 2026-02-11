import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Suspense, lazy } from 'react';
// PublicLayout is lazy loaded
const PublicLayout = lazy(() => import('../components/layout/PublicLayout'));
import { useUserAuth } from '../hooks/useAuthHooks';
import Loading from '../components/common/Loading';

// Public Pages (Lazy Loaded)
const Home = lazy(() => import('../pages/public/Home'));
const Agenda = lazy(() => import('../pages/public/Agenda'));
const Venue = lazy(() => import('../pages/public/Venue'));
const FAQ = lazy(() => import('../pages/public/FAQ'));
const FunZone = lazy(() => import('../pages/public/FunZone'));
const Leaderboard = lazy(() => import('../pages/public/Leaderboard'));
const Gallery = lazy(() => import('../pages/public/Gallery'));
const Notifications = lazy(() => import('../pages/public/Notifications'));
const Helpdesk = lazy(() => import('../pages/public/Helpdesk'));
const Register = lazy(() => import('../pages/public/Register'));
const UserLogin = lazy(() => import('../pages/public/UserLogin'));
const UserProfile = lazy(() => import('../pages/public/UserProfile'));

/**
 * Protected route wrapper for user-only pages
 * Redirects to login if user is not authenticated
 */
function ProtectedUserRoute({ children }) {
    const { isAuthenticated, loading } = useUserAuth();
    const { orgSlug } = useParams();

    if (loading) {
        return <Loading />;
    }

    if (!isAuthenticated) {
        return <Navigate to={`/${orgSlug}/login`} replace />;
    }

    return children;
}

/**
 * Public routes for organization-specific pages
 * These routes are wrapped with UserAuthProvider and OrgProvider in App.jsx
 */
export default function PublicRoutes() {
    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* Open routes - accessible by everyone */}
                <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
                <Route path="/agenda" element={<PublicLayout><Agenda /></PublicLayout>} />
                <Route path="/venue" element={<PublicLayout><Venue /></PublicLayout>} />
                <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
                <Route path="/funzone" element={<PublicLayout><FunZone /></PublicLayout>} />
                <Route path="/leaderboard" element={<PublicLayout><Leaderboard /></PublicLayout>} />
                <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
                <Route path="/login" element={<PublicLayout><UserLogin /></PublicLayout>} />

                {/* Protected routes - require user login */}
                <Route path="/gallery" element={
                    <PublicLayout>
                        <ProtectedUserRoute><Gallery /></ProtectedUserRoute>
                    </PublicLayout>
                } />
                <Route path="/notifications" element={
                    <PublicLayout>
                        <ProtectedUserRoute><Notifications /></ProtectedUserRoute>
                    </PublicLayout>
                } />
                <Route path="/helpdesk" element={
                    <PublicLayout>
                        <ProtectedUserRoute><Helpdesk /></ProtectedUserRoute>
                    </PublicLayout>
                } />
                <Route path="/profile" element={
                    <PublicLayout>
                        <ProtectedUserRoute><UserProfile /></ProtectedUserRoute>
                    </PublicLayout>
                } />
            </Routes>
        </Suspense>
    );
}
