import { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { mockOrganizations } from '../utils/mockData';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
    const { orgSlug } = useParams();
    const location = useLocation();
    const [currentOrg, setCurrentOrg] = useState(null);

    useEffect(() => {
        if (orgSlug) {
            // Find org by slug
            const org = mockOrganizations.find(o => o.slug === orgSlug);
            setCurrentOrg(org || null);
        } else {
            // Check if we're on a path that starts with an org slug
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                const possibleSlug = pathParts[0];
                const org = mockOrganizations.find(o => o.slug === possibleSlug);
                setCurrentOrg(org || null);
            } else {
                // Default to first org for demo
                setCurrentOrg(mockOrganizations[0]);
            }
        }
    }, [orgSlug, location.pathname]);

    const setOrganization = (org) => {
        setCurrentOrg(org);
    };

    const getOrgBySlug = (slug) => {
        return mockOrganizations.find(o => o.slug === slug) || null;
    };

    return (
        <OrgContext.Provider value={{ currentOrg, setOrganization, getOrgBySlug }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    const context = useContext(OrgContext);
    if (!context) {
        // Return default values if not wrapped in provider
        return {
            currentOrg: mockOrganizations[0],
            setOrganization: () => { },
            getOrgBySlug: (slug) => mockOrganizations.find(o => o.slug === slug) || null
        };
    }
    return context;
}

export default OrgContext;
