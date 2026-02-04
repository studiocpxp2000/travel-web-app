import { useNavigate } from 'react-router-dom';
import { Building2, Users, UserCheck } from 'lucide-react';
import { StatCard } from '../../components/common/Card';
import { useGetDashboardStatsQuery, useGetOrganizationsQuery } from '../../redux/slices/apiSlice';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();

    // Fetch stats
    const { data: statsData } = useGetDashboardStatsQuery();
    const stats = statsData?.data || {
        totalOrganizations: 0,
        totalUsers: 0,
        totalPromoters: 0
    };

    // Fetch organizations
    const { data: orgsData } = useGetOrganizationsQuery();
    const organizations = orgsData?.data || [];

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-dark-900 rounded-2xl p-6 text-white border border-dark-700">
                <h1 className="text-gray-100 text-2xl font-bold mb-2">Welcome, Super Admin!</h1>
                <p className="text-gray-400">
                    Here's an overview of all organizations and their activities.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Organizations"
                    value={stats.totalOrganizations}
                    icon={Building2}
                    color="purple"
                    onClick={() => navigate('/superadmin/organizations')}
                />
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
                    onClick={() => navigate('/superadmin/users')}
                />
                <StatCard
                    title="Total Promoters"
                    value={stats.totalPromoters}
                    icon={UserCheck}
                    color="green"
                    onClick={() => navigate('/superadmin/promoters')}
                />
            </div>

            {/* Organizations Overview */}
            <div className="card">
                <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-500" />
                    Organizations Overview
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {organizations.map(org => (
                        <div
                            key={org.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border cursor-pointer"
                            onClick={() => navigate(`/superadmin/manage/${org.slug}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                                    style={{ backgroundColor: org.colors?.button || '#3B82F6' }}
                                >
                                    {org.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-medium text-dark-900">{org.name}</p>
                                    <p className="text-xs text-text-light">/{org.slug}/</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div
                                    className="w-6 h-6 rounded border border-gray-300"
                                    style={{ backgroundColor: org.colors?.header || '#1A1A1A' }}
                                    title="Header Color"
                                />
                                <div
                                    className="w-6 h-6 rounded border border-gray-300"
                                    style={{ backgroundColor: org.colors?.button || '#3B82F6' }}
                                    title="Button Color"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
