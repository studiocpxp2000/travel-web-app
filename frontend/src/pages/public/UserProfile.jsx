import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Ticket, LogOut, Eye, Download, Calendar, QrCode, FileText } from 'lucide-react';
import { useUserAuth } from '../../context/UserAuthContext';
import Input from '../../components/forms/Input';
import StatusModal from '../../components/common/StatusModal';

export default function UserProfile() {
    const { orgSlug } = useParams();
    const navigate = useNavigate();
    const { user, organization, isAuthenticated, updateProfile, logout } = useUserAuth();

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

    useEffect(() => {
        if (user) {
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

    const handleSave = () => {
        setLoading(true);
        const result = updateProfile(formData);

        if (result.success) {
            setIsEditing(false);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Profile Updated',
                message: 'Your profile has been updated successfully.'
            });
        } else {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Update Failed',
                message: 'Failed to update profile. Please try again.'
            });
        }
        setLoading(false);
    };

    const handleLogout = () => {
        logout();
        navigate(`${pathPrefix}/`);
    };

    // Generate QR Code using canvas
    const generateQRCanvas = (qrData, size = 200) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Simple QR-like pattern (placeholder - in production use a proper QR library)
        const cellSize = size / 25;
        ctx.fillStyle = '#000000';

        // Generate pattern based on qrData hash
        const hash = qrData.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);

        // Corner patterns (position detection)
        const drawCorner = (x, y) => {
            ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, cellSize);
            ctx.fillRect(x * cellSize, (y + 6) * cellSize, 7 * cellSize, cellSize);
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, 7 * cellSize);
            ctx.fillRect((x + 6) * cellSize, y * cellSize, cellSize, 7 * cellSize);
            ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
        };

        drawCorner(1, 1);
        drawCorner(17, 1);
        drawCorner(1, 17);

        // Data pattern
        for (let i = 9; i < 16; i++) {
            for (let j = 9; j < 16; j++) {
                if ((hash + i * j) % 3 === 0) {
                    ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                }
            }
        }

        // Timing patterns
        for (let i = 8; i < 17; i += 2) {
            ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
            ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
        }

        return canvas;
    };

    const handleDownloadQR = () => {
        const qrData = user?.qr_code || user?.email || user?.id;
        const canvas = generateQRCanvas(qrData, 400);

        // Add label below QR
        const ctx = canvas.getContext('2d');
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#374151';

        const link = document.createElement('a');
        link.download = `qr-code-${user?.name?.replace(/\s+/g, '-') || 'user'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handlePreviewTicket = (booking) => {
        setPreviewTicket(booking);
    };

    const handleDownloadTicket = (booking) => {
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
        ctx.fillText(`Date: ${booking.date || 'TBA'}`, 30, 135);
        ctx.fillText(`Attendee: ${user?.name || 'N/A'}`, 30, 160);
        ctx.fillText(`Email: ${user?.email || 'N/A'}`, 30, 185);
        ctx.fillText(`Booking ID: ${booking.id || 'N/A'}`, 30, 210);

        // Status
        ctx.fillStyle = booking.status === 'confirmed' ? '#22c55e' : '#f59e0b';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`Status: ${booking.status?.toUpperCase() || 'PENDING'}`, 30, 250);

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
        link.download = `${booking.type || 'ticket'}-${booking.id}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    if (!user) {
        return null;
    }

    // Get all user bookings
    const bookings = user.bookings || [];
    const userQRCode = user.qr_code || user.email || user.id;

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
                            <p className="text-text-light">{user.email || user.phone}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                    </button>
                </div>

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
                                    <Input
                                        label="Full Name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <Input
                                        label="Phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                    <Input
                                        label="Location"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                    <div>
                                        <label className="form-label">Gender</label>
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
                                    <div>
                                        <label className="form-label">Food Preference</label>
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
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Email</p>
                                            <p className="font-medium">{user.email || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <Phone className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Phone</p>
                                            <p className="font-medium">{user.phone || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <MapPin className="w-5 h-5 text-gray-400" />
                                        <div>
                                            <p className="text-xs text-gray-500">Location</p>
                                            <p className="font-medium">{user.location || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tickets/Bookings Section */}
                        <div className="card">
                            <h2 className="text-lg font-semibold text-dark-900 mb-4">My Tickets & Bookings</h2>

                            {bookings.length > 0 ? (
                                <div className="space-y-3">
                                    {bookings.map((booking, index) => (
                                        <div key={booking.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
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
                                                        <h3 className="font-medium text-dark-900">{booking.title || booking.type}</h3>
                                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {booking.date || 'Date TBA'}
                                                            </span>
                                                            {booking.type && (
                                                                <span className="capitalize text-xs bg-gray-100 px-2 py-0.5 rounded">
                                                                    {booking.type}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1) || 'Pending'}
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
                        <div className="card sticky top-4">
                            <h2 className="text-lg font-semibold text-dark-900 mb-4">My QR Code</h2>

                            {/* QR Code Display */}
                            <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center">
                                <div className="w-40 h-40 bg-white rounded-lg shadow-sm flex items-center justify-center border-2 border-gray-200">
                                    <QrCode className="w-24 h-24 text-gray-800" />
                                </div>
                                <p className="text-xs text-gray-500 mt-3 text-center font-mono break-all max-w-full">
                                    {userQRCode}
                                </p>
                            </div>

                            {/* QR Actions */}
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setShowQRPreview(true)}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    Preview
                                </button>
                                <button
                                    onClick={handleDownloadQR}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
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
                            <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200">
                                <QrCode className="w-32 h-32 text-gray-800" />
                            </div>
                            <p className="text-sm font-medium text-dark-900 mt-4">{user?.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-1">{userQRCode}</p>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-center">
                            <button
                                onClick={() => {
                                    handleDownloadQR();
                                    setShowQRPreview(false);
                                }}
                                className="btn-primary"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ticket Preview Modal */}
            {previewTicket && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl">
                        <div className="bg-gradient-to-r from-primary-500 to-purple-500 p-4 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold">{previewTicket.title || previewTicket.type}</h3>
                                <p className="text-white/80 text-sm">{organization?.name || orgSlug}</p>
                            </div>
                            <button onClick={() => setPreviewTicket(null)} className="text-white/80 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Type</span>
                                    <span className="font-medium capitalize">{previewTicket.type || 'Ticket'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{previewTicket.date || 'TBA'}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Attendee</span>
                                    <span className="font-medium">{user?.name}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">Booking ID</span>
                                    <span className="font-mono text-sm">{previewTicket.id}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-500">Status</span>
                                    <span className={`text-sm px-3 py-1 rounded-full font-medium ${previewTicket.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            previewTicket.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {previewTicket.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                            <button onClick={() => setPreviewTicket(null)} className="btn-secondary">
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleDownloadTicket(previewTicket);
                                    setPreviewTicket(null);
                                }}
                                className="btn-primary"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Download
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
