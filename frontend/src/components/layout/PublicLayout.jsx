import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Home, Calendar, MapPin, HelpCircle, UserPlus, LogIn, Gamepad2, Trophy, Image, Bell, Headphones, Menu, X, ChevronDown, User, Mail, Phone, Layers, BarChart3, MessageSquareText } from 'lucide-react';
import { useUserAuth } from '../../hooks/useAuthHooks';
import { useOrg } from '../../context/OrgContext';
import { applyOrgTheme, resetTheme } from '../../utils/helpers';
import NotificationToast from '../common/NotificationToast';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';

const publicNavItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/agenda', label: 'Agenda', icon: Calendar },
    { path: '/venue', label: 'Venue', icon: MapPin },
    { path: '/live', label: 'Live Engagement', icon: BarChart3 },
    { path: '/faq', label: 'FAQs', icon: HelpCircle },
    { path: '/funzone', label: 'Fun Zone', icon: Gamepad2 },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/gallery', label: 'Gallery', icon: Image },
    { path: '/wall', label: 'Social Wall', icon: Layers },
    { path: '/notifications', label: 'Notifications', icon: Bell },
    { path: '/helpdesk', label: 'Helpdesk', icon: Headphones },
    { path: '/feedback', label: 'Feedback', icon: MessageSquareText },
];

// First 4 items for mobile bottom nav, rest go in "More" menu
const mobileNavItems = publicNavItems.slice(0, 4);
const moreNavItems = publicNavItems.slice(4);

export default function PublicLayout({ children }) {
    // Use UserAuth context for public pages (separate from admin auth)
    const { isAuthenticated, user, logout } = useUserAuth();
    const location = useLocation();
    const { orgSlug } = useParams();
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);

    // Try to get org from context. OrgContext handles fetching by slug.
    const { currentOrg } = useOrg();

    // Use currentOrg for theming. If not found, theme might be reset or generic.
    const organization = currentOrg;

    // Fetch helpdesk content for dynamic footer contact info (same as Helpdesk.jsx)
    const { data: helpdeskPageData } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'helpdesk' },
        { skip: !orgSlug }
    );
    const helpdeskContent = helpdeskPageData?.data?.content || {};

    // Build path prefix based on org slug
    const pathPrefix = orgSlug ? `/${orgSlug}` : '';

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        } else {
            resetTheme();
        }
    }, [organization]);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setMoreMenuOpen(false);
            setDesktopDropdownOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Close menus on route change
    useEffect(() => {
        setMoreMenuOpen(false);
        setDesktopDropdownOpen(false);
    }, [location.pathname]);

    const isActive = (path) => {
        const itemPath = `${pathPrefix}${path}`;
        return location.pathname === itemPath || location.pathname === path;
    };

    return (
        <div className="min-h-screen flex flex-col pb-16 lg:pb-0">
            {/* Push Notifications Toast */}
            <NotificationToast />

            {/* Header - Desktop */}
            <header
                className="sticky top-0 z-50 shadow-lg"
                style={{ backgroundColor: 'var(--header-bg)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to={pathPrefix || '/'} className="flex items-center gap-2">
                            {organization?.logo_url ? (
                                <img
                                    src={organization.logo_url}
                                    alt={`${organization.name} logo`}
                                    className="h-10 w-auto max-w-[120px] object-contain"
                                />
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                        <span className="text-white font-bold text-lg">
                                            {organization?.name?.charAt(0) || 'T'}
                                        </span>
                                    </div>
                                    <span className="text-white font-semibold text-xl hidden sm:block">
                                        {organization?.name || 'TravelAgency'}
                                    </span>
                                </>
                            )}
                        </Link>

                        {/* Desktop Navigation */}
                        {/* Only show nav if organization is present, or maybe just generic links? Assuming org context is needed for most pages */}
                        {organization && (
                            <nav className="hidden lg:flex items-center gap-1">
                                {/* First 6 items */}
                                {publicNavItems.slice(0, 6).map(item => (
                                    <Link
                                        key={item.path}
                                        to={`${pathPrefix}${item.path}`}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(item.path)
                                            ? 'bg-white/20 text-white'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}

                                {/* "More" Dropdown for remaining items */}
                                {publicNavItems.length > 6 && (
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDesktopDropdownOpen(!desktopDropdownOpen);
                                            }}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${desktopDropdownOpen
                                                ? 'bg-white/20 text-white'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            More
                                            <ChevronDown className={`w-4 h-4 transition-transform ${desktopDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>

                                        {desktopDropdownOpen && (
                                            <div
                                                className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-xl py-2 z-50"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {publicNavItems.slice(6).map(item => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <Link
                                                            key={item.path}
                                                            to={`${pathPrefix}${item.path}`}
                                                            className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors ${isActive(item.path)
                                                                ? 'bg-white/10 text-white'
                                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                                }`}
                                                        >
                                                            <Icon className="w-4 h-4" />
                                                            {item.label}
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </nav>
                        )}

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <>
                                    <Link
                                        to={`${pathPrefix}/profile`}
                                        className="flex items-center gap-2 text-gray-300 hover:text-white text-sm"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="hidden sm:block">{user?.name}</span>
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="btn-primary btn-sm"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    {/* Only show register/login if we are in an org context context or if we want global login */}
                                    {pathPrefix && (
                                        <>
                                            <Link to={`${pathPrefix}/register`} className="btn-outline btn-sm text-white border-white hover:bg-white/10 hidden sm:flex">
                                                <UserPlus className="w-4 h-4 mr-1" />
                                                Register
                                            </Link>
                                            <Link to={`${pathPrefix}/login`} className="btn-primary btn-sm">
                                                <LogIn className="w-4 h-4 mr-1" />
                                                Login
                                            </Link>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer - visible on all devices */}
            <footer
                className="py-6 lg:py-8 mt-auto"
                style={{ backgroundColor: 'var(--footer-bg)' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 text-center md:text-left">
                        {/* Brand */}
                        <div className="flex flex-col items-center md:items-start">
                            <div className="flex items-center gap-2 mb-3 lg:mb-4">
                                {organization?.logo_url ? (
                                    <img
                                        src={organization.logo_url}
                                        alt={`${organization.name} logo`}
                                        className="h-8 lg:h-10 w-auto max-w-[100px] lg:max-w-[120px] object-contain"
                                    />
                                ) : (
                                    <>
                                        <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                            <span className="text-white font-bold text-sm lg:text-lg">
                                                {organization?.name?.charAt(0) || 'T'}
                                            </span>
                                        </div>
                                        <span className="text-white font-semibold text-lg lg:text-xl">
                                            {organization?.name || 'TravelAgency'}
                                        </span>
                                    </>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs lg:text-sm">
                                {organization?.name ? `Welcome to ${organization.name}` : 'Discover the world with our curated travel experiences.'}
                            </p>
                        </div>

                        {/* Quick Links */}
                        {organization && (
                            <div>
                                <h4 className="text-white font-semibold mb-3 lg:mb-4 text-sm lg:text-base">Quick Links</h4>
                                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 lg:grid lg:grid-cols-2 lg:gap-2">
                                    {publicNavItems.slice(0, 6).map(item => (
                                        <Link
                                            key={item.path}
                                            to={`${pathPrefix}${item.path}`}
                                            className={`text-xs lg:text-sm transition-colors ${isActive(item.path)
                                                ? 'text-white font-medium'
                                                : 'text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contact */}
                        <div>
                            <h4 className="text-white font-semibold mb-3 lg:mb-4 text-sm lg:text-base">Contact Us</h4>
                            <div className="space-y-2">
                                {helpdeskContent.email && (
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <p className="text-gray-400 text-xs lg:text-sm">{helpdeskContent.email}</p>
                                    </div>
                                )}
                                {helpdeskContent.phone && (
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                        <p className="text-gray-400 text-xs lg:text-sm">{helpdeskContent.phone}</p>
                                    </div>
                                )}
                                {!helpdeskContent.email && !helpdeskContent.phone && (
                                    <p className="text-gray-500 text-xs lg:text-sm italic">Contact info not available</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 lg:mt-8 pt-4 lg:pt-8 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-xs lg:text-sm">© {new Date().getFullYear()} {organization?.name || 'TravelAgency'}. All rights reserved.</p>
                        <p className="text-gray-500 text-xs lg:text-sm mt-1">Developed by <span className="font-medium text-gray-400">CloudPlay XP</span></p>
                    </div>
                </div>
            </footer>

            {/* Mobile Bottom Navigation */}
            {organization && (
                <nav
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t border-white/10"
                    style={{ backgroundColor: 'var(--header-bg)' }}
                >
                    <div className="flex items-center justify-around h-16">
                        {/* First 4 nav items */}
                        {mobileNavItems.map(item => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={`${pathPrefix}${item.path}`}
                                    className={`flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-0 flex-1 ${isActive(item.path)
                                        ? 'text-white'
                                        : 'text-gray-400'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="text-xs truncate">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* More button */}
                        <div className="relative flex-1">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMoreMenuOpen(!moreMenuOpen);
                                }}
                                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 w-full ${moreMenuOpen
                                    ? 'text-white'
                                    : 'text-gray-400'
                                    }`}
                            >
                                <div className={`p-1 rounded border-2 ${moreMenuOpen ? 'border-white' : 'border-gray-400'}`}>
                                    <Menu className="w-4 h-4" />
                                </div>
                                <span className="text-xs">More</span>
                            </button>

                            {/* More Menu Popup */}
                            {moreMenuOpen && (
                                <div
                                    className="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-xl py-2 z-50"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {moreNavItems.map(item => {
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.path}
                                                to={`${pathPrefix}${item.path}`}
                                                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${isActive(item.path)
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                                {item.label}
                                            </Link>
                                        );
                                    })}

                                    {/* Register link for mobile */}
                                    {!isAuthenticated && pathPrefix && (
                                        <Link
                                            to={`${pathPrefix}/register`}
                                            className="flex items-center gap-3 px-4 py-3 text-sm transition-colors text-gray-300 hover:text-white hover:bg-white/5 border-t border-white/10 mt-2 pt-3"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            Register
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
}
