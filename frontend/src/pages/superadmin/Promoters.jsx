import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/forms/Input';
import { mockPromoters, mockOrganizations } from '../../utils/mockData';
import { SCANNER_TYPES } from '../../context/AuthContext';
import { generateId, getScannerTypeName } from '../../utils/helpers';

export default function SuperAdminPromoters() {
    const [promoters, setPromoters] = useState(mockPromoters);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromoter, setEditingPromoter] = useState(null);
    const [filterOrg, setFilterOrg] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        org_id: '',
        assigned_scanner_type: '',
    });

    const orgOptions = mockOrganizations.map(org => ({
        value: org.id,
        label: org.name,
    }));

    const scannerOptions = Object.keys(SCANNER_TYPES).map(key => ({
        value: key,
        label: getScannerTypeName(key),
    }));

    const filteredPromoters = filterOrg
        ? promoters.filter(p => p.org_id === filterOrg)
        : promoters;

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
                <span className="font-mono text-sm text-text-light">{row.password}</span>
            ),
        },
        {
            header: 'Organization',
            render: (row) => {
                const org = mockOrganizations.find(o => o.id === row.org_id);
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

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this promoter?')) {
            setPromoters(promoters.filter(p => p.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPromoter) {
            setPromoters(promoters.map(p =>
                p.id === editingPromoter.id ? { ...p, ...formData } : p
            ));
        } else {
            const newPromoter = {
                id: generateId('promo'),
                ...formData,
            };
            setPromoters([...promoters, newPromoter]);
        }
        closeModal();
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
                <div className="flex gap-3">
                    <Select
                        placeholder="All Organizations"
                        options={orgOptions}
                        value={filterOrg}
                        onChange={(e) => setFilterOrg(e.target.value)}
                        className="w-48"
                    />
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
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
                        <button type="submit" className="btn-primary">
                            {editingPromoter ? 'Save Changes' : 'Add Promoter'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
