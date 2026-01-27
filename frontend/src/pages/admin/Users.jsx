import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, QrCode, CheckCircle, XCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/forms/Input';
import { useAuth } from '../../context/AuthContext';
import { mockUsers } from '../../utils/mockData';
import { generateId } from '../../utils/helpers';

export default function AdminUsers() {
    const { organization } = useAuth();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    useEffect(() => {
        // Filter users by organization
        setUsers(mockUsers.filter(u => u.org_id === organization?.id));
    }, [organization]);

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
                    ? <span className="badge badge-success">Arrived</span>
                    : <span className="badge badge-gray">Pending</span>
            ),
        },
        {
            header: 'Sessions',
            render: (row) => {
                const attendedCount = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => row[`session_${n}_status`]).length;
                return <span className="font-medium">{attendedCount}/9</span>;
            },
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
                org_id: organization?.id,
                qr_code_data: `QR-${organization?.id}-${Date.now()}`,
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
        setFormData({ name: '', email: '' });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Users</h1>
                    <p className="text-text-light">Manage users for {organization?.name}</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Add User
                </button>
            </div>

            {/* Table */}
            <DataTable
                columns={columns}
                data={users}
                searchPlaceholder="Search users..."
                emptyMessage="No users found for this organization"
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
