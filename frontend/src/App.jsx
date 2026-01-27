import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ROLES } from './context/AuthContext';
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
import Organizations from './pages/superadmin/Organizations';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminPromoters from './pages/superadmin/Promoters';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminPromoters from './pages/admin/Promoters';
import ContentEditor from './pages/admin/ContentEditor';

// Promoter Pages
import Scanner from './pages/promoter/Scanner';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes with Layout */}
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

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]}>
                <DashboardLayout><AdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]}>
                <DashboardLayout><AdminUsers /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/promoters"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]}>
                <DashboardLayout><AdminPromoters /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/content"
            element={
              <ProtectedRoute allowedRoles={[ROLES.ADMIN_ORG]}>
                <DashboardLayout><ContentEditor /></DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Promoter Routes - No Dashboard Layout (Mobile-first) */}
          <Route
            path="/promoter"
            element={
              <ProtectedRoute allowedRoles={[ROLES.PROMOTER]}>
                <Scanner />
              </ProtectedRoute>
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
