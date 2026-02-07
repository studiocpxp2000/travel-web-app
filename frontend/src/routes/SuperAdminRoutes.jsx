import { Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { ROLES } from '../hooks/useAuthHooks';
import { OrgProvider } from '../context/OrgContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
// DashboardLayout is lazy loaded to reduce initial bundle size
const DashboardLayout = lazy(() => import('../components/layout/DashboardLayout'));

// Fallback Loader
const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
    </div>
);

// Super Admin Pages (Lazy Loaded)
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/Dashboard'));
const SuperAdminLogin = lazy(() => import('../pages/superadmin/SuperAdminLogin'));
const Organizations = lazy(() => import('../pages/superadmin/Organizations'));
const SuperAdminUsers = lazy(() => import('../pages/superadmin/Users'));
const SuperAdminPromoters = lazy(() => import('../pages/superadmin/Promoters'));
const SuperAdminAdmins = lazy(() => import('../pages/superadmin/Admins'));

// Admin Pages (used for org management by superadmin) (Lazy Loaded)
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));
const AdminPromoters = lazy(() => import('../pages/admin/Promoters'));
const ContentEditor = lazy(() => import('../pages/admin/ContentEditor'));
const RegistrationFields = lazy(() => import('../pages/admin/RegistrationFields'));
const SendEmail = lazy(() => import('../pages/admin/SendEmail'));
const EmailInvitations = lazy(() => import('../pages/admin/EmailInvitations'));
const PushNotifications = lazy(() => import('../pages/admin/PushNotifications'));
const HelpdeskMessages = lazy(() => import('../pages/admin/HelpdeskMessages'));
const GalleryManager = lazy(() => import('../pages/admin/GalleryManager'));
const BonusCodeManager = lazy(() => import('../pages/admin/BonusCodeManager'));

/**
 * Super Admin Org Management Routes
 * Used when superadmin accesses an organization's admin panel
 */
const SuperAdminOrgManageRoutes = () => (
    <Suspense fallback={<PageLoader />}>
        <Routes>
            <Route path="/" element={<DashboardLayout><AdminDashboard /></DashboardLayout>} />
            <Route path="/users" element={<DashboardLayout><AdminUsers /></DashboardLayout>} />
            <Route path="/promoters" element={<DashboardLayout><AdminPromoters /></DashboardLayout>} />
            <Route path="/content" element={<DashboardLayout><ContentEditor /></DashboardLayout>} />
            <Route path="/registration-fields" element={<DashboardLayout><RegistrationFields /></DashboardLayout>} />
            <Route path="/send-email" element={<DashboardLayout><SendEmail /></DashboardLayout>} />
            <Route path="/email-invitations" element={<DashboardLayout><EmailInvitations /></DashboardLayout>} />
            <Route path="/push-notifications" element={<DashboardLayout><PushNotifications /></DashboardLayout>} />
            <Route path="/helpdesk-messages" element={<DashboardLayout><HelpdeskMessages /></DashboardLayout>} />
            <Route path="/gallery" element={<DashboardLayout><GalleryManager /></DashboardLayout>} />
            <Route path="/bonus-codes" element={<DashboardLayout><BonusCodeManager /></DashboardLayout>} />
        </Routes>
    </Suspense>
);

/**
 * Super Admin route configurations
 * Returns an array of Route elements for super admin panel
 */
export function getSuperAdminRoutes() {
    return (
        <>
            {/* Super Admin Login */}
            <Route element={<SuperAdminLogin />} path="/superadmin/login" />

            {/* Super Admin Dashboard */}
            <Route
                path="/superadmin"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <DashboardLayout><SuperAdminDashboard /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Organizations Management */}
            <Route
                path="/superadmin/organizations"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <DashboardLayout><Organizations /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* All Users View */}
            <Route
                path="/superadmin/users"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <DashboardLayout><SuperAdminUsers /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* All Promoters View */}
            <Route
                path="/superadmin/promoters"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <DashboardLayout><SuperAdminPromoters /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* All Admins View */}
            <Route
                path="/superadmin/admins"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <DashboardLayout><SuperAdminAdmins /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Super Admin Org Management - Access admin panel as super admin */}
            <Route
                path="/superadmin/manage/:orgSlug/*"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <OrgProvider>
                            <SuperAdminOrgManageRoutes />
                        </OrgProvider>
                    </ProtectedRoute>
                }
            />
        </>
    );
}
