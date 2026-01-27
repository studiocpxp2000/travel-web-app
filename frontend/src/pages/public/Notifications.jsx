import { Bell, CheckCircle, AlertTriangle, Info, Clock } from 'lucide-react';

const notifications = [
    {
        id: 1,
        type: 'success',
        title: 'Registration Confirmed',
        message: 'Your registration for the Travel Summit 2026 has been confirmed.',
        time: '2 hours ago',
        read: false,
    },
    {
        id: 2,
        type: 'info',
        title: 'Schedule Update',
        message: 'The keynote speech has been moved to 10:30 AM. Please update your calendar.',
        time: '5 hours ago',
        read: false,
    },
    {
        id: 3,
        type: 'warning',
        title: 'Limited Seats Available',
        message: 'Workshop on Travel Photography is almost full. Reserve your spot now!',
        time: '1 day ago',
        read: true,
    },
    {
        id: 4,
        type: 'info',
        title: 'New Speaker Announced',
        message: 'We are excited to announce John Traveler as our special guest speaker.',
        time: '2 days ago',
        read: true,
    },
    {
        id: 5,
        type: 'success',
        title: 'QR Code Ready',
        message: 'Your event QR code is ready. Check your email or download it from your profile.',
        time: '3 days ago',
        read: true,
    },
];

const typeConfig = {
    success: { icon: CheckCircle, bg: 'bg-green-100', iconColor: 'text-green-600' },
    warning: { icon: AlertTriangle, bg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
    info: { icon: Info, bg: 'bg-blue-100', iconColor: 'text-blue-600' },
};

export default function Notifications() {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 relative">
                        <Bell className="w-8 h-8 text-white" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Notifications</h1>
                    <p className="text-lg text-text-light">
                        Stay updated with the latest event announcements.
                    </p>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {notifications.map(notification => {
                        const { icon: Icon, bg, iconColor } = typeConfig[notification.type];
                        return (
                            <div
                                key={notification.id}
                                className={`card flex gap-4 ${!notification.read ? 'border-l-4 border-l-primary-500' : ''}`}
                            >
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${iconColor}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className={`font-semibold ${!notification.read ? 'text-dark-900' : 'text-text-light'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500 mt-2"></span>
                                        )}
                                    </div>
                                    <p className="text-text-light text-sm mt-1">{notification.message}</p>
                                    <div className="flex items-center gap-1 text-xs text-text-muted mt-2">
                                        <Clock className="w-3 h-3" />
                                        {notification.time}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State - Hidden since we have data */}
                {notifications.length === 0 && (
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-text-light">No notifications yet</p>
                    </div>
                )}
            </div>
        </div>
    );
}
