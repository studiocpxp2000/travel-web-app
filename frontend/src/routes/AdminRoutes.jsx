import { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';
import { ROLES } from '../hooks/useAuthHooks';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PromoterProtectedRoute from '../components/auth/PromoterProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';

// Loading Component
const Loading = () => (
    <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
    </div>
);

// Admin Pages (Lazy Loaded)
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminPromoters = lazy(() => import('../pages/admin/Promoters'));
const ContentEditor = lazy(() => import('../pages/admin/ContentEditor'));
const LeaderboardManager = lazy(() => import('../pages/admin/LeaderboardManager'));
const RegistrationFields = lazy(() => import('../pages/admin/RegistrationFields'));
const SendEmail = lazy(() => import('../pages/admin/SendEmail'));
const EmailInvitations = lazy(() => import('../pages/admin/EmailInvitations'));
const PushNotifications = lazy(() => import('../pages/admin/PushNotifications'));
const HelpdeskMessages = lazy(() => import('../pages/admin/HelpdeskMessages'));
const GalleryManager = lazy(() => import('../pages/admin/GalleryManager'));
const WallManager = lazy(() => import('../pages/admin/WallManager'));
const BonusCodeManager = lazy(() => import('../pages/admin/BonusCodeManager'));

// Public Login (Lazy Loaded to keep initial bundle small if user lands elsewhere)
const Login = lazy(() => import('../pages/public/Login'));

// Promoter Pages (Lazy Loaded)
const Scanner = lazy(() => import('../pages/promoter/Scanner'));

/**
 * Admin route configurations
 * Returns an array of Route elements for admin panel
 */
export function getAdminRoutes() {
    return (
        <>
            {/* Admin Login - Redirect to /admin if already logged in as Admin */}
            <Route
                path="/admin/login"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} redirectIfAuthenticated="/admin" loginRoute="/admin/login">
                            <Login userType="admin" />
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Admin Dashboard */}
            <Route
                path="/admin"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><AdminDashboard /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Admin Users */}
            <Route
                path="/admin/users"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><AdminUsers /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Admin Promoters */}
            <Route
                path="/admin/promoters"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><AdminPromoters /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Bonus Codes */}
            <Route
                path="/admin/bonus-codes"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><BonusCodeManager /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Content Editor */}
            <Route
                path="/admin/content"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><ContentEditor /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Leaderboard Manager */}
            <Route
                path="/admin/leaderboard"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><LeaderboardManager /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Registration Fields */}
            <Route
                path="/admin/registration-fields"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><RegistrationFields /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Send Email */}
            <Route
                path="/admin/send-email"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><SendEmail /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Email Invitations */}
            <Route
                path="/admin/email-invitations"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><EmailInvitations /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Push Notifications */}
            <Route
                path="/admin/push-notifications"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><PushNotifications /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Helpdesk Messages */}
            <Route
                path="/admin/helpdesk-messages"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><HelpdeskMessages /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Gallery Manager */}
            <Route
                path="/admin/gallery"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><GalleryManager /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Wall Manager */}
            <Route
                path="/admin/wall"
                element={
                    <Suspense fallback={<Loading />}>
                        <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                            <DashboardLayout><WallManager /></DashboardLayout>
                        </ProtectedRoute>
                    </Suspense>
                }
            />

            {/* Promoter Login */}
            <Route
                path="/promoter/login"
                element={
                    <Suspense fallback={<Loading />}>
                        <PromoterProtectedRoute redirectIfAuthenticated="/promoter" loginRoute="/promoter/login">
                            <Login userType="promoter" />
                        </PromoterProtectedRoute>
                    </Suspense>
                }
            />

            {/* Promoter Scanner */}
            <Route
                path="/promoter"
                element={
                    <Suspense fallback={<Loading />}>
                        <PromoterProtectedRoute loginRoute="/promoter/login">
                            <Scanner />
                        </PromoterProtectedRoute>
                    </Suspense>
                }
            />
        </>
    );
}
