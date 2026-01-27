// Mock Organizations
export const mockOrganizations = [
    {
        id: 'org-001',
        name: 'Travel Adventures Inc.',
        logo: '/logos/travel-adventures.png',
        header_color: '#1A1A1A',
        footer_color: '#1A1A1A',
        button_color: '#3B82F6',
    },
    {
        id: 'org-002',
        name: 'Global Tours Ltd.',
        logo: '/logos/global-tours.png',
        header_color: '#0F172A',
        footer_color: '#0F172A',
        button_color: '#10B981',
    },
    {
        id: 'org-003',
        name: 'Sunset Voyages',
        logo: '/logos/sunset-voyages.png',
        header_color: '#7C2D12',
        footer_color: '#7C2D12',
        button_color: '#F59E0B',
    },
];

// Mock Admins (plain text passwords)
export const mockAdmins = [
    {
        id: 'admin-001',
        org_id: 'org-001',
        name: 'John Admin',
        username: 'john',
        password: 'admin123',
    },
    {
        id: 'admin-002',
        org_id: 'org-002',
        name: 'Sarah Manager',
        username: 'sarah',
        password: 'admin123',
    },
    {
        id: 'admin-003',
        org_id: 'org-003',
        name: 'Mike Travel',
        username: 'mike',
        password: 'admin123',
    },
];

// Mock Promoters (plain text passwords)
export const mockPromoters = [
    {
        id: 'promo-001',
        org_id: 'org-001',
        username: 'arrival1',
        password: 'scan123',
        assigned_scanner_type: 'ARRIVAL_SCANNER',
    },
    {
        id: 'promo-002',
        org_id: 'org-001',
        username: 'session1',
        password: 'scan123',
        assigned_scanner_type: 'SESSION_1',
    },
    {
        id: 'promo-003',
        org_id: 'org-001',
        username: 'session2',
        password: 'scan123',
        assigned_scanner_type: 'SESSION_2',
    },
    {
        id: 'promo-004',
        org_id: 'org-002',
        username: 'gtarrive',
        password: 'scan123',
        assigned_scanner_type: 'ARRIVAL_SCANNER',
    },
    {
        id: 'promo-005',
        org_id: 'org-002',
        username: 'gtsession1',
        password: 'scan123',
        assigned_scanner_type: 'SESSION_1',
    },
];

// Mock Users (attendees)
export const mockUsers = [
    {
        id: 'user-001',
        org_id: 'org-001',
        name: 'Alice Johnson',
        email: 'alice@example.com',
        qr_code_data: 'QR-ORG001-USER001',
        arrival_status: false,
        session_1_status: false,
        session_2_status: false,
        session_3_status: false,
        session_4_status: false,
        session_5_status: false,
        session_6_status: false,
        session_7_status: false,
        session_8_status: false,
        session_9_status: false,
    },
    {
        id: 'user-002',
        org_id: 'org-001',
        name: 'Bob Smith',
        email: 'bob@example.com',
        qr_code_data: 'QR-ORG001-USER002',
        arrival_status: true,
        session_1_status: true,
        session_2_status: false,
        session_3_status: false,
        session_4_status: false,
        session_5_status: false,
        session_6_status: false,
        session_7_status: false,
        session_8_status: false,
        session_9_status: false,
    },
    {
        id: 'user-003',
        org_id: 'org-001',
        name: 'Carol White',
        email: 'carol@example.com',
        qr_code_data: 'QR-ORG001-USER003',
        arrival_status: true,
        session_1_status: true,
        session_2_status: true,
        session_3_status: false,
        session_4_status: false,
        session_5_status: false,
        session_6_status: false,
        session_7_status: false,
        session_8_status: false,
        session_9_status: false,
    },
    {
        id: 'user-004',
        org_id: 'org-002',
        name: 'David Brown',
        email: 'david@example.com',
        qr_code_data: 'QR-ORG002-USER001',
        arrival_status: false,
        session_1_status: false,
        session_2_status: false,
        session_3_status: false,
        session_4_status: false,
        session_5_status: false,
        session_6_status: false,
        session_7_status: false,
        session_8_status: false,
        session_9_status: false,
    },
    {
        id: 'user-005',
        org_id: 'org-002',
        name: 'Emma Davis',
        email: 'emma@example.com',
        qr_code_data: 'QR-ORG002-USER002',
        arrival_status: true,
        session_1_status: false,
        session_2_status: false,
        session_3_status: false,
        session_4_status: false,
        session_5_status: false,
        session_6_status: false,
        session_7_status: false,
        session_8_status: false,
        session_9_status: false,
    },
];

// Mock Page Content
export const mockPageContent = {
    home: {
        hero: {
            title: 'Welcome to Travel Adventures',
            subtitle: 'Discover the world with us',
            backgroundImage: '/images/hero-bg.jpg',
        },
        body: '<h2>About Our Event</h2><p>Join us for an unforgettable travel experience. We bring together travel enthusiasts from around the world.</p><h3>What to Expect</h3><ul><li>Expert travel presentations</li><li>Networking opportunities</li><li>Exclusive deals and offers</li></ul>',
    },
    agenda: {
        body: '<h2>Event Schedule</h2><div class="agenda-item"><h4>9:00 AM - Registration</h4><p>Check-in and collect your badge</p></div><div class="agenda-item"><h4>10:00 AM - Opening Ceremony</h4><p>Welcome address and keynote</p></div><div class="agenda-item"><h4>11:30 AM - Session 1</h4><p>Destination presentations</p></div>',
    },
    venue: {
        body: '<h2>Event Venue</h2><p><strong>Grand Convention Center</strong></p><p>123 Travel Street, Adventure City</p><p>Parking available on-site. Public transport accessible.</p>',
    },
    faq: {
        body: '<h2>Frequently Asked Questions</h2><details><summary>How do I register?</summary><p>Click on the Register link and fill out the form.</p></details><details><summary>What should I bring?</summary><p>Your ID and confirmation email.</p></details>',
    },
};

// Statistics for dashboards
export const getMockStats = (orgId = null) => {
    const filteredUsers = orgId
        ? mockUsers.filter(u => u.org_id === orgId)
        : mockUsers;

    const filteredPromoters = orgId
        ? mockPromoters.filter(p => p.org_id === orgId)
        : mockPromoters;

    return {
        totalUsers: filteredUsers.length,
        arrivedUsers: filteredUsers.filter(u => u.arrival_status).length,
        totalPromoters: filteredPromoters.length,
        totalOrganizations: orgId ? 1 : mockOrganizations.length,
        sessionStats: Array.from({ length: 9 }, (_, i) => ({
            session: i + 1,
            attended: filteredUsers.filter(u => u[`session_${i + 1}_status`]).length,
            total: filteredUsers.length,
        })),
    };
};
