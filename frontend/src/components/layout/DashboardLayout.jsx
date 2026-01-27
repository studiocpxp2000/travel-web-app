import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Building2, Users, UserCheck, FileText,
    LogOut, Menu, X, ChevronDown
} from 'lucide-react';
import { useAuth, ROLES } from '../../context/AuthContext';
import { applyOrgTheme, resetTheme, getInitials } from '../../utils/helpers';

// Sidebar navigation items per role
const getNavItems = (role) => {
    switch (role) {
        case ROLES.SUPER_ADMIN:
            return [
                { path: '/superadmin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/superadmin/organizations', label: 'Organizations', icon: Building2 },
                { path: '/superadmin/users', label: 'Users', icon: Users },
                { path: '/superadmin/promoters', label: 'Promoters', icon: UserCheck },
            ];
        case ROLES.ADMIN_ORG:
            return [
                { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
                { path: '/admin/users', label: 'Users', icon: Users },
                { path: '/admin/promoters', label: 'Promoters', icon: UserCheck },
                { path: '/admin/content', label: 'Content Editor', icon: FileText },
            ];
        default:
            return [];
    }
};

export default function DashboardLayout({ children }) {
    const { user, organization, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const navItems = getNavItems(user?.role);

    useEffect(() => {
        if (organization) {
            applyOrgTheme(organization);
        } else if (user?.role === ROLES.SUPER_ADMIN) {
            resetTheme();
        }
    }, [organization, user?.role]);

    const handleLogout = () => {
        logout();
        navigate('/login');
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
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-64 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
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

                {/* Organization Badge */}
                {organization && (
                    <div className="mx-4 mt-4 p-3 rounded-lg bg-white/10">
                        <p className="text-xs text-gray-400">Organization</p>
                        <p className="text-white font-medium truncate">{organization.name}</p>
                    </div>
                )}

                {/* Navigation */}
                <nav className="mt-6 px-4 space-y-1">
                    {navItems.map(item => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
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

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:pl-64">
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
                    <div className="ml-auto relative">
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
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setUserMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-20">
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
                            </>
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
