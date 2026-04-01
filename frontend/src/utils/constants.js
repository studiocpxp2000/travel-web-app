// User field definitions for registration configuration
export const USER_FIELDS = {
    // Configurable fields (can be toggled on/off for registration)
    configurable: [
        { key: 'name', label: 'Full Name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'password', label: 'Password', type: 'password', required: true },
        { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'passport_number', label: 'Passport Number', type: 'text' },
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

export const VOTE_STORAGE_KEY = 'poll_votes';
