import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// API Slice (RTK Query)
// This serves as the single API definition for the entire app.
// It handles fetching, caching, and invalidation automatically.

export const apiSlice = createApi({
    reducerPath: 'api', // The key in the store
    baseQuery: fetchBaseQuery({
        baseUrl: '/api', // Your backend URL
        prepareHeaders: (headers, { getState }) => {
            // Automatically attach JWT token if available
            const token = getState().auth?.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['User', 'Organization', 'Promoter'], // For invalidating caches
    endpoints: (builder) => ({
        // Endpoints will be injected from other files or defined here
        // Example: getUsers, getPromoters, etc.
    }),
});
