import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Headphones, MessageSquare, Phone, Mail, Send, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks'; // Assumed hook for user info
import { useGetMessagesQuery, useSendMessageMutation, useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';
import { joinUserRoom } from '../../services/socket';
import Input, { Select, Textarea } from '../../components/forms/Input';

export default function Helpdesk() {
    const { orgSlug } = useParams();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    // API Hooks
    // Fetch messages for the logged-in user
    const { data: messagesData, isLoading: isLoadingMessages } = useGetMessagesQuery();
    // Fetch public content for contact info
    const { data: pageData } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'helpdesk' },
        { skip: !orgSlug }
    );
    const helpdeskContent = pageData?.data?.content || {};

    const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

    // Derived State
    const messages = messagesData?.data || [];

    // Local State
    const [view, setView] = useState('form'); // 'form', 'chat', 'success'
    const [replyText, setReplyText] = useState('');
    const [formData, setFormData] = useState({
        category: '',
        message: '',
    });

    // Auto-Join User Room for Real-time Updates
    useEffect(() => {
        if (user?.id) {
            joinUserRoom(user.id);
        }
    }, [user]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await sendMessage({
                content: `[${formData.category}] ${formData.message}`,
                image_url: null
            }).unwrap();

            setView('success');
            setFormData({ category: '', message: '' });
        } catch (err) {
            console.error('Failed to send ticket:', err);
            // Handle error (show toast)
        }
    };

    const handleContinueChat = () => {
        setView('chat');
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;

        try {
            await sendMessage({
                content: replyText.trim(),
                image_url: null
            }).unwrap();
            setReplyText('');
        } catch (err) {
            console.error('Failed to send reply:', err);
        }
    };

    const categoryOptions = [
        { value: 'registration', label: 'Registration Issues' },
        { value: 'technical', label: 'Technical Support' },
        { value: 'event', label: 'Event Information' },
        { value: 'other', label: 'Other' },
    ];

    // Success View
    if (view === 'success') {
        return (
            <div className="py-12">
                <div className="max-w-md mx-auto px-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-dark-900 mb-4">Message Sent!</h1>
                    <p className="text-text-light mb-6">
                        Your ticket has been created. Our team will respond shortly.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={handleContinueChat}
                            className="btn-primary w-full"
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Continue to Chat
                        </button>
                        <button
                            onClick={() => {
                                setView('form');
                            }}
                            className="btn-outline w-full"
                        >
                            Submit Another Request
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Chat View
    if (view === 'chat') {
        return (
            <div className="py-6 h-[calc(100vh-80px)]">
                <div className="max-w-3xl mx-auto px-4 h-full flex flex-col">
                    {/* Chat Header */}
                    <div className="bg-white rounded-t-xl border border-b-0 p-4 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('form')}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="font-semibold text-dark-900">Support Chat</h2>
                                    <p className="text-sm text-gray-500">Real-time assistance</p>
                                </div>
                            </div>
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                Live
                            </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="bg-gray-50 flex-1 overflow-y-auto p-4 space-y-6">
                        {isLoadingMessages ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <MessageSquare className="w-12 h-12 mb-3 opacity-20" />
                                <p>No messages yet.</p>
                                <p className="text-sm">Start a conversation with our support team.</p>
                            </div>
                        ) : (
                            messages.map((message, index) => {
                                const showDateSeparator = index === 0 ||
                                    new Date(message.createdAt).toDateString() !== new Date(messages[index - 1].createdAt).toDateString();

                                return (
                                    <div key={message._id}>
                                        {showDateSeparator && (
                                            <div className="flex justify-center my-4">
                                                <span className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                                    {new Date(message.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        )}
                                        <div className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`flex flex-col max-w-[80%] ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                                <div
                                                    className={`rounded-2xl px-4 py-2 shadow-sm ${message.sender === 'user'
                                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                                        : 'bg-white border text-gray-900 rounded-tl-none'
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                                                </div>
                                                <div className="flex items-center gap-1 mt-1 px-1">
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {message.sender === 'user' && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {message.isRead ? '• Read' : '• Sent'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    <div className="bg-white rounded-b-xl border border-t-0 p-4 shrink-0">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendReply()}
                                className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                                className="btn-primary disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Messages are synced in real-time. You'll see admin replies instantly.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Form View (Default)
    return (
        <div className="py-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                        <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Help Desk</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Need assistance? We're here to help. Send us a message and we'll respond in real-time.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Contact Form */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-dark-900 mb-6 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-primary-500" />
                            Start a Conversation
                        </h2>

                        {/* Check existing messages shortcut */}
                        {messages.length > 0 && (
                            <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-blue-900">You have existing messages</p>
                                    <p className="text-xs text-blue-700">{messages.length} messages in history</p>
                                </div>
                                <button
                                    onClick={handleContinueChat}
                                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                                >
                                    Continue Chat →
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Select
                                label="Category"
                                placeholder="Select a category"
                                options={categoryOptions}
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            />
                            <Textarea
                                label="Message"
                                placeholder="Describe your issue or question"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                rows={4}
                                required
                            />
                            <button type="submit" className="btn-primary w-full" disabled={isSending}>
                                <Send className="w-4 h-4 mr-2" />
                                {isSending ? 'Sending...' : 'Start Chat'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Phone</p>
                                        <p className="font-medium text-dark-900">{helpdeskContent.phone || 'Not available'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Email</p>
                                        <p className="font-medium text-dark-900">{helpdeskContent.email || 'Not available'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Support Hours - Static for now, could be dynamic later */}
                        <div className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
                            <h3 className="font-semibold mb-2">Real-time Support</h3>
                            <p className="text-primary-100 text-sm">
                                Our team monitors messages regularly. You'll receive responses directly in the chat - no need to refresh!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

