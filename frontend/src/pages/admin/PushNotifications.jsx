import { useState, useContext } from 'react';
import { Bell, Send, Trash2, Calendar, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OrgContext from '../../context/OrgContext';
import { useNotifications, NOTIFICATION_LEVELS } from '../../context/NotificationContext';
import Input, { Select } from '../../components/forms/Input';
import DataTable from '../../components/common/DataTable';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';

export default function PushNotifications() {
    const { organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;
    const { notificationHistory, sendNotification, deleteFromHistory } = useNotifications();

    // Form state
    const [heading, setHeading] = useState('');
    const [text, setText] = useState('');
    const [level, setLevel] = useState('info');
    const [isSending, setIsSending] = useState(false);

    // UI state
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', itemId: null });
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

        setIsSending(true);

        // Simulate brief delay
        await new Promise(resolve => setTimeout(resolve, 500));

        sendNotification(heading, text, level, organization?.id, organization?.slug);

        setIsSending(false);
        showStatus('success', 'Notification Sent!', 'The notification has been broadcast to all users viewing this organization.');

        // Reset form
        setHeading('');
        setText('');
        setLevel('info');
    };

    const handleDelete = (id) => {
        const notification = notificationHistory.find(n => n.id === id);
        setConfirmModal({
            isOpen: true,
            title: 'Delete Notification?',
            message: `Are you sure you want to delete "${notification?.heading}" from history?`,
            itemId: id,
        });
    };

    const handleConfirmDelete = () => {
        deleteFromHistory(confirmModal.itemId);
        setConfirmModal({ ...confirmModal, isOpen: false });
        showStatus('success', 'Deleted', 'Notification removed from history.');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter history by current org (match by ID or slug)
    const orgHistory = organization
        ? notificationHistory.filter(n => n.orgId === organization.id || n.orgSlug === organization.slug)
        : notificationHistory;

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
                            <p className="font-medium">{row.heading}</p>
                            {row.text && <p className="text-sm text-gray-500 line-clamp-1">{row.text}</p>}
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
                        <span>{formatDate(row.sentAt)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatTime(row.sentAt)}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Actions',
            width: '80px',
            render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(row.id); }}
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
                            <div className={`${NOTIFICATION_LEVELS[level]?.bg || 'bg-blue-600'} text-white rounded-lg p-4`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">{NOTIFICATION_LEVELS[level]?.icon || 'ℹ️'}</span>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm">
                                            {heading || 'Notification Heading'}
                                        </h4>
                                        {text && (
                                            <p className="text-sm opacity-90 mt-1">{text}</p>
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
                    <h2 className="text-lg font-semibold text-dark-900 mb-4">
                        Notification History ({orgHistory.length})
                    </h2>

                    {orgHistory.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No notifications sent yet</p>
                            <p className="text-sm">Send your first notification using the form</p>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={[...orgHistory].reverse()}
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
                onConfirm={handleConfirmDelete}
                title={confirmModal.title}
                message={confirmModal.message}
                type="delete"
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
