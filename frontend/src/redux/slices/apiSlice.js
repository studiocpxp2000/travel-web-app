import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getSocket } from '../../services/socket';

// API Slice (RTK Query)
// This serves as the single API definition for the entire app.
// It handles fetching, caching, and invalidation automatically.

export const apiSlice = createApi({
    reducerPath: 'api', // The key in the store
    baseQuery: fetchBaseQuery({
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api', // Fallback for dev
        prepareHeaders: (headers, { getState }) => {
            // Automatically attach JWT token if available
            const token = getState().auth?.token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    tagTypes: ['User', 'Organization', 'Admin', 'Promoter', 'Gallery', 'Score', 'BonusCode', 'Message', 'Notification', 'PageContent'],
    endpoints: (builder) => ({
        // Auth Endpoints
        login: builder.mutation({
            query: (credentials) => ({
                url: '/auth/login',
                method: 'POST',
                body: credentials,
            }),
        }),
        userLogin: builder.mutation({
            query: (credentials) => ({
                url: '/auth/user-login',
                method: 'POST',
                body: credentials,
            }),
        }),
        register: builder.mutation({
            query: (userData) => ({
                url: '/auth/register',
                method: 'POST',
                body: userData,
            }),
        }),
        logout: builder.mutation({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),
        // Helper to check token status
        getMe: builder.query({
            query: () => '/auth/me',
            providesTags: ['User'],
        }),
        // Admin Endpoints
        getDashboardStats: builder.query({
            query: () => '/admin/dashboard-stats',
            providesTags: ['User', 'Organization'],
        }),
        getOrganizations: builder.query({
            query: () => '/admin/organizations',
            providesTags: ['Organization'],
        }),
        getOrganizationBySlug: builder.query({
            query: (slug) => `/admin/public/organizations/${slug}`,
            providesTags: ['Organization'],
        }),
        getOrganizationById: builder.query({
            query: (id) => `/admin/organizations/${id}`,
            providesTags: ['Organization'],
        }),
        getPublicOrganizations: builder.query({
            query: () => '/admin/public/organizations',
            providesTags: ['Organization'],
        }),
        // User Endpoints
        getUsers: builder.query({
            query: (params) => ({
                url: '/users',
                params,
            }),
            providesTags: ['User'],
        }),
        createUser: builder.mutation({
            query: (userData) => ({
                url: '/users',
                method: 'POST',
                body: userData,
            }),
            invalidatesTags: ['User'],
        }),
        updateUser: builder.mutation({
            query: ({ id, ...patch }) => ({
                url: `/users/${id}`,
                method: 'PUT',
                body: patch,
            }),
            invalidatesTags: ['User'],
        }),
        deleteUser: builder.mutation({
            query: (id) => ({
                url: `/users/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        generateMissingQRCodes: builder.mutation({
            query: () => ({
                url: '/users/generate-missing-qr',
                method: 'POST',
            }),
            invalidatesTags: ['User'],
        }),
        // File Upload Mutations
        uploadGovtId: builder.mutation({
            query: ({ userId, file }) => {
                const formData = new FormData();
                formData.append('govt_id', file);
                return {
                    url: `/users/${userId}/govt-id`,
                    method: 'PUT',
                    body: formData,
                };
            },
            invalidatesTags: ['User'],
        }),
        addBooking: builder.mutation({
            query: ({ userId, file, type }) => {
                const formData = new FormData();
                formData.append('ticket', file);
                formData.append('type', type);
                return {
                    url: `/users/${userId}/bookings`,
                    method: 'POST',
                    body: formData,
                };
            },
            invalidatesTags: ['User'],
        }),
        deleteBooking: builder.mutation({
            query: ({ userId, bookingId }) => ({
                url: `/users/${userId}/bookings/${bookingId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['User'],
        }),
        // Promoter Management Endpoints (Admin Side)
        getPromoters: builder.query({
            query: () => '/admin/promoters',
            providesTags: ['Promoter'],
        }),
        createPromoter: builder.mutation({
            query: (data) => ({
                url: '/admin/promoters',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Promoter'],
        }),
        updatePromoter: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/admin/promoters/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Promoter'],
        }),
        deletePromoter: builder.mutation({
            query: (id) => ({
                url: `/admin/promoters/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Promoter'],
        }),

        // Registration Fields Endpoints
        getRegistrationFields: builder.query({
            query: () => '/admin/registration-fields',
            providesTags: ['Organization'],
        }),
        updateRegistrationFields: builder.mutation({
            query: (data) => ({
                url: '/admin/registration-fields',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Organization'],
        }),

        // Promoter Endpoints (Mobile App)
        scanUser: builder.mutation({
            query: (qrData) => ({
                url: '/promoter/scan',
                method: 'POST',
                body: { qr_data: qrData },
            }),
            invalidatesTags: ['User', 'Score'],
        }),
        getPromoterStats: builder.query({
            query: () => '/promoter/stats',
        }),
        // Score/Leaderboard Endpoints
        getLeaderboard: builder.query({
            query: (params) => ({
                url: '/scores/leaderboard',
                params,
            }),
            providesTags: ['Score'],
        }),

        // Content Endpoints
        getGallery: builder.query({
            query: (params) => ({
                url: '/gallery',
                params,
            }),
            providesTags: ['Gallery'],
        }),
        uploadGalleryItem: builder.mutation({
            query: (formData) => ({
                url: '/gallery',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Gallery'],
        }),
        deleteGalleryItem: builder.mutation({
            query: (id) => ({
                url: `/gallery/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Gallery'],
        }),
        deleteGalleryItems: builder.mutation({
            query: (ids) => ({
                url: '/gallery/delete',
                method: 'POST',
                body: { ids },
            }),
            invalidatesTags: ['Gallery'],
        }),
        downloadGallery: builder.mutation({
            query: (data) => ({
                url: '/gallery/download',
                method: 'POST',
                body: data,
                responseHandler: (response) => response.blob(),
            }),
        }),
        // Communication Endpoints
        resetMessages: builder.mutation({
            query: (orgId) => ({
                url: orgId ? `/messages/reset?org_id=${orgId}` : '/messages/reset',
                method: 'DELETE',
            }),
            invalidatesTags: ['Message'],
        }),
        getConversations: builder.query({
            query: (orgId) => {
                return orgId ? `/messages/conversations?org_id=${orgId}` : '/messages/conversations';
            },
            providesTags: ['Message'],
            async onCacheEntryAdded(
                arg, // orgId
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();


                    if (!socket) {

                        return;
                    }

                    // Attach debug listener for ANY event (wildcard not standard in client, but we can log specific one)
                    // socket.onAny((event, ...args) => console.log(`[Socket Debug] Event: ${event}`, args));

                    const handleNewMessage = (message) => {

                        // Optional: Check if message belongs to this org (if arg provided)
                        if (arg && message.org_id && String(message.org_id) !== String(arg)) {
                            return;
                        }

                        updateCachedData((draft) => {

                            const existingConversation = draft.data.find(c => String(c._id) === String(message.user_id));

                            if (existingConversation) {

                                // Update existing conversation
                                existingConversation.lastMessage = message.content;
                                existingConversation.lastMessageTime = message.createdAt;
                                existingConversation.unreadCount += 1;

                                // Move to top
                                const index = draft.data.findIndex(c => String(c._id) === String(message.user_id));
                                if (index > 0) {
                                    const [moved] = draft.data.splice(index, 1);
                                    draft.data.unshift(moved);
                                }
                            } else {

                                // Add new conversation
                                draft.data.unshift({
                                    _id: message.user_id,
                                    lastMessage: message.content,
                                    lastMessageTime: message.createdAt,
                                    unreadCount: 1,
                                    userInfo: message.userInfo || { name: 'New User', email: 'Unknown' }
                                });
                            }
                        });
                    };

                    socket.on('new_helpdesk_message', handleNewMessage);

                    await cacheEntryRemoved;

                    socket.off('new_helpdesk_message', handleNewMessage);
                } catch (err) {
                    // console.error('Socket update error:', err);
                }
            },
        }),
        getMessages: builder.query({
            query: (arg) => {
                // Support object { userId, orgId } or string userId or undefined
                if (typeof arg === 'object' && arg !== null) {
                    const { userId, orgId } = arg;
                    const params = new URLSearchParams();
                    if (userId) params.append('user_id', userId);
                    if (orgId) params.append('org_id', orgId);
                    return `/messages?${params.toString()}`;
                }
                // Fallback for string or undefined
                return arg ? `/messages?user_id=${arg}` : '/messages';
            },
            providesTags: ['Message'],
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved, getState }
            ) {
                // Real-time updates via Socket.io
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();
                    const state = getState();
                    const user = state.auth.user;

                    if (!socket) return;

                    // Handler for Admin receiving new message from User
                    const handleNewMessage = (message) => {
                        let isViewingUser = false;

                        // Check if viewing specific user
                        if (typeof arg === 'object' && arg !== null) {
                            if (String(arg.userId) === String(message.user_id)) isViewingUser = true;
                        } else if (String(arg) === String(message.user_id)) {
                            isViewingUser = true;
                        }

                        // If Admin/Superadmin viewing the specific user who sent the message
                        if ((user?.role === 'admin_org' || user?.role === 'super_admin') && isViewingUser) {
                            updateCachedData((draft) => {
                                draft.data.push(message);
                            });
                        }
                    };

                    // Handler for User receiving reply from Admin
                    const handleReply = (message) => {
                        // If User viewing their own conversation
                        if (user?.role === 'user') {
                            updateCachedData((draft) => {
                                draft.data.push(message);
                            });
                        }
                        // If Admin/Superadmin is the sender (optimistic update separate, but this confirms receipt if needed)
                        // Actually replyMessage mutation handles optimistic/result update.
                        // But if multiple admins, we might want to see it?
                        // For now, only user sees helpdesk_response.
                    };

                    socket.on('new_helpdesk_message', handleNewMessage);
                    socket.on('helpdesk_response', handleReply);

                    await cacheEntryRemoved;

                    socket.off('new_helpdesk_message', handleNewMessage);
                    socket.off('helpdesk_response', handleReply);

                } catch (err) {
                    console.error('Socket update error:', err);
                }
            },
        }),
        sendMessage: builder.mutation({
            query: (data) => ({
                url: '/messages',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Message'], // Invalidate list to refresh last message in conversations
        }),
        replyMessage: builder.mutation({
            query: (data) => ({
                url: '/messages/reply',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Message'],
        }),
        getNotifications: builder.query({
            query: () => '/communication/notifications',
            providesTags: ['Notification'],
        }),
        createNotification: builder.mutation({
            query: (data) => ({
                url: '/communication/notifications',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notification'],
        }),
        createOrganization: builder.mutation({
            query: (data) => ({
                url: '/admin/organizations',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Organization'],
        }),
        updateOrganization: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/admin/organizations/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Organization'],
        }),
        deleteOrganization: builder.mutation({
            query: (id) => ({
                url: `/admin/organizations/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Organization'],
        }),
        getAdmins: builder.query({
            query: () => '/admin/admins',
            providesTags: ['Admin'],
        }),
        createAdmin: builder.mutation({
            query: (data) => ({
                url: '/admin/admins',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Admin', 'Organization'],
        }),
        updateAdmin: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/admin/admins/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Admin', 'Organization'],
        }),
        deleteAdmin: builder.mutation({
            query: (id) => ({
                url: `/admin/admins/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Admin', 'Organization'],
        }),
        getBonusCodes: builder.query({
            query: () => '/scores/codes',
            providesTags: ['BonusCode'],
        }),
        redeemBonusCode: builder.mutation({
            query: (data) => ({
                url: '/scores/redeem',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['User', 'Score'],
        }),
        createBonusCode: builder.mutation({
            query: (data) => ({
                url: '/scores/codes',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['BonusCode'],
        }),
        toggleBonusCode: builder.mutation({
            query: (id) => ({
                url: `/scores/codes/${id}/toggle`,
                method: 'PUT',
            }),
            invalidatesTags: ['BonusCode'],
        }),
        deleteBonusCode: builder.mutation({
            query: (id) => ({
                url: `/scores/codes/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['BonusCode'],
        }),
        sendEmail: builder.mutation({
            query: (data) => ({
                url: '/communication/email',
                method: 'POST',
                body: data,
            }),
        }),

        // ==============================
        // Page Content Endpoints
        // ==============================

        // Get all page content for admin's organization
        getAllPageContent: builder.query({
            query: () => '/admin/content',
            providesTags: ['PageContent'],
        }),

        // Get specific page content
        getPageContent: builder.query({
            query: (pageType) => `/admin/content/${pageType}`,
            providesTags: (result, error, pageType) => [{ type: 'PageContent', id: pageType }],
        }),

        // Update page content (save draft)
        updatePageContent: builder.mutation({
            query: ({ pageType, content }) => ({
                url: `/admin/content/${pageType}`,
                method: 'PUT',
                body: { content },
            }),
            invalidatesTags: (result, error, { pageType }) => [
                { type: 'PageContent', id: pageType },
                'PageContent'
            ],
        }),

        // Publish page content
        publishPageContent: builder.mutation({
            query: (pageType) => ({
                url: `/admin/content/${pageType}/publish`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, pageType) => [
                { type: 'PageContent', id: pageType },
                'PageContent'
            ],
        }),

        // Unpublish page content
        unpublishPageContent: builder.mutation({
            query: (pageType) => ({
                url: `/admin/content/${pageType}/unpublish`,
                method: 'POST',
            }),
            invalidatesTags: (result, error, pageType) => [
                { type: 'PageContent', id: pageType },
                'PageContent'
            ],
        }),

        // ==============================
        // Public Content Endpoints
        // ==============================

        // Get all published content for an organization (public)
        getPublicAllContent: builder.query({
            query: (orgSlug) => `/public/${orgSlug}/content`,
            providesTags: ['PageContent'],
        }),

        // Get specific published page content (public)
        getPublicPageContent: builder.query({
            query: ({ orgSlug, pageType }) => `/public/${orgSlug}/content/${pageType}`,
            providesTags: (result, error, { pageType }) => [{ type: 'PageContent', id: `public-${pageType}` }],
        }),

        // ==============================
        // Super Admin - Org Content Management
        // ==============================

        // Get all content for a specific organization
        getOrgAllContent: builder.query({
            query: (orgId) => `/admin/content/organizations/${orgId}/content`,
            providesTags: ['PageContent'],
        }),

        // Get specific page content for an organization
        getOrgPageContent: builder.query({
            query: ({ orgId, pageType }) => `/admin/content/organizations/${orgId}/content/${pageType}`,
            providesTags: (result, error, { orgId, pageType }) => [{ type: 'PageContent', id: `${orgId}-${pageType}` }],
        }),

        // Update content for a specific organization
        updateOrgPageContent: builder.mutation({
            query: ({ orgId, pageType, content, publish }) => ({
                url: `/admin/content/organizations/${orgId}/content/${pageType}`,
                method: 'PUT',
                body: { content, publish },
            }),
            invalidatesTags: (result, error, { orgId, pageType }) => [
                { type: 'PageContent', id: `${orgId}-${pageType}` },
                'PageContent'
            ],
        }),

        // ==============================
        // Email Management
        // ==============================

        // Send bulk email
        sendBulkEmail: builder.mutation({
            query: (data) => ({
                url: '/admin/emails/send',
                method: 'POST',
                body: data,
            }),
        }),

        // Get sent emails history
        getSentEmails: builder.query({
            query: (params) => ({
                url: '/admin/emails',
                params,
            }),
        }),

        // Get unregistered users (emails sent but not registered)
        getUnregisteredUsers: builder.query({
            query: () => '/admin/emails/unregistered',
        }),

        // Get sent email details
        getSentEmailDetails: builder.query({
            query: (id) => `/admin/emails/${id}`,
        }),
    }),
});

export const {
    useLoginMutation,
    useUserLoginMutation,
    useRegisterMutation,
    useLogoutMutation,
    useGetMeQuery,
    // Admin
    useGetDashboardStatsQuery,
    useGetOrganizationsQuery,
    useGetOrganizationBySlugQuery,
    useGetOrganizationByIdQuery,
    useGetPublicOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useDeleteOrganizationMutation,
    useGetAdminsQuery,
    useCreateAdminMutation,
    useUpdateAdminMutation,
    useDeleteAdminMutation,
    useGetBonusCodesQuery,
    useRedeemBonusCodeMutation,
    useCreateBonusCodeMutation,
    useToggleBonusCodeMutation,
    useDeleteBonusCodeMutation,
    useGetUsersQuery,
    useCreateUserMutation,
    useUpdateUserMutation,
    useDeleteUserMutation,
    // Promoter Management
    useGetPromotersQuery,
    useCreatePromoterMutation,
    useUpdatePromoterMutation,
    useDeletePromoterMutation,
    // Promoter App
    useScanUserMutation,
    useGetPromoterStatsQuery,
    // Score
    useGetLeaderboardQuery,
    // Content
    useGetGalleryQuery,
    useUploadGalleryItemMutation,
    useDeleteGalleryItemMutation,
    useDeleteGalleryItemsMutation,
    useDownloadGalleryMutation,
    // Communication
    useGetConversationsQuery,
    useGetMessagesQuery,
    useSendMessageMutation,
    useReplyMessageMutation,
    useResetMessagesMutation,
    useGetNotificationsQuery,
    useCreateNotificationMutation,
    useSendEmailMutation,
    // Page Content
    useGetAllPageContentQuery,
    useGetPageContentQuery,
    useUpdatePageContentMutation,
    usePublishPageContentMutation,
    useUnpublishPageContentMutation,
    // Public Content
    useGetPublicAllContentQuery,
    useGetPublicPageContentQuery,
    // Super Admin Org Content
    useGetOrgAllContentQuery,
    useGetOrgPageContentQuery,
    useUpdateOrgPageContentMutation,
    // Registration Fields
    useGetRegistrationFieldsQuery,
    useUpdateRegistrationFieldsMutation,
    // Email Management
    useSendBulkEmailMutation,
    useGetSentEmailsQuery,
    useGetUnregisteredUsersQuery,
    useGetSentEmailDetailsQuery,
    // QR Code Generation
    useGenerateMissingQRCodesMutation,
    // File Uploads
    useUploadGovtIdMutation,
    useAddBookingMutation,
    useDeleteBookingMutation
} = apiSlice;
