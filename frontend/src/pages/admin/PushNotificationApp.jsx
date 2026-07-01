import { useState, useContext } from 'react';
import { Bell, Send, Trash2, Calendar, Clock, RefreshCw } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import { NOTIFICATION_LEVELS } from '../../context/NotificationContext'; // Constants
import Input, { Select } from '../../components/forms/Input';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';
import {
    useGetNotificationsQuery,
    useSendGlobalPushNotificationMutation,
    useDeleteNotificationMutation,
    useResetNotificationsMutation,
    useGetUsersQuery
} from '../../redux/slices/apiSlice';

export default function PushNotificationApp() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;
    // const { notificationHistory, sendNotification, deleteFromHistory } = useNotifications(); // Removed

    // API Hooks
    // Pass org ID for super admin context
    const { data: notificationsData, isLoading: isLoadingHistory } = useGetNotificationsQuery({ orgId: organization?._id, type: 'mobile' });
    const [sendGlobalPush, { isLoading: isSending }] = useSendGlobalPushNotificationMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
    const [resetNotifications, { isLoading: isResetting }] = useResetNotificationsMutation();

    const { data: usersData } = useGetUsersQuery({ limit: 1000, org_id: organization?._id }, { skip: !organization?._id });
    const usersWithTokens = (usersData?.data || []).filter(u => !!u.fcmToken);

    const notificationHistory = notificationsData?.data || [];

    // Form state
    const [heading, setHeading] = useState('');
    const [text, setText] = useState('');
    const [level, setLevel] = useState('info');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduledFor, setScheduledFor] = useState('');
    const [targetUserIds, setTargetUserIds] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    // const [isSending, setIsSending] = useState(false); // Managed by hook

    // UI state
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', itemId: null, action: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const levelOptions = Object.entries(NOTIFICATION_LEVELS).map(([key, val]) => ({
        value: key,
        label: `${val.icon} ${val.label}`,
    }));

    const handleSend = async () => {
        if (!heading.trim()) {
            showStatus('error', 'Missing Heading', 'Please enter a notification heading.');
            return;
        }

        if (isScheduled && !scheduledFor) {
            showStatus('error', 'Missing Time', 'Please select a date and time for the scheduled notification.');
            return;
        }

        if (isScheduled && new Date(scheduledFor) <= new Date()) {
            showStatus('error', 'Invalid Time', 'Scheduled time must be in the future.');
            return;
        }

        try {
            await sendGlobalPush({
                title: heading,
                message: text,
                level,
                org_id: organization?._id,
                redirectUrl: redirectUrl || undefined,
                scheduledFor: isScheduled && scheduledFor ? scheduledFor : undefined,
                targetUserIds: targetUserIds.length > 0 ? targetUserIds : undefined
            }).unwrap();

            showStatus('success', isScheduled ? 'Notification Scheduled!' : 'Notification Sent!', 
                       isScheduled ? 'The notification has been scheduled.' : 'The notification has been broadcast.');

            // Reset form
            setHeading('');
            setText('');
            setLevel('info');
            setRedirectUrl('');
            setIsScheduled(false);
            setScheduledFor('');
            setTargetUserIds([]);
        } catch (err) {
            showStatus('error', 'Send Failed', err?.data?.message || 'Failed to send notification.');
        }
    };

    const handleDeleteClick = (id) => {
        const notification = notificationHistory.find(n => n._id === id || n.id === id);
        setConfirmModal({
            isOpen: true,
            title: 'Delete Notification?',
            message: `Are you sure you want to delete "${notification?.title}"? This action cannot be undone.`,
            itemId: id,
            action: 'delete'
        });
    };

    const handleResetClick = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Reset All Notifications?',
            message: 'Are you sure you want to delete ALL notifications for this organization? This will clear history for everyone.',
            itemId: null,
            action: 'reset'
        });
    };

    const handleConfirmAction = async () => {
        try {
            if (confirmModal.action === 'delete') {
                await deleteNotification(confirmModal.itemId).unwrap();
                showStatus('success', 'Deleted', 'Notification removed.');
            } else if (confirmModal.action === 'reset') {
                await resetNotifications({ orgId: organization?._id, type: 'mobile' }).unwrap();
                showStatus('success', 'Reset Complete', 'All notifications have been cleared.');
            }
        } catch (err) {
            showStatus('error', 'Action Failed', err?.data?.message || 'Operation failed.');
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter history by current org (Already filtered by API mostly, but double check)
    // The API `getNotifications` returns current org's notifications.
    const orgHistory = notificationHistory;

    const columns = [
        {
            header: 'Notification',
            render: (row) => {
                const levelConfig = NOTIFICATION_LEVELS[row.level] || NOTIFICATION_LEVELS.info;
                return (
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${levelConfig.bg} flex items-center justify-center text-white text-lg`}>
                            {levelConfig.icon}
                        </div>
                        <div>
                            <p className="font-medium">
                                {row.title}
                                {row.target_user_ids && row.target_user_ids.length > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 w-fit border border-blue-200">
                                        Targeted ({row.target_user_ids.length})
                                    </span>
                                )}
                            </p>
                            {row.message && <p className="text-sm text-gray-500 line-clamp-1">{row.message}</p>}
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Level',
            width: '100px',
            render: (row) => {
                const levelConfig = NOTIFICATION_LEVELS[row.level] || NOTIFICATION_LEVELS.info;
                return (
                    <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium text-white ${levelConfig.bg} text-center w-fit`}>
                            {levelConfig.label}
                        </span>
                        {!row.isSent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 w-fit border border-purple-200">
                                Scheduled
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            header: 'Sent / Scheduled For',
            width: '160px',
            render: (row) => {
                const dateToUse = row.scheduledFor ? row.scheduledFor : row.createdAt;
                return (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatDate(dateToUse)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{formatTime(dateToUse)}</span>
                        </div>
                    </div>
                );
            },
        },
        {
            header: 'Actions',
            width: '80px',
            render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(row._id || row.id); }}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                    title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            ),
        },
    ];

    const primaryColor = organization?.button_color || '#3B82F6';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-dark-900">Mobile App Push Notifications</h1>
                <p className="text-text-light">Send native mobile push notifications to all users who have the app installed for {organization?.name || 'this organization'}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Send Notification Form */}
                <div className="lg:col-span-1 bg-white rounded-xl border shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Send Notification
                    </h2>

                    <div className="space-y-4">
                        <Input
                            label="Heading *"
                            placeholder="Notification title..."
                            value={heading}
                            onChange={(e) => setHeading(e.target.value)}
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Message (Optional)
                            </label>
                            <textarea
                                className="w-full h-24 px-4 py-3 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Additional details..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                            />
                        </div>

                        <Select
                            label="Level"
                            options={levelOptions}
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                        />

                        <Select
                            label="Navigate User To (Optional)"
                            options={[
                                { value: '', label: 'None (Default)' },
                                { value: 'Home', label: 'Home Page' },
                                { value: 'Agenda', label: 'Agenda' },
                                { value: 'Venue', label: 'Venue Information' },
                                { value: 'LiveEngagement', label: 'Live Engagement' },
                                { value: 'PhotoGallery', label: 'Photo Gallery' },
                            ]}
                            value={redirectUrl}
                            onChange={(e) => setRedirectUrl(e.target.value)}
                        />

                        {/* Targeted Users Section */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Target Specific Users (Optional)
                            </label>
                            <p className="text-xs text-gray-500">
                                Select users to send this notification to. If none are selected, it will broadcast to all users in the organization. (Only users with active app installations are shown).
                            </p>
                            
                            <div className="border rounded-lg overflow-hidden flex flex-col max-h-[220px]">
                                <div className="p-2 border-b bg-gray-50">
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="w-full px-3 py-1.5 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="overflow-y-auto p-2 space-y-1 flex-1">
                                    {usersWithTokens.length === 0 ? (
                                        <p className="text-xs text-gray-500 p-2 text-center">No active app users found.</p>
                                    ) : (
                                        usersWithTokens
                                            .filter(u => u.name?.toLowerCase().includes(userSearch.toLowerCase()) || u.email?.toLowerCase().includes(userSearch.toLowerCase()))
                                            .map(u => (
                                                <label key={u._id} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                                    <input
                                                        type="checkbox"
                                                        checked={targetUserIds.includes(u._id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setTargetUserIds([...targetUserIds, u._id]);
                                                            } else {
                                                                setTargetUserIds(targetUserIds.filter(id => id !== u._id));
                                                            }
                                                        }}
                                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                    />
                                                    <span className="text-sm text-gray-700 font-medium">{u.name}</span>
                                                    <span className="text-xs text-gray-500 line-clamp-1">{u.email}</span>
                                                </label>
                                            ))
                                    )}
                                </div>
                                {targetUserIds.length > 0 && (
                                    <div className="p-2 border-t bg-gray-50 flex justify-between items-center">
                                        <span className="text-xs font-medium text-blue-600">{targetUserIds.length} selected</span>
                                        <button type="button" onClick={() => setTargetUserIds([])} className="text-xs text-gray-500 hover:text-gray-700">Clear</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isScheduled}
                                    onChange={(e) => setIsScheduled(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-700">Schedule for Later</span>
                            </label>
                            
                            {isScheduled && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Select Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        value={scheduledFor}
                                        onChange={(e) => setScheduledFor(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
                            <div
                                className={`${NOTIFICATION_LEVELS[level]?.bg || 'bg-blue-400'} text-white rounded-lg shadow-lg overflow-hidden bg-opacity-95 backdrop-blur-sm`}
                                style={{ borderLeft: '4px solid rgba(255,255,255,0.5)' }}
                            >
                                <div className="p-4 flex items-start gap-4">
                                    <div className="flex-shrink-0 bg-white/20 rounded-full p-2">
                                        <span className="text-xl leading-none block">{NOTIFICATION_LEVELS[level]?.icon || 'ℹ️'}</span>
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <h4 className="font-bold text-white text-base leading-tight tracking-wide">
                                            {heading || 'Notification Heading'}
                                        </h4>
                                        {text && (
                                            <p className="text-white/90 text-sm mt-1 leading-relaxed break-words font-medium">
                                                {text}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={isSending}
                            className="w-full btn-dark flex items-center justify-center gap-2 py-3"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {isSending ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    {isScheduled ? 'Scheduling...' : 'Sending...'}
                                </>
                            ) : (
                                <>
                                    {isScheduled ? <Clock className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                                    {isScheduled ? 'Schedule Notification' : 'Send Notification'}
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Notification History */}
                <div className="lg:col-span-2 bg-white rounded-xl border shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-dark-900">
                            Notification History ({orgHistory.length})
                        </h2>
                        {orgHistory.length > 0 && (
                            <button
                                onClick={handleResetClick}
                                className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reset All
                            </button>
                        )}
                    </div>

                    {orgHistory.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No notifications sent yet</p>
                            <p className="text-sm">Send your first notification using the form</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={[...orgHistory]} // Already reversed by backend? Backend sort({ createdAt: -1 }), so newest first.
                            searchPlaceholder="Search notifications..."
                            pageSize={5}
                        />
                    )}
                </div>
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                type="delete"
                loading={isDeleting || isResetting}
            />

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
