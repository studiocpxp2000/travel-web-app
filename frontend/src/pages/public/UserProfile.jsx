import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Ticket, LogOut, Eye, Download, Calendar, QrCode, FileText, CheckCircle } from 'lucide-react';
import { useUserAuth } from '../../hooks/useAuthHooks';

import { useGetOrganizationBySlugQuery, useGetMyScoreQuery, useGetMeQuery, useUpdateMeMutation } from '../../redux/slices/apiSlice';
import Input from '../../components/forms/Input';
import StatusModal from '../../components/common/StatusModal';
import { USER_FIELDS } from '../../utils/constants';

export default function UserProfile() {
    const { orgSlug } = useParams();
    const navigate = useNavigate();
    const { user: authUser, isAuthenticated, logout } = useUserAuth();

    // Fetch Fresh User Data
    const { data: meData, refetch: refetchMe } = useGetMeQuery(undefined, {
        skip: !isAuthenticated,
        refetchOnMountOrArgChange: true
    });

    // Use fresh user data if available, otherwise fall back to authUser
    const user = meData?.user || authUser;

    // Fetch Organization Config
    const { data: orgData } = useGetOrganizationBySlugQuery(orgSlug, {
        skip: !orgSlug
    });
    const organization = orgData?.data;

    // Fetch Real Score
    const { data: scoreData } = useGetMyScoreQuery(undefined, {
        skip: !isAuthenticated
    });
    const userScore = scoreData?.data?.current_score || 0;

    const [updateMe, { isLoading: isUpdating }] = useUpdateMeMutation();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
    const [showQRPreview, setShowQRPreview] = useState(false);
    const [previewTicket, setPreviewTicket] = useState(null);

    const pathPrefix = orgSlug ? `/${orgSlug}` : '';

    useEffect(() => {
        if (!isAuthenticated) {
            navigate(`${pathPrefix}/login`);
        }
    }, [isAuthenticated, navigate, pathPrefix]);

    // Determine configured fields
    const configuredFields = organization?.settings?.registration_fields || organization?.registration_fields || ['name', 'email'];

    useEffect(() => {
        if (user) {
            // Initialize form data with all potential fields
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                location: user.location || '',
                gender: user.gender || '',
                food_preference: user.food_preference || '',
                food_remarks: user.food_remarks || '',
            });
        }
    }, [user]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const formDataToSend = { ...formData };
            // Remove email from update payload if it's restricted/disabled
            // Although backend ignores it, cleaner to send what changed or allowed.
            // But apiSlice sends everything.

            const result = await updateMe(formDataToSend).unwrap();

            if (result.success) {
                setIsEditing(false);
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Profile Updated',
                    message: 'Your profile has been updated successfully.'
                });
                refetchMe(); // Refresh data
            }
        } catch (err) {
            console.error('Update profile error:', err);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: err?.data?.message || 'Failed to update profile. Please try again.'
            });
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        navigate(`${pathPrefix}/`);
    };

    // Generic Download Handler
    const handleDownload = async (url, filename) => {
        if (!url) return;
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed:', error);
            window.open(url, '_blank');
        }
    };

    const handleDownloadQR = () => {
        const qrUrl = user?.qr_code_url;
        const filename = `qr-code-${user?.name?.replace(/\s+/g, '-') || 'user'}.png`;
        handleDownload(qrUrl, filename);
    };

    const handlePreviewTicket = (booking) => {
        if (booking.ticket_url) {
            window.open(booking.ticket_url, '_blank');
        } else {
            setPreviewTicket(booking);
        }
    };

    const handleDownloadTicket = (booking) => {
        if (booking.ticket_url) {
            const filename = booking.filename || `ticket-${booking.type || 'doc'}.png`;
            handleDownload(booking.ticket_url, filename);
        } else {
            // Generative fallback
            // Create a simple ticket image
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');

            // Background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Header gradient
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#8b5cf6');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, 70);

            // Title
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.fillText(booking.title || booking.type || 'Ticket', 30, 45);

            // Organization
            ctx.font = '12px Arial';
            ctx.fillText(organization?.name || orgSlug || '', 30, 62);

            // Booking details
            ctx.fillStyle = '#1f2937';
            ctx.font = '14px Arial';
            ctx.fillText(`Type: ${booking.type || 'N/A'}`, 30, 110);
            ctx.fillText(`Date: ${booking.uploadedAt ? new Date(booking.uploadedAt).toLocaleDateString() : 'TBA'}`, 30, 135);
            ctx.fillText(`Attendee: ${user?.name || 'N/A'}`, 30, 160);
            ctx.fillText(`Email: ${user?.email || 'N/A'}`, 30, 185);
            ctx.fillText(`Booking ID: ${booking._id || 'N/A'}`, 30, 210);

            // Footer
            ctx.fillStyle = '#9ca3af';
            ctx.font = '11px Arial';
            ctx.fillText('Please present this ticket/booking confirmation at the venue', 30, 280);

            // Border
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

            // Download
            const link = document.createElement('a');
            link.download = `${booking.type || 'ticket'}-${booking._id}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    };

    if (!user) {
        return null;
    }

    // Get all user bookings
    const bookings = user.bookings || [];
    const userQRCode = user.qr_code_url;

    // Filter fields for display/edit
    // user always has name, email. Other fields depend on Config.
    // 'password' is usually not shown/editable here without special flow.
    // We filter USER_FIELDS.configurable based on `configuredFields`.

    const fieldsToRender = USER_FIELDS.configurable.filter(f =>
        configuredFields.includes(f.key)
    );

    return (
        <div className="py-8 md:py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-900">{user.name || 'User'}</h1>
                            <div className="flex items-center gap-3">
                                <p className="text-text-light">{user.email || user.phone}</p>
                                <div className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span>★</span>
                                    <span>{userScore} pts</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* <div className='flex justify-start mb-5'>
                    <button
                        onClick={handleLogout}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div> */}

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Profile Card */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-dark-900">Profile Information</h2>
                                {!isEditing ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="btn-secondary text-sm"
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setIsEditing(false)}
                                            className="btn-secondary text-sm"
                                        >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={loading}
                                            className="btn-primary text-sm"
                                        >
                                            <Save className="w-4 h-4 mr-2" />
                                            {loading ? 'Saving...' : 'Save'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isEditing ? (
                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Always allow Name edit? Or restricted? Usually Name is editable. Email is RESTRICTED as per requirements. */}
                                    <Input
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        disabled={!configuredFields.includes('name')} // If not in config, maybe disabled? But usually name is core.
                                    />
                                    {configuredFields.includes('email') && (
                                        <Input
                                            label="Email"
                                            type="email"
                                            value={formData.email}
                                            disabled={true} // "except email" requirement
                                            required={true}
                                        />
                                    )}
                                    {configuredFields.includes('phone') && (
                                        <Input
                                            label="Phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    )}

                                    {/* Render other fields */}
                                    {fieldsToRender.map(field => {
                                        if (['name', 'email', 'phone', 'password'].includes(field.key)) return null; // Handled separately or ignored

                                        if (field.key === 'gender') {
                                            return (
                                                <div key={field.key}>
                                                    <label className="form-label">{field.label}</label>
                                                    <select
                                                        value={formData.gender}
                                                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                                        className="form-input"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="male">Male</option>
                                                        <option value="female">Female</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                            );
                                        }

                                        if (field.key === 'food_preference') {
                                            return (
                                                <div key={field.key}>
                                                    <label className="form-label">{field.label}</label>
                                                    <select
                                                        value={formData.food_preference}
                                                        onChange={(e) => setFormData({ ...formData, food_preference: e.target.value })}
                                                        className="form-input"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="veg">Vegetarian</option>
                                                        <option value="non-veg">Non-Vegetarian</option>
                                                    </select>
                                                </div>
                                            );
                                        }

                                        return (
                                            <Input
                                                key={field.key}
                                                label={field.label}
                                                value={formData[field.key] || ''}
                                                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <User className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Name</p>
                                            <p className="font-medium">{user.name || '-'}</p>
                                        </div>
                                    </div>
                                    {configuredFields.includes('email') && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Mail className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="font-medium">{user.email || '-'}</p>
                                            </div>
                                        </div>
                                    )}
                                    {configuredFields.includes('phone') && (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <div>
                                                <p className="text-xs text-gray-500">Phone</p>
                                                <p className="font-medium">{user.phone || '-'}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Render other fields View */}
                                    {fieldsToRender.map(field => {
                                        if (['name', 'email', 'phone', 'password'].includes(field.key)) return null;

                                        return (
                                            <div key={field.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                                <span className="w-5 h-5 flex items-center justify-center text-gray-400">•</span>
                                                <div>
                                                    <p className="text-xs text-gray-500">{field.label}</p>
                                                    <p className="font-medium">{user[field.key] || '-'}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Tickets/Bookings Section */}
                        <div className="card">
                            <h2 className="text-lg font-semibold text-dark-900 mb-4">My Tickets & Bookings</h2>

                            {bookings.length > 0 ? (
                                <div className="space-y-3">
                                    {bookings.map((booking, index) => (
                                        <div key={booking._id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                        {booking.type === 'hotel' || booking.type === 'resort' ? (
                                                            <FileText className="w-5 h-5 text-primary-600" />
                                                        ) : (
                                                            <Ticket className="w-5 h-5 text-primary-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-dark-900">{booking.filename || booking.type}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {booking.uploadedAt ? new Date(booking.uploadedAt).toLocaleDateString() : 'Date TBA'}
                                                            </span>
                                                            {booking.type && (
                                                                <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                                    {booking.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Status typically comes from status_flags, bookings are documents essentially. Display "Document" or something */}
                                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">
                                                    Available
                                                </span>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                                <button
                                                    onClick={() => handlePreviewTicket(booking)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded hover:bg-primary-100 transition-colors"
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    Preview
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadTicket(booking)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                                >
                                                    <Download className="w-3.5 h-3.5" />
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No tickets or bookings yet</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - QR Code */}
                    <div className="lg:col-span-1">
                        <div className="card"> {/* Removed sticky */}
                            <h2 className="text-lg font-semibold text-dark-900 mb-4">My QR Code</h2>

                            {/* QR Code Display */}
                            <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                                <div className="w-40 h-40 bg-white rounded-lg shadow-sm flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                                    {userQRCode ? (
                                        <img src={userQRCode} alt="My QR Code" className="w-full h-full object-contain" />
                                    ) : (
                                        <QrCode className="w-24 h-24 text-gray-800" />
                                    )}
                                </div>
                            </div>

                            {/* QR Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setShowQRPreview(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                    disabled={!userQRCode}
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                                    disabled={!userQRCode}
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 text-center mt-4">
                                Present this QR code at the event venue for check-in
                            </p>
                        </div>


                    </div>
                </div>
            </div>

            {/* QR Code Preview Modal */}
            {showQRPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4 text-white flex justify-between items-center">
                            <h3 className="text-lg font-bold">My QR Code</h3>
                            <button onClick={() => setShowQRPreview(false)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 flex flex-col items-center">
                            <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 overflow-hidden">
                                {userQRCode ? (
                                    <img src={userQRCode} alt="QR" className="w-full h-full object-contain" />
                                ) : (
                                    <QrCode className="w-32 h-32 text-gray-800" />
                                )}
                            </div>
                            <p className="text-sm font-medium text-dark-900 mt-4">{user?.name}</p>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-center">
                            <button
                                onClick={() => {
                                    handleDownloadQR();
                                    setShowQRPreview(false);
                                }}
                                className="btn-primary"
                                disabled={!userQRCode}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
