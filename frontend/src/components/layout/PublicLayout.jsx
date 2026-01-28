import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, Calendar, MapPin, HelpCircle, UserPlus, LogIn, Gamepad2, Trophy, Image, Bell, Headphones } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOrg } from '../../context/OrgContext';
import { applyOrgTheme, resetTheme } from '../../utils/helpers';
import { mockOrganizations } from '../../utils/mockData';

const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    { path: '/venue', label: 'Venue', icon: MapPin },
    { path: '/faq', label: 'FAQs', icon: HelpCircle },
    { path: '/funzone', label: 'Fun Zone', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/helpdesk', label: 'Helpdesk', icon: Headphones },
];

export default function PublicLayout({ children }) {
    const { isAuthenticated, user, organization: authOrg, logout } = useAuth();
    const location = useLocation();
    const { orgSlug } = useParams();

    // Try to get org from context, fall back to auth org or default
    let currentOrg = null;
    try {
        const { currentOrg: contextOrg } = useOrg();
        currentOrg = contextOrg;
    } catch {
        // OrgContext not available, use fallback
    }

    // Determine the organization to use for theming
    const organization = currentOrg || authOrg || (orgSlug ? mockOrganizations.find(o => o.slug === orgSlug) : mockOrganizations[0]);

    // Build path prefix based on org slug
    const pathPrefix = orgSlug ? `/${orgSlug}` : '';

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        } else {
            resetTheme();
        }
    }, [organization]);

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header
                className="sticky top-0 z-50 shadow-lg"
                style={{ backgroundColor: 'var(--header-bg)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                            <span className="text-white font-semibold text-xl hidden sm:block">
                                TravelAgency
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center gap-1">
                            {publicNavItems.slice(0, 5).map(item => (
                                <Link
                                    key={item.path}
                                    to={`${pathPrefix}${item.path}`}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === `${pathPrefix}${item.path}` || location.pathname === item.path
                                        ? 'bg-white/20 text-white'
                                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <>
                                    <span className="text-gray-300 text-sm hidden sm:block">
                                        {user?.name}
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="btn-primary btn-sm"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/register" className="btn-outline btn-sm text-white border-white hover:bg-white/10">
                                        <UserPlus className="w-4 h-4 mr-1" />
                                        Register
                                    </Link>
                                    <Link to="/login" className="btn-primary btn-sm">
                                        <LogIn className="w-4 h-4 mr-1" />
                                        Login
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="lg:hidden border-t border-white/10">
                    <div className="flex overflow-x-auto scrollbar-thin px-4 py-2 gap-4">
                        {publicNavItems.map(item => {
                            const Icon = item.icon;
                            const itemPath = `${pathPrefix}${item.path}`;
                            return (
                                <Link
                                    key={item.path}
                                    to={itemPath}
                                    className={`flex flex-col items-center gap-1 px-3 py-1 min-w-fit text-xs ${location.pathname === itemPath || location.pathname === item.path
                                        ? 'text-white'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer
                className="py-8 mt-auto"
                style={{ backgroundColor: 'var(--footer-bg)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">T</span>
                                </div>
                                <span className="text-white font-semibold text-xl">TravelAgency</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Discover the world with our curated travel experiences and events.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {publicNavItems.slice(0, 6).map(item => (
                                    <Link
                                        key={item.path}
                                        to={`${pathPrefix}${item.path}`}
                                        className="text-gray-400 text-sm hover:text-white transition-colors"
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
                            <p className="text-gray-400 text-sm">support@travelagency.com</p>
                            <p className="text-gray-400 text-sm">+1 (555) 123-4567</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} TravelAgency. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
