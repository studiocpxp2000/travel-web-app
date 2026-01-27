import { useState } from 'react';
import { Plus, Edit2, Trash2, QrCode, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input, { Select } from '../../components/forms/Input';
import { mockUsers, mockOrganizations } from '../../utils/mockData';
import { generateId } from '../../utils/helpers';

export default function SuperAdminUsers() {
    const [users, setUsers] = useState(mockUsers);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [filterOrg, setFilterOrg] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        org_id: '',
    });

    const orgOptions = mockOrganizations.map(org => ({
        value: org.id,
        label: org.name,
    }));

    const filteredUsers = filterOrg
        ? users.filter(u => u.org_id === filterOrg)
        : users;

    const columns = [
        {
            header: 'User',
            accessor: 'name',
            render: (row) => (
                <div>
                    <p className="font-medium text-dark-900">{row.name}</p>
                    <p className="text-xs text-text-light">{row.email}</p>
                </div>
            ),
        },
        {
            header: 'Organization',
            render: (row) => {
                const org = mockOrganizations.find(o => o.id === row.org_id);
                return (
                    <span className="badge badge-info">{org?.name || 'Unknown'}</span>
                );
            },
        },
        {
            header: 'QR Code',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-mono text-text-light">{row.qr_code_data}</span>
                </div>
            ),
        },
        {
            header: 'Arrival',
            render: (row) => (
                row.arrival_status
                    ? <CheckCircle className="w-5 h-5 text-green-500" />
                    : <XCircle className="w-5 h-5 text-gray-300" />
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

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            org_id: user.org_id,
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this user?')) {
            setUsers(users.filter(u => u.id !== id));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            setUsers(users.map(u =>
                u.id === editingUser.id ? { ...u, ...formData } : u
            ));
        } else {
            const newUser = {
                id: generateId('user'),
                qr_code_data: `QR-${formData.org_id}-${Date.now()}`,
                arrival_status: false,
                session_1_status: false,
                session_2_status: false,
                session_3_status: false,
                session_4_status: false,
                session_5_status: false,
                session_6_status: false,
                session_7_status: false,
                session_8_status: false,
                session_9_status: false,
                ...formData,
            };
            setUsers([...users, newUser]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', org_id: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Users</h1>
                    <p className="text-text-light">Manage all users across organizations</p>
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
                        Add User
                    </button>
                </div>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={filteredUsers}
                searchPlaceholder="Search users..."
            />

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingUser ? 'Edit User' : 'Add User'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="Enter user name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Email"
                        type="email"
                        placeholder="Enter email address"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {editingUser ? 'Save Changes' : 'Add User'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
