import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
                  <OrgProvider>
                    <PublicRoutes />
                  </OrgProvider>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </GalleryProvider>
      </NotificationProvider>
    </HelpdeskProvider>
  );
}

export default App;
