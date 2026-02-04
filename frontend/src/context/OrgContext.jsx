import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useGetOrganizationBySlugQuery } from '../redux/slices/apiSlice';
import { skipToken } from '@reduxjs/toolkit/query/react';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
    const { orgSlug } = useParams();
    const location = useLocation();

    const [derivedSlug, setDerivedSlug] = useState(null);

    useEffect(() => {
        if (orgSlug) {
            setDerivedSlug(orgSlug);
        } else {
            const pathParts = location.pathname.split('/').filter(Boolean);
            const reserved = ['admin', 'superadmin', 'login', 'register', 'api', 'auth'];
            // If path starts with a slug that isn't reserved
            if (pathParts.length > 0 && !reserved.includes(pathParts[0])) {
                setDerivedSlug(pathParts[0]);
            } else {
                setDerivedSlug(null);
            }
        }
    }, [orgSlug, location.pathname]);

    // Use query with skipToken if no slug derived
    const { data: orgData, isLoading } = useGetOrganizationBySlugQuery(derivedSlug ?? skipToken);

    const [currentOrg, setCurrentOrg] = useState(null);

    useEffect(() => {
        if (orgData?.success) {
            setCurrentOrg(orgData.data);
        } else {
            // Keep currentOrg if already set? Or reset?
            // If we navigated away from an org page, we might want to reset.
            if (!isLoading && !derivedSlug) {
                setCurrentOrg(null);
            }
        }
    }, [orgData, isLoading, derivedSlug]);

    const setOrganization = (org) => {
        setCurrentOrg(org);
    };

    // Deprecated but kept for signature compatibility
    const getOrgBySlug = (slug) => {
        console.warn('getOrgBySlug is deprecated in favor of API calls');
        return null;
    };

    return (
        <OrgContext.Provider value={{ currentOrg, setOrganization, getOrgBySlug, isLoading }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (!context) {
        return {
            currentOrg: null,
            setOrganization: () => { },
            getOrgBySlug: () => null,
            isLoading: false
        };
    }
    return context;
}

export default OrgContext;
