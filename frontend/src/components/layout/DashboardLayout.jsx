import { useEffect, useState, useRef, useMemo, memo } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, UserCheck, FileText,
    LogOut, Menu, X, ChevronDown, ArrowLeft, Settings, Mail,
    Inbox, Bell, Headphones, Image, Gift, Trophy, Layers, BarChart3, Palette
} from 'lucide-react';
import { useAuth, ROLES } from '../../hooks/useAuthHooks';
import { useGetOrganizationBySlugQuery, useGetOrganizationByIdQuery } from '../../redux/slices/apiSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { applyOrgTheme, resetTheme, getInitials } from '../../utils/helpers';

// Memoized Sidebar Component
const Sidebar = memo(({
    sidebarOpen,
    setSidebarOpen,
    organization,
    isManagingOrg,
    handleBackToSuperAdmin,
    navItems,
    currentPath,
    handleLogout
}) => {
    return (
        <aside
            className={`fixed top-0 left-0 z-50 h-full w-64 flex flex-col transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            style={{ backgroundColor: 'var(--header-bg)' }}
        >
            {/* Sidebar Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">T</span>
                    </div>
                    <span className="text-white font-semibold">TravelAgency</span>
                </Link>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scrollable Content Area - Hidden scrollbar */}
            <div className="flex-1 overflow-y-auto scrollbar-hide">
                {/* Organization Badge */}
                {organization && (
                    <div className="mx-4 mt-4 p-3 rounded-lg bg-white/10">
                        {isManagingOrg && (
                            <p className="text-xs text-yellow-400 mb-2">Managing as Super Admin</p>
                        )}
                        <p className="text-xs text-gray-400 mb-2">Organization</p>
                        <div className="flex items-center gap-3">
                            {organization.logo ? (
                                <img
                                    src={organization.logo}
                                    alt={`${organization.name} logo`}
                                    className="w-10 h-10 rounded-lg object-contain bg-white/10"
                                />
                            ) : (
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                    style={{ backgroundColor: organization.button_color || '#3B82F6' }}
                                >
                                    {organization.name?.charAt(0)}
                                </div>
                            )}
                            <p className="text-white font-medium truncate flex-1">{organization.name}</p>
                        </div>
                    </div>
                )}

                {/* Back Button for Super Admin Org Management */}
                {isManagingOrg && (
                    <button
                        onClick={handleBackToSuperAdmin}
                        className="mx-4 mt-4 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Organizations
                    </button>
                )}

                {/* Navigation */}
                <nav className="mt-6 px-4 space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = currentPath === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                            >
                                <Icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Sidebar Footer - Fixed at bottom */}
            <div className="flex-shrink-0 p-4 border-t border-white/10" style={{ backgroundColor: 'var(--header-bg)' }}>
                <button
                    onClick={handleLogout}
                    className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
});

// Sidebar navigation items per role
const getNavItems = (role, isManagingOrg = false, orgSlug = null) => {
    // Super admin managing a specific org
    if (isManagingOrg && orgSlug) {
        const basePath = `/superadmin/manage/${orgSlug}`;
        return [
            { path: basePath, label: 'Dashboard', icon: LayoutDashboard },
            { path: `${basePath}/users`, label: 'Users', icon: Users },
            { path: `${basePath}/promoters`, label: 'Promoters', icon: UserCheck },
            { path: `${basePath}/bonus-codes`, label: 'Bonus Codes', icon: Gift },
            { path: `${basePath}/content`, label: 'Content Editor', icon: FileText },
            { path: `${basePath}/registration-fields`, label: 'Registration Fields', icon: Settings },
            { path: `${basePath}/leaderboard`, label: 'Leaderboard', icon: Trophy },
            { path: `${basePath}/email-templates`, label: 'Email Templates', icon: Palette },
            { path: `${basePath}/send-email`, label: 'Send Email', icon: Mail },
            { path: `${basePath}/email-invitations`, label: 'Email Invitations', icon: Inbox },
            { path: `${basePath}/gallery`, label: 'Gallery', icon: Image },
            { path: `${basePath}/wall`, label: 'Social Wall', icon: Layers },
            { path: `${basePath}/live-engagement`, label: 'Live Engagement', icon: BarChart3 },
            { path: `${basePath}/push-notifications`, label: 'Push Notifications', icon: Bell },
            { path: `${basePath}/helpdesk-messages`, label: 'Helpdesk Messages', icon: Headphones },
        ];
    }

    switch (role) {
        case ROLES.SUPER_ADMIN:
            const superAdminLinks = [
                { path: '/superadmin', icon: LayoutDashboard, label: 'Dashboard' },
                { path: '/superadmin/organizations', icon: Building2, label: 'Organizations' },
                { path: '/superadmin/admins', icon: UserCheck, label: 'Admins' },
                { path: '/superadmin/users', icon: Users, label: 'All Users' },
                { path: '/superadmin/promoters', label: 'Promoters', icon: UserCheck },
            ];
            return superAdminLinks;
        case ROLES.ADMIN_ORG:
            return [
                { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/admin/users', label: 'Users', icon: Users },
                { path: '/admin/promoters', label: 'Promoters', icon: UserCheck },
                { path: '/admin/bonus-codes', label: 'Bonus Codes', icon: Gift },
                { path: '/admin/content', label: 'Content Editor', icon: FileText },
                { path: '/admin/registration-fields', label: 'Registration Fields', icon: Settings },
                { path: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
                { path: '/admin/email-templates', label: 'Email Templates', icon: Palette },
                { path: '/admin/send-email', label: 'Send Email', icon: Mail },
                { path: '/admin/email-invitations', label: 'Email Invitations', icon: Inbox },
                { path: '/admin/gallery', label: 'Gallery', icon: Image },
                { path: '/admin/wall', label: 'Social Wall', icon: Layers },
                { path: '/admin/live-engagement', label: 'Live Engagement', icon: BarChart3 },
                { path: '/admin/push-notifications', label: 'Push Notifications', icon: Bell },
                { path: '/admin/helpdesk-messages', label: 'Helpdesk Messages', icon: Headphones },
            ];
        default:
            return [];
    }
};

export default function DashboardLayout({ children }) {
    const { user, organization: authOrg, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { orgSlug } = useParams();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    // Check if super admin is managing a specific org
    const isManagingOrg = user?.role === ROLES.SUPER_ADMIN && orgSlug && location.pathname.includes('/superadmin/manage/');

    // Fetch org details if managing
    const { data: managedOrgData } = useGetOrganizationBySlugQuery(
        isManagingOrg ? orgSlug : skipToken
    );

    // Fetch own org for regular Admin (using their assigned org_id)
    const { data: userOrgData } = useGetOrganizationByIdQuery(
        (!isManagingOrg && user?.role === ROLES.ADMIN_ORG && user?.org_id) ? user.org_id : skipToken
    );

    const managedOrg = managedOrgData?.data;
    const userOrg = userOrgData?.data;
    const organization = managedOrg || userOrg;

    const navItems = useMemo(() =>
        getNavItems(user?.role, isManagingOrg, orgSlug),
        [user?.role, isManagingOrg, orgSlug]
    );

    const userMenuRef = useRef(null);

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        } else if (user?.role === ROLES.SUPER_ADMIN) {
            resetTheme();
        }
    }, [organization, user?.role]);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setUserMenuOpen(false);
            }
        };
        if (userMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [userMenuOpen]);

    const handleLogout = () => {
        const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
        const isAdmin = user?.role === ROLES.ADMIN_ORG;
        const isPromoter = user?.role === ROLES.PROMOTER;

        logout();

        if (isSuperAdmin) {
            navigate('/superadmin/login');
        } else if (isAdmin) {
            navigate('/admin/login');
        } else if (isPromoter) {
            navigate('/promoter/login');
        } else {
            navigate('/login');
        }
    };

    const handleBackToSuperAdmin = () => {
        navigate('/superadmin/organizations');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                organization={organization}
                isManagingOrg={isManagingOrg}
                handleBackToSuperAdmin={handleBackToSuperAdmin}
                navItems={navItems}
                currentPath={location.pathname}
                handleLogout={handleLogout}
            />

            {/* Main Content Area */}
            <div className="lg:pl-64 min-h-screen flex flex-col">
                {/* Top Header */}
                <header className="sticky top-0 z-30 bg-white shadow-sm h-16 flex items-center px-4 lg:px-8">
                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-4"
                    >
                        <Menu className="w-6 h-6 text-gray-600" />
                    </button>

                    {/* Page Title */}
                    <h1 className="text-lg font-semibold text-dark-900">
                        {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
                    </h1>

                    {/* User Menu */}
                    <div className="ml-auto relative" ref={userMenuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-medium">
                                {getInitials(user?.name)}
                            </div>
                            <span className="hidden sm:block text-sm font-medium text-gray-700">
                                {user?.name}
                            </span>
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                        </button>

                        {/* Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                                <div className="px-4 py-2 border-b">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="py-4 px-4 lg:px-8 border-t border-gray-200 bg-white">
                    <div className="flex flex-col items-center gap-1 text-sm text-gray-500">
                        <span>© 2026 TravelAgency. All rights reserved.</span>
                        <span>Developed by <span className="font-medium text-gray-600">CloudPlay XP</span></span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
