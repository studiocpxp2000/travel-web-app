import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';
import { useUserAuth } from '../hooks/useAuthHooks';

// Public Pages
import Home from '../pages/public/Home';
import Agenda from '../pages/public/Agenda';
import Venue from '../pages/public/Venue';
import FAQ from '../pages/public/FAQ';
import FunZone from '../pages/public/FunZone';
import Leaderboard from '../pages/public/Leaderboard';
import Gallery from '../pages/public/Gallery';
import Notifications from '../pages/public/Notifications';
import Helpdesk from '../pages/public/Helpdesk';
import Register from '../pages/public/Register';
import UserLogin from '../pages/public/UserLogin';
import UserProfile from '../pages/public/UserProfile';

/**
 * Protected route wrapper for user-only pages
 * Redirects to login if user is not authenticated
 */
function ProtectedUserRoute({ children }) {
    const { isAuthenticated, loading } = useUserAuth();
    const { orgSlug } = useParams();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
            </div>
        );
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
    );
}
