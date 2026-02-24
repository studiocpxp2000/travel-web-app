import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, NOTIFICATION_LEVELS } from '../../context/NotificationContext';

export default function NotificationToast() {
    const { notifications, dismissNotification } = useNotifications();
    const navigate = useNavigate();

    if (notifications.length === 0) return null;

    const handleClick = (notification) => {
        if (notification.redirectUrl) {
            dismissNotification(notification.id);
            navigate(notification.redirectUrl);
        }
    };

    return (
        <div className="fixed top-20 right-4 sm:top-10 sm:right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none items-end">
            {notifications.map((notification) => {
                const levelConfig = NOTIFICATION_LEVELS[notification.level] || NOTIFICATION_LEVELS.info;
                const isClickable = !!notification.redirectUrl;

                return (
                    <div
                        key={notification.id}
                        onClick={() => handleClick(notification)}
                        className={`${levelConfig.bg} text-white rounded-lg shadow-lg pointer-events-auto transform transition-all duration-300 ease-in-out hover:scale-102 flex flex-col overflow-hidden max-w-sm w-full mx-4 sm:mx-0 animate-slide-in-right bg-opacity-95 backdrop-blur-sm ${isClickable ? 'cursor-pointer' : ''}`}
                        style={{
                            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                            borderLeft: '4px solid rgba(255,255,255,0.5)'
                        }}
                    >
                        <div className="p-4 flex items-start gap-4">
                            <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
                                <span className="text-xl leading-none block">{levelConfig.icon}</span>
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                                <h4 className="font-bold text-white text-base leading-tight tracking-wide">
                                    {notification.heading}
                                </h4>
                                {notification.text && (
                                    <p className="text-white/90 text-sm mt-1 leading-relaxed break-words font-medium">
                                        {notification.text}
                                    </p>
                                )}
                                {isClickable && (
                                    <p className="text-white/70 text-xs mt-1.5 font-medium">Tap to view →</p>
                                )}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); dismissNotification(notification.id); }}
                                className="flex-shrink-0 -mr-2 -mt-2 p-2 hover:bg-white/20 rounded-full transition-colors text-white/80 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-black/10">
                            <div
                                className="h-full bg-white/60 origin-left"
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
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes shrink {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
}
