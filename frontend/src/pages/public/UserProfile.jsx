import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Mail, Phone, MapPin, Edit2, Save, X, Calendar, Ticket, LogOut, ChevronRight } from 'lucide-react';
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

    if (!user) {
        return null;
    }

    // Get user bookings
    const bookings = user.bookings || [];

    // Get session attendance
    const sessions = [
        { key: 'session_1', label: 'Session 1' },
        { key: 'session_2', label: 'Session 2' },
        { key: 'session_3', label: 'Session 3' },
        { key: 'session_4', label: 'Session 4' },
        { key: 'session_5', label: 'Session 5' },
        { key: 'session_6', label: 'Session 6' },
        { key: 'session_7', label: 'Session 7' },
        { key: 'session_8', label: 'Session 8' },
        { key: 'session_9', label: 'Session 9' },
    ].filter(s => user[s.key] !== undefined);

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

                {/* Profile Card */}
                <div className="card mb-6">
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
                            <div className="md:col-span-2">
                                <label className="form-label">Food Remarks</label>
                                <textarea
                                    value={formData.food_remarks}
                                    onChange={(e) => setFormData({ ...formData, food_remarks: e.target.value })}
                                    className="form-input"
                                    rows={2}
                                    placeholder="Any dietary restrictions or allergies..."
                                />
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

                {/* Arrival Status */}
                <div className="card mb-6">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4">Arrival Status</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-4 rounded-lg text-center ${user.is_arrived_on_airport ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className="text-xs text-gray-500 mb-1">Airport</p>
                            <p className={`font-medium ${user.is_arrived_on_airport ? 'text-green-600' : 'text-gray-400'}`}>
                                {user.is_arrived_on_airport ? '✓ Arrived' : 'Pending'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${user.is_arrived_on_bus ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className="text-xs text-gray-500 mb-1">Bus</p>
                            <p className={`font-medium ${user.is_arrived_on_bus ? 'text-green-600' : 'text-gray-400'}`}>
                                {user.is_arrived_on_bus ? '✓ Arrived' : 'Pending'}
                            </p>
                        </div>
                        <div className={`p-4 rounded-lg text-center ${user.is_arrived_at_hotel ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className="text-xs text-gray-500 mb-1">Hotel</p>
                            <p className={`font-medium ${user.is_arrived_at_hotel ? 'text-green-600' : 'text-gray-400'}`}>
                                {user.is_arrived_at_hotel ? '✓ Arrived' : 'Pending'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Session Attendance */}
                {sessions.length > 0 && (
                    <div className="card mb-6">
                        <h2 className="text-lg font-semibold text-dark-900 mb-4">Session Attendance</h2>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {sessions.map(session => (
                                <div
                                    key={session.key}
                                    className={`p-3 rounded-lg text-center ${user[session.key] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}
                                >
                                    <p className="text-xs text-gray-500 mb-1">{session.label}</p>
                                    <p className={`text-sm font-medium ${user[session.key] ? 'text-green-600' : 'text-gray-400'}`}>
                                        {user[session.key] ? '✓' : '-'}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Bookings */}
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-dark-900">My Bookings</h2>
                        <Link
                            to={`${pathPrefix}/bookings`}
                            className="text-primary-600 text-sm font-medium hover:underline flex items-center"
                        >
                            View All <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {bookings.length > 0 ? (
                        <div className="space-y-3">
                            {bookings.slice(0, 3).map((booking, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Ticket className="w-5 h-5 text-primary-500" />
                                        <div>
                                            <p className="font-medium">{booking.title || booking.type}</p>
                                            <p className="text-xs text-gray-500">{booking.date || 'No date'}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {booking.status || 'Pending'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No bookings yet</p>
                            <Link
                                to={`${pathPrefix}/bookings`}
                                className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block"
                            >
                                Make a Booking
                            </Link>
                        </div>
                    )}
                </div>
            </div>

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
