import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Auth roles
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN_ORG: 'ADMIN_ORG',
    PROMOTER: 'PROMOTER',
    PUBLIC_USER: 'PUBLIC_USER',
};

// Scanner types for promoters
export const SCANNER_TYPES = {
    ARRIVAL_SCANNER: 'ARRIVAL_SCANNER',
    SESSION_1: 'SESSION_1',
    SESSION_2: 'SESSION_2',
    SESSION_3: 'SESSION_3',
    SESSION_4: 'SESSION_4',
    SESSION_5: 'SESSION_5',
    SESSION_6: 'SESSION_6',
    SESSION_7: 'SESSION_7',
    SESSION_8: 'SESSION_8',
    SESSION_9: 'SESSION_9',
};

// Simple JWT-like token generation (for demo - in production use proper JWT library)
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const storedOrg = localStorage.getItem('auth_org');

        if (token && storedUser) {
            const decoded = decodeToken(token);
            if (decoded) {
                setUser(JSON.parse(storedUser));
                if (storedOrg) {
                    setOrganization(JSON.parse(storedOrg));
                }
            } else {
                // Token expired, clear storage
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                localStorage.removeItem('auth_org');
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (credentials, userType = 'admin') => {
        // Import mock data dynamically to avoid circular deps
        const { mockAdmins, mockPromoters, mockOrganizations } = await import('../utils/mockData');

        let foundUser = null;
        let foundOrg = null;

        if (userType === 'superadmin') {
            // Super admin login (hardcoded for demo)
            if (credentials.username === 'superadmin' && credentials.password === 'admin123') {
                foundUser = {
                    id: 'sa-001',
                    name: 'Super Administrator',
                    role: ROLES.SUPER_ADMIN,
                    org_id: null,
                };
            }
        } else if (userType === 'admin') {
            // Org admin login - plain text password comparison
            const admin = mockAdmins.find(
                a => a.username === credentials.username && a.password === credentials.password
            );
            if (admin) {
                foundUser = {
                    id: admin.id,
                    name: admin.name,
                    role: ROLES.ADMIN_ORG,
                    org_id: admin.org_id,
                };
                foundOrg = mockOrganizations.find(o => o.id === admin.org_id);
            }
        } else if (userType === 'promoter') {
            // Promoter login - plain text password comparison
            const promoter = mockPromoters.find(
                p => p.username === credentials.username && p.password === credentials.password
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
        }

        if (foundUser) {
            const token = generateToken(foundUser);
            foundUser.token = token;

            localStorage.setItem('auth_token', token);
            localStorage.setItem('auth_user', JSON.stringify(foundUser));
            if (foundOrg) {
                localStorage.setItem('auth_org', JSON.stringify(foundOrg));
            }

            setUser(foundUser);
            setOrganization(foundOrg);
            return { success: true, user: foundUser };
        }

        return { success: false, error: 'Invalid credentials' };
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_org');
        setUser(null);
        setOrganization(null);
    }, []);

    const updateOrganization = useCallback((org) => {
        setOrganization(org);
        if (org) {
            localStorage.setItem('auth_org', JSON.stringify(org));
        }
    }, []);

    const isAuthenticated = !!user;
    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const isAdmin = user?.role === ROLES.ADMIN_ORG;
    const isPromoter = user?.role === ROLES.PROMOTER;

    const value = {
        user,
        organization,
        loading,
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isPromoter,
        login,
        logout,
        updateOrganization,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
