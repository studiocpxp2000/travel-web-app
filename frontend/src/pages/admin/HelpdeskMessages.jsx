import { useState, useRef, useEffect, useContext } from 'react';
import { MessageSquare, Send, Search, Clock, User, Mail, Phone, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import OrgContext from '../../context/OrgContext';
import StatusModal from '../../components/common/StatusModal';
import { useGetConversationsQuery, useGetMessagesQuery, useReplyMessageMutation } from '../../redux/slices/apiSlice';

export default function HelpdeskMessages() {
    const { user, organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;

    // API Hooks
    // 1. Get list of all conversations for the org
    const {
        data: conversationsData,
        isLoading: isLoadingConversations,
        refetch: refetchConversations
    } = useGetConversationsQuery();

    // 2. Selected user state for viewing chat
    const [selectedUserId, setSelectedUserId] = useState(null);

    // 3. Get messages for selected user
    // Skip fetching if no user selected
    const {
        data: messagesData,
        isLoading: isLoadingMessages
    } = useGetMessagesQuery(selectedUserId, {
        skip: !selectedUserId,
        pollingInterval: 3000 // Poll every 3s for new messages (simple real-time)
    });

    // 4. Send message mutation (Reply)
    const [replyMessage] = useReplyMessageMutation();

    // Local State
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    // Refs
    const messagesEndRef = useRef(null);

    // Join Admin Room using Socket
    useEffect(() => {
        if (organization?.slug) {
            import('../../services/socket').then(({ joinAdminRoom }) => {
                joinAdminRoom(organization.slug);
            });
        }
    }, [organization?.slug]);

    // Derived Data
    const conversations = conversationsData?.data || [];
    const messages = messagesData?.data || [];

    // Finds the currently selected conversation info (user details)
    const selectedConversation = conversations.find(c => c._id === selectedUserId);
    const selectedUserInfo = selectedConversation?.userInfo || {};

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const name = conv.userInfo?.name || 'Unknown User';
        const email = conv.userInfo?.email || '';
        const searchLower = searchTerm.toLowerCase();

        return name.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);
    });

    // Validations / Helpers
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const handleSendReply = async () => {
        if (!replyText.trim() || !selectedUserId) return;

        try {
            await replyMessage({
                user_id: selectedUserId,
                content: replyText.trim()
            }).unwrap();

            setReplyText('');
            // refetchConversations is not needed if cache invalidation works correctly
        } catch (err) {
            console.error("Failed to send message:", err);
            setStatusModal({
                isOpen: true,
                type: 'error',
                title: 'Send Failed',
                message: 'Could not send message. Please try again.'
            });
        }
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // UI Render
    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-dark-900">Helpdesk Messages</h1>
                <p className="text-text-light">Manage support requests from users</p>
            </div>

            {/* Stats Cards (Calculated from conversations list) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
                    <div className="text-sm text-gray-500">Active Conversations</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-red-600">
                        {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-500">Unread Messages</div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex gap-4 min-h-0">

                {/* Conversations List (Sidebar) */}
                <div className={`${selectedUserId ? 'hidden lg:flex' : 'flex'} w-full lg:w-1/3 bg-white rounded-xl border shadow-sm flex-col`}>

                    {/* Search */}
                    <div className="p-4 border-b">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="flex justify-center items-center h-32">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                            </div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
                                <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                                <p>No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv._id}
                                    onClick={() => setSelectedUserId(conv._id)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedUserId === conv._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">
                                                {conv.userInfo?.name || 'User'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate">
                                                {conv.lastMessage || 'Sent an attachment'}
                                            </p>
                                        </div>
                                        {conv.unreadCount > 0 && (
                                            <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center text-xs text-gray-400">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {formatTime(conv.lastMessageTime)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Details (Main Panel) */}
                <div className={`${!selectedUserId ? 'hidden lg:flex' : 'flex'} flex-1 bg-white rounded-xl border shadow-sm flex-col`}>
                    {selectedUserId ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedUserId(null)}
                                        className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <User className="w-5 h-5 text-gray-500" />
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">{selectedUserInfo.name || 'User'}</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            {selectedUserInfo.email && (
                                                <span className="flex items-center gap-1">
                                                    <Mail className="w-3 h-3" /> {selectedUserInfo.email}
                                                </span>
                                            )}
                                            {selectedUserInfo.phone && (
                                                <span className="flex items-center gap-1 ml-2">
                                                    <Phone className="w-3 h-3" /> {selectedUserInfo.phone}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {isLoadingMessages ? (
                                    <div className="flex justify-center p-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-10">Start the conversation</div>
                                ) : (
                                    messages.map(msg => (
                                        <div
                                            key={msg._id}
                                            className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[75%] rounded-lg p-3 ${msg.sender === 'admin'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-800'
                                                    }`}
                                            >
                                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                                <div className={`text-xs mt-1 text-right ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-400'
                                                    }`}>
                                                    {formatTime(msg.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t bg-white">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type your reply..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                        className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim()}
                                        className="px-4 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50 hover:bg-blue-700 transition"
                                    >
                                        <Send className="w-4 h-4" />
                                        Send
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-lg font-medium">Select a conversation</p>
                            <p className="text-sm">Choose a user from the list to view message history</p>
                        </div>
                    )}
                </div>
            </div>

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
