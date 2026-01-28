import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Archive, RotateCcw, Eye, QrCode, Download, Upload } from 'lucide-react';
import QRCodeLib from 'qrcode';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import QRCodeModal from '../../components/common/QRCodeModal';
import Input, { Select } from '../../components/forms/Input';
import { mockUsers, mockOrganizations, USER_FIELDS } from '../../utils/mockData';
import { generateId } from '../../utils/helpers';
import { exportToExcel, USER_EXPORT_COLUMNS } from '../../utils/exportUtils';

export default function SuperAdminUsers() {
    const [users, setUsers] = useState(mockUsers.map(u => ({ ...u, archived: u.archived || false })));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [filterOrg, setFilterOrg] = useState('');
    const [showArchived, setShowArchived] = useState(false);

    // QR Code modal state
    const [qrModal, setQrModal] = useState({
        isOpen: false,
        data: '',
        userName: ''
    });

    // QR thumbnails cache
    const [qrThumbnails, setQrThumbnails] = useState({});

    // Form data with all editable fields
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
        org_id: '',
        // System fields (boolean) - editable for manual override
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

    // Generate QR thumbnails for all users
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
                        console.error('Error generating QR thumbnail:', err);
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

    const orgOptions = mockOrganizations.map(org => ({
        value: org.id,
        label: org.name,
    }));

    const genderOptions = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
    ];

    const foodOptions = [
        { value: 'veg', label: 'Vegetarian' },
        { value: 'non-veg', label: 'Non-Vegetarian' },
    ];

    const filteredUsers = users.filter(u => {
        const orgMatch = !filterOrg || u.org_id === filterOrg;
        const archiveMatch = showArchived || !u.archived;
        return orgMatch && archiveMatch;
    });

    const renderFieldValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return <span className="text-gray-400 italic">N/A</span>;
        }
        if (typeof value === 'boolean') {
            return value
                ? <CheckCircle className="w-4 h-4 text-green-500" />
                : <XCircle className="w-4 h-4 text-gray-300" />;
        }
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
        e.target.value = ''; // Reset input so same file can be selected again
    };

    const handleClearStagedTicket = () => {
        setNewBooking({ ...newBooking, ticket: null });
    };

    const handleDownloadReport = () => {
        const orgName = mockOrganizations.find(o => o.id === filterOrg)?.name || 'users';
        const orgUsers = filteredUsers.filter(u => !u.archived);
        exportToExcel(orgUsers, `${orgName.replace(/\s+/g, '_')}_users`, USER_EXPORT_COLUMNS);
        showStatus('success', 'Report Downloaded!', `Successfully exported ${orgUsers.length} users to Excel.`);
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
                            setQrModal({
                                isOpen: true,
                                data: row.qr_code,
                                userName: row.name
                            });
                        }}
                        className="flex-shrink-0 w-[60px] h-[60px] p-1 rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-sm transition-all bg-white group flex items-center justify-center"
                        title="View QR Code"
                    >
                        {qrThumbnails[row.id] ? (
                            <img
                                src={qrThumbnails[row.id]}
                                alt="QR"
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        ) : (
                            <QrCode className="w-8 h-8 text-gray-400" />
                        )}
                    </button>
                </div>
            ),
        },
        {
            header: 'User',
            accessor: 'name',
            render: (row) => (
                <div className={row.archived ? 'opacity-50' : ''}>
                    <p className="font-medium text-dark-900 flex items-center gap-2">
                        {row.name}
                        {row.archived && <span className="badge badge-gray">Archived</span>}
                    </p>
                    <p className="text-xs text-text-light">{row.email || row.phone || 'No contact'}</p>
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
            header: 'Location',
            render: (row) => renderFieldValue(row.location),
        },
        {
            header: 'Food',
            render: (row) => (
                <div>
                    {row.food_preference && (
                        <span className={`badge ${row.food_preference === 'veg' ? 'badge-success' : 'badge-warning'}`}>
                            {row.food_preference}
                        </span>
                    )}
                    {!row.food_preference && <span className="text-gray-400 italic">N/A</span>}
                </div>
            ),
        },
        {
            header: 'Arrivals',
            render: (row) => (
                <div className="flex gap-1">
                    <div className="flex items-center gap-1" title="Airport">
                        <span className="text-xs text-gray-500">✈️</span>
                        {row.is_arrived_on_airport
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex items-center gap-1" title="Bus">
                        <span className="text-xs text-gray-500">🚌</span>
                        {row.is_arrived_on_bus
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                    <div className="flex items-center gap-1" title="Hotel">
                        <span className="text-xs text-gray-500">🏨</span>
                        {row.is_arrived_at_hotel
                            ? <CheckCircle className="w-4 h-4 text-green-500" />
                            : <XCircle className="w-4 h-4 text-gray-300" />}
                    </div>
                </div>
            ),
        },
        {
            header: 'Registered',
            width: '100px',
            render: (row) => (
                <div className="flex justify-center">
                    {row.isRegistered
                        ? <span className="badge badge-success">Yes</span>
                        : <span className="badge badge-gray">No</span>}
                </div>
            ),
        },
        {
            header: 'Actions',
            width: '180px',
            render: (row) => (
                <div className="flex gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(row);
                        }}
                        className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                        title="View All Details"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
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

    const handleViewDetails = (user) => {
        setSelectedUser(user);
        setIsDetailModalOpen(true);
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        // Populate form with all editable fields from the user
        setFormData({
            name: user.name || '',
            gender: user.gender || '',
            email: user.email || '',
            phone: user.phone || '',
            password: user.password || '',
            location: user.location || '',
            passport: user.passport || '',
            govt_id_number: user.govt_id_number || '',
            govt_id: user.govt_id || null,
            food_preference: user.food_preference || '',
            food_remarks: user.food_remarks || '',
            org_id: user.org_id || '',
            is_arrived_on_airport: user.is_arrived_on_airport || false,
            is_arrived_on_bus: user.is_arrived_on_bus || false,
            is_arrived_at_hotel: user.is_arrived_at_hotel || false,
            session_1: user.session_1 || false,
            session_2: user.session_2 || false,
            session_3: user.session_3 || false,
            session_4: user.session_4 || false,
            session_5: user.session_5 || false,
            session_6: user.session_6 || false,
            session_7: user.session_7 || false,
            session_8: user.session_8 || false,
            session_8: user.session_8 || false,
            session_9: user.session_9 || false,
            bookings: user.bookings || [],
            isRegistered: user.isRegistered || false,
        });
        setIsModalOpen(true);
    };

    const openArchiveConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'archive',
            title: 'Archive User?',
            message: `Are you sure you want to archive "${name}"? You can restore them later.`,
            itemId: id
        });
    };

    const openDeleteConfirm = (id, name) => {
        setConfirmModal({
            isOpen: true,
            type: 'delete',
            title: 'Delete User?',
            message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
            itemId: id
        });
    };

    const handleConfirmAction = () => {
        const { type, itemId } = confirmModal;
        try {
            if (type === 'archive') {
                setUsers(users.map(u =>
                    u.id === itemId ? { ...u, archived: true } : u
                ));
                showStatus('success', 'Archived!', 'User has been archived successfully.');
            } else if (type === 'delete') {
                setUsers(users.filter(u => u.id !== itemId));
                showStatus('success', 'Deleted!', 'User has been permanently deleted.');
            }
        } catch {
            showStatus('error', 'Error!', `Failed to ${type} user.`);
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    const handleRestore = (id) => {
        try {
            setUsers(users.map(u =>
                u.id === id ? { ...u, archived: false } : u
            ));
            showStatus('success', 'Restored!', 'User has been restored successfully.');
        } catch {
            showStatus('error', 'Error!', 'Failed to restore user.');
        }
    };

    const handleGovtIdUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // In a real app, we'd upload to server and get URL back
            // For now, create a local object URL
            const url = URL.createObjectURL(file);
            setFormData({ ...formData, govt_id: url });
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            // Generate QR code using email or phone
            const identifier = formData.email || formData.phone;
            if (!identifier && !editingUser) {
                showStatus('error', 'Error!', 'Please provide either email or phone number for QR code generation.');
                return;
            }

            if (editingUser) {
                // Update existing user with all form fields
                setUsers(users.map(u =>
                    u.id === editingUser.id ? {
                        ...u,
                        ...formData,
                        // Preserve non-editable fields
                        org_id: u.org_id,
                        otp: u.otp,
                        qr_code: u.qr_code,
                    } : u
                ));
                showStatus('success', 'Updated!', 'User has been updated successfully.');
            } else {
                const newUser = {
                    id: generateId('user'),
                    ...formData,
                    archived: false,
                    // System generated fields
                    otp: String(Math.floor(100000 + Math.random() * 900000)),
                    // QR code uses email if available, otherwise phone
                    qr_code: identifier,
                };
                setUsers([...users, newUser]);
                showStatus('success', 'Created!', 'User has been created successfully.');
            }
            closeModal();
        } catch {
            showStatus('error', 'Error!', 'Failed to save user.');
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData(getEmptyFormData());
    };

    return (
        <div className="space-y-6" >
            {/* Header */}
            < div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" >
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Users</h1>
                    <p className="text-text-light">Manage all users across organizations</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
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
                            title="Download Users Report"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download Report
                        </button>
                    )}
                    <button onClick={() => setIsModalOpen(true)} className="btn-dark">
                        <Plus className="w-5 h-5 mr-2" />
                        Add User
                    </button>
                </div>
            </div >

            {/* Table */}
            < DataTable
                columns={columns}
                data={filteredUsers}
                searchPlaceholder="Search users..."
                pageSize={10}
            />

            {/* Form Modal */}
            < Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingUser ? 'Edit User' : 'Add User'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Information */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Profile Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Full Name"
                                placeholder="Enter full name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Select
                                label="Gender"
                                placeholder="Select gender"
                                options={genderOptions}
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            />
                            <Input
                                label="Email"
                                type="email"
                                placeholder="Enter email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                            <Input
                                label="Phone"
                                type="tel"
                                placeholder="Enter phone number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label="Password"
                                type="text"
                                placeholder="Enter password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Input
                                label="Location"
                                placeholder="Enter location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            />
                            {!editingUser && (
                                <Select
                                    label="Organization"
                                    placeholder="Select organization"
                                    options={orgOptions}
                                    value={formData.org_id}
                                    onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                                    required
                                />
                            )}
                        </div>
                        {!editingUser && (
                            <p className="mt-2 text-xs text-gray-500">
                                * QR code will be generated using email (preferred) or phone number.
                            </p>
                        )}
                    </div>

                    {/* Identity & Documents */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Identity & Documents</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Passport Number"
                                placeholder="Enter passport number"
                                value={formData.passport}
                                onChange={(e) => setFormData({ ...formData, passport: e.target.value })}
                            />
                            <Input
                                label="Government ID Number"
                                placeholder="Enter government ID"
                                value={formData.govt_id_number}
                                onChange={(e) => setFormData({ ...formData, govt_id_number: e.target.value })}
                            />
                        </div>
                        {/* Govt ID Upload */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Government ID Document
                            </label>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                                    <Upload className="w-5 h-5 text-gray-500" />
                                    <span className="text-sm text-gray-600">
                                        {formData.govt_id ? 'Change Document' : 'Upload Document'}
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        onChange={handleGovtIdUpload}
                                        className="hidden"
                                    />
                                </label>
                                {formData.govt_id && (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={formData.govt_id}
                                            alt="ID Preview"
                                            className="w-12 h-12 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, govt_id: null })}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Accepted: Aadhar, DL, PAN, Voter ID, or any valid government ID
                            </p>
                        </div>
                    </div>

                    {/* Food Preferences */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Food Preferences</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Select
                                label="Food Preference"
                                placeholder="Select preference"
                                options={foodOptions}
                                value={formData.food_preference}
                                onChange={(e) => setFormData({ ...formData, food_preference: e.target.value })}
                            />
                            <Input
                                label="Food Remarks"
                                placeholder="Any dietary restrictions..."
                                value={formData.food_remarks}
                                onChange={(e) => setFormData({ ...formData, food_remarks: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Arrival & Session Status (only when editing) */}
                    {editingUser && (
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Arrival & Session Status</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_arrived_on_airport}
                                        onChange={(e) => setFormData({ ...formData, is_arrived_on_airport: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">✈️ Airport</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_arrived_on_bus}
                                        onChange={(e) => setFormData({ ...formData, is_arrived_on_bus: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">🚌 Bus</span>
                                </label>
                                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_arrived_at_hotel}
                                        onChange={(e) => setFormData({ ...formData, is_arrived_at_hotel: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm">🏨 Hotel</span>
                                </label>
                            </div>
                            <div className="grid grid-cols-5 gap-2 mt-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                    <label key={num} className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={formData[`session_${num}`]}
                                            onChange={(e) => setFormData({ ...formData, [`session_${num}`]: e.target.checked })}
                                            className="rounded"
                                        />
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
                                    className="btn-dark mb-0.5"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-dark">
                            {editingUser ? 'Save Changes' : 'Add User'}
                        </button>
                    </div>
                </form>
            </Modal >

            {/* Detail Modal */}
            < Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)
                }
                title="User Details"
                size="lg"
            >
                {selectedUser && (
                    <div className="space-y-6">
                        {/* Organization Info */}
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-text-light">Organization</p>
                            <p className="font-medium">
                                {mockOrganizations.find(o => o.id === selectedUser.org_id)?.name || 'Unknown'}
                            </p>
                        </div>

                        {/* Configurable Fields */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Profile Information</h4>
                            <div className="grid grid-cols-2 gap-4">
                                {USER_FIELDS.configurable.map(field => (
                                    <div key={field.key} className="p-3 border rounded-lg">
                                        <p className="text-xs text-text-light mb-1">{field.label}</p>
                                        <div className="font-medium">
                                            {field.key === 'govt_id' && selectedUser[field.key] ? (
                                                <img
                                                    src={selectedUser[field.key]}
                                                    alt="Govt ID"
                                                    className="w-20 h-14 object-cover rounded border cursor-pointer hover:opacity-80"
                                                    onClick={() => window.open(selectedUser[field.key], '_blank')}
                                                />
                                            ) : (
                                                renderFieldValue(selectedUser[field.key])
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* System Fields */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">System Information</h4>
                            <div className="grid grid-cols-3 gap-3">
                                {USER_FIELDS.system.map(field => (
                                    <div key={field.key} className="p-3 border rounded-lg">
                                        <p className="text-xs text-text-light mb-1">{field.label}</p>
                                        <div className="font-medium">
                                            {renderFieldValue(selectedUser[field.key])}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </Modal >

            {/* QR Code Modal */}
            < QRCodeModal
                isOpen={qrModal.isOpen}
                onClose={() => setQrModal({ ...qrModal, isOpen: false })}
                data={qrModal.data}
                userName={qrModal.userName}
            />

            {/* Confirm Modal */}
            < ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                type={confirmModal.type}
                title={confirmModal.title}
                message={confirmModal.message}
            />

            {/* Status Modal */}
            < StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div >
    );
}
