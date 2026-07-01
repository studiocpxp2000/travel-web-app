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
    tagTypes: ['User', 'Organization', 'Admin', 'Promoter', 'Gallery', 'Score', 'BonusCode', 'Message', 'Notification', 'PageContent', 'WallPost', 'Poll', 'Feedback', 'FeedbackSettings'],
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
        getLocations: builder.query({
            query: () => '/admin/locations',
            providesTags: ['User'],
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
        updateMe: builder.mutation({
            query: (data) => ({
                url: '/users/profile/me',
                method: 'PUT',
                body: data,
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
            query: (params) => ({
                url: '/admin/promoters',
                params,
            }),
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
            query: (params) => ({
                url: '/admin/registration-fields',
                params,
            }),
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
        getAdminLeaderboard: builder.query({
            query: (params) => ({
                url: '/scores/admin/leaderboard',
                params, // Allow org_id or org_slug
            }),
            providesTags: ['Score'],
        }),
        updateScore: builder.mutation({
            query: ({ id, ...data }) => ({
                url: `/scores/admin/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Score'],
        }),
        deleteScore: builder.mutation({
            query: (id) => ({
                url: `/scores/admin/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Score'],
        }),
        getMyScore: builder.query({
            query: () => '/scores/my-score',
            providesTags: ['Score'],
        }),

        // Content Endpoints
        getGallery: builder.query({
            query: (params) => ({
                url: '/gallery',
                params,
            }),
            providesTags: ['Gallery'],
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();
                    if (!socket) return;

                    // Direct cache update: new item added
                    const handleGalleryUpdate = (newItem) => {
                        updateCachedData((draft) => {
                            // Add to the beginning (newest first)
                            if (draft.data && !draft.data.find(i => i._id === newItem._id)) {
                                draft.data.unshift(newItem);
                                draft.count = (draft.count || 0) + 1;
                            }
                        });
                    };

                    // Direct cache update: single item deleted
                    const handleGalleryDelete = (deletedId) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                draft.data = draft.data.filter(i => String(i._id) !== String(deletedId));
                                draft.count = draft.data.length;
                            }
                        });
                    };

                    // Direct cache update: bulk items deleted
                    const handleGalleryDeleteBulk = (deletedIds) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                const idSet = new Set(deletedIds.map(String));
                                draft.data = draft.data.filter(i => !idSet.has(String(i._id)));
                                draft.count = draft.data.length;
                            }
                        });
                    };

                    socket.on('gallery_update', handleGalleryUpdate);
                    socket.on('gallery_delete', handleGalleryDelete);
                    socket.on('gallery_delete_bulk', handleGalleryDeleteBulk);

                    await cacheEntryRemoved;

                    socket.off('gallery_update', handleGalleryUpdate);
                    socket.off('gallery_delete', handleGalleryDelete);
                    socket.off('gallery_delete_bulk', handleGalleryDeleteBulk);
                } catch (err) {
                    // Silently handle - cache entry may have been removed
                }
            },
        }),
        uploadGalleryItem: builder.mutation({
            query: (formData) => ({
                url: '/gallery',
                method: 'POST',
                body: formData,
            }),
        }),
        deleteGalleryItem: builder.mutation({
            query: (id) => ({
                url: `/gallery/${id}`,
                method: 'DELETE',
            }),
        }),
        deleteGalleryItems: builder.mutation({
            query: (ids) => ({
                url: '/gallery/delete',
                method: 'POST',
                body: { ids },
            }),
        }),

        // ==============================
        // Social Wall Endpoints
        // ==============================

        getWallPosts: builder.query({
            query: (params) => ({
                url: '/wall',
                params, // { slug }
            }),
            providesTags: ['WallPost'],
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();
                    if (!socket) return;

                    // New post pushed to the top
                    const handlePostNew = (post) => {
                        updateCachedData((draft) => {
                            if (draft.data && !draft.data.find(p => p._id === post._id)) {
                                draft.data.unshift(post);
                                draft.count = (draft.count || 0) + 1;
                            }
                        });
                    };

                    // Remove deleted post
                    const handlePostDeleted = (postId) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                draft.data = draft.data.filter(p => String(p._id) !== String(postId));
                                draft.count = draft.data.length;
                            }
                        });
                    };

                    // Update caption on edited post
                    const handlePostUpdated = (post) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                const idx = draft.data.findIndex(p => String(p._id) === String(post._id));
                                if (idx !== -1) draft.data[idx] = post;
                            }
                        });
                    };

                    // Reflect admin feature-flag changes in real time
                    const handleSettingsChanged = ({ wall_enabled, wall_upload_enabled }) => {
                        updateCachedData((draft) => {
                            draft.wall_enabled = wall_enabled;
                            draft.wall_upload_enabled = wall_upload_enabled;
                        });
                    };

                    socket.on('wall_post_new', handlePostNew);
                    socket.on('wall_post_deleted', handlePostDeleted);
                    socket.on('wall_post_updated', handlePostUpdated);
                    socket.on('wall_settings_changed', handleSettingsChanged);

                    await cacheEntryRemoved;

                    socket.off('wall_post_new', handlePostNew);
                    socket.off('wall_post_deleted', handlePostDeleted);
                    socket.off('wall_post_updated', handlePostUpdated);
                    socket.off('wall_settings_changed', handleSettingsChanged);
                } catch (err) {
                    // Silently handle — cache entry may have been removed
                }
            },
        }),

        uploadWallPost: builder.mutation({
            query: (formData) => ({
                url: '/wall',
                method: 'POST',
                body: formData,
            }),
        }),

        deleteWallPost: builder.mutation({
            query: (id) => ({
                url: `/wall/${id}`,
                method: 'DELETE',
            }),
        }),

        toggleWallFeature: builder.mutation({
            query: (settings) => ({
                url: '/wall/settings',
                method: 'PUT',
                body: settings, // { wall_enabled?, wall_upload_enabled?, org_slug? }
            }),
            invalidatesTags: ['Organization'],
        }),

        downloadWallPosts: builder.mutation({
            query: (data) => ({
                url: '/wall/download',
                method: 'POST',
                body: data,
                responseHandler: (response) => response.blob(),
            }),
        }),

        adminUploadWallPosts: builder.mutation({
            query: (formData) => ({
                url: '/wall/admin-upload',
                method: 'POST',
                body: formData,
            }),
        }),

        deleteWallPosts: builder.mutation({
            query: (ids) => ({
                url: '/wall/delete',
                method: 'POST',
                body: { ids },
            }),
        }),

        // ─── Polling Endpoints ───────────────────────────────────────────

        getPolls: builder.query({
            query: ({ slug }) => `/polls?slug=${slug}`,
            providesTags: ['Poll'],
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();
                    if (!socket) return;

                    const handleVoteUpdate = (update) => {
                        updateCachedData((draft) => {
                            if (!draft.data) return;
                            const poll = draft.data.find(p => String(p._id) === String(update._id));
                            if (poll) {
                                poll.options = update.options;
                                poll.totalVotes = update.totalVotes;
                            }
                        });
                    };

                    const handlePollCreated = (newPoll) => {
                        updateCachedData((draft) => {
                            if (draft.data && !draft.data.find(p => p._id === newPoll._id)) {
                                draft.data.unshift(newPoll);
                            }
                        });
                    };

                    const handlePollDeleted = ({ _id }) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                draft.data = draft.data.filter(p => String(p._id) !== String(_id));
                            }
                        });
                    };

                    const handlePollStatusUpdate = ({ _id, status }) => {
                        updateCachedData((draft) => {
                            if (!draft.data) return;
                            const poll = draft.data.find(p => String(p._id) === String(_id));
                            if (poll) poll.status = status;
                        });
                    };

                    const handlePollArchived = ({ _id }) => {
                        updateCachedData((draft) => {
                            if (draft.data) {
                                draft.data = draft.data.filter(p => String(p._id) !== String(_id));
                            }
                        });
                    };

                    const handleConfigUpdated = ({ live_engagement_enabled, quizzes }) => {
                        updateCachedData((draft) => {
                            if (draft) {
                                draft.live_engagement_enabled = live_engagement_enabled;
                                draft.quizzes = quizzes;
                            }
                        });
                    };

                    socket.on('poll_vote_update', handleVoteUpdate);
                    socket.on('poll_created', handlePollCreated);
                    socket.on('poll_deleted', handlePollDeleted);
                    socket.on('poll_status_update', handlePollStatusUpdate);
                    socket.on('poll_archived', handlePollArchived);
                    socket.on('live_engagement_config_updated', handleConfigUpdated);

                    await cacheEntryRemoved;

                    socket.off('poll_vote_update', handleVoteUpdate);
                    socket.off('poll_created', handlePollCreated);
                    socket.off('poll_deleted', handlePollDeleted);
                    socket.off('poll_status_update', handlePollStatusUpdate);
                    socket.off('live_engagement_config_updated', handleConfigUpdated);
                } catch (err) {
                    console.error("Cache entry error: ", err);
                    // cache entry removed before data loaded
                }
            }
        }),

        createPoll: builder.mutation({
            query: (formData) => ({
                url: '/polls',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Poll'],
        }),

        votePoll: builder.mutation({
            query: ({ id, optionIndex }) => ({
                url: `/polls/${id}/vote`,
                method: 'POST',
                body: { optionIndex },
            }),
            invalidatesTags: ['Poll'],
        }),

        togglePollStatus: builder.mutation({
            query: (id) => ({
                url: `/polls/${id}/status`,
                method: 'PUT',
            }),
            invalidatesTags: ['Poll'],
        }),

        toggleLiveEngagementFeature: builder.mutation({
            query: (data) => ({
                url: '/polls/feature',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Poll'],
        }),

        archivePoll: builder.mutation({
            query: (id) => ({
                url: `/polls/${id}/archive`,
                method: 'PUT',
            }),
            invalidatesTags: ['Poll'],
        }),

        deletePoll: builder.mutation({
            query: (id) => ({
                url: `/polls/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Poll'],
        }),

        addQuiz: builder.mutation({
            query: (data) => ({
                url: '/polls/quizzes',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Poll'],
        }),

        updateQuiz: builder.mutation({
            query: ({ quizId, ...data }) => ({
                url: `/polls/quizzes/${quizId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Poll'],
        }),

        deleteQuiz: builder.mutation({
            query: ({ quizId, ...data }) => ({
                url: `/polls/quizzes/${quizId}`,
                method: 'DELETE',
                body: data,
            }),
            invalidatesTags: ['Poll'],
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
            query: (arg) => {
                const params = new URLSearchParams();
                if (typeof arg === 'object' && arg !== null) {
                    if (arg.orgId) params.append('org_id', arg.orgId);
                    if (arg.type) params.append('type', arg.type);
                } else if (arg) {
                    params.append('org_id', arg);
                }
                return `/notifications?${params.toString()}`;
            },
            providesTags: ['Notification'],
            async onCacheEntryAdded(
                arg,
                { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
            ) {
                try {
                    await cacheDataLoaded;
                    const socket = getSocket();

                    if (!socket) return;

                    const handleNotification = (notification) => {
                        updateCachedData((draft) => {
                            // Add new notification to the top of the list
                            draft.data.unshift(notification);
                        });
                    };

                    socket.on('notification', handleNotification);

                    await cacheEntryRemoved;

                    socket.off('notification', handleNotification);
                } catch (err) {
                    // console.error('Socket update error:', err);
                }
            },
        }),
        createNotification: builder.mutation({
            query: (data) => ({
                url: '/notifications',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notification'],
        }),
        sendGlobalPushNotification: builder.mutation({
            query: (data) => ({
                url: '/notifications/send-global',
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Notification'],
        }),
        deleteNotification: builder.mutation({
            query: (id) => ({
                url: `/notifications/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Notification'],
        }),
        resetNotifications: builder.mutation({
            query: (arg) => {
                const params = new URLSearchParams();
                if (typeof arg === 'object' && arg !== null) {
                    if (arg.orgId) params.append('org_id', arg.orgId);
                    if (arg.type) params.append('type', arg.type);
                } else if (arg) {
                    params.append('org_id', arg);
                }
                return {
                    url: `/notifications/reset?${params.toString()}`,
                    method: 'DELETE',
                };
            },
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
        uploadOrganizationLogo: builder.mutation({
            query: ({ id, file }) => {
                const formData = new FormData();
                formData.append('logo', file);
                return {
                    url: `/admin/organizations/${id}/logo`,
                    method: 'PUT',
                    body: formData,
                };
            },
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
            query: (params) => ({
                url: '/scores/codes',
                params,
            }),
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

        // Upload content image
        uploadPageContentImage: builder.mutation({
            query: (formData) => ({
                url: '/admin/content/upload',
                method: 'POST',
                body: formData,
            }),
        }),

        // Delete content image
        deletePageContentImage: builder.mutation({
            query: (url) => ({
                url: '/admin/content/delete-image',
                method: 'POST',
                body: { url },
            }),
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

        // Get unregistered users (isRegistered: false in Users table)
        getUnregisteredUsers: builder.query({
            query: (params) => ({
                url: '/admin/emails/unregistered',
                params,
            }),
        }),

        getSentEmailDetails: builder.query({
            query: (id) => `/admin/emails/${id}`,
        }),

        // ==============================
        // Feedback System
        // ==============================

        // Admin: Get Feedback Settings
        getFeedbackSettings: builder.query({
            query: (orgSlug) => orgSlug ? `/feedback/admin/settings?orgSlug=${orgSlug}` : '/feedback/admin/settings',
            providesTags: ['FeedbackSettings'],
        }),

        // Admin: Update Feedback Settings
        updateFeedbackSettings: builder.mutation({
            query: ({ orgSlug, ...data }) => ({
                url: orgSlug ? `/feedback/admin/settings?orgSlug=${orgSlug}` : '/feedback/admin/settings',
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['FeedbackSettings', 'Feedback'],
        }),

        // Admin: Get Feedback Responses
        getFeedbackResponses: builder.query({
            query: ({ orgSlug, ...params }) => ({
                url: orgSlug ? `/feedback/admin/responses?orgSlug=${orgSlug}` : '/feedback/admin/responses',
                params,
            }),
            providesTags: ['Feedback'],
        }),

        // Admin: Update Single Feedback Response
        updateFeedbackResponse: builder.mutation({
            query: ({ id, orgSlug, data }) => ({
                url: orgSlug ? `/feedback/admin/responses/${id}?orgSlug=${orgSlug}` : `/feedback/admin/responses/${id}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: ['Feedback'],
        }),

        // Admin: Delete Single Feedback Response
        deleteFeedbackResponse: builder.mutation({
            query: ({ id, orgSlug }) => ({
                url: orgSlug ? `/feedback/admin/responses/${id}?orgSlug=${orgSlug}` : `/feedback/admin/responses/${id}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Feedback'],
        }),

        // Admin: Download Feedback Report (Excel) - Note: RTK Query isn't ideal for blob downloads, so we'll likely hit this directly via fetch/window.location, but keeping it here for consistency if needed.

        // Public: Get Feedback Form
        getPublicFeedbackForm: builder.query({
            query: (orgSlug) => `/feedback/public/${orgSlug}`,
            providesTags: ['FeedbackSettings'],
        }),

        // Public: Submit Feedback
        submitFeedback: builder.mutation({
            query: ({ orgSlug, data }) => ({
                url: `/feedback/public/${orgSlug}/submit`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['Feedback'], // Invalidate admin list if they are looking at it
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
    useGetLocationsQuery,
    useGetOrganizationsQuery,
    useGetOrganizationBySlugQuery,
    useGetOrganizationByIdQuery,
    useGetPublicOrganizationsQuery,
    useCreateOrganizationMutation,
    useUpdateOrganizationMutation,
    useDeleteOrganizationMutation,
    useUploadOrganizationLogoMutation,
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
    useUpdateMeMutation,
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
    useGetAdminLeaderboardQuery,
    useGetMyScoreQuery,
    useUpdateScoreMutation,
    useDeleteScoreMutation,
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
    useSendGlobalPushNotificationMutation,
    useDeleteNotificationMutation,
    useResetNotificationsMutation,
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
    // Email
    useSendBulkEmailMutation,
    useGetSentEmailsQuery,
    useGetUnregisteredUsersQuery,
    useLazyGetUnregisteredUsersQuery,
    useGetSentEmailDetailsQuery,
    useLazyGetSentEmailDetailsQuery,
    // Page Content Assets
    useUploadPageContentImageMutation,
    useDeletePageContentImageMutation,
    // Registration Fields
    useGetRegistrationFieldsQuery,
    useUpdateRegistrationFieldsMutation,
    // QR Code Generation
    useGenerateMissingQRCodesMutation,
    // File Uploads
    useUploadGovtIdMutation,
    useAddBookingMutation,
    useDeleteBookingMutation,
    // Social Wall
    useGetWallPostsQuery,
    useUploadWallPostMutation,

    useDeleteWallPostMutation,
    useToggleWallFeatureMutation,
    useDownloadWallPostsMutation,
    useAdminUploadWallPostsMutation,
    useDeleteWallPostsMutation,
    // Polls / Live Engagement
    useGetPollsQuery,
    useCreatePollMutation,
    useVotePollMutation,
    useTogglePollStatusMutation,
    useToggleLiveEngagementFeatureMutation,
    useArchivePollMutation,
    useDeletePollMutation,
    useAddQuizMutation,
    useUpdateQuizMutation,
    useDeleteQuizMutation,
    // Feedback
    useGetFeedbackSettingsQuery,
    useUpdateFeedbackSettingsMutation,
    useGetFeedbackResponsesQuery,
    useUpdateFeedbackResponseMutation,
    useDeleteFeedbackResponseMutation,
    useGetPublicFeedbackFormQuery,
    useSubmitFeedbackMutation
} = apiSlice;
