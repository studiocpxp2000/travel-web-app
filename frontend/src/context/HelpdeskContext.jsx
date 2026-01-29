import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const HelpdeskContext = createContext(null);

// Storage keys for localStorage sync
const HELPDESK_TICKETS_KEY = 'helpdesk_tickets';
const HELPDESK_SYNC_KEY = 'helpdesk_sync';

// Ticket status options
export const TICKET_STATUS = {
    open: { label: 'Open', color: 'bg-yellow-500' },
    in_progress: { label: 'In Progress', color: 'bg-blue-500' },
    resolved: { label: 'Resolved', color: 'bg-green-500' },
    closed: { label: 'Closed', color: 'bg-gray-500' },
};

// Generate unique ID
const generateId = () => `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateMessageId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function HelpdeskProvider({ children }) {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const lastSyncRef = useRef(null);

    // Load tickets from localStorage on mount
    useEffect(() => {
        loadTickets();
        setIsLoading(false);
    }, []);

    // Load tickets from localStorage
    const loadTickets = useCallback(() => {
        try {
            const stored = localStorage.getItem(HELPDESK_TICKETS_KEY);
            if (stored) {
                setTickets(JSON.parse(stored));
            }
        } catch (e) {
            console.error('Failed to load helpdesk tickets:', e);
        }
    }, []);

    // Save tickets to localStorage
    const saveTickets = useCallback((newTickets) => {
        try {
            localStorage.setItem(HELPDESK_TICKETS_KEY, JSON.stringify(newTickets));
            // Trigger sync event for other tabs
            localStorage.setItem(HELPDESK_SYNC_KEY, JSON.stringify({
                timestamp: Date.now(),
                action: 'update'
            }));
            setTimeout(() => localStorage.removeItem(HELPDESK_SYNC_KEY), 100);
        } catch (e) {
            console.error('Failed to save helpdesk tickets:', e);
        }
    }, []);

    // Listen for changes from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === HELPDESK_SYNC_KEY && e.newValue) {
                loadTickets();
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [loadTickets]);

    // Polling for updates (fallback for storage events)
    useEffect(() => {
        const interval = setInterval(() => {
            const stored = localStorage.getItem(HELPDESK_TICKETS_KEY);
            if (stored) {
                const currentHash = JSON.stringify(tickets);
                if (stored !== currentHash) {
                    loadTickets();
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tickets, loadTickets]);

    // Create a new ticket (from public user)
    const createTicket = useCallback((userInfo, initialMessage, orgId, orgSlug) => {
        const ticket = {
            id: generateId(),
            orgId,
            orgSlug,
            userInfo: {
                name: userInfo.name || 'Anonymous',
                email: userInfo.email || '',
                phone: userInfo.phone || '',
            },
            status: 'open',
            subject: initialMessage.subject || 'General Inquiry',
            messages: [
                {
                    id: generateMessageId(),
                    sender: 'user',
                    senderName: userInfo.name || 'Anonymous',
                    content: initialMessage.content,
                    timestamp: new Date().toISOString(),
                }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newTickets = [...tickets, ticket];
        setTickets(newTickets);
        saveTickets(newTickets);

        return ticket;
    }, [tickets, saveTickets]);

    // Add message to existing ticket
    const addMessage = useCallback((ticketId, content, sender = 'user', senderName = 'User') => {
        const message = {
            id: generateMessageId(),
            sender, // 'user' or 'admin'
            senderName,
            content,
            timestamp: new Date().toISOString(),
        };

        const newTickets = tickets.map(ticket => {
            if (ticket.id === ticketId) {
                return {
                    ...ticket,
                    messages: [...ticket.messages, message],
                    updatedAt: new Date().toISOString(),
                    // Auto-update status when admin responds
                    status: sender === 'admin' && ticket.status === 'open'
                        ? 'in_progress'
                        : ticket.status,
                };
            }
            return ticket;
        });

        setTickets(newTickets);
        saveTickets(newTickets);

        return message;
    }, [tickets, saveTickets]);

    // Update ticket status
    const updateTicketStatus = useCallback((ticketId, status) => {
        const newTickets = tickets.map(ticket => {
            if (ticket.id === ticketId) {
                return {
                    ...ticket,
                    status,
                    updatedAt: new Date().toISOString(),
                };
            }
            return ticket;
        });

        setTickets(newTickets);
        saveTickets(newTickets);
    }, [tickets, saveTickets]);

    // Get ticket by ID
    const getTicket = useCallback((ticketId) => {
        return tickets.find(t => t.id === ticketId) || null;
    }, [tickets]);

    // Get tickets for a specific org
    const getOrgTickets = useCallback((orgId, orgSlug) => {
        return tickets.filter(t => t.orgId === orgId || t.orgSlug === orgSlug);
    }, [tickets]);

    // Get user's tickets (by email or session)
    const getUserTickets = useCallback((userEmail) => {
        if (!userEmail) return [];
        return tickets.filter(t => t.userInfo.email === userEmail);
    }, [tickets]);

    // Delete ticket
    const deleteTicket = useCallback((ticketId) => {
        const newTickets = tickets.filter(t => t.id !== ticketId);
        setTickets(newTickets);
        saveTickets(newTickets);
    }, [tickets, saveTickets]);

    // ========================================
    // WebSocket-Ready Methods (placeholders)
    // Replace these with actual WebSocket calls when backend is ready
    // ========================================

    // TODO: Replace with WebSocket connection
    const connectToWebSocket = useCallback((/* url, token */) => {
        console.log('[HelpdeskContext] WebSocket connection placeholder - implement with backend');
        // Future implementation:
        // const ws = new WebSocket(url);
        // ws.onmessage = (event) => handleWebSocketMessage(JSON.parse(event.data));
        // return ws;
    }, []);

    // TODO: Replace with WebSocket send
    const sendViaWebSocket = useCallback((/* ws, message */) => {
        console.log('[HelpdeskContext] WebSocket send placeholder - implement with backend');
        // Future implementation:
        // ws.send(JSON.stringify(message));
    }, []);

    return (
        <HelpdeskContext.Provider value={{
            tickets,
            isLoading,
            createTicket,
            addMessage,
            updateTicketStatus,
            getTicket,
            getOrgTickets,
            getUserTickets,
            deleteTicket,
            // WebSocket-ready methods
            connectToWebSocket,
            sendViaWebSocket,
            // Force refresh
            refreshTickets: loadTickets,
        }}>
            {children}
        </HelpdeskContext.Provider>
    );
}

export function useHelpdesk() {
    const context = useContext(HelpdeskContext);
    if (!context) {
        return {
            tickets: [],
            isLoading: false,
            createTicket: () => null,
            addMessage: () => null,
            updateTicketStatus: () => { },
            getTicket: () => null,
            getOrgTickets: () => [],
            getUserTickets: () => [],
            deleteTicket: () => { },
            connectToWebSocket: () => { },
            sendViaWebSocket: () => { },
            refreshTickets: () => { },
        };
    }
    return context;
}

export default HelpdeskContext;
