import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/helpers';

const UserAuthContext = createContext(null);

// Storage keys for user auth (separate from admin)
const STORAGE_KEYS = {
    TOKEN: 'user_auth_token',
    USER: 'auth_user',
    ORG: 'user_auth_org',
};

// Simple token generation
const generateToken = (user) => {
    const payload = {
        id: user.id,
        type: 'user',
        org_id: user.org_id,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    return btoa(JSON.stringify(payload));
};

const decodeToken = (token) => {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) {
            return null;
        }
        return payload;
    } catch {
        return null;
    }
};

// Get users from localStorage or return empty array
const getStoredUsers = (orgSlug) => {
    try {
        const users = localStorage.getItem(`registered_users_${orgSlug}`);
        return users ? JSON.parse(users) : [];
    } catch {
        return [];
    }
};

// Save users to localStorage
const saveUsers = (orgSlug, users) => {
    localStorage.setItem(`registered_users_${orgSlug}`, JSON.stringify(users));
};

export function UserAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedOrg = localStorage.getItem(STORAGE_KEYS.ORG);

        if (token && storedUser) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUser(JSON.parse(storedUser));
                if (storedOrg) {
                    setOrganization(JSON.parse(storedOrg));
                }
            } else {
                // Token expired
                localStorage.removeItem(STORAGE_KEYS.TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER);
                localStorage.removeItem(STORAGE_KEYS.ORG);
            }
        }
        setLoading(false);
    }, []);

    // Login user (email/phone + password)
    const login = useCallback(async (credentials, orgSlug) => {
        const { mockOrganizations } = await import('../utils/mockData');
        const org = mockOrganizations.find(o => o.slug === orgSlug) || mockOrganizations[0];

        const users = getStoredUsers(org.slug);

        // Find user by email or phone with matching password
        const foundUser = users.find(u => {
            const identifier = credentials.identifier?.toLowerCase();
            const matchEmail = u.email?.toLowerCase() === identifier;
            const matchPhone = u.phone === identifier;
            const matchPassword = u.password === credentials.password;
            return (matchEmail || matchPhone) && matchPassword;
        });

        if (foundUser) {
            const token = generateToken(foundUser);
            const userWithToken = { ...foundUser, token };

            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithToken));
            localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(org));

            setUser(userWithToken);
            setOrganization(org);
            return { success: true, user: userWithToken };
        }

        return { success: false, error: 'Invalid email/phone or password' };
    }, []);

    // Register new user
    const register = useCallback(async (userData, orgSlug) => {
        const { mockOrganizations } = await import('../utils/mockData');
        const org = mockOrganizations.find(o => o.slug === orgSlug) || mockOrganizations[0];

        const users = getStoredUsers(org.slug);

        // Check if email or phone already exists
        if (userData.email && users.find(u => u.email?.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, error: 'Email already registered' };
        }
        if (userData.phone && users.find(u => u.phone === userData.phone)) {
            return { success: false, error: 'Phone number already registered' };
        }

        // Auto-generate password (6 character alphanumeric)
        const generatedPassword = Math.random().toString(36).slice(-6).toUpperCase();

        // Create new user
        const newUser = {
            id: generateId('user'),
            ...userData,
            password: generatedPassword, // Auto-generated password
            org_id: org.id,
            otp: String(Math.floor(100000 + Math.random() * 900000)),
            qr_code: userData.email || userData.phone || generateId('qr'),
            createdAt: new Date().toISOString(),
            // Initialize booking/session fields
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
        };

        users.push(newUser);
        saveUsers(org.slug, users);

        // Auto-login after registration
        const token = generateToken(newUser);
        const userWithToken = { ...newUser, token };

        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithToken));
        localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(org));

        setUser(userWithToken);
        setOrganization(org);

        return { success: true, user: userWithToken };
    }, []);

    // Update user profile
    const updateProfile = useCallback((updates) => {
        if (!user || !organization) return { success: false };

        const users = getStoredUsers(organization.slug);
        const userIndex = users.findIndex(u => u.id === user.id);

        if (userIndex === -1) return { success: false };

        const updatedUser = { ...users[userIndex], ...updates };
        users[userIndex] = updatedUser;
        saveUsers(organization.slug, users);

        const userWithToken = { ...updatedUser, token: user.token };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithToken));
        setUser(userWithToken);

        return { success: true, user: userWithToken };
    }, [user, organization]);

    // Logout
    const logout = useCallback(() => {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.ORG);
        setUser(null);
        setOrganization(null);
    }, []);

    const isAuthenticated = !!user;

    const value = {
        user,
        organization,
        loading,
        isAuthenticated,
        login,
        register,
        updateProfile,
        logout,
    };

    return (
        <UserAuthContext.Provider value={value}>
            {children}
        </UserAuthContext.Provider>
    );
}

export function useUserAuth() {
    const context = useContext(UserAuthContext);
    if (!context) {
        throw new Error('useUserAuth must be used within a UserAuthProvider');
    }
    return context;
}

export default UserAuthContext;
