import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';

const NotificationContext = createContext(null);

// Notification levels with their styles
export const NOTIFICATION_LEVELS = {
    neutral: { bg: 'bg-gray-400', icon: '📝', label: 'Neutral' },
    positive: { bg: 'bg-green-400', icon: '✅', label: 'Positive' },
    info: { bg: 'bg-blue-400', icon: 'ℹ️', label: 'Info' },
    warning: { bg: 'bg-yellow-400', icon: '⚠️', label: 'Warning' },
    negative: { bg: 'bg-red-400', icon: '❌', label: 'Negative' },
};

// Storage key for cross-tab communication
const NOTIFICATION_STORAGE_KEY = 'push_notification';
const NOTIFICATION_HISTORY_KEY = 'notification_history';
const PROCESSED_NOTIFICATIONS_KEY = 'processed_notification_ids';

// Extract org slug from URL path
const getOrgSlugFromPath = () => {
    const path = window.location.pathname;
    // Match org slugs like /travel-adventures/ or /org-slug/page
    const match = path.match(/^\/([a-z0-9-]+)(?:\/|$)/i);
    if (match && match[1]) {
        // Exclude known non-org routes
        const nonOrgRoutes = ['admin', 'superadmin', 'promoter', 'agenda', 'venue', 'faq', 'funzone', 'leaderboard', 'gallery', 'notifications', 'helpdesk', 'register', 'login', 'wall', 'polls'];
        if (!nonOrgRoutes.includes(match[1].toLowerCase())) {
            return match[1];
        }
    }
    return null;
};

export function NotificationProvider({ children, orgId = null }) {
    const [notifications, setNotifications] = useState([]);
    const [notificationHistory, setNotificationHistory] = useState([]);
    const [currentOrgSlug, setCurrentOrgSlug] = useState(getOrgSlugFromPath());
    const processedIdsRef = useRef(new Set());

    // Load processed IDs from sessionStorage to avoid showing same notification twice
    useEffect(() => {
        try {
            const stored = sessionStorage.getItem(PROCESSED_NOTIFICATIONS_KEY);
            if (stored) {
                processedIdsRef.current = new Set(JSON.parse(stored));
            }
        } catch (e) {
            // Ignore
        }
    }, []);

    // Update org slug when URL changes
    useEffect(() => {
        const handlePopState = () => {
            setCurrentOrgSlug(getOrgSlugFromPath());
        };
        window.addEventListener('popstate', handlePopState);

        // Also check periodically for SPA navigation
        const interval = setInterval(() => {
            const newSlug = getOrgSlugFromPath();
            if (newSlug !== currentOrgSlug) {
                setCurrentOrgSlug(newSlug);
            }
        }, 500);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            clearInterval(interval);
        };
    }, [currentOrgSlug]);

    // Load notification history from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Filter by orgId if provided
                const effectiveOrgId = orgId || currentOrgSlug;
                const filtered = effectiveOrgId
                    ? parsed.filter(n => n.orgId === effectiveOrgId || n.orgSlug === effectiveOrgId)
                    : parsed;
                setNotificationHistory(filtered);
            }
        } catch (e) {
            console.error('Failed to load notification history:', e);
        }
    }, [orgId, currentOrgSlug]);

    // Add notification to display queue
    const addNotificationToQueue = useCallback((notification) => {
        const id = notification.id || `notif-${Date.now()}`;

        // Check if already processed
        if (processedIdsRef.current.has(id)) {
            return;
        }

        // Mark as processed
        processedIdsRef.current.add(id);
        try {
            sessionStorage.setItem(PROCESSED_NOTIFICATIONS_KEY, JSON.stringify([...processedIdsRef.current]));
        } catch (e) {
            // Ignore
        }

        setNotifications(prev => [...prev, { ...notification, id }]);

        // Auto-remove after 60 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 60000);
    }, []);

    // Check if notification matches current org
    const matchesCurrentOrg = useCallback((notification) => {
        const effectiveOrgId = orgId || currentOrgSlug;
        if (!effectiveOrgId) return true; // No filter, show all
        return notification.orgId === effectiveOrgId || notification.orgSlug === effectiveOrgId;
    }, [orgId, currentOrgSlug]);

    // Listen for cross-tab notifications via localStorage event
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === NOTIFICATION_STORAGE_KEY && e.newValue) {
                try {
                    const notification = JSON.parse(e.newValue);
                    if (matchesCurrentOrg(notification)) {
                        addNotificationToQueue(notification);
                    }
                } catch (err) {
                    console.error('Failed to parse notification:', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [matchesCurrentOrg, addNotificationToQueue]);

    // POLLING FALLBACK: Check localStorage every 500ms for new notifications
    // This handles cases where storage event doesn't fire reliably
    useEffect(() => {
        let lastCheckedId = null;

        const pollForNotifications = () => {
            try {
                const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
                if (stored) {
                    const notification = JSON.parse(stored);
                    // Only process if it's a new notification we haven't seen
                    if (notification.id && notification.id !== lastCheckedId) {
                        lastCheckedId = notification.id;
                        if (matchesCurrentOrg(notification)) {
                            addNotificationToQueue(notification);
                        }
                    }
                }
            } catch (e) {
                // Ignore errors
            }
        };

        const interval = setInterval(pollForNotifications, 500);
        return () => clearInterval(interval);
    }, [matchesCurrentOrg, addNotificationToQueue]);

    // Socket Listener for Real-time Notifications
    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleNotification = (data) => {
            // Normalize data
            const toastData = {
                id: data._id || data.id || `socket-${Date.now()}`,
                heading: data.title || 'New Notification',
                text: data.message, // Message is now optional
                level: data.level || 'info',
                orgId: data.org_id,
                redirectUrl: data.redirectUrl || null,
            };

            addNotificationToQueue(toastData);
        };

        socket.on('notification', handleNotification);

        return () => {
            socket.off('notification', handleNotification);
        };
    }, [addNotificationToQueue]);

    // Send notification (from admin)
    const sendNotification = useCallback((heading, text, level = 'info', targetOrgId, targetOrgSlug = null) => {
        const notification = {
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            heading,
            text,
            level,
            orgId: targetOrgId,
            orgSlug: targetOrgSlug,
            sentAt: new Date().toISOString(),
        };

        // Save to history
        const newHistory = [...notificationHistory, notification];
        setNotificationHistory(newHistory);

        // Persist history to localStorage
        try {
            const existing = JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_KEY) || '[]');
            localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify([...existing, notification]));
        } catch (e) {
            console.error('Failed to save notification history:', e);
        }

        // Broadcast to other tabs via localStorage
        // Keep it in storage longer (1 second) so polling can pick it up
        localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notification));
        setTimeout(() => localStorage.removeItem(NOTIFICATION_STORAGE_KEY), 1000);

        // Also show in current tab if viewing same org
        if (matchesCurrentOrg(notification)) {
            addNotificationToQueue(notification);
        }

        return notification;
    }, [notificationHistory, matchesCurrentOrg, addNotificationToQueue]);

    // Dismiss notification manually
    const dismissNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear notification from history
    const deleteFromHistory = useCallback((id) => {
        const newHistory = notificationHistory.filter(n => n.id !== id);
        setNotificationHistory(newHistory);

        try {
            const existing = JSON.parse(localStorage.getItem(NOTIFICATION_HISTORY_KEY) || '[]');
            const updated = existing.filter(n => n.id !== id);
            localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
        } catch (e) {
            console.error('Failed to update notification history:', e);
        }
    }, [notificationHistory]);

    return (
        <NotificationContext.Provider value={{
            notifications,
            notificationHistory,
            sendNotification,
            dismissNotification,
            deleteFromHistory,
            currentOrgSlug,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        return {
            notifications: [],
            notificationHistory: [],
            sendNotification: () => { },
            dismissNotification: () => { },
            deleteFromHistory: () => { },
            currentOrgSlug: null,
        };
    }
    return context;
}

export default NotificationContext;
