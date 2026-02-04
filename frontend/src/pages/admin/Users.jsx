import { useContext, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, QrCode, Download, Upload } from 'lucide-react';
import QRCodeLib from 'qrcode';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import QRCodeModal from '../../components/common/QRCodeModal';
import Input, { Select } from '../../components/forms/Input';
import { exportToExcel, USER_EXPORT_COLUMNS } from '../../utils/exportUtils';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import { useGetUsersQuery, useCreateUserMutation, useUpdateUserMutation, useDeleteUserMutation } from '../../redux/slices/apiSlice';

export default function AdminUsers() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Fetch Users
    const { data: usersData, isLoading } = useGetUsersQuery(
        // Pass org_id param if super admin viewing specific org?
        // User Controller filters by req.user.org_id for admin_org.
        // If super_admin, we might want to filter by selected org context?
        // Let's pass { org_id: organization?.id } if organization is defined.
        organization?.id && { org_id: organization.id },
        { skip: !organization }
    );

    const users = usersData?.data || [];

    // Mutations
    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();

    // Remove useEffect for mock filtering
    // useEffect(() => { ... }, [organization]); // Removed

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    // QR Code modal state
    const [qrModal, setQrModal] = useState({
        isOpen: false,
        data: '',
        userName: ''
    });

    // QR thumbnails cache
    const [qrThumbnails, setQrThumbnails] = useState({});

    // Form data
    const getEmptyFormData = () => ({
        name: '',
        gender: '',
        email: '',
        phone: '',
        password: '',
        location: '',
        passport: '',
        govt_id_number: '',
        govt_id: null,
        food_preference: '',
        food_remarks: '',
        // org_id is auto-set
        is_arrived_on_airport: false,
        is_arrived_on_bus: false,
        is_arrived_at_hotel: false,
        session_1: false,
        session_2: false,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: false,
    });

    const [formData, setFormData] = useState(getEmptyFormData());

    // Status/Confirm Modals
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'delete', title: '', message: '', itemId: null });

    // Generate QR thumbnails
    useEffect(() => {
        const generateThumbnails = async () => {
            const thumbnails = {};
            for (const user of users) {
                if (user.qr_code) {
                    try {
                        const url = await QRCodeLib.toDataURL(user.qr_code, {
                            width: 128,
                            margin: 1,
                        });
                        thumbnails[user.id] = url;
                    } catch (err) {
                        console.error('Error QR:', err);
                    }
                }
            }
            setQrThumbnails(thumbnails);
        };
        generateThumbnails();
    }, [users]);

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];

    const foodOptions = [
        { value: 'veg', label: 'Vegetarian' },
        { value: 'non-veg', label: 'Non-Vegetarian' },
    ];

    // Helper renderers
    const renderFieldValue = (value) => {
        if (value === null || value === undefined || value === '') return <span className="text-gray-400 italic">N/A</span>;
        if (typeof value === 'boolean') return value ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />;
        return <span className="text-dark-900">{String(value)}</span>;
    };

    // Booking Handlers
    const [newBooking, setNewBooking] = useState({ type: 'flight', ticket: null });

    const handleAddBooking = () => {
        if (!newBooking.ticket) {
            showStatus('error', 'Error', 'Please upload a ticket file.');
            return;
        }
        const booking = {
            id: generateId('booking'),
            type: newBooking.type,
            ticket: newBooking.ticket, // URL from createObjectURL
        };
        setFormData({ ...formData, bookings: [...formData.bookings, booking] });
        setNewBooking({ type: 'flight', ticket: null }); // Reset
    };

    const handleRemoveBooking = (bookingId) => {
        setFormData({ ...formData, bookings: formData.bookings.filter(b => b.id !== bookingId) });
    };

    const handleTicketUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setNewBooking({ ...newBooking, ticket: url });
        }
        e.target.value = ''; // Reset
    };

    const handleClearStagedTicket = () => {
        setNewBooking({ ...newBooking, ticket: null });
    };

    const handleDownloadReport = () => {
        const orgName = organization?.name || 'users';
        exportToExcel(users, `${orgName.replace(/\s+/g, '_')}_users`, USER_EXPORT_COLUMNS);
        showStatus('success', 'Report Downloaded!', `Successfully exported ${users.length} users to Excel.`);
    };

    const handleGovtIdUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setFormData({ ...formData, govt_id: url });
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            ...user,
            bookings: user.bookings || [],
            isRegistered: user.isRegistered || false,
        });
        setIsModalOpen(true);
    };

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete User?',
            message: `Are you sure you want to permanently delete "${name}"?`,
            itemId: id
        });
    };

    const handleConfirmAction = async () => {
        try {
            await deleteUser(confirmModal.itemId).unwrap();
            showStatus('success', 'Deleted!', 'User has been deleted.');
        } catch (err) {
            showStatus('error', 'Error', err?.data?.message || 'Delete failed');
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const identifier = formData.email || formData.phone;

        // For new users, validate identifier
        if (!identifier && !editingUser) {
            showStatus('error', 'Error!', 'Please provide either email or phone number for QR code generation.');
            return;
        }

        try {
            if (editingUser) {
                await updateUser({
                    id: editingUser.id,
                    ...formData,
                    // If backend expects specific structure, ensure formData matches.
                    // Note: File uploads (blob URLs) won't persist. 
                    // Should warn or handle differently in future.
                }).unwrap();
                showStatus('success', 'Updated!', 'User updated successfully.');
            } else {
                // Auto-generate password from org slug
                const autoPassword = organization?.slug || 'event2024';
                const newUser = {
                    ...formData,
                    password: autoPassword,
                    org_id: organization.id,
                    qr_code: identifier, // Initial QR data
                };
                await createUser(newUser).unwrap();
                showStatus('success', 'Created!', `User created successfully. Password: ${autoPassword}`);
            }
            closeModal();
        } catch (err) {
            showStatus('error', 'Error', err?.data?.message || 'Operation failed');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData(getEmptyFormData());
    };

    const columns = [
        {
            header: 'QR',
            width: '100px',
            render: (row) => (
                <div className="flex items-center justify-center p-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setQrModal({ isOpen: true, data: row.qr_code, userName: row.name });
                        }}
                        className="flex-shrink-0 w-[60px] h-[60px] p-1 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all bg-white group flex items-center justify-center"
                    >
                        {qrThumbnails[row.id] ? (
                            <img src={qrThumbnails[row.id]} alt="QR" className="w-full h-full object-contain group-hover:scale-105 transition-transform" style={{ imageRendering: 'pixelated' }} />
                        ) : (
                            <QrCode className="w-8 h-8 text-gray-400" />
                        )}
                    </button>
                </div>
            )
        },
        {
            header: 'User',
            accessor: 'name',
            render: (row) => (
                <div>
                    <p className="font-medium text-dark-900">{row.name}</p>
                    <p className="text-xs text-text-light">{row.email || row.phone || 'No contact'}</p>
                </div>
            )
        },
        { header: 'Location', render: (row) => renderFieldValue(row.location) },
        { header: 'Phone', render: (row) => row.phone ? <span className="text-sm">{row.phone}</span> : <span className="text-gray-400 italic">N/A</span> },
        { header: 'Password', render: (row) => row.password ? <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{row.password}</span> : <span className="text-gray-400 italic">N/A</span> },
        {
            header: 'Food',
            render: (row) => row.food_preference ? <span className={`badge ${row.food_preference === 'veg' ? 'badge-success' : 'badge-warning'}`}>{row.food_preference}</span> : <span className="text-gray-400 italic">N/A</span>
        },
        {
            header: 'Arrivals',
            render: (row) => (
                <div className="flex gap-1">
                    <div className="flex items-center gap-1" title="Airport">
                        <span className="text-xs text-gray-500">✈️</span>
                        {row.is_arrived_on_airport ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex items-center gap-1" title="Bus">
                        <span className="text-xs text-gray-500">🚌</span>
                        {row.is_arrived_on_bus ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex items-center gap-1" title="Hotel">
                        <span className="text-xs text-gray-500">🏨</span>
                        {row.is_arrived_at_hotel ? <CheckCircle className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                </div>
            )
        },
        {
            header: 'Registered',
            width: '90px',
            render: (row) => (
                <div className="flex justify-center">
                    {row.isRegistered
                        ? <span className="badge badge-success">Yes</span>
                        : <span className="badge badge-gray">No</span>}
                </div>
            )
        },
        {
            header: 'Actions',
            width: '140px',
            render: (row) => (
                <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); handleViewDetails(row); }} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleEdit(row); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(row.id, row.name); }} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Users</h1>
                    <p className="text-text-light">Manage users for {organization?.name}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadReport} className="btn-secondary">
                        <Download className="w-5 h-5 mr-2" /> Download Report
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="btn-dark" style={{ backgroundColor: organization?.button_color }}>
                        <Plus className="w-5 h-5 mr-2" /> Add User
                    </button>
                </div>
            </div>

            <DataTable columns={columns} data={users} searchPlaceholder="Search users..." pageSize={10} />

            {/* Edit/Add Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? 'Edit User' : 'Add User'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Profile Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                            <Select label="Gender" options={genderOptions} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} />
                            <Input label="Email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            <Input label="Phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                            {editingUser && (
                                <Input label="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter new password" />
                            )}
                            <Input label="Location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                        </div>
                        {!editingUser && (
                            <p className="mt-2 text-xs text-gray-500">* Password will be auto-generated from organization slug ({organization?.slug || 'event2024'}). QR code uses email (preferred) or phone.</p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Identity & Documents</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Passport Number" value={formData.passport} onChange={(e) => setFormData({ ...formData, passport: e.target.value })} />
                            <Input label="Government ID Number" value={formData.govt_id_number} onChange={(e) => setFormData({ ...formData, govt_id_number: e.target.value })} />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Government ID Document</label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">{formData.govt_id ? 'Change Document' : 'Upload Document'}</span>
                                    <input type="file" accept="image/*,.pdf" onChange={handleGovtIdUpload} className="hidden" />
                                </label>
                                {formData.govt_id && (
                                    <div className="flex items-center gap-2">
                                        <img src={formData.govt_id} alt="ID Preview" className="w-12 h-12 object-cover rounded border" />
                                        <button type="button" onClick={() => setFormData({ ...formData, govt_id: null })} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Food Preferences</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Food Preference" options={foodOptions} value={formData.food_preference} onChange={(e) => setFormData({ ...formData, food_preference: e.target.value })} />
                            <Input label="Food Remarks" value={formData.food_remarks} onChange={(e) => setFormData({ ...formData, food_remarks: e.target.value })} />
                        </div>
                    </div>

                    {editingUser && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Arrival & Sessions</h4>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {['is_arrived_on_airport', 'is_arrived_on_bus', 'is_arrived_at_hotel'].map(key => (
                                    <label key={key} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input type="checkbox" checked={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })} className="rounded" />
                                        <span className="text-sm text-capitalize">{key.replace('is_arrived_', '').replace(/_/g, ' ')}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <label key={num} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input type="checkbox" checked={formData[`session_${num}`]} onChange={(e) => setFormData({ ...formData, [`session_${num}`]: e.target.checked })} className="rounded" />
                                        <span className="text-xs">S{num}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Registration Status (shown for both Add and Edit) */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Registration Status</h4>
                        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={formData.isRegistered}
                                onChange={(e) => setFormData({ ...formData, isRegistered: e.target.checked })}
                                className="rounded w-5 h-5"
                            />
                            <div>
                                <span className="text-sm font-medium">Registered</span>
                                <p className="text-xs text-gray-500">Mark user as registered (email confirmed)</p>
                            </div>
                        </label>
                    </div>

                    {/* Bookings Management */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Bookings</h4>

                        {/* List Existing Bookings */}
                        {formData.bookings.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                {formData.bookings.map((booking, index) => (
                                    <div key={booking.id || index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded text-blue-600 capitalize">
                                                {booking.type === 'flight' && '✈️'}
                                                {booking.type === 'train' && '🚆'}
                                                {booking.type === 'bus' && '🚌'}
                                                {booking.type === 'cab' && '🚖'}
                                                {booking.type === 'hotel' && '🏨'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium capitalize">{booking.type} Booking</p>
                                                {booking.ticket && (
                                                    <a href={booking.ticket} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                                                        View Ticket
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveBooking(booking.id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Remove Booking"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add New Booking */}
                        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50/50">
                            <p className="text-sm font-medium text-gray-700 mb-3">Add New Booking</p>
                            <div className="grid grid-cols-[1fr,1fr,auto] gap-3 items-end">
                                <Select
                                    label="Type"
                                    options={[
                                        { value: 'flight', label: 'Flight' },
                                        { value: 'train', label: 'Train' },
                                        { value: 'bus', label: 'Bus' },
                                        { value: 'cab', label: 'Cab' },
                                        { value: 'hotel', label: 'Hotel' },
                                    ]}
                                    value={newBooking.type}
                                    onChange={(e) => setNewBooking({ ...newBooking, type: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket File</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={handleTicketUpload}
                                            className="hidden"
                                            id="booking-ticket-upload"
                                        />
                                        <div className="flex gap-2">
                                            <label
                                                htmlFor="booking-ticket-upload"
                                                className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-md bg-white cursor-pointer hover:border-primary-500 text-sm overflow-hidden"
                                            >
                                                <Upload className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                <span className="truncate text-gray-600">
                                                    {newBooking.ticket ? 'File Selected' : 'Upload Ticket'}
                                                </span>
                                            </label>
                                            {newBooking.ticket && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearStagedTicket}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                    title="Clear Selection"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAddBooking}
                                    className="btn-dark"
                                    style={{ backgroundColor: organization?.button_color }}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-dark" style={{ backgroundColor: organization?.button_color }}>{editingUser ? 'Save Changes' : 'Add User'}</button>
                    </div>
                </form>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="User Details" size="lg">
                {selectedUser && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {USER_FIELDS.configurable.map(field => (
                                <div key={field.key} className="p-3 border rounded-lg">
                                    <p className="text-xs text-text-light mb-1">{field.label}</p>
                                    <div className="font-medium">
                                        {field.key === 'govt_id' && selectedUser[field.key] ? (
                                            <img src={selectedUser[field.key]} alt="Govt ID" className="w-20 h-14 object-cover rounded border cursor-pointer hover:opacity-80" onClick={() => window.open(selectedUser[field.key], '_blank')} />
                                        ) : renderFieldValue(selectedUser[field.key])}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">System Information</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {USER_FIELDS.system.map(field => (
                                    <div key={field.key} className="p-3 border rounded-lg">
                                        <p className="text-xs text-text-light mb-1">{field.label}</p>
                                        <div className="font-medium">{renderFieldValue(selectedUser[field.key])}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <QRCodeModal isOpen={qrModal.isOpen} onClose={() => setQrModal({ ...qrModal, isOpen: false })} data={qrModal.data} userName={qrModal.userName} />
            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={handleConfirmAction} type={confirmModal.type} title={confirmModal.title} message={confirmModal.message} />
            <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} type={statusModal.type} title={statusModal.title} message={statusModal.message} />
        </div>
    );
}
