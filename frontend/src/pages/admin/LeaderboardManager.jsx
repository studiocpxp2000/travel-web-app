import { useState } from 'react';
import { useGetAdminLeaderboardQuery, useUpdateScoreMutation, useDeleteScoreMutation } from '../../redux/slices/apiSlice';
import { Edit, Trash2, Search, Save, X, Trophy } from 'lucide-react';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../hooks/useAuthHooks';

export default function LeaderboardManager() {
    const { user, isSuperAdmin } = useAuth();
    const { currentOrg } = useOrg();

    // Determine context: Super Admin managing an org vs Admin managing their own
    const targetOrgId = (isSuperAdmin && currentOrg?._id) ? currentOrg._id : user?.org_id;

    const { data: leaderboardRes, isLoading, refetch } = useGetAdminLeaderboardQuery(
        targetOrgId ? { org_id: targetOrgId } : undefined,
        { skip: !targetOrgId }
    );
    const [updateScore, { isLoading: isUpdating }] = useUpdateScoreMutation();
    const [deleteScore, { isLoading: isDeleting }] = useDeleteScoreMutation();

    const [searchTerm, setSearchTerm] = useState('');
    const [editingScore, setEditingScore] = useState(null);
    const [editForm, setEditForm] = useState({ points: '', reason: '' });

    const leaderboard = leaderboardRes?.data || [];

    const filteredLeaderboard = leaderboard.filter(entry =>
        entry.user_id?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.user_id?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEditClick = (entry) => {
        setEditingScore(entry);
        setEditForm({ points: entry.current_score, reason: '' });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await updateScore({
                id: editingScore._id,
                points: Number(editForm.points),
                reason: editForm.reason
            }).unwrap();
            setEditingScore(null);
            refetch(); // Ensure UI updates
        } catch (err) {
            console.error('Failed to update score:', err);
            alert('Failed to update score');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this score entry? This removes the user from the leaderboard.')) {
            try {
                await deleteScore(id).unwrap();
                refetch();
            } catch (err) {
                console.error('Failed to delete score:', err);
                alert('Failed to delete score');
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading Leaderboard...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Leaderboard Management</h1>
                    <p className="text-sm text-gray-500">Manage user scores and rankings</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Score</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Redeemed Codes</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredLeaderboard.map((entry, index) => (
                                <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 font-bold text-gray-600">
                                            {index + 1}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                                                {entry.user_id?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{entry.user_name_snapshot || entry.user_id?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{entry.user_id?.email || 'No Email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="font-bold text-primary-600 text-lg">{entry.current_score}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                                            {entry.redeemed_codes?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEditClick(entry)}
                                                className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                title="Edit Score"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry._id)}
                                                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Score"
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeaderboard.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        No scores found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editingScore && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-primary-500" />
                                Update Score
                            </h3>
                            <button onClick={() => setEditingScore(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                                <div className="p-3 bg-gray-50 rounded-lg text-gray-900 text-sm">
                                    {editingScore.user_name_snapshot} ({editingScore.user_id?.email})
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Score Points</label>
                                <input
                                    type="number"
                                    required
                                    value={editForm.points}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, points: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Change</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Manual Adjustment, Bonus Correction"
                                    value={editForm.reason}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingScore(null)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
