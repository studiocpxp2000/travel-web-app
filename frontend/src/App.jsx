import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ROLES } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicLayout from './components/layout/PublicLayout';
import DashboardLayout from './components/layout/DashboardLayout';

// Public Pages
import Home from './pages/public/Home';
import Agenda from './pages/public/Agenda';
import Venue from './pages/public/Venue';
import FAQ from './pages/public/FAQ';
import FunZone from './pages/public/FunZone';
import Leaderboard from './pages/public/Leaderboard';
import Gallery from './pages/public/Gallery';
import Notifications from './pages/public/Notifications';
import Helpdesk from './pages/public/Helpdesk';
import Register from './pages/public/Register';
import Login from './pages/public/Login';

// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import Organizations from './pages/superadmin/Organizations';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminPromoters from './pages/superadmin/Promoters';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminPromoters from './pages/admin/Promoters';
import ContentEditor from './pages/admin/ContentEditor';
import RegistrationFields from './pages/admin/RegistrationFields';
import SendEmail from './pages/admin/SendEmail';
import EmailInvitations from './pages/admin/EmailInvitations';

// Promoter Pages
import Scanner from './pages/promoter/Scanner';

// Component wrapper for org-specific public routes
function OrgPublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
      <Route path="/agenda" element={<PublicLayout><Agenda /></PublicLayout>} />
      <Route path="/venue" element={<PublicLayout><Venue /></PublicLayout>} />
      <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
      <Route path="/funzone" element={<PublicLayout><FunZone /></PublicLayout>} />
      <Route path="/leaderboard" element={<PublicLayout><Leaderboard /></PublicLayout>} />
      <Route path="/gallery" element={<PublicLayout><Gallery /></PublicLayout>} />
      <Route path="/notifications" element={<PublicLayout><Notifications /></PublicLayout>} />
      <Route path="/helpdesk" element={<PublicLayout><Helpdesk /></PublicLayout>} />
      <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />
    </Routes>
  );
}

// Component wrapper for super admin org management routes
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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Default Public Routes (no org slug) */}
          <Route element={<PublicLayout><Home /></PublicLayout>} path="/" />
          <Route element={<PublicLayout><Agenda /></PublicLayout>} path="/agenda" />
          <Route element={<PublicLayout><Venue /></PublicLayout>} path="/venue" />
          <Route element={<PublicLayout><FAQ /></PublicLayout>} path="/faq" />
          <Route element={<PublicLayout><FunZone /></PublicLayout>} path="/funzone" />
          <Route element={<PublicLayout><Leaderboard /></PublicLayout>} path="/leaderboard" />
          <Route element={<PublicLayout><Gallery /></PublicLayout>} path="/gallery" />
          <Route element={<PublicLayout><Notifications /></PublicLayout>} path="/notifications" />
          <Route element={<PublicLayout><Helpdesk /></PublicLayout>} path="/helpdesk" />
          <Route element={<PublicLayout><Register /></PublicLayout>} path="/register" />

          {/* Auth Routes - No Layout */}
          <Route element={<Login />} path="/login" />
          <Route element={<SuperAdminLogin />} path="/superadmin/login" />

          {/* Admin Login - Redirect to /admin if already logged in as Admin */}
          <Route
            path="/admin/login"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} redirectIfAuthenticated="/admin" loginRoute="/admin/login">
                <Login userType="admin" />
              </ProtectedRoute>
            }
          />

          {/* Promoter Login - Redirect to /promoter if already logged in as Promoter */}
          <Route
            path="/promoter/login"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PROMOTER]} redirectIfAuthenticated="/promoter" loginRoute="/promoter/login">
                <Login userType="promoter" />
              </ProtectedRoute>
            }
          />

          {/* Super Admin Routes */}
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <DashboardLayout><SuperAdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/organizations"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <DashboardLayout><Organizations /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <DashboardLayout><SuperAdminUsers /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/promoters"
            element={
              <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                <DashboardLayout><SuperAdminPromoters /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Super Admin Org Management Routes - Access admin panel as super admin */}
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

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><AdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><AdminUsers /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/promoters"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><AdminPromoters /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><ContentEditor /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/registration-fields"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><RegistrationFields /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/send-email"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><SendEmail /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/email-invitations"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]} loginRoute="/admin/login">
                <DashboardLayout><EmailInvitations /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Promoter Routes - No Dashboard Layout (Mobile-first) */}
          <Route
            path="/promoter"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PROMOTER]} loginRoute="/promoter/login">
                <Scanner />
              </ProtectedRoute>
            }
          />

          {/* Organization-specific Public Routes */}
          <Route
            path="/:orgSlug/*"
            element={
              <OrgProvider>
                <OrgPublicRoutes />
              </OrgProvider>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

