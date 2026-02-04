import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Palette, ExternalLink, Link as LinkIcon, Archive, RotateCcw, Upload, ImageIcon } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Input from '../../components/forms/Input';
import { generateId } from '../../utils/helpers';
import {
    useGetOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useDeleteOrganizationMutation
} from '../../redux/slices/apiSlice';

export default function Organizations() {
    const navigate = useNavigate();

    // API Hooks
    const { data: orgsData, isLoading } = useGetOrganizationsQuery();
    const [createOrganization] = useCreateOrganizationMutation();
    const [updateOrganization] = useUpdateOrganizationMutation();
    const [deleteOrganization] = useDeleteOrganizationMutation();

    const organizations = orgsData?.data || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo: '',
        colors: {
            header: '#1A1A1A',
            footer: '#1A1A1A',
            button: '#3B82F6'
        }
    });

    // Modals
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'delete', title: '', message: '', itemId: null });

    const showStatus = (type, title, message) => setStatusModal({ isOpen: true, type, title, message });

    const handleOrgClick = (org) => {
        navigate(`/superadmin/manage/${org.slug}`);
    };

    const columns = [
        {
            header: 'Logo',
            render: (row) => (
                <div className={`${row.archived ? 'opacity-50' : ''}`}>
                    {row.logo ? (
                        <img
                            src={row.logo}
                            alt={`${row.name} logo`}
                            className="w-12 h-12 rounded-lg object-contain bg-gray-100 border border-gray-200"
                        />
                    ) : (
                        <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                            style={{ backgroundColor: row.colors?.button || '#3B82F6' }}
                        >
                            {row.name?.charAt(0)}
                        </div>
                    )}
                </div>
            ),
        },
        {
            header: 'Organization',
            accessor: 'name',
            render: (row) => (
                <div
                    className={`flex items-center gap-3 cursor-pointer group ${row.archived ? 'opacity-50' : ''}`}
                    onClick={() => !row.archived && handleOrgClick(row)}
                >
                    <div>
                        <p className="font-medium text-dark-900 group-hover:text-primary-600 transition-colors flex items-center gap-1">
                            {row.name}
                            {row.archived && <span className="badge badge-gray ml-2">Archived</span>}
                            {!row.archived && <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </p>
                        <p className="text-xs text-text-light">{row._id || row.id}</p>
                    </div>
                </div>
            ),
        },
        {
            header: 'URL Slug',
            accessor: 'slug',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-gray-400" />
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">/{row.slug}/</code>
                </div>
            ),
        },
        {
            header: 'Admin Login',
            render: (row) => (
                <div className="text-sm">
                    {row.admin ? (
                        <div className="space-y-1">
                            <p className="flex items-center gap-1 text-gray-700">
                                <span className="font-medium text-xs w-16">Username:</span>
                                <span>{row.admin.username}</span>
                            </p>
                            <p className="flex items-center gap-1 text-gray-700">
                                <span className="font-medium text-xs w-16">Password:</span>
                                <span className="font-mono bg-gray-50 px-1 rounded">{row.admin.password}</span>
                            </p>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">No admin assigned</span>
                    )}
                </div>
            ),
        },
        {
            header: 'Theme Colors',
            render: (row) => (
                <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: row.colors?.header || '#1A1A1A' }}
                            title="Header"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: row.colors?.footer || '#1A1A1A' }}
                            title="Footer"
                        />
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: row.colors?.button || '#3B82F6' }}
                            title="Button"
                        />
                    </div>
                </div>
            ),
        },
        {
            header: 'Actions',
            width: '180px',
            render: (row) => (
                <div className="flex gap-1">
                    {!row.archived && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
                                title="Edit"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); openDeleteConfirm(row._id || row.id, row.name); }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                        title="Permanently Delete"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ),
        },
    ];

    const handleEdit = (org) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            slug: org.slug || '',
            logo: org.logo || '',
            colors: {
                header: org.colors?.header || '#1A1A1A',
                footer: org.colors?.footer || '#1A1A1A',
                button: org.colors?.button || '#3B82F6'
            }
        });
        setIsModalOpen(true);
    };

    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Organization?',
            message: `Are you sure you want to permanently delete "${name}"? This will also delete the associated Admin account.`,
            itemId: id
        });
    };

    const handleConfirmAction = async () => {
        const { type, itemId } = confirmModal;
        try {
            if (type === 'delete') {
                await deleteOrganization(itemId).unwrap();
                showStatus('success', 'Deleted!', 'Organization has been permanently deleted.');
            }
        } catch (err) {
            showStatus('error', 'Error!', err?.data?.message || `Failed to ${type} organization.`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                await updateOrganization({
                    id: editingOrg._id || editingOrg.id,
                    ...formData
                }).unwrap();
                showStatus('success', 'Updated!', 'Organization has been updated successfully.');
            } else {
                const res = await createOrganization(formData).unwrap();
                // We typically need to create an Admin after creating Org, but user just asked for Org Page updates.
                // Normally we'd prompt for Admin creation or auto-generate.
                // For now, keeping as is.
                showStatus('success', 'Created!', 'Organization has been created successfully.');
            }
            closeModal();
        } catch (err) {
            showStatus('error', 'Error!', err?.data?.message || 'Failed to save organization.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOrg(null);
        setFormData({
            name: '',
            slug: '',
            logo: '',
            colors: {
                header: '#1A1A1A',
                footer: '#1A1A1A',
                button: '#3B82F6'
            }
        });
    };

    const filteredOrganizations = showArchived
        ? organizations
        : organizations.filter(org => !org.archived);

    if (isLoading) return <div>Loading organizations...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Organizations</h1>
                    <p className="text-text-light">Manage all organizations and their branding</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsModalOpen(true)} className="btn-dark">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Organization
                    </button>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredOrganizations}
                searchPlaceholder="Search organizations..."
                emptyMessage="No organizations found."
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingOrg ? 'Edit Organization' : 'Add Organization'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Organization Name"
                        placeholder="Enter organization name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />

                    <Input
                        label="URL Slug"
                        placeholder="e.g., travel-adventures"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                        required
                    />
                    <p className="text-xs text-gray-500 -mt-2">Public pages will be available at: /{formData.slug || 'your-slug'}/</p>

                    <div>
                        <label className="form-label flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" /> Organization Logo
                        </label>
                        <div className="flex items-start gap-4">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                                {formData.logo ? (
                                    <img src={formData.logo} alt="Logo preview" className="w-full h-full object-contain" />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Enter URL</label>
                                    <Input
                                        placeholder="https://example.com/logo.png"
                                        value={formData.logo}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400">OR</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Upload Image</label>
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">Choose file</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => setFormData({ ...formData, logo: reader.result });
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="form-label flex items-center gap-1"><Palette className="w-4 h-4" /> Header Color</label>
                            <input
                                type="color"
                                value={formData.colors.header}
                                onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, header: e.target.value } })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1"><Palette className="w-4 h-4" /> Footer Color</label>
                            <input
                                type="color"
                                value={formData.colors.footer}
                                onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, footer: e.target.value } })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1"><Palette className="w-4 h-4" /> Button Color</label>
                            <input
                                type="color"
                                value={formData.colors.button}
                                onChange={(e) => setFormData({ ...formData, colors: { ...formData.colors, button: e.target.value } })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-dark">{editingOrg ? 'Save Changes' : 'Add Organization'}</button>
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
