import { Route } from 'react-router-dom';
import { ROLES } from '../hooks/useAuthHooks';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import PromoterProtectedRoute from '../components/auth/PromoterProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminPromoters from '../pages/admin/Promoters';
import ContentEditor from '../pages/admin/ContentEditor';
import RegistrationFields from '../pages/admin/RegistrationFields';
import SendEmail from '../pages/admin/SendEmail';
import EmailInvitations from '../pages/admin/EmailInvitations';
import PushNotifications from '../pages/admin/PushNotifications';
import HelpdeskMessages from '../pages/admin/HelpdeskMessages';
import GalleryManager from '../pages/admin/GalleryManager';
import BonusCodeManager from '../pages/admin/BonusCodeManager';
import Login from '../pages/public/Login';

// Promoter Pages
import Scanner from '../pages/promoter/Scanner';

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
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} redirectIfAuthenticated="/admin" loginRoute="/admin/login">
                        <Login userType="admin" />
                    </ProtectedRoute>
                }
            />

            {/* Admin Dashboard */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><AdminDashboard /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Admin Users */}
            <Route
                path="/admin/users"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><AdminUsers /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Admin Promoters */}
            <Route
                path="/admin/promoters"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><AdminPromoters /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Bonus Codes */}
            <Route
                path="/admin/bonus-codes"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><BonusCodeManager /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Content Editor */}
            <Route
                path="/admin/content"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><ContentEditor /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Registration Fields */}
            <Route
                path="/admin/registration-fields"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><RegistrationFields /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Send Email */}
            <Route
                path="/admin/send-email"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><SendEmail /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Email Invitations */}
            <Route
                path="/admin/email-invitations"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><EmailInvitations /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Push Notifications */}
            <Route
                path="/admin/push-notifications"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><PushNotifications /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Helpdesk Messages */}
            <Route
                path="/admin/helpdesk-messages"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><HelpdeskMessages /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Gallery Manager */}
            <Route
                path="/admin/gallery"
                element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                        <DashboardLayout><GalleryManager /></DashboardLayout>
                    </ProtectedRoute>
                }
            />

            {/* Promoter Login */}
            <Route
                path="/promoter/login"
                element={
                    <PromoterProtectedRoute redirectIfAuthenticated="/promoter" loginRoute="/promoter/login">
                        <Login userType="promoter" />
                    </PromoterProtectedRoute>
                }
            />

            {/* Promoter Scanner */}
            <Route
                path="/promoter"
                element={
                    <PromoterProtectedRoute loginRoute="/promoter/login">
                        <Scanner />
                    </PromoterProtectedRoute>
                }
            />
        </>
    );
}
