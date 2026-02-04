import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, Archive, RotateCcw, Download } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Input, { Select } from '../../components/forms/Input';
import {
    useGetPromotersQuery,
    useGetOrganizationsQuery,
    useCreatePromoterMutation,
    useUpdatePromoterMutation,
    useDeletePromoterMutation
} from '../../redux/slices/apiSlice';
import { SCANNER_TYPES } from '../../hooks/useAuthHooks';
import { generateId, getScannerTypeName } from '../../utils/helpers';
import { exportToExcel, PROMOTER_EXPORT_COLUMNS } from '../../utils/exportUtils';

export default function SuperAdminPromoters() {
    // API Hooks
    const { data: promotersData, isLoading: isPromotersLoading } = useGetPromotersQuery();
    const { data: orgsData } = useGetOrganizationsQuery();

    // Mutations
    const [createPromoter] = useCreatePromoterMutation();
    const [updatePromoter] = useUpdatePromoterMutation();
    const [deletePromoter] = useDeletePromoterMutation();

    // Derived Data
    const promoters = promotersData?.success ? promotersData.data : [];
    const organizations = orgsData?.success ? orgsData.data : [];

    // Local State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromoter, setEditingPromoter] = useState(null);
    const [filterOrg, setFilterOrg] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        org_id: '',
        assigned_scanner_type: '',
    });

    // Status modal state
    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'success',
        title: '',
        message: ''
    });

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: 'delete',
        title: '',
        message: '',
        itemId: null
    });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const orgOptions = organizations.map(org => ({
        value: org.id,
        label: org.name,
    }));

    const scannerOptions = Object.keys(SCANNER_TYPES).map(key => ({
        value: key,
        label: getScannerTypeName(key),
    }));

    const filteredPromoters = promoters.filter(p => {
        const orgMatch = !filterOrg || p.org_id === filterOrg;
        const archiveMatch = showArchived || !p.archived;
        return orgMatch && archiveMatch;
    });

    const handleDownloadReport = () => {
        const orgName = organizations.find(o => o.id === filterOrg)?.name || 'promoters';
        const orgPromoters = filteredPromoters.filter(p => !p.archived);
        exportToExcel(orgPromoters, `${orgName.replace(/\s+/g, '_')}_promoters`, PROMOTER_EXPORT_COLUMNS);
        showStatus('success', 'Report Downloaded!', `Successfully exported ${orgPromoters.length} promoters to Excel.`);
    };

    const columns = [
        {
            header: 'Username',
            accessor: 'username',
            render: (row) => (
                <div className={`flex items-center gap-2 ${row.archived ? 'opacity-50' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-dark-900 flex items-center gap-2">
                        {row.username}
                        {row.archived && <span className="badge badge-gray">Archived</span>}
                    </span>
                </div>
            ),
        },
        {
            header: 'Password',
            accessor: 'password',
            render: (row) => (
                <span className="font-mono text-sm text-text-light">{row.password}</span>
            ),
        },
        {
            header: 'Organization',
            render: (row) => {
                const org = organizations.find(o => o.id === row.org_id);
                return <span className="badge badge-info">{org?.name || 'Unknown'}</span>;
            },
        },
        {
            header: 'Scanner Type',
            render: (row) => (
                <span className="badge badge-success">
                    {getScannerTypeName(row.assigned_scanner_type)}
                </span>
            ),
        },
        {
            header: 'Actions',
            width: '150px',
            render: (row) => (
                <div className="flex gap-1">
                    {!row.archived && (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleEdit(row);
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openArchiveConfirm(row.id, row.username);
                                }}
                                className="p-2 rounded-lg hover:bg-yellow-50 text-yellow-600"
                                title="Archive"
                            >
                                <Archive className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    {row.archived && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRestore(row.id);
                            }}
                            className="p-2 rounded-lg hover:bg-green-50 text-green-600"
                            title="Restore"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            openDeleteConfirm(row.id, row.username);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Permanently Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const handleEdit = (promoter) => {
        setEditingPromoter(promoter);
        setFormData({
            username: promoter.username,
            password: promoter.password,
            org_id: promoter.org_id,
            assigned_scanner_type: promoter.assigned_scanner_type,
        });
        setIsModalOpen(true);
    };

    const openArchiveConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'archive',
            title: 'Archive Promoter?',
            message: `Are you sure you want to archive "${name}"? You can restore them later.`,
            itemId: id
        });
    };

    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Promoter?',
            message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
            itemId: id
        });
    };

    const handleConfirmAction = async () => {
        const { type, itemId } = confirmModal;
        try {
            if (type === 'archive') {
                await updatePromoter({ id: itemId, archived: true }).unwrap();
                showStatus('success', 'Archived!', 'Promoter has been archived successfully.');
            } else if (type === 'delete') {
                await deletePromoter(itemId).unwrap();
                showStatus('success', 'Deleted!', 'Promoter has been permanently deleted.');
            }
        } catch (err) {
            console.error('Failed to update promoter:', err);
            showStatus('error', 'Error!', `Failed to ${type} promoter.`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleRestore = async (id) => {
        try {
            await updatePromoter({ id, archived: false }).unwrap();
            showStatus('success', 'Restored!', 'Promoter has been restored successfully.');
        } catch (err) {
            console.error('Failed to restore promoter:', err);
            showStatus('error', 'Error!', 'Failed to restore promoter.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPromoter) {
                await updatePromoter({ id: editingPromoter.id, ...formData }).unwrap();
                showStatus('success', 'Updated!', 'Promoter has been updated successfully.');
            } else {
                await createPromoter({
                    ...formData,
                    archived: false
                }).unwrap();
                showStatus('success', 'Created!', 'Promoter has been created successfully.');
            }
            closeModal();
        } catch (err) {
            console.error('Failed to save promoter:', err);
            showStatus('error', 'Error!', 'Failed to save promoter.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPromoter(null);
        setFormData({ username: '', password: '', org_id: '', assigned_scanner_type: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Promoters</h1>
                    <p className="text-text-light">Manage all promoters and their scanner assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={showArchived}
                            onChange={(e) => setShowArchived(e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Show Archived
                    </label>
                    <Select
                        placeholder="All Organizations"
                        options={orgOptions}
                        value={filterOrg}
                        onChange={(e) => setFilterOrg(e.target.value)}
                        className="w-48"
                    />
                    {filterOrg && (
                        <button
                            onClick={handleDownloadReport}
                            className="btn-secondary"
                            title="Download Promoters Report"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download Report
                        </button>
                    )}
                    <button onClick={() => setIsModalOpen(true)} className="btn-dark">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Promoter
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredPromoters}
                searchPlaceholder="Search promoters..."
            />

            {/* Form Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingPromoter ? 'Edit Promoter' : 'Add Promoter'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                    <Input
                        label="Password (Plain Text)"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                    <Select
                        label="Organization"
                        placeholder="Select organization"
                        options={orgOptions}
                        value={formData.org_id}
                        onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                        required
                    />
                    <Select
                        label="Scanner Type"
                        placeholder="Select scanner type"
                        options={scannerOptions}
                        value={formData.assigned_scanner_type}
                        onChange={(e) => setFormData({ ...formData, assigned_scanner_type: e.target.value })}
                        required
                    />

                    <p className="text-xs text-text-muted">
                        ⚠️ Password is stored in plain text for operational requirements.
                    </p>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-dark">
                            {editingPromoter ? 'Save Changes' : 'Add Promoter'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                type={confirmModal.type}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            {/* Status Modal */}
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
