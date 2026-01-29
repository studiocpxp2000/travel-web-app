import { useState, useContext, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, Clock, User, Mail, Phone, CheckCircle, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import OrgContext from '../../context/OrgContext';
import { useHelpdesk, TICKET_STATUS } from '../../context/HelpdeskContext';
import StatusModal from '../../components/common/StatusModal';

export default function HelpdeskMessages() {
    const { user, organization: authOrg } = useAuth();
    const orgContext = useContext(OrgContext);
    const organization = orgContext?.currentOrg || authOrg;
    const { tickets, getOrgTickets, addMessage, updateTicketStatus, deleteTicket, refreshTickets } = useHelpdesk();

    // State
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
    const messagesEndRef = useRef(null);

    // Get tickets for current org
    const orgTickets = organization
        ? getOrgTickets(organization.id, organization.slug)
        : tickets;

    // Filter tickets
    const filteredTickets = orgTickets.filter(ticket => {
        const matchesSearch = !searchTerm ||
            ticket.userInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.userInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;

        return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    // Scroll to bottom of messages when ticket changes
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [selectedTicket?.messages]);

    // Refresh tickets periodically
    useEffect(() => {
        const interval = setInterval(refreshTickets, 2000);
        return () => clearInterval(interval);
    }, [refreshTickets]);

    // Update selected ticket from refreshed data
    useEffect(() => {
        if (selectedTicket) {
            const updated = tickets.find(t => t.id === selectedTicket.id);
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedTicket)) {
                setSelectedTicket(updated);
            }
        }
    }, [tickets, selectedTicket]);

    const handleSendReply = () => {
        if (!replyText.trim() || !selectedTicket) return;

        addMessage(
            selectedTicket.id,
            replyText.trim(),
            'admin',
            user?.name || 'Admin'
        );

        setReplyText('');
    };

    const handleStatusChange = (ticketId, newStatus) => {
        updateTicketStatus(ticketId, newStatus);
        setStatusModal({
            isOpen: true,
            type: 'success',
            title: 'Status Updated',
            message: `Ticket status changed to ${TICKET_STATUS[newStatus].label}`,
        });
    };

    const formatTime = (timestamp) => {
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

    const getStatusBadge = (status) => {
        const config = TICKET_STATUS[status] || TICKET_STATUS.open;
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const primaryColor = organization?.button_color || '#3B82F6';

    // Stats
    const stats = {
        total: orgTickets.length,
        open: orgTickets.filter(t => t.status === 'open').length,
        inProgress: orgTickets.filter(t => t.status === 'in_progress').length,
        resolved: orgTickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-dark-900">Helpdesk Messages</h1>
                <p className="text-text-light">Manage support requests from {organization?.name || 'users'}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-500">Total Tickets</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
                    <div className="text-sm text-gray-500">Open</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                    <div className="text-sm text-gray-500">In Progress</div>
                </div>
                <div className="bg-white rounded-lg border p-4">
                    <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                    <div className="text-sm text-gray-500">Resolved</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex gap-4 min-h-0">
                {/* Tickets List */}
                <div className="w-1/3 bg-white rounded-xl border shadow-sm flex flex-col">
                    {/* Search & Filter */}
                    <div className="p-4 border-b space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>

                    {/* Tickets */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <MessageSquare className="w-12 h-12 mb-2 opacity-30" />
                                <p>No tickets found</p>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <div
                                    key={ticket.id}
                                    onClick={() => setSelectedTicket(ticket)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{ticket.userInfo.name}</p>
                                            <p className="text-sm text-gray-500 truncate">{ticket.subject}</p>
                                        </div>
                                        {getStatusBadge(ticket.status)}
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-400">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(ticket.updatedAt)}
                                        </span>
                                        <span>{ticket.messages.length} messages</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 bg-white rounded-xl border shadow-sm flex flex-col">
                    {selectedTicket ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setSelectedTicket(null)}
                                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                            <User className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{selectedTicket.userInfo.name}</h3>
                                            <p className="text-sm text-gray-500">{selectedTicket.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={selectedTicket.status}
                                            onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                                            className="px-3 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {Object.entries(TICKET_STATUS).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* User Info */}
                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    {selectedTicket.userInfo.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail className="w-4 h-4" />
                                            {selectedTicket.userInfo.email}
                                        </span>
                                    )}
                                    {selectedTicket.userInfo.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {selectedTicket.userInfo.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                                {selectedTicket.messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-lg p-3 ${message.sender === 'admin'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white border text-gray-900'
                                                }`}
                                        >
                                            <p className="text-sm">{message.content}</p>
                                            <div className={`text-xs mt-1 ${message.sender === 'admin' ? 'text-blue-100' : 'text-gray-400'
                                                }`}>
                                                {message.senderName} • {formatTime(message.timestamp)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
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
                                        className="px-4 py-2 rounded-lg text-white flex items-center gap-2 disabled:opacity-50"
                                        style={{ backgroundColor: primaryColor }}
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
                            <p className="text-lg font-medium">Select a ticket</p>
                            <p className="text-sm">Choose a ticket from the list to view the conversation</p>
                        </div>
                    )}
                </div>
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
