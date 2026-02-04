import { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Building2, User } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Input, { Select } from '../../components/forms/Input';
import {
    useGetAdminsQuery,
    useCreateAdminMutation,
    useUpdateAdminMutation,
    useDeleteAdminMutation,
    useGetOrganizationsQuery
} from '../../redux/slices/apiSlice';

export default function SuperAdminAdmins() {
    // API Hooks
    const { data: adminsData, isLoading: isLoadingAdmins, error: adminError } = useGetAdminsQuery();
    const { data: orgsData } = useGetOrganizationsQuery();
    const [createAdmin] = useCreateAdminMutation();
    const [updateAdmin] = useUpdateAdminMutation();
    const [deleteAdmin] = useDeleteAdminMutation();

    const admins = adminsData?.data || [];
    const organizations = orgsData?.data || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrgFilter, setSelectedOrgFilter] = useState('all');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        password: '',
        org_id: ''
    });

    // Modals
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'delete', title: '', message: '', itemId: null });

    const showStatus = (type, title, message) => setStatusModal({ isOpen: true, type, title, message });

    // Filter Logic
    const filteredAdmins = admins.filter(admin => {
        const matchesSearch =
            admin.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            admin.org_id?.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesOrg = selectedOrgFilter === 'all' || admin.org_id?._id === selectedOrgFilter || admin.org_id === selectedOrgFilter;

        return matchesSearch && matchesOrg;
    });

    const columns = [
        {
            header: 'Organization',
            accessor: 'org_id.name',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{row.org_id?.name || 'N/A'}</span>
                </div>
            )
        },
        {
            header: 'Admin Name',
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{row.name}</span>
                </div>
            )
        },
        {
            header: 'Credentials',
            render: (row) => (
                <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-16 uppercase font-semibold">Username:</span>
                        <span className="font-mono bg-gray-50 px-1 rounded text-dark-800">{row.username}</span>
                    </p>
                    <p className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs w-16 uppercase font-semibold">Password:</span>
                        <span className="font-mono bg-yellow-50 px-1 rounded text-orange-700 font-medium">
                            {row.plain_password || '******'}
                        </span>
                    </p>
                </div>
            )
        },
        {
            header: 'Actions',
            width: '120px',
            render: (row) => (
                <div className="flex gap-1 justify-end">
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                        title="Edit Admin"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => openDeleteConfirm(row._id, row.username)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Delete Admin"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            )
        }
    ];

    const handleEdit = (admin) => {
        setEditingAdmin(admin);
        setFormData({
            name: admin.name,
            username: admin.username,
            password: admin.plain_password || '', // Pre-fill plain if available, typically we don't prefill password on edit but here explicitly requested to manage it
            org_id: admin.org_id?._id || admin.org_id // Handle populated or ID
        });
        setIsModalOpen(true);
    };

    const openDeleteConfirm = (id, username) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Admin?',
            message: `Are you sure you want to delete admin "${username}"?`,
            itemId: id
        });
    };

    const handleConfirmAction = async () => {
        try {
            if (confirmModal.type === 'delete') {
                await deleteAdmin(confirmModal.itemId).unwrap();
                showStatus('success', 'Deleted!', 'Admin has been removed.');
            }
        } catch (err) {
            showStatus('error', 'Error!', err?.data?.message || 'Failed to delete admin.');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAdmin) {
                // If editing, password is optional unless changed
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Don't send empty pass if not changing

                await updateAdmin({
                    id: editingAdmin._id,
                    ...payload
                }).unwrap();
                showStatus('success', 'Updated!', 'Admin credentials updated.');
            } else {
                await createAdmin(formData).unwrap();
                showStatus('success', 'Created!', 'New Admin created successfully.');
            }
            closeModal();
        } catch (err) {
            showStatus('error', 'Error!', err?.data?.message || 'Failed to save admin.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingAdmin(null);
        setFormData({ name: '', username: '', password: '', org_id: '' });
    };

    // Org Options for Select
    const orgOptions = [
        { value: '', label: 'Select Organization' },
        ...organizations.map(org => ({ value: org._id, label: org.name }))
    ];

    const filterOrgOptions = [
        { value: 'all', label: 'All Organizations' },
        ...organizations.map(org => ({ value: org._id, label: org.name }))
    ];

    if (isLoadingAdmins) return <div>Loading admins...</div>;

    if (adminError) {
        console.error("Admins Fetch Error:", adminError);
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                <p className="font-bold">Error loading admins:</p>
                <code className="text-sm block mt-1">{JSON.stringify(adminError.data || adminError.error)}</code>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Manage Admins</h1>
                    <p className="text-text-light">Create and manage organization administrators</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-dark">
                    <Plus className="w-5 h-5 mr-2" />
                    New Admin
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search admins by name, username..."
                        className="w-full pl-10 h-10 rounded-lg border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-64">
                    <select
                        className="w-full h-10 rounded-lg border border-gray-200 px-3 outline-none focus:border-primary-500"
                        value={selectedOrgFilter}
                        onChange={(e) => setSelectedOrgFilter(e.target.value)}
                    >
                        {filterOrgOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredAdmins}
                emptyMessage="No admins found."
                searchable={false}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingAdmin ? 'Edit Admin' : 'New Admin'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select
                        label="Organization"
                        options={orgOptions}
                        value={formData.org_id}
                        onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                        required
                        disabled={!!editingAdmin} // Optionally allow moving admins? Usually restricted. Let's allow for now if superadmin wants to fix mistake.
                    />

                    <Input
                        label="Full Name"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Username"
                            placeholder="login_username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                        />
                        <div className="relative">
                            <Input
                                label={editingAdmin ? "New Password (Optional)" : "Password"}
                                type="text" // Show plain for superadmin convenience
                                placeholder="Secret password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required={!editingAdmin}
                            />
                            {editingAdmin && (
                                <p className="text-xs text-text-light mt-1">Leave blank to keep current</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-dark">{editingAdmin ? 'Save Changes' : 'Create Admin'}</button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                type={confirmModal.type}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
}
