import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Palette, ExternalLink, Link as LinkIcon, Archive, RotateCcw, Upload, ImageIcon } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import Input from '../../components/forms/Input';
import { mockOrganizations } from '../../utils/mockData';
import { generateId } from '../../utils/helpers';


export default function Organizations() {
    const navigate = useNavigate();
    const [organizations, setOrganizations] = useState(mockOrganizations.map(org => ({ ...org, archived: org.archived || false })));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [showArchived, setShowArchived] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        logo: '',
        header_color: '#1A1A1A',
        footer_color: '#1A1A1A',
        button_color: '#3B82F6',
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
                            style={{ backgroundColor: row.button_color }}
                        >
                            {row.name.charAt(0)}
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
                        <p className="text-xs text-text-light">{row.id}</p>
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
            header: 'Theme Colors',
            render: (row) => (
                <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: row.header_color }}
                        />
                        <span className="text-xs text-text-light">Header</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: row.button_color }}
                        />
                        <span className="text-xs text-text-light">Button</span>
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
                                    openArchiveConfirm(row.id, row.name);
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
                            openDeleteConfirm(row.id, row.name);
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

    const handleEdit = (org) => {
        setEditingOrg(org);
        setFormData({
            name: org.name,
            slug: org.slug || '',
            logo: org.logo || '',
            header_color: org.header_color,
            footer_color: org.footer_color,
            button_color: org.button_color,
        });
        setIsModalOpen(true);
    };

    const openArchiveConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'archive',
            title: 'Archive Organization?',
            message: `Are you sure you want to archive "${name}"? You can restore it later.`,
            itemId: id
        });
    };

    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete Organization?',
            message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
            itemId: id
        });
    };

    const handleConfirmAction = () => {
        const { type, itemId } = confirmModal;
        try {
            if (type === 'archive') {
                setOrganizations(organizations.map(org =>
                    org.id === itemId ? { ...org, archived: true } : org
                ));
                showStatus('success', 'Archived!', 'Organization has been archived successfully.');
            } else if (type === 'delete') {
                setOrganizations(organizations.filter(org => org.id !== itemId));
                showStatus('success', 'Deleted!', 'Organization has been permanently deleted.');
            }
        } catch {
            showStatus('error', 'Error!', `Failed to ${type} organization.`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleRestore = (id) => {
        try {
            setOrganizations(organizations.map(org =>
                org.id === id ? { ...org, archived: false } : org
            ));
            showStatus('success', 'Restored!', 'Organization has been restored successfully.');
        } catch {
            showStatus('error', 'Error!', 'Failed to restore organization.');
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                setOrganizations(organizations.map(org =>
                    org.id === editingOrg.id ? { ...org, ...formData } : org
                ));
                showStatus('success', 'Updated!', 'Organization has been updated successfully.');
            } else {
                const newOrg = {
                    id: generateId('org'),
                    logo: '',
                    archived: false,
                    ...formData,
                };
                setOrganizations([...organizations, newOrg]);
                showStatus('success', 'Created!', 'Organization has been created successfully.');
            }
            closeModal();
        } catch {
            showStatus('error', 'Error!', 'Failed to save organization.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOrg(null);
        setFormData({
            name: '',
            slug: '',
            logo: '',
            header_color: '#1A1A1A',
            footer_color: '#1A1A1A',
            button_color: '#3B82F6',
        });
    };

    const filteredOrganizations = showArchived
        ? organizations
        : organizations.filter(org => !org.archived);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Organizations</h1>
                    <p className="text-text-light">Manage all organizations and their branding</p>
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
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-dark"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Organization
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredOrganizations}
                searchPlaceholder="Search organizations..."
            />

            {/* Form Modal */}
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

                    {/* Logo Upload */}
                    <div>
                        <label className="form-label flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" /> Organization Logo
                        </label>
                        <div className="flex items-start gap-4">
                            {/* Logo Preview */}
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                                {formData.logo ? (
                                    <img
                                        src={formData.logo}
                                        alt="Logo preview"
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <ImageIcon className="w-10 h-10 text-gray-400" />
                                )}
                            </div>
                            {/* Upload Options */}
                            <div className="flex-1 space-y-3">
                                {/* URL Input */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Enter URL</label>
                                    <Input
                                        placeholder="https://example.com/logo.png or /logos/org.png"
                                        value={formData.logo}
                                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-400">OR</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Upload Image</label>
                                    <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                                        <Upload className="w-5 h-5 text-gray-500" />
                                        <span className="text-sm text-gray-600">Choose file</span>
                                        <input
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/avif"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, logo: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG (max 2MB)</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="form-label flex items-center gap-1">
                                <Palette className="w-4 h-4" /> Header Color
                            </label>
                            <input
                                type="color"
                                value={formData.header_color}
                                onChange={(e) => setFormData({ ...formData, header_color: e.target.value })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1">
                                <Palette className="w-4 h-4" /> Footer Color
                            </label>
                            <input
                                type="color"
                                value={formData.footer_color}
                                onChange={(e) => setFormData({ ...formData, footer_color: e.target.value })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                        <div>
                            <label className="form-label flex items-center gap-1">
                                <Palette className="w-4 h-4" /> Button Color
                            </label>
                            <input
                                type="color"
                                value={formData.button_color}
                                onChange={(e) => setFormData({ ...formData, button_color: e.target.value })}
                                className="w-full h-10 rounded-lg cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-4 rounded-lg border">
                        <p className="text-sm text-text-light mb-2">Preview:</p>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-8 rounded"
                                style={{ backgroundColor: formData.header_color }}
                            />
                            <button
                                type="button"
                                className="px-3 py-1 rounded text-white text-sm"
                                style={{ backgroundColor: formData.button_color }}
                            >
                                Sample Button
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-dark">
                            {editingOrg ? 'Save Changes' : 'Add Organization'}
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
