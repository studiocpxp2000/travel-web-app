import { useContext, useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, QrCode, Download, Upload, RefreshCw, X, Loader2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import QRCodeModal from '../../components/common/QRCodeModal';
import Input, { Select } from '../../components/forms/Input';
import { exportToExcel, USER_EXPORT_COLUMNS } from '../../utils/exportUtils';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import {
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    useGenerateMissingQRCodesMutation,
    useUploadGovtIdMutation,
    useAddBookingMutation,
    useDeleteBookingMutation
} from '../../redux/slices/apiSlice';

// User fields configuration for detail view
const USER_FIELDS = {
    configurable: [
        { key: 'name', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'gender', label: 'Gender' },
        { key: 'location', label: 'Location' },
        { key: 'password', label: 'Password' },
        { key: 'food_preference', label: 'Food Preference' },
        { key: 'food_remarks', label: 'Food Remarks' },
        { key: 'passport_number', label: 'Passport Number' },
        { key: 'govt_id_number', label: 'Govt ID Number' },
        { key: 'govt_id_url', label: 'Govt ID Document' },
    ],
    system: [
        { key: 'isRegistered', label: 'Registered' },
        { key: 'createdAt', label: 'Created At' },
        { key: 'updatedAt', label: 'Updated At' },
    ]
};

export default function AdminUsers() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // Fetch Users - API uses req.user.org_id from token for admin_org role
    const { data: usersData, isLoading, refetch } = useGetUsersQuery(undefined, {
        refetchOnMountOrArgChange: true
    });

    const users = usersData?.data || [];

    // Mutations
    const [createUser] = useCreateUserMutation();
    const [updateUser] = useUpdateUserMutation();
    const [deleteUser] = useDeleteUserMutation();
    const [generateMissingQR, { isLoading: isGeneratingQR }] = useGenerateMissingQRCodesMutation();
    const [uploadGovtId, { isLoading: isUploadingGovtId }] = useUploadGovtIdMutation();
    const [addBooking, { isLoading: isAddingBooking }] = useAddBookingMutation();
    const [deleteBookingMutation] = useDeleteBookingMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    // QR Code modal state - now uses S3 URL
    const [qrModal, setQrModal] = useState({
        isOpen: false,
        qrUrl: '',
        email: '',
        userName: '',
        userId: null
    });

    // Form data
    const getEmptyFormData = () => ({
        name: '',
        gender: 'male', // Default to first option so it matches visual state
        email: '',
        phone: '',
        password: '',
        location: '',
        passport: '',
        govt_id_number: '',
        govt_id: null,
        food_preference: 'veg', // Default to first option so it matches visual state
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
        session_9: false,
        bookings: [],
        isRegistered: false,
    });

    const [formData, setFormData] = useState(getEmptyFormData());

    // Status/Confirm Modals
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: 'delete', title: '', message: '', itemId: null });

    // Generate missing QR codes handler
    const handleGenerateMissingQR = async () => {
        try {
            const result = await generateMissingQR().unwrap();
            showStatus('success', 'QR Codes Generated', `Generated ${result.generated} QR codes for users.`);
            refetch();
        } catch (err) {
            showStatus('error', 'Error', err?.data?.message || 'Failed to generate QR codes');
        }
    };

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

    const handleGovtIdUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (editingUser?._id) {
            // Editing existing user - upload immediately to S3
            try {
                const result = await uploadGovtId({ userId: editingUser._id, file }).unwrap();
                setFormData({ ...formData, govt_id_url: result.data.govt_id_url });
                showStatus('success', 'Uploaded!', 'Government ID uploaded successfully.');
            } catch (err) {
                console.error('Govt ID upload error:', err);
                showStatus('error', 'Upload Failed', err?.data?.message || 'Failed to upload government ID');
            }
        } else {
            // New user - store file for upload after creation
            setFormData({ ...formData, govt_id_file: file, govt_id_preview: URL.createObjectURL(file) });
        }
        e.target.value = '';
    };

    // Booking upload handler - uploads to S3 immediately when editing
    const handleBookingUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (editingUser?._id) {
            // Editing existing user - upload immediately
            try {
                const result = await addBooking({
                    userId: editingUser._id,
                    file,
                    type: newBooking.type
                }).unwrap();

                // Update formData.bookings with the new booking
                const newBookingData = result.data;
                setFormData(prev => ({
                    ...prev,
                    bookings: [...(prev.bookings || []), newBookingData]
                }));

                // Also update editingUser for consistency
                setEditingUser(prev => ({
                    ...prev,
                    bookings: [...(prev.bookings || []), newBookingData]
                }));

                setNewBooking({ type: 'flight', ticket: null });
                showStatus('success', 'Uploaded!', 'Booking document uploaded successfully.');
            } catch (err) {
                console.error('Booking upload error:', err);
                showStatus('error', 'Upload Failed', err?.data?.message || 'Failed to upload booking');
            }
        } else {
            // New user - store file for later
            const stagedBooking = {
                id: `temp-${Date.now()}`,
                type: newBooking.type,
                file: file,
                filename: file.name,
                preview: URL.createObjectURL(file)
            };
            setFormData({ ...formData, stagedBookings: [...(formData.stagedBookings || []), stagedBooking] });
            setNewBooking({ type: 'flight', ticket: null });
        }
        e.target.value = '';
    };

    // Delete booking handler
    const handleDeleteBooking = async (bookingId) => {
        if (!editingUser?._id) {
            // Remove from staged bookings for new user
            setFormData({
                ...formData,
                stagedBookings: (formData.stagedBookings || []).filter(b => b.id !== bookingId)
            });
            return;
        }

        try {
            await deleteBookingMutation({ userId: editingUser._id, bookingId }).unwrap();

            // Update formData.bookings by removing the deleted booking
            setFormData(prev => ({
                ...prev,
                bookings: (prev.bookings || []).filter(b => b._id !== bookingId)
            }));

            // Also update editingUser for consistency
            setEditingUser(prev => ({
                ...prev,
                bookings: (prev.bookings || []).filter(b => b._id !== bookingId)
            }));

            showStatus('success', 'Deleted!', 'Booking removed successfully.');
        } catch (err) {
            console.error('Delete booking error:', err);
            showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete booking');
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
                    id: editingUser._id,
                    ...formData,
                    // If backend expects specific structure, ensure formData matches.
                    // Note: File uploads (blob URLs) won't persist. 
                    // Should warn or handle differently in future.
                }).unwrap();
                showStatus('success', 'Updated!', 'User updated successfully.');
            } else {
                // Auto-generate password from org slug
                const autoPassword = organization?.slug || 'event2024';
                // Exclude _id, id and other system fields from formData for new user
                const { _id, id, createdAt, updatedAt, qr_code_url, bookings, stagedBookings, govt_id_file, govt_id_preview, ...cleanFormData } = formData;
                const newUser = {
                    ...cleanFormData,
                    password: autoPassword,
                    // org_id is optional - backend uses req.user.org_id for admin_org role
                    ...(organization && { org_id: organization._id || organization.id }),
                };

                const result = await createUser(newUser).unwrap();
                const newUserId = result.data._id;

                // 1. Upload Staged Govt ID if exists
                if (formData.govt_id_file) {
                    try {
                        await uploadGovtId({ userId: newUserId, file: formData.govt_id_file }).unwrap();
                    } catch (uploadErr) {
                        console.error('Failed to upload govt ID for new user:', uploadErr);
                        showStatus('warning', 'Partial Success', 'User created but Government ID upload failed.');
                    }
                }

                // 2. Upload Staged Bookings if exist
                if (formData.stagedBookings && formData.stagedBookings.length > 0) {
                    let uploadedCount = 0;
                    for (const booking of formData.stagedBookings) {
                        try {
                            await addBooking({
                                userId: newUserId,
                                file: booking.file,
                                type: booking.type
                            }).unwrap();
                            uploadedCount++;
                        } catch (bookingErr) {
                            console.error('Failed to upload booking:', bookingErr);
                        }
                    }

                    if (uploadedCount < formData.stagedBookings.length) {
                        showStatus('warning', 'Partial Success', `User created but only ${uploadedCount}/${formData.stagedBookings.length} bookings uploaded.`);
                    } else {
                        showStatus('success', 'Created!', `User created with ${uploadedCount} bookings. Password: ${autoPassword}`);
                    }
                } else {
                    showStatus('success', 'Created!', `User created successfully. Password: ${autoPassword}`);
                }
            }
            closeModal();
        } catch (err) {
            console.error('User operation error:', err);
            showStatus('error', 'Error', err?.data?.message || err?.message || 'Operation failed');
        }
    };

    const handleDownload = async (urlOrPath, filename, useProxy = false, userId = null) => {
        try {
            let fetchUrl = urlOrPath;
            const headers = {};

            // If using backend proxy (for stored Govt IDs)
            if (useProxy && userId) {
                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
                const token = localStorage.getItem('token');
                fetchUrl = `${baseUrl}/users/${userId}/govt-id/download`;
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(fetchUrl, { headers });

            if (!response.ok) throw new Error('Download request failed');

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback
            if (!useProxy && urlOrPath) {
                window.open(urlOrPath, '_blank');
            } else {
                showStatus('error', 'Download Error', 'Failed to download file.');
            }
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
                            setQrModal({ isOpen: true, qrUrl: row.qr_code_url, email: row.email, userName: row.name, userId: row._id });
                        }}
                        className="flex-shrink-0 w-[60px] h-[60px] p-1 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all bg-white group flex items-center justify-center"
                    >
                        {row.qr_code_url ? (
                            <img src={row.qr_code_url} alt="QR" className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
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
                    <button onClick={(e) => { e.stopPropagation(); openDeleteConfirm(row._id, row.name); }} className="p-2 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
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
                    <button
                        onClick={handleGenerateMissingQR}
                        disabled={isGeneratingQR}
                        className="btn-secondary"
                        title="Generate QR codes for users without one"
                    >
                        <RefreshCw className={`w-5 h-5 mr-2 ${isGeneratingQR ? 'animate-spin' : ''}`} />
                        {isGeneratingQR ? 'Generating...' : 'Generate QR'}
                    </button>
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

                            {!formData.govt_id && (
                                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors w-fit">
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">Upload Document</span>
                                    <input type="file" accept="image/*,.pdf" onChange={handleGovtIdUpload} className="hidden" />
                                </label>
                            )}

                            {formData.govt_id && (
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={formData.govt_id}
                                            alt="ID Preview"
                                            className="w-16 h-10 object-cover rounded border bg-white"
                                        />
                                        <div>
                                            <p className="text-sm font-medium">Government ID</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => window.open(formData.govt_id, '_blank')}
                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-white border px-2 py-0.5 rounded"
                                                >
                                                    <Eye className="w-3 h-3" /> View
                                                </button>
                                                {/* Download: Use Proxy if editing user (has ID), else direct URL logic for new uploads */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const useProxy = !!editingUser; // Only use proxy if we are editing an existing user with stored ID
                                                        handleDownload(formData.govt_id, `govt_id_${formData.name}`, useProxy, editingUser?._id);
                                                    }}
                                                    className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 bg-white border px-2 py-0.5 rounded"
                                                >
                                                    <Download className="w-3 h-3" /> Save
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, govt_id: null })}
                                        className="text-red-500 hover:text-red-700 p-2"
                                        title="Remove Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
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
                                    <div key={booking._id || index} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded text-blue-600 capitalize">
                                                {booking.type === 'flight' && '✈️'}
                                                {booking.type === 'train' && '🚆'}
                                                {booking.type === 'bus' && '🚌'}
                                                {booking.type === 'cab' && '🚖'}
                                                {booking.type === 'hotel' && '🏨'}
                                                {booking.type === 'other' && '📄'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium capitalize">{booking.type} Booking</p>
                                                {booking.filename && <p className="text-xs text-gray-500">{booking.filename}</p>}
                                                {booking.ticket_url && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <a href={booking.ticket_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                            <Eye className="w-3 h-3" /> View
                                                        </a>
                                                        <button
                                                            type="button"
                                                            // Bookings (existing) also might need proxy in future, but for now user said bookings work. 
                                                            // We keep boolean false for bookings based on current status.
                                                            onClick={() => handleDownload(booking.ticket_url, booking.filename || `booking_${booking.type}`)}
                                                            className="flex items-center gap-1 text-xs text-green-500 hover:text-green-700 bg-green-50 px-2 py-0.5 rounded"
                                                        >
                                                            <Download className="w-3 h-3" /> Save
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteBooking(booking._id)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Remove Booking"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Staged Bookings for New Users */}
                        {!editingUser && formData.stagedBookings?.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 mb-4">
                                <p className="text-xs text-gray-500">Staged bookings (will upload after user creation)</p>
                                {formData.stagedBookings.map((booking) => (
                                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{booking.type === 'flight' ? '✈️' : booking.type === 'hotel' ? '🏨' : '📄'}</span>
                                            <div>
                                                <p className="text-sm font-medium capitalize">{booking.type}</p>
                                                <p className="text-xs text-gray-500">{booking.filename}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => handleDeleteBooking(booking.id)} className="text-red-500 p-2">
                                            <X className="w-4 h-4" />
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
                                        { value: 'other', label: 'Other' },
                                    ]}
                                    value={newBooking.type}
                                    onChange={(e) => setNewBooking({ ...newBooking, type: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket File</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            onChange={handleBookingUpload}
                                            className="hidden"
                                            id="booking-ticket-upload"
                                            accept="image/*,.pdf"
                                        />
                                        <label
                                            htmlFor="booking-ticket-upload"
                                            className={`flex items-center gap-2 px-3 py-2 border rounded-md bg-white cursor-pointer hover:border-primary-500 text-sm ${isAddingBooking ? 'opacity-50' : ''}`}
                                        >
                                            {isAddingBooking ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="text-gray-600">
                                                {isAddingBooking ? 'Uploading...' : 'Upload & Add'}
                                            </span>
                                        </label>
                                    </div>
                                </div>
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
                                        {field.key === 'govt_id_url' && selectedUser[field.key] ? (
                                            <div className="mt-1">
                                                <img
                                                    src={selectedUser[field.key]}
                                                    alt="Govt ID"
                                                    className="w-full h-32 object-contain bg-gray-50 rounded border mb-2"
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => window.open(selectedUser[field.key], '_blank')}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                                                    >
                                                        <Eye className="w-3 h-3" /> Preview
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(selectedUser.govt_id_url, `govt_id_${selectedUser.name}`, true, selectedUser._id)}
                                                        className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100"
                                                    >
                                                        <Download className="w-3 h-3" /> Download
                                                    </button>
                                                </div>
                                            </div>
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

                        {/* View Bookings Section */}
                        {selectedUser.bookings && selectedUser.bookings.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Bookings</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {selectedUser.bookings.map((booking, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded text-blue-600 capitalize">
                                                    {booking.type === 'flight' ? '✈️' : booking.type === 'hotel' ? '🏨' : booking.type === 'train' ? '🚆' : booking.type === 'bus' ? '🚌' : '📄'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium capitalize">{booking.type} Booking</p>
                                                    <p className="text-xs text-gray-500">{booking.filename || 'Document'}</p>
                                                </div>
                                            </div>
                                            {booking.ticket_url && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => window.open(booking.ticket_url, '_blank')}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownload(booking.ticket_url, booking.filename || `booking_${booking.type}`)}
                                                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                                        title="Download"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <QRCodeModal
                isOpen={qrModal.isOpen}
                onClose={() => setQrModal({ ...qrModal, isOpen: false })}
                qrUrl={qrModal.qrUrl}
                email={qrModal.email}
                userName={qrModal.userName}
                userId={qrModal.userId}
            />
            <ConfirmModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={handleConfirmAction} type={confirmModal.type} title={confirmModal.title} message={confirmModal.message} />
            <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })} type={statusModal.type} title={statusModal.title} message={statusModal.message} />
        </div>
    );
}
