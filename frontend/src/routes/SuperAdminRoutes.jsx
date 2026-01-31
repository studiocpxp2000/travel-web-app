import { Routes, Route } from 'react-router-dom';
import { ROLES } from '../context/AuthContext';
import { OrgProvider } from '../context/OrgContext';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Super Admin Pages
import SuperAdminDashboard from '../pages/superadmin/Dashboard';
import SuperAdminLogin from '../pages/superadmin/SuperAdminLogin';
import Organizations from '../pages/superadmin/Organizations';
import SuperAdminUsers from '../pages/superadmin/Users';
import SuperAdminPromoters from '../pages/superadmin/Promoters';

// Admin Pages (used for org management by superadmin)
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

/**
 * Super Admin Org Management Routes
 * Used when superadmin accesses an organization's admin panel
 */
function SuperAdminOrgManageRoutes() {
    return (
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
        </Routes>
    );
}

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
