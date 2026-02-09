import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import StatusModal from '../../components/common/StatusModal';
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
    const {
        data: conversationsData,
    } = useGetConversationsQuery();

    const [selectedUserId, setSelectedUserId] = useState(null);

    const {
        data: messagesData,
        isLoading: isLoadingMessages
    } = useGetMessagesQuery(selectedUserId, {
        skip: !selectedUserId,
        pollingInterval: 3000
    });

    const [replyMessage, { isLoading: isReplying }] = useReplyMessageMutation();
    const [resetMessages, { isLoading: isResetting }] = useResetMessagesMutation();

    // Local State
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

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
                content: replyText.trim()
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
    }, [replyText, selectedUserId, replyMessage]);

    const handleResetMessages = useCallback(async () => {
        if (window.confirm('Are you sure you want to delete ALL messages? This action cannot be undone.')) {
            try {
                await resetMessages().unwrap();
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    title: 'Messages Reset',
                    message: 'All helpdesk messages have been permanently deleted.'
                });
                setSelectedUserId(null);
            } catch (err) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    title: 'Reset Failed',
                    message: 'Could not reset messages. Please try again.'
                });
            }
        }
    }, [resetMessages]);

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
                    onClick={handleResetMessages}
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
        </div>
    );
}
