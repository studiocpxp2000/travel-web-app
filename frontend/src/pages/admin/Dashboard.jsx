import { useState, useContext } from 'react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import { useGetDashboardStatsQuery } from '../../redux/slices/apiSlice';
import { Users, TrendingUp, UserCheck, Calendar as CalendarIcon, BarChart3, ExternalLink, Copy } from 'lucide-react';
import { StatCard } from '../../components/common/Card';

export default function AdminDashboard() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Fetch stats - API uses req.user.org_id from token, or query param for Super Admin
    const { data: statsData, isLoading, error } = useGetDashboardStatsQuery(
        organization?._id ? { org_id: organization._id } : undefined,
        {
            refetchOnMountOrArgChange: true
        }
    );

    const stats = statsData?.data || {
        totalUsers: 0,
        arrivedUsers: 0,
        totalPromoters: 0,
        sessions: [],
        organization: null
    };

    // Map API sessions to component expected format if needed, or just use stats.sessions
    const sessionStats = stats.sessions || [];
    const [copied, setCopied] = useState(false);

    // Use organization from API response, fallback to auth context
    const orgData = stats.organization || organization;
    const primaryColor = orgData?.colors?.button || organization?.button_color || '#3B82F6';
    const orgName = orgData?.name || organization?.name || 'Your Organization';
    const orgSlug = orgData?.slug || organization?.slug || '';
    const publicUrl = orgSlug ? `${window.location.origin}/${orgSlug}` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div
                className="relative overflow-hidden rounded-2xl p-8 text-white shadow-xl"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColorBrightness(primaryColor, -20)} 100%)`
                }}
            >
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 text-white">Welcome to {orgName}!</h1>
                        <p className="opacity-90 max-w-xl">
                            Here's an overview of your organization's performance and recent activities.
                        </p>
                    </div>
                    {/* Public URL Card */}
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 w-full md:w-auto max-w-md">
                        <p className="text-xs font-medium opacity-80 mb-2 uppercase tracking-wide">Public Registration URL</p>
                        <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 pr-3">
                            <ExternalLink className="w-4 h-4 opacity-70" />
                            <a
                                href={publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono truncate hover:underline flex-1"
                            >
                                {publicUrl}
                            </a>
                            <button
                                onClick={copyToClipboard}
                                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                                title="Copy to clipboard"
                            >
                                <Copy className={`w-4 h-4 ${copied ? 'text-green-300' : 'opacity-70'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
                    // Override color for this org context
                    customColor={primaryColor}
                />
                <StatCard
                    title="Arrived"
                    value={stats.arrivedUsers}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    title="Promoters"
                    value={stats.totalPromoters}
                    icon={UserCheck}
                    color="purple"
                />
                <StatCard
                    title="Sessions"
                    value="9"
                    icon={CalendarIcon}
                    color="yellow"
                />
            </div>

            {/* Session Attendance */}
            <div className="card">
                <h2 className="text-lg font-semibold text-dark-900 mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                    Session Attendance Overview
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {sessionStats.map(session => {
                        const percentage = stats.totalUsers > 0
                            ? Math.round((session.attended / stats.totalUsers) * 100)
                            : 0;
                        return (
                            <div key={session.session} className="p-5 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-sm transition-all">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="font-semibold text-dark-900">Session {session.session}</span>
                                    <span className="badge badge-gray">{percentage}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: primaryColor
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-text-light flex justify-between">
                                    <span>Attended: {session.attended}</span>
                                    <span>Total: {stats.totalUsers}</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Helper to darken/lighten color (simple implementation)
function adjustColorBrightness(hex, percent) {
    if (!hex) return '#000000';
    let num = parseInt(hex.replace('#', ''), 16);
    let amt = Math.round(2.55 * percent);
    let R = (num >> 16) + amt;
    let G = (num >> 8 & 0x00FF) + amt;
    let B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
