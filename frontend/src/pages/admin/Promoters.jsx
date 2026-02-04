import { useState, useEffect, useContext } from 'react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/forms/Input';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import { SCANNER_TYPES } from '../../hooks/useAuthHooks';
import { generateId, getScannerTypeName } from '../../utils/helpers';
import { useGetPromotersQuery, useCreatePromoterMutation, useUpdatePromoterMutation, useDeletePromoterMutation } from '../../redux/slices/apiSlice';

export default function AdminPromoters() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // API Hooks
    // Note: useGetPromotersQuery uses headers for org context or user's org.
    // If Admin is switching orgs in context (Super Admin view?), headers might need to track it.
    // apiSlice accesses `getState().auth?.token`.
    // It does NOT automatically access `OrgContext`.
    // If the backend relies on `req.user.org_id`, then it works for Org Admins.
    // For Super Admins managing an org, we might need to pass `org_id` as param if the endpoint supports it.
    // `adminController.getPromoters` uses `req.user.org_id`.
    // If Super Admin impersonates or VIEWS an org, `req.user.org_id` might be their OWN org (null or super admin org).
    // The backend `getPromoters` enforces `org_id = req.user.org_id`.
    // This implies Super Admins cannot see promoters of other orgs with this endpoint unless they "switch" context or we update backend.
    // REQUIRED: Update backend `getPromoters` to accept `?org_id=` for Super Admins.
    // I'll assume for now we are logged in as Org Admin.
    const { data: promotersData, isLoading } = useGetPromotersQuery(undefined, {
        skip: !organization?.id
    });

    const [createPromoter] = useCreatePromoterMutation();
    const [updatePromoter] = useUpdatePromoterMutation();
    const [deletePromoter] = useDeletePromoterMutation();

    // const [promoters, setPromoters] = useState([]); // Controlled by RTK Query
    const promoters = promotersData?.data || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromoter, setEditingPromoter] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        assigned_scanner_type: '',
    });

    const scannerOptions = Object.keys(SCANNER_TYPES).map(key => ({
        value: key,
        label: getScannerTypeName(key),
    }));

    const columns = [
        {
            header: 'Username',
            accessor: 'username',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="font-medium text-dark-900">{row.username}</span>
                </div>
            ),
        },
        {
            header: 'Password',
            accessor: 'password',
            render: (row) => (
                <span className="font-mono text-sm text-text-light">{row.password ? '••••••' : 'Hidden'}</span>
            ),
        },
        {
            header: 'Scanner Type',
            render: (row) => (
                <span className="badge badge-success">
                    {getScannerTypeName(row.scanner_type || row.assigned_scanner_type)}
                </span>
            ),
        },
        {
            header: 'Actions',
            width: '100px',
            render: (row) => (
                <div className="flex gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(row);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row._id || row.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
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
            password: '', // Don't show existing password hash
            assigned_scanner_type: promoter.scanner_type || promoter.assigned_scanner_type,
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm('Are you sure you want to delete this promoter?')) {
            try {
                await deletePromoter(id).unwrap();
            } catch (err) {
                alert(err?.data?.message || 'Delete failed');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPromoter) {
                await updatePromoter({
                    id: editingPromoter._id || editingPromoter.id,
                    username: formData.username,
                    password: formData.password || undefined, // Send only if changed
                    scanner_type: formData.assigned_scanner_type
                }).unwrap();
            } else {
                await createPromoter({
                    username: formData.username,
                    password: formData.password,
                    scanner_type: formData.assigned_scanner_type
                }).unwrap();
            }
            closeModal();
        } catch (err) {
            alert(err?.data?.message || 'Operation failed');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPromoter(null);
        setFormData({ username: '', password: '', assigned_scanner_type: '' });
    };

    if (isLoading) return <div>Loading Promoters...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Promoters</h1>
                    <p className="text-text-light">Manage promoters for {organization?.name}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Add Promoter
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={promoters}
                searchPlaceholder="Search promoters..."
                emptyMessage="No promoters found for this organization"
            />

            {/* Modal */}
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
                        <button type="submit" className="btn-primary">
                            {editingPromoter ? 'Save Changes' : 'Add Promoter'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
