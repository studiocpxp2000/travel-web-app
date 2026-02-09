import { memo } from 'react';
import { Search, User, Clock, MessageSquare } from 'lucide-react';

const HelpdeskConversationList = memo(({
    conversations = [],
    selectedUserId,
    onSelectUser,
    searchTerm,
    onSearchChange
}) => {

    // Filter conversations
    const filteredConversations = conversations.filter(conv => {
        const name = conv.userInfo?.name || 'Unknown User';
        const email = conv.userInfo?.email || '';
        const searchLower = searchTerm.toLowerCase();

        return name.toLowerCase().includes(searchLower) ||
            email.toLowerCase().includes(searchLower);
    });

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

    return (
        <div className={`flex-col h-full border-r bg-white md:w-1/3 ${selectedUserId ? 'hidden md:flex w-full' : 'flex w-full'}`}>
            {/* Search Header */}
            <div className="p-4 border-b">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                        <p>No conversations found</p>
                    </div>
                ) : (
                    filteredConversations.map((conversation) => (
                        <button
                            key={conversation._id}
                            onClick={() => onSelectUser(conversation._id)}
                            className={`w-full p-3 border-b text-left hover:bg-gray-50 transition-colors flex items-center gap-3 ${selectedUserId === conversation._id ? 'bg-primary-50 hover:bg-primary-50 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className={`text-sm font-semibold truncate ${selectedUserId === conversation._id ? 'text-primary-700' : 'text-gray-900'}`}>
                                        {conversation.userInfo?.name || 'Unknown User'}
                                    </h3>
                                    {conversation.lastMessageTime && (
                                        <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(conversation.lastMessageTime)}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {conversation.lastMessage || 'No messages yet'}
                                </p>
                            </div>
                            {conversation.unreadCount > 0 && selectedUserId !== conversation._id && (
                                <div className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium shadow-sm">
                                    {conversation.unreadCount}
                                </div>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    );
});

HelpdeskConversationList.displayName = 'HelpdeskConversationList';

export default HelpdeskConversationList;
