import { X } from 'lucide-react';
import { useNotifications, NOTIFICATION_LEVELS } from '../../context/NotificationContext';

export default function NotificationToast() {
    const { notifications, dismissNotification } = useNotifications();

    if (notifications.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm">
            {notifications.map((notification) => {
                const levelConfig = NOTIFICATION_LEVELS[notification.level] || NOTIFICATION_LEVELS.info;

                return (
                    <div
                        key={notification.id}
                        className={`${levelConfig.bg} text-white rounded-lg shadow-xl p-4 animate-slide-in-right`}
                        style={{
                            animation: 'slideInRight 0.3s ease-out',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <span className="text-xl">{levelConfig.icon}</span>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm">
                                    {notification.heading}
                                </h4>
                                {notification.text && (
                                    <p className="text-sm opacity-90 mt-1">
                                        {notification.text}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => dismissNotification(notification.id)}
                                className="p-1 hover:bg-white/20 rounded transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Progress bar for auto-dismiss */}
                        <div className="mt-3 h-1 bg-white/30 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white/70 rounded-full"
                                style={{
                                    animation: 'shrink 6s linear forwards',
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
}
