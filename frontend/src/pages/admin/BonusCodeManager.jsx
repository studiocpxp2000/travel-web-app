import { useState } from 'react';
import { Plus, Search, Tag, Calendar, CheckCircle, XCircle, Trash2, Edit2, Info } from 'lucide-react';

import { useGetBonusCodesQuery, useCreateBonusCodeMutation, useToggleBonusCodeMutation, useDeleteBonusCodeMutation } from '../../redux/slices/apiSlice';
import Input from '../../components/forms/Input';
import StatusModal from '../../components/common/StatusModal';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useAuth } from '../../hooks/useAuthHooks';
import { useOrg } from '../../context/OrgContext';

export default function BonusCodeManager() {
    const { user, isSuperAdmin } = useAuth();
    const { currentOrg } = useOrg();

    // Determine context
    const targetOrgId = (isSuperAdmin && currentOrg?._id) ? currentOrg._id : user?.org_id;

    const { data: bonusData, isLoading } = useGetBonusCodesQuery(
        targetOrgId ? { org_id: targetOrgId } : undefined,
        { skip: !targetOrgId }
    );
    const [createBonusCode] = useCreateBonusCodeMutation();
    const [toggleBonusCode] = useToggleBonusCodeMutation();
    const [deleteBonusCode] = useDeleteBonusCodeMutation();

    const codes = bonusData?.data || [];

    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: 'delete',
        title: '',
        message: '',
        onConfirm: () => { }
    });

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        points: '',
        isActive: true
    });

    // Filter codes
    const filteredCodes = codes.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddCode = async (e) => {
        e.preventDefault();

        if (!formData.code || !formData.points) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Validation Error',
                message: 'Please fill in all required fields.'
            });
            return;
        }

        try {
            await createBonusCode({
                code: formData.code.toUpperCase(),
                points: parseInt(formData.points),
                isActive: formData.isActive,
                org_id: targetOrgId // Pass org_id for Super Admin (controller handles it)
            }).unwrap();

            setIsAddModalOpen(false);
            setFormData({ code: '', points: '', isActive: true });

            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Success',
                message: 'Bonus code created successfully.'
            });
        } catch (err) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Error',
                message: err.data?.message || 'Failed to create code'
            });
        }
    };

    const toggleStatus = async (id) => {
        try {
            await toggleBonusCode(id).unwrap();
        } catch (err) {
            console.error('Failed to toggle code', err);
        }
    };

    const deleteCode = (id) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Bonus Code?',
            message: 'Are you sure you want to delete this bonus code? Users who have already redeemed it will keep their points.',
            onConfirm: async () => {
                try {
                    await deleteBonusCode(id).unwrap();
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        title: 'Deleted',
                        message: 'Bonus code deleted successfully.'
                    });
                } catch (err) {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                    setStatusModal({
                        isOpen: true,
                        type: 'error',
                        title: 'Error',
                        message: 'Failed to delete code'
                    });
                }
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Bonus Codes</h1>
                    <p className="text-text-light mt-1">Manage points redemption codes for users</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Create Bonus Code
                </button>
            </div>

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search codes..."
                        className="pl-10 form-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Codes Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-dark-900">Code</th>
                                <th className="px-6 py-4 font-semibold text-dark-900">Points</th>
                                <th className="px-6 py-4 font-semibold text-dark-900">Status</th>
                                <th className="px-6 py-4 font-semibold text-dark-900">Created At</th>
                                <th className="px-6 py-4 font-semibold text-dark-900 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredCodes.length > 0 ? (
                                filteredCodes.map((code) => (
                                    <tr key={code._id || code.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                                                    <Tag className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <span className="font-mono font-medium text-dark-900 bg-gray-100 px-2 py-0.5 rounded">
                                                        {code.code}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-green-600">+{code.points} pts</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => toggleStatus(code._id || code.id)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${code.isActive
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                                                    }`}
                                            >
                                                {code.isActive ? (
                                                    <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3 h-3" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {new Date(code.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => deleteCode(code._id || code.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete Code"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                                <Tag className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <p>No bonus codes found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title="Create Bonus Code"
                size="md"
            >
                <form onSubmit={handleAddCode} className="space-y-4">
                    <div>
                        <Input
                            label="Bonus Code"
                            placeholder="e.g. WELCOME50"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        />
                        <p className="text-xs text-gray-500 mt-1">Codes are case-insensitive and unique.</p>
                    </div>

                    <Input
                        label="Points Value"
                        type="number"
                        placeholder="e.g. 50"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                    />

                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.isActive ? 'bg-primary-600' : 'bg-gray-300'}`}
                                onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-700">Immediately Active</span>
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(false)}
                            className="btn-secondary flex-1"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1"
                        >
                            Create Code
                        </button>
                    </div>
                </form>
            </Modal>

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                type={confirmModal.type}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
            />
        </div>
    );
}
