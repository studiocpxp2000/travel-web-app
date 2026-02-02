import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PromoterAuthProvider } from './context/PromoterAuthContext';
import { UserAuthProvider } from './context/UserAuthContext';
import { OrgProvider } from './context/OrgContext';
import { NotificationProvider } from './context/NotificationContext';
import { HelpdeskProvider } from './context/HelpdeskContext';
import { GalleryProvider } from './context/GalleryContext';

// Route configurations
import { PublicRoutes, getAdminRoutes, getSuperAdminRoutes } from './routes';

// Landing and Login pages (not in route files as they're special cases)
import LandingPage from './pages/public/LandingPage';
import Login from './pages/public/Login';

function App() {
  return (
    <AuthProvider>
      <PromoterAuthProvider>
        <HelpdeskProvider>
          <NotificationProvider>
            <GalleryProvider>
              <BrowserRouter>
                <Routes>
                  {/* Root Landing Page - No org slug */}
                  <Route element={<LandingPage />} path="/" />

                  {/* Generic Login (if accessed directly) */}
                  <Route element={<Login />} path="/login" />

                  {/* Super Admin Routes */}
                  {getSuperAdminRoutes()}

                  {/* Admin & Promoter Routes */}
                  {getAdminRoutes()}

                  {/* Organization-specific Public Routes */}
                  <Route
                    path="/:orgSlug/*"
                    element={
                      <UserAuthProvider>
                        <OrgProvider>
                          <PublicRoutes />
                        </OrgProvider>
                      </UserAuthProvider>
                    }
                  />

                  {/* Catch all - redirect to home */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </GalleryProvider>
          </NotificationProvider>
        </HelpdeskProvider>
      </PromoterAuthProvider>
    </AuthProvider>
  );
}

export default App;
