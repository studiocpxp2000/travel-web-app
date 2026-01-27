import { Users, UserCheck, TrendingUp, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { StatCard } from '../../components/common/Card';
import { useAuth } from '../../context/AuthContext';
import { getMockStats } from '../../utils/mockData';

export default function AdminDashboard() {
    const { organization } = useAuth();
    const stats = getMockStats(organization?.id);

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div
                className="rounded-2xl p-6 text-white"
                style={{ backgroundColor: organization?.button_color || '#3B82F6' }}
            >
                <h1 className="text-2xl font-bold mb-2">Welcome to {organization?.name}!</h1>
                <p className="opacity-90">
                    Here's an overview of your organization's activities.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
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
                <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-500" />
                    Session Attendance Overview
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {stats.sessionStats.map(session => {
                        const percentage = stats.totalUsers > 0
                            ? Math.round((session.attended / session.total) * 100)
                            : 0;
                        return (
                            <div key={session.session} className="p-4 rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium text-dark-900">Session {session.session}</span>
                                    <span className="text-sm text-text-light">{percentage}%</span>
                                </div>
                                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: organization?.button_color || '#3B82F6'
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-text-muted mt-1">
                                    {session.attended} of {session.total} attended
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
