// User field definitions for registration configuration
export const USER_FIELDS = {
    // Configurable fields (can be toggled on/off for registration)
    configurable: [
        { key: 'name', label: 'Full Name', type: 'text', required: true },
        { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'password', label: 'Password', type: 'password' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'passport', label: 'Passport Number', type: 'text' },
        { key: 'govt_id_number', label: 'Government ID Number', type: 'text' },
        { key: 'govt_id', label: 'Government ID (Upload)', type: 'file' },
        { key: 'food_preference', label: 'Food Preference', type: 'select', options: ['veg', 'non-veg'] },
        { key: 'food_remarks', label: 'Food Remarks', type: 'textarea' },
    ],
    // System fields (auto-generated, not asked at registration)
    system: [
        { key: 'org_id', label: 'Organization ID', type: 'text' },
        { key: 'otp', label: 'OTP', type: 'text' },
        { key: 'qr_code', label: 'QR Code', type: 'text' },
        { key: 'is_arrived_on_airport', label: 'Arrived on Airport', type: 'boolean' },
        { key: 'is_arrived_on_bus', label: 'Arrived on Bus', type: 'boolean' },
        { key: 'is_arrived_at_hotel', label: 'Arrived at Hotel', type: 'boolean' },
        { key: 'session_1', label: 'Session 1', type: 'boolean' },
        { key: 'session_2', label: 'Session 2', type: 'boolean' },
        { key: 'session_3', label: 'Session 3', type: 'boolean' },
        { key: 'session_4', label: 'Session 4', type: 'boolean' },
        { key: 'session_5', label: 'Session 5', type: 'boolean' },
        { key: 'session_6', label: 'Session 6', type: 'boolean' },
        { key: 'session_7', label: 'Session 7', type: 'boolean' },
        { key: 'session_8', label: 'Session 8', type: 'boolean' },
        { key: 'session_9', label: 'Session 9', type: 'boolean' },
        { key: 'isRegistered', label: 'Registered', type: 'boolean' },
    ]
};

// Mock Organizations
export const mockOrganizations = [
    {
        id: 'org-001',
        name: 'Travel Adventures Inc.',
        slug: 'travel-adventures',
        logo: '/logos/travel-adventures.png',
        header_color: '#1A1A1A',
        footer_color: '#1A1A1A',
        button_color: '#3B82F6',
        // Registration fields enabled for this org
        registration_fields: ['name', 'gender', 'email', 'password', 'location', 'food_preference'],
    },
    {
        id: 'org-002',
        name: 'Global Tours Ltd.',
        slug: 'global-tours',
        logo: '/logos/global-tours.png',
        header_color: '#0F172A',
        footer_color: '#0F172A',
        button_color: '#10B981',
        registration_fields: ['name', 'email', 'password', 'passport', 'govt_id_number'],
    },
    {
        id: 'org-003',
        name: 'Sunset Voyages',
        slug: 'sunset-voyages',
        logo: '/logos/sunset-voyages.png',
        header_color: '#7C2D12',
        footer_color: '#7C2D12',
        button_color: '#F59E0B',
        registration_fields: ['name', 'email', 'password', 'food_preference', 'food_remarks'],
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

// Mock Users with extended schema
export const mockUsers = [
    {
        id: 'user-001',
        org_id: 'org-001',
        // Configurable fields
        name: 'Alice Johnson',
        gender: 'female',
        email: 'alice@example.com',
        password: 'user123',
        location: 'New York, USA',
        passport: 'AB1234567',
        govt_id_number: 'NY-987654321',
        govt_id: null,
        food_preference: 'veg',
        food_remarks: 'No nuts please',
        // System fields
        otp: '123456',
        qr_code: 'QR-ORG001-USER001',
        is_arrived_on_airport: false,
        is_arrived_on_bus: false,
        is_arrived_at_hotel: false,
        session_1: false,
        session_2: false,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: false,
    },
    {
        id: 'user-002',
        org_id: 'org-001',
        name: 'Bob Smith',
        gender: 'male',
        email: 'bob@example.com',
        password: 'user123',
        location: 'Los Angeles, USA',
        passport: null,
        govt_id_number: 'CA-123456789',
        govt_id: null,
        food_preference: 'non-veg',
        food_remarks: null,
        otp: '234567',
        qr_code: 'QR-ORG001-USER002',
        is_arrived_on_airport: true,
        is_arrived_on_bus: true,
        is_arrived_at_hotel: true,
        session_1: true,
        session_2: false,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: false,
    },
    {
        id: 'user-003',
        org_id: 'org-001',
        name: 'Carol White',
        gender: 'female',
        email: 'carol@example.com',
        password: 'user123',
        location: 'Chicago, USA',
        passport: 'CD7654321',
        govt_id_number: null,
        govt_id: null,
        food_preference: 'veg',
        food_remarks: 'Gluten free',
        otp: '345678',
        qr_code: 'QR-ORG001-USER003',
        is_arrived_on_airport: true,
        is_arrived_on_bus: true,
        is_arrived_at_hotel: true,
        session_1: true,
        session_2: true,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: true,
    },
    {
        id: 'user-004',
        org_id: 'org-002',
        name: 'David Brown',
        gender: 'male',
        email: 'david@example.com',
        password: 'user123',
        location: 'London, UK',
        passport: 'UK9876543',
        govt_id_number: 'UK-555444333',
        govt_id: null,
        food_preference: null,
        food_remarks: null,
        otp: '456789',
        qr_code: 'QR-ORG002-USER001',
        is_arrived_on_airport: false,
        is_arrived_on_bus: false,
        is_arrived_at_hotel: false,
        session_1: false,
        session_2: false,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: false,
    },
    {
        id: 'user-005',
        org_id: 'org-002',
        name: 'Emma Davis',
        gender: 'female',
        email: 'emma@example.com',
        password: 'user123',
        location: 'Paris, France',
        passport: 'FR1234567',
        govt_id_number: 'FR-111222333',
        govt_id: null,
        food_preference: 'veg',
        food_remarks: null,
        otp: '567890',
        qr_code: 'QR-ORG002-USER002',
        is_arrived_on_airport: true,
        is_arrived_on_bus: false,
        is_arrived_at_hotel: false,
        session_1: false,
        session_2: false,
        session_3: false,
        session_4: false,
        session_5: false,
        session_6: false,
        session_7: false,
        session_8: false,
        session_9: false,
        bookings: [],
        isRegistered: true,
    },
];

// Mock Email Invitations (emails sent to invite users to register)
export const mockEmailInvitations = [
    { id: 'invite-001', email: 'alice@example.com', subject: 'Welcome!', sentAt: '2026-01-15T10:30:00Z' },
    { id: 'invite-002', email: 'bob@example.com', subject: 'Welcome!', sentAt: '2026-01-15T10:30:00Z' },
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
        arrivedUsers: filteredUsers.filter(u => u.is_arrived_at_hotel).length,
        totalPromoters: filteredPromoters.length,
        totalOrganizations: orgId ? 1 : mockOrganizations.length,
        sessionStats: Array.from({ length: 9 }, (_, i) => ({
            session: i + 1,
            attended: filteredUsers.filter(u => u[`session_${i + 1}`]).length,
            total: filteredUsers.length,
        })),
    };
};
