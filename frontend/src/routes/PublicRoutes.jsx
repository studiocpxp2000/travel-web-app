import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../components/layout/PublicLayout';

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
 * Public routes for organization-specific pages
 * These routes are wrapped with UserAuthProvider and OrgProvider in App.jsx
 */
export default function PublicRoutes() {
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
            <Route path="/login" element={<PublicLayout><UserLogin /></PublicLayout>} />
            <Route path="/profile" element={<PublicLayout><UserProfile /></PublicLayout>} />
        </Routes>
    );
}
