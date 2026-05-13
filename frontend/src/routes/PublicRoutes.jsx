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
const Feedback = lazy(() => import('../pages/public/Feedback'));
const Register = lazy(() => import('../pages/public/Register'));
const UserLogin = lazy(() => import('../pages/public/UserLogin'));
const UserProfile = lazy(() => import('../pages/public/UserProfile'));
const SocialWall = lazy(() => import('../pages/public/SocialWall'));
const LiveEngagement = lazy(() => import('../pages/public/LiveEngagement'));

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
            <PublicLayout>
                <Routes>
                    {/* Open routes - accessible by everyone */}
                    <Route path="/" element={<Home />} />
                    <Route path="/agenda" element={<Agenda />} />
                    <Route path="/venue" element={<Venue />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/funzone" element={<FunZone />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<UserLogin />} />
                    <Route path="/feedback" element={<Feedback />} />

                    {/* Protected routes - require user login */}
                    <Route path="/gallery" element={
                        <ProtectedUserRoute><Gallery /></ProtectedUserRoute>
                    } />
                    <Route path="/notifications" element={
                        <ProtectedUserRoute><Notifications /></ProtectedUserRoute>
                    } />
                    <Route path="/helpdesk" element={
                        <ProtectedUserRoute><Helpdesk /></ProtectedUserRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedUserRoute><UserProfile /></ProtectedUserRoute>
                    } />
                    <Route path="/wall" element={
                        <ProtectedUserRoute><SocialWall /></ProtectedUserRoute>
                    } />
                    <Route path="/live" element={
                        <ProtectedUserRoute><LiveEngagement /></ProtectedUserRoute>
                    } />
                </Routes>
            </PublicLayout>
        </Suspense>
    );
}
