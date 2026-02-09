import { memo, useEffect, useRef } from 'react';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';

const HelpdeskChatArea = memo(({
    selectedUser,
    messages = [],
    isLoading,
    replyText,
    setReplyText,
    onSendReply,
    isReplying,
    onBack
}) => {
    const messagesEndRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, selectedUser]);

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendReply();
        }
    };

    if (!selectedUser) {
        return (
            <div className="flex-1 hidden md:flex flex-col items-center justify-center bg-gray-50 text-gray-500">
                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a conversation to start chatting</p>
            </div>
        );
    }

    return (
        <div className={`flex-col h-full bg-gray-50 flex-1 ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b px-4 md:px-6 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900">{selectedUser.userInfo?.name || 'Unknown User'}</h2>
                        <p className="text-xs text-gray-500">
                            {selectedUser.userInfo?.email}
                            {selectedUser.userInfo?.phone && ` • ${selectedUser.userInfo?.phone}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">No messages yet. Start the conversation!</div>
                ) : (
                    messages.map((msg, index) => {
                        const isAdmin = msg.sender === 'admin' || msg.sender === 'Admin';
                        return (
                            <div
                                key={msg._id || index}
                                className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] md:max-w-[70%] px-4 py-2 md:px-5 md:py-3 shadow-sm relative group ${isAdmin
                                        ? 'bg-primary-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                                        }`}
                                >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isAdmin ? 'text-primary-100' : 'text-gray-400'}`}>
                                        {formatTime(msg.createdAt)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 bg-white border-t flex-shrink-0">
                <div className="flex gap-2 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your reply..."
                            className="w-full pl-4 pr-12 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-gray-50 leading-relaxed custom-scrollbar text-sm md:text-base"
                            rows="1"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                    </div>
                    <button
                        onClick={onSendReply}
                        disabled={!replyText.trim() || isReplying}
                        className="h-[48px] w-[48px] flex items-center justify-center bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                    >
                        {isReplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
});

HelpdeskChatArea.displayName = 'HelpdeskChatArea';

export default HelpdeskChatArea;
