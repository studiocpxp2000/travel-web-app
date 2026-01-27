import { Building2, Users, UserCheck, TrendingUp, BarChart3 } from 'lucide-react';
import { StatCard } from '../../components/common/Card';
import { getMockStats, mockOrganizations } from '../../utils/mockData';

export default function SuperAdminDashboard() {
    const stats = getMockStats();

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Welcome, Super Admin!</h1>
                <p className="text-primary-100">
                    Here's an overview of all organizations and their activities.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Organizations"
                    value={stats.totalOrganizations}
                    icon={Building2}
                    color="purple"
                />
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
                />
                <StatCard
                    title="Total Promoters"
                    value={stats.totalPromoters}
                    icon={UserCheck}
                    color="green"
                />
                <StatCard
                    title="Arrivals Today"
                    value={stats.arrivedUsers}
                    icon={TrendingUp}
                    color="yellow"
                />
            </div>

            {/* Organizations Overview */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="card">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary-500" />
                        Organizations
                    </h2>
                    <div className="space-y-3">
                        {mockOrganizations.map(org => (
                            <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: org.button_color }}
                                    >
                                        {org.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-dark-900">{org.name}</p>
                                        <p className="text-xs text-text-light">ID: {org.id}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <div
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: org.header_color }}
                                        title="Header Color"
                                    />
                                    <div
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: org.button_color }}
                                        title="Button Color"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        Session Attendance
                    </h2>
                    <div className="space-y-3">
                        {stats.sessionStats.map(session => {
                            const percentage = stats.totalUsers > 0
                                ? Math.round((session.attended / session.total) * 100)
                                : 0;
                            return (
                                <div key={session.session}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-light">Session {session.session}</span>
                                        <span className="font-medium">{session.attended}/{session.total}</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
