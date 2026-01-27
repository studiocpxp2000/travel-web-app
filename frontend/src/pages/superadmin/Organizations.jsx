import { useState } from 'react';
import { Plus, Edit2, Trash2, Palette } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import { mockOrganizations } from '../../utils/mockData';
import { generateId } from '../../utils/helpers';

export default function Organizations() {
    const [organizations, setOrganizations] = useState(mockOrganizations);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        header_color: '#1A1A1A',
        footer_color: '#1A1A1A',
        button_color: '#3B82F6',
    });

    const columns = [
        {
            header: 'Organization',
            accessor: 'name',
            render: (row) => (
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: row.button_color }}
                    >
                        {row.name.charAt(0)}
                    </div>
                    <div>
                        <p className="font-medium text-dark-900">{row.name}</p>
                        <p className="text-xs text-text-light">{row.id}</p>
                    </div>
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
            width: '120px',
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
                            handleDelete(row.id);
                        }}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-600"
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
            header_color: org.header_color,
            footer_color: org.footer_color,
            button_color: org.button_color,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this organization?')) {
            setOrganizations(organizations.filter(org => org.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingOrg) {
            setOrganizations(organizations.map(org =>
                org.id === editingOrg.id ? { ...org, ...formData } : org
            ));
        } else {
            const newOrg = {
                id: generateId('org'),
                logo: '',
                ...formData,
            };
            setOrganizations([...organizations, newOrg]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingOrg(null);
        setFormData({
            name: '',
            header_color: '#1A1A1A',
            footer_color: '#1A1A1A',
            button_color: '#3B82F6',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Organizations</h1>
                    <p className="text-text-light">Manage all organizations and their branding</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Organization
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={organizations}
                searchPlaceholder="Search organizations..."
            />

            {/* Modal */}
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
                        <button type="submit" className="btn-primary">
                            {editingOrg ? 'Save Changes' : 'Add Organization'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
