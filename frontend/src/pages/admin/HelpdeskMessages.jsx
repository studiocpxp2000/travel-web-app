import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import StatusModal from '../../components/common/StatusModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useGetConversationsQuery, useGetMessagesQuery, useReplyMessageMutation, useResetMessagesMutation, useGetOrganizationByIdQuery } from '../../redux/slices/apiSlice';
import { joinAdminRoom } from '../../services/socket';
import HelpdeskConversationList from './components/HelpdeskConversationList';
import HelpdeskChatArea from './components/HelpdeskChatArea';

export default function HelpdeskMessages() {
    const { user } = useAuth();
    const orgContext = useContext(OrgContext);

    // Fetch Organization for socket room slug
    const { data: orgData } = useGetOrganizationByIdQuery(user?.org_id, {
        skip: !user?.org_id
    });

    const organization = orgContext?.currentOrg || orgData?.data;

    // API Hooks
    // If Superadmin, we need to pass orgId explicitly. 
    // If Admin, it's optional but good practice to rely on context if available, 
    // though backend uses token for Admin.
    const {
        data: conversationsData,
    } = useGetConversationsQuery(organization?._id, {
        skip: !organization?._id && user?.role === 'super_admin' // Skip if superadmin has no org selected
    });

    const [selectedUserId, setSelectedUserId] = useState(null);

    const {
        data: messagesData,
        isLoading: isLoadingMessages
    } = useGetMessagesQuery(
        selectedUserId ? { userId: selectedUserId, orgId: organization?._id } : null,
        {
            skip: !selectedUserId,
            pollingInterval: 3000
        }
    );

    const [replyMessage, { isLoading: isReplying }] = useReplyMessageMutation();
    const [resetMessages, { isLoading: isResetting }] = useResetMessagesMutation();

    // Local State
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // Join Admin Room
    useEffect(() => {
        if (organization?.slug) {
            joinAdminRoom(organization.slug);
        }
    }, [organization?.slug]);

    // Handlers (Memoized)
    const handleSelectUser = useCallback((userId) => {
        setSelectedUserId(userId);
    }, []);

    const handleSearchChange = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const handleSendReply = useCallback(async () => {
        if (!replyText.trim() || !selectedUserId) return;

        try {
            await replyMessage({
                user_id: selectedUserId,
                content: replyText.trim(),
                org_id: organization?._id // Pass org_id for Superadmin support
            }).unwrap();

            setReplyText('');
        } catch (err) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Send Failed',
                message: 'Could not send message. Please try again.'
            });
        }
    }, [replyText, selectedUserId, replyMessage, organization?._id]);

    const handleResetClick = useCallback(() => {
        setIsConfirmOpen(true);
    }, []);

    const handleConfirmReset = useCallback(async () => {
        try {
            // Pass org_id for Superadmin support
            await resetMessages(organization?._id).unwrap();

            setIsConfirmOpen(false);
            setStatusModal({
                isOpen: true,
                type: 'success',
                title: 'Messages Reset',
                message: 'All helpdesk messages have been permanently deleted.'
            });
            setSelectedUserId(null);
        } catch (err) {
            setIsConfirmOpen(false);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Reset Failed',
                message: 'Could not reset messages. Please try again.'
            });
        }
    }, [resetMessages, organization?._id]);

    // Derived Data
    const conversations = useMemo(() => conversationsData?.data || [], [conversationsData]);
    const messages = useMemo(() => messagesData?.data || [], [messagesData]);
    const selectedConversation = useMemo(() => conversations.find(c => c._id === selectedUserId), [conversations, selectedUserId]);

    // UI Render
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Helpdesk Messages</h1>
                    <p className="text-text-light">Manage support requests from users</p>
                </div>
                <button
                    onClick={handleResetClick}
                    disabled={isResetting || conversations.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Trash2 className="w-4 h-4" />
                    Reset All Messages
                </button>
            </div>

            {/* Main Content: Split View */}
            <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex">
                <HelpdeskConversationList
                    conversations={conversations}
                    selectedUserId={selectedUserId}
                    onSelectUser={handleSelectUser}
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                />

                <HelpdeskChatArea
                    selectedUser={selectedConversation}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    replyText={replyText}
                    setReplyText={setReplyText} // Pass setter directly, safe for optimization
                    onSendReply={handleSendReply}
                    isReplying={isReplying}
                    onBack={() => setSelectedUserId(null)}
                />
            </div>

            {/* Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />

            {/* Confirmation Modal */}
            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmReset}
                title="Reset All Messages?"
                message="Are you sure you want to delete ALL messages for this organization? This action cannot be undone."
                type="delete"
                confirmText="Reset Messages"
                loading={isResetting}
            />
        </div>
    );
}
