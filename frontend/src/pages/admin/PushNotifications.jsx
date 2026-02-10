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
    useCreateNotificationMutation,
    useDeleteNotificationMutation,
    useResetNotificationsMutation
} from '../../redux/slices/apiSlice';

export default function PushNotifications() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;
    // const { notificationHistory, sendNotification, deleteFromHistory } = useNotifications(); // Removed

    // API Hooks
    // Pass org ID for super admin context
    const { data: notificationsData, isLoading: isLoadingHistory } = useGetNotificationsQuery(organization?._id);
    const [createNotification, { isLoading: isSending }] = useCreateNotificationMutation();
    const [deleteNotification, { isLoading: isDeleting }] = useDeleteNotificationMutation();
    const [resetNotifications, { isLoading: isResetting }] = useResetNotificationsMutation();

    const notificationHistory = notificationsData?.data || [];

    // Form state
    const [heading, setHeading] = useState('');
    const [text, setText] = useState('');
    const [level, setLevel] = useState('info');
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

        try {
            await createNotification({
                title: heading,
                message: text,
                level,
                org_id: organization?._id
            }).unwrap();

            showStatus('success', 'Notification Sent!', 'The notification has been broadcast to all users.');

            // Reset form
            setHeading('');
            setText('');
            setLevel('info');
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
                await resetNotifications(organization?._id).unwrap();
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
                            <p className="font-medium">{row.title}</p>
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
                    <span className={`px-2 py-1 rounded text-xs font-medium text-white ${levelConfig.bg}`}>
                        {levelConfig.label}
                    </span>
                );
            },
        },
        {
            header: 'Sent At',
            width: '140px',
            render: (row) => (
                <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(row.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatTime(row.createdAt)}</span>
                    </div>
                </div>
            ),
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
                <h1 className="text-2xl font-bold text-dark-900">Push Notifications</h1>
                <p className="text-text-light">Send real-time notifications to all users viewing {organization?.name || 'this organization'}</p>
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
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Notification
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
