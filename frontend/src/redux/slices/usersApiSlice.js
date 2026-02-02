import { apiSlice } from './apiSlice';

// User API Slice
// Extends the main apiSlice to add user-related endpoints.
// This keeps the code organized by feature.

export const usersApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        getUsers: builder.query({
            query: (orgId) => `/users?org_id=${orgId}`,
            providesTags: (result, error, orgId) => [{ type: 'User', id: 'LIST' }],
            // Cache this data for 60 seconds by default, or until invalidated
        }),
        addUser: builder.mutation({
            query: (userData) => ({
                url: '/users',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }], // Auto-refetch getUsers
        }),
        updateUser: builder.mutation({
            query: (userData) => ({
                url: `/users/${userData.id}`,
                method: 'PUT',
                body: userData,
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'User', id: arg.id }],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: [{ type: 'User', id: 'LIST' }],
        }),
    }),
});

export const {
    useGetUsersQuery,
    useAddUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
} = usersApiSlice;
