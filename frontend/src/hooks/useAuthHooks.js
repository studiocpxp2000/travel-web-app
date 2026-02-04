import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser, selectIsAuthenticated, setCredentials, logout as logoutAction } from '../redux/slices/authSlice';
import {
    useLoginMutation as useAdminLoginMutation,
    useLoginMutation as usePromoterLoginMutation,
    useUserLoginMutation,
    useRegisterMutation
} from '../redux/slices/apiSlice';
import { useOrg } from '../context/OrgContext'; // Keeping OrgContext for Public URL Slug parsing

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

// --- Admin & Super Admin Auth ---
export function useAuth() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Selectors
    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // Mutations
    const [adminLoginMutation] = useAdminLoginMutation();
    const [promoterLoginMutation] = usePromoterLoginMutation(); // Access for shared login page potentially

    const login = useCallback(async (credentials, userType = 'admin') => {
        let result;
        try {
            if (userType === 'superadmin' || userType === 'admin') {
                result = await adminLoginMutation(credentials).unwrap();
            } else if (userType === 'promoter') {
                result = await promoterLoginMutation(credentials).unwrap();
            }

            if (result) {
                dispatch(setCredentials({
                    user: result.user,
                    token: result.token
                }));
                return { success: true, user: result.user };
            }
        } catch (err) {
            console.error('Login failed:', err);
            return { success: false, error: err.data?.message || 'Login failed' };
        }
        return { success: false, error: 'Invalid user type' };
    }, [adminLoginMutation, promoterLoginMutation, dispatch]);

    const logout = useCallback(() => {
        dispatch(logoutAction());
        // Check if we need to clear anything else?
    }, [dispatch]);

    const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
    const isAdmin = user?.role === ROLES.ADMIN_ORG;
    const isPromoter = user?.role === ROLES.PROMOTER;

    // Organization is NOT part of Auth State anymore. 
    // Consumers should fetch it via useGetOrganizationQuery(user.org_id)

    return {
        user,
        loading: false, // Redux state always sync unless we track loading separately
        isAuthenticated,
        isSuperAdmin,
        isAdmin,
        isPromoter,
        login,
        logout,
        // Helper to mimic old Context. Consumer should prefer API.
        organization: null,
        updateOrganization: () => console.warn('updateOrganization is deprecated. Use API mutations.'),
    };
}


// --- Promoter Specific Auth ---
export function usePromoterAuth() {
    const dispatch = useDispatch();
    const { user, isAuthenticated, logout: globalLogout } = useAuth(); // Reuse basic selectors/logout

    const [loginMutation] = usePromoterLoginMutation();

    const login = useCallback(async (credentials) => {
        try {
            const result = await loginMutation({
                ...credentials,
                role: 'promoter'
            }).unwrap();

            if (result.user.role !== 'promoter') {
                return { success: false, error: 'Access denied: Not a promoter account' };
            }

            dispatch(setCredentials({
                user: result.user,
                token: result.token
            }));

            return { success: true, user: result.user };
        } catch (err) {
            return { success: false, error: err.data?.message || 'Login failed' };
        }
    }, [loginMutation, dispatch]);

    const isPromoter = user?.role === ROLES.PROMOTER;
    const validAuth = isAuthenticated && isPromoter;

    return {
        user: validAuth ? user : null,
        organization: user?.org_id || null, // Promoter user object has org_id (populated or id)
        loading: false,
        isAuthenticated: validAuth,
        login,
        logout: globalLogout,
    };
}


// --- Public User Auth ---
export function useUserAuth() {
    const dispatch = useDispatch();
    const { currentOrg } = useOrg(); // Context for URL-based org

    // Selectors
    const user = useSelector(selectCurrentUser);
    const isAuthenticated = useSelector(selectIsAuthenticated) && user?.role === 'public_user'; // 'public_user' is not in ROLES? Check backend.
    // Backend returns 'user' role for public users.
    const isUser = user?.role === 'user';
    const validAuth = useSelector(selectIsAuthenticated) && isUser;

    // Mutations
    const [userLoginMutation] = useUserLoginMutation();
    const [registerMutation] = useRegisterMutation();

    const handleAuthSuccess = useCallback((result) => {
        dispatch(setCredentials({
            user: result.user,
            token: result.token
        }));
    }, [dispatch]);

    const login = useCallback(async (credentials) => {
        if (!currentOrg) return { success: false, error: 'Organization not found' };

        try {
            const result = await userLoginMutation({
                ...credentials,
                org_slug: currentOrg.slug
            }).unwrap();

            handleAuthSuccess(result);
            return { success: true, user: result.user };
        } catch (err) {
            return { success: false, error: err.data?.message || 'Login failed' };
        }
    }, [currentOrg, userLoginMutation, handleAuthSuccess]);

    const register = useCallback(async (userData) => {
        if (!currentOrg) return { success: false, error: 'Organization not found' };

        try {
            const result = await registerMutation({
                ...userData,
                org_slug: currentOrg.slug
            }).unwrap();

            handleAuthSuccess(result);
            return { success: true, user: result.user };
        } catch (err) {
            return { success: false, error: err.data?.message || 'Registration failed' };
        }
    }, [currentOrg, registerMutation, handleAuthSuccess]);

    const logout = useCallback(() => {
        dispatch(logoutAction());
    }, [dispatch]);

    return {
        user: validAuth ? user : null,
        organization: currentOrg,
        loading: false,
        isAuthenticated: validAuth,
        login,
        register,
        logout,
        updateProfile: async () => { console.warn('Deprecated'); return { success: false }; }
    };
}
