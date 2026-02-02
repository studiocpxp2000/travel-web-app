import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES } from './AuthContext';

// Storage keys for PROMOTER auth (separate from admin and user auth)
const STORAGE_KEYS = {
    TOKEN: 'promoter_auth_token',
    USER: 'auth_promoter',
    ORG: 'promoter_auth_org',
};

// Simple JWT-like token generation
const generateToken = (user) => {
    const payload = {
        id: user.id,
        role: user.role,
        org_id: user.org_id,
        exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    return btoa(JSON.stringify(payload));
};

const decodeToken = (token) => {
    try {
        const payload = JSON.parse(atob(token));
        if (payload.exp < Date.now()) {
            return null; // Token expired
        }
        return payload;
    } catch {
        return null;
    }
};

const PromoterAuthContext = createContext(null);

export function PromoterAuthProvider({ children }) {
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
                // Token expired, clear storage
                localStorage.removeItem(STORAGE_KEYS.TOKEN);
                localStorage.removeItem(STORAGE_KEYS.USER);
                localStorage.removeItem(STORAGE_KEYS.ORG);
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (credentials) => {
        // Import mock data dynamically
        const { mockPromoters, mockOrganizations } = await import('../utils/mockData');

        let foundUser = null;
        let foundOrg = null;

        // Promoter login - case-insensitive comparison
        const promoter = mockPromoters.find(
            p => p.username.toLowerCase() === credentials.username.toLowerCase() &&
                p.password.toLowerCase() === credentials.password.toLowerCase()
        );

        if (promoter) {
            foundUser = {
                id: promoter.id,
                name: promoter.username,
                role: ROLES.PROMOTER,
                org_id: promoter.org_id,
                scanner_type: promoter.assigned_scanner_type,
            };
            foundOrg = mockOrganizations.find(o => o.id === promoter.org_id);
        }

        if (foundUser) {
            const token = generateToken(foundUser);
            foundUser.token = token;

            localStorage.setItem(STORAGE_KEYS.TOKEN, token);
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(foundUser));
            if (foundOrg) {
                localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(foundOrg));
            }

            setUser(foundUser);
            setOrganization(foundOrg);
            return { success: true, user: foundUser };
        }

        return { success: false, error: 'Invalid credentials' };
    }, []);

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
        logout,
    };

    return (
        <PromoterAuthContext.Provider value={value}>
            {children}
        </PromoterAuthContext.Provider>
    );
}

export function usePromoterAuth() {
    const context = useContext(PromoterAuthContext);
    if (!context) {
        throw new Error('usePromoterAuth must be used within a PromoterAuthProvider');
    }
    return context;
}

export default PromoterAuthContext;
