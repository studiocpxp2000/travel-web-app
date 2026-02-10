import { Bell, CheckCircle, AlertTriangle, Info, Clock, Loader2 } from 'lucide-react';
import { useGetNotificationsQuery } from '../../redux/slices/apiSlice';
import { NOTIFICATION_LEVELS } from '../../context/NotificationContext';

export default function Notifications() {
    const { data: notificationsData, isLoading } = useGetNotificationsQuery(undefined, {
        pollingInterval: 60000 // Poll every minute as backup to socket
    });

    const notifications = notificationsData?.data || [];
    // Calculate unread? API doesn't seem to track read status per user yet, 
    // but usually user notifications handle 'seen' state locally or via API.
    // backend model has `isRead` but it's not per-user for broadcast notifications unless stored per user.
    // For now, we assume all are 'read' if they are in the list, or we just show them.
    // The previous mocked data had 'read' property.
    // We'll treat all as read or just list them.

    // Formatting helper
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // If less than 24h, show relative? Or just date/time
        // Simple date time for now
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mx-auto mb-4 relative">
                        <Bell className="w-8 h-8 text-white" />
                        {/* {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                                {unreadCount}
                            </span>
                        )} */}
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Notifications</h1>
                    <p className="text-lg text-text-light">
                        Stay updated with the latest event announcements.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : (
                    <>
                        {/* Notifications List */}
                        <div className="space-y-4">
                            {notifications.map(notification => {
                                const levelConfig = NOTIFICATION_LEVELS[notification.level] || NOTIFICATION_LEVELS.info;
                                // const Icon = levelConfig.icon; // Icon is an emoji in context, but let's check. 
                                // In context: icon: '📝'. Wait, in PushNotifications.jsx it used the context config.
                                // But here we want Lucide icons if possible or just use the emoji.
                                // The public page previously used Lucide icons.
                                // Let's map levels to Lucide icons for better UI.

                                let Icon = Info;
                                let bgClass = 'bg-blue-100';
                                let iconColor = 'text-blue-600';

                                switch (notification.level) {
                                    case 'positive':
                                    case 'success':
                                        Icon = CheckCircle;
                                        bgClass = 'bg-green-100';
                                        iconColor = 'text-green-600';
                                        break;
                                    case 'warning':
                                        Icon = AlertTriangle;
                                        bgClass = 'bg-yellow-100';
                                        iconColor = 'text-yellow-600';
                                        break;
                                    case 'negative':
                                    case 'error':
                                        Icon = AlertTriangle;
                                        bgClass = 'bg-red-100';
                                        iconColor = 'text-red-600';
                                        break;
                                    default:
                                        Icon = Info;
                                        bgClass = 'bg-blue-100';
                                        iconColor = 'text-blue-600';
                                }

                                return (
                                    <div
                                        key={notification.id || notification._id}
                                        className={`card flex gap-4 border-l-4 border-l-transparent hover:border-l-primary-500 transition-all`}
                                    >
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${bgClass} flex items-center justify-center`}>
                                            <Icon className={`w-6 h-6 ${iconColor}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <h3 className="font-semibold text-dark-900">
                                                    {notification.title}
                                                </h3>
                                            </div>
                                            <p className="text-text-light text-sm mt-1">{notification.message}</p>
                                            <div className="flex items-center gap-1 text-xs text-text-muted mt-2">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(notification.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {notifications.length === 0 && (
                            <div className="text-center py-12">
                                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-text-light">No notifications yet</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
