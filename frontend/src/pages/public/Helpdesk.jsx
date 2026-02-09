import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Headphones, MessageSquare, Phone, Mail, Send, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks'; // Assumed hook for user info
import { useGetMessagesQuery, useSendMessageMutation } from '../../redux/slices/apiSlice';
import { joinUserRoom } from '../../services/socket';
import Input, { Select, Textarea } from '../../components/forms/Input';

const faqQuickHelp = [
    { q: 'How do I get my QR code?', a: 'Check your registration confirmation email.' },
    { q: 'What are the event timings?', a: 'Events run from 9 AM to 10 PM daily.' },
    { q: 'Is parking available?', a: 'Yes, free parking is available at the venue.' },
];

export default function Helpdesk() {
    const { orgSlug } = useParams();
    const { user } = useAuth();
    const messagesEndRef = useRef(null);

    // API Hooks
    // Fetch messages for the logged-in user
    const { data: messagesData, isLoading: isLoadingMessages } = useGetMessagesQuery();
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

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
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
                    <div className="bg-gray-50 border-x flex-1 overflow-y-auto p-4 space-y-4">
                        {isLoadingMessages ? (
                            <div className="flex justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-gray-500 mt-10">
                                <p>No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <div
                                    key={message._id}
                                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-white border text-gray-900'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                        <div className={`text-xs mt-1 flex items-center gap-1 ${message.sender === 'user' ? 'text-primary-100' : 'text-gray-400'
                                            }`}>
                                            <Clock className="w-3 h-3" />
                                            {formatTime(message.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))
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

                    {/* Quick Help & Contact */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Phone</p>
                                        <p className="font-medium text-dark-900">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Email</p>
                                        <p className="font-medium text-dark-900">support@travelagency.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Answers */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Quick Answers</h2>
                            <div className="space-y-4">
                                {faqQuickHelp.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-gray-50">
                                        <p className="font-medium text-dark-900 text-sm">{item.q}</p>
                                        <p className="text-text-light text-sm mt-1">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Support Hours */}
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



export default function Helpdesk() {
    const { orgSlug } = useParams();
    const messagesEndRef = useRef(null);
    const { currentOrg } = useOrg();
    const organization = currentOrg; // If not loaded, useOrg handles loading state or we show spinner?
    // PublicLayout handles Org loading mostly.

    // We can assume organization is available if PublicLayout rendered this?
    // Or if accessing directly? PublicLayout wraps Outlet.
    // So currentOrg should be there.

    const { createTicket, addMessage, getUserTickets, refreshTickets } = useHelpdesk();

    // State
    const [view, setView] = useState('form'); // 'form', 'chat', 'success'
    const [activeTicket, setActiveTicket] = useState(null);
    const [userEmail, setUserEmail] = useState('');
    const [replyText, setReplyText] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        category: '',
        message: '',
    });

    // Get user's existing tickets
    const userTickets = getUserTickets(userEmail);

    // Refresh tickets periodically when in chat view
    useEffect(() => {
        if (view === 'chat') {
            const interval = setInterval(refreshTickets, 2000);
            return () => clearInterval(interval);
        }
    }, [view, refreshTickets]);

    // Update active ticket from refreshed data
    useEffect(() => {
        if (activeTicket) {
            const updated = userTickets.find(t => t.id === activeTicket.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(activeTicket)) {
                setActiveTicket(updated);
            }
        }
    }, [userTickets, activeTicket]);

    // Scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activeTicket?.messages]);

    const handleSubmit = (e) => {
        e.preventDefault();

        const ticket = createTicket(
            {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
            },
            {
                subject: categoryOptions.find(c => c.value === formData.category)?.label || 'General Inquiry',
                content: formData.message,
            },
            organization?.id,
            organization?.slug
        );

        setUserEmail(formData.email);
        setActiveTicket(ticket);
        setView('success');
    };

    const handleContinueChat = () => {
        setView('chat');
    };

    const handleSendReply = () => {
        if (!replyText.trim() || !activeTicket) return;

        addMessage(
            activeTicket.id,
            replyText.trim(),
            'user',
            formData.name || activeTicket.userInfo.name
        );

        setReplyText('');
    };

    const handleViewExisting = (ticket) => {
        setActiveTicket(ticket);
        setView('chat');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
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
                                setFormData({ name: '', email: '', phone: '', category: '', message: '' });
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
    if (view === 'chat' && activeTicket) {
        const statusConfig = TICKET_STATUS[activeTicket.status] || TICKET_STATUS.open;

        return (
            <div className="py-6">
                <div className="max-w-3xl mx-auto px-4">
                    {/* Chat Header */}
                    <div className="bg-white rounded-t-xl border border-b-0 p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setView('form')}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div>
                                    <h2 className="font-semibold text-dark-900">{activeTicket.subject}</h2>
                                    <p className="text-sm text-gray-500">Ticket #{activeTicket.id.slice(-8)}</p>
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${statusConfig.color}`}>
                                {statusConfig.label}
                            </span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="bg-gray-50 border-x h-96 overflow-y-auto p-4 space-y-4">
                        {activeTicket.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 ${message.sender === 'user'
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-white border text-gray-900'
                                        }`}
                                >
                                    <p className="text-sm">{message.content}</p>
                                    <div className={`text-xs mt-1 flex items-center gap-1 ${message.sender === 'user' ? 'text-primary-100' : 'text-gray-400'
                                        }`}>
                                        <Clock className="w-3 h-3" />
                                        {formatTime(message.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Reply Input */}
                    <div className="bg-white rounded-b-xl border border-t-0 p-4">
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
                                disabled={!replyText.trim()}
                                className="btn-primary disabled:opacity-50"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            Messages are synced in real-time. You'll see admin replies instantly.
                        </p>
                    </div>

                    {/* Other Tickets */}
                    {userTickets.length > 1 && (
                        <div className="mt-6">
                            <h3 className="font-medium text-dark-900 mb-3">Your Other Tickets</h3>
                            <div className="space-y-2">
                                {userTickets.filter(t => t.id !== activeTicket.id).map(ticket => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => handleViewExisting(ticket)}
                                        className="bg-white border rounded-lg p-3 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="font-medium text-sm">{ticket.subject}</p>
                                            <p className="text-xs text-gray-500">{formatTime(ticket.updatedAt)}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs text-white ${TICKET_STATUS[ticket.status]?.color}`}>
                                            {TICKET_STATUS[ticket.status]?.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
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
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Your Name"
                                placeholder="Enter your name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    setUserEmail(e.target.value);
                                }}
                                required
                            />
                            <Input
                                label="Phone (Optional)"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
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
                            <button type="submit" className="btn-primary w-full">
                                <Send className="w-4 h-4 mr-2" />
                                Start Chat
                            </button>
                        </form>

                        {/* Show existing tickets if email entered */}
                        {userTickets.length > 0 && (
                            <div className="mt-6 pt-6 border-t">
                                <h3 className="font-medium text-dark-900 mb-3">Continue Existing Conversation</h3>
                                <div className="space-y-2">
                                    {userTickets.slice(0, 3).map(ticket => (
                                        <div
                                            key={ticket.id}
                                            onClick={() => handleViewExisting(ticket)}
                                            className="bg-gray-50 rounded-lg p-3 cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{ticket.subject}</p>
                                                <p className="text-xs text-gray-500">
                                                    {ticket.messages.length} messages • {formatTime(ticket.updatedAt)}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs text-white ${TICKET_STATUS[ticket.status]?.color}`}>
                                                {TICKET_STATUS[ticket.status]?.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Help & Contact */}
                    <div className="space-y-6">
                        {/* Contact Info */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Contact Information</h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Phone</p>
                                        <p className="font-medium text-dark-900">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-text-light">Email</p>
                                        <p className="font-medium text-dark-900">support@travelagency.com</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Answers */}
                        <div className="card">
                            <h2 className="text-xl font-semibold text-dark-900 mb-4">Quick Answers</h2>
                            <div className="space-y-4">
                                {faqQuickHelp.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg bg-gray-50">
                                        <p className="font-medium text-dark-900 text-sm">{item.q}</p>
                                        <p className="text-text-light text-sm mt-1">{item.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Support Hours */}
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
