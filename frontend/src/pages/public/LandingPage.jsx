import { Link } from 'react-router-dom';
import { Shield, UserCheck, Building2, ArrowRight, Globe, Loader2 } from 'lucide-react';
import { useGetPublicOrganizationsQuery } from '../../redux/slices/apiSlice';

export default function LandingPage() {
    const { data: orgData, isLoading, error } = useGetPublicOrganizationsQuery();
    const organizations = orgData?.data || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
            {/* Header */}
            <header className="py-6 px-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <span className="text-white font-bold text-xl">T</span>
                        </div>
                        <span className="text-white font-bold text-2xl">TravelAgency</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Hero Section */}
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-6">
                            <Globe className="w-4 h-4" />
                            Event Management Platform
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                TravelAgency
                            </span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                            Please select an organization portal to access public content, or login to the admin/promoter dashboard.
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-12">
                        {/* Admin Card */}
                        <Link
                            to="/admin/login"
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Shield className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Admin Portal</h2>
                                <p className="text-blue-100 mb-4">
                                    Manage organizations, users, content, and event settings.
                                </p>
                                <div className="flex items-center text-white font-medium">
                                    Go to Admin Dashboard
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        {/* Promoter Card */}
                        <Link
                            to="/promoter/login"
                            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-8 text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-500/20"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <UserCheck className="w-7 h-7 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Promoter Portal</h2>
                                <p className="text-emerald-100 mb-4">
                                    Scan QR codes, verify attendees, and manage check-ins.
                                </p>
                                <div className="flex items-center text-white font-medium">
                                    Go to Promoter Scanner
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Organizations Section */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-8">
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <h3 className="text-lg font-semibold text-white">Available Organizations</h3>
                        </div>

                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p>Loading organizations...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-8 text-red-400">
                                <p>Failed to load organizations.</p>
                                <p className="text-xs mt-1 opacity-75">{error.data?.message || 'Network error'}</p>
                            </div>
                        ) : organizations.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <p>No organizations found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {organizations.map(org => (
                                    <Link
                                        key={org._id || org.id}
                                        to={`/${org.slug}`}
                                        className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        {org.logo ? (
                                            <img
                                                src={org.logo}
                                                alt={`${org.name} logo`}
                                                className="w-10 h-10 object-contain mx-auto mb-3 group-hover:scale-110 transition-transform"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                                <span className="text-white font-bold">{org.name.charAt(0)}</span>
                                            </div>
                                        )}
                                        <p className="text-white font-medium text-sm text-center">{org.name}</p>
                                        <p className="text-gray-500 text-xs text-center mt-1">/{org.slug}</p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 px-4 border-t border-white/10">
                <div className="max-w-6xl mx-auto flex flex-col items-center gap-1 text-sm text-gray-500">
                    <span>© 2026 TravelAgency. All rights reserved.</span>
                    <span>Developed by <span className="font-medium text-gray-400">CloudPlay XP</span></span>
                </div>
            </footer>
        </div>
    );
}
