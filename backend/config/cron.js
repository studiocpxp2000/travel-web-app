const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { getMessaging } = require('firebase-admin/messaging');

const startCronJobs = () => {
    // Run every minute (60000 ms)
    setInterval(async () => {
        if (mongoose.connection.readyState !== 1) return;

        try {
            const now = new Date();
            
            // Find scheduled notifications that are due to be sent
            const dueNotifications = await Notification.find({
                type: 'mobile',
                isSent: false,
                scheduledFor: { $lte: now, $ne: null }
            });

            if (dueNotifications.length === 0) return;

            console.log(`[Cron] Found ${dueNotifications.length} scheduled notifications to send.`);

            for (const notification of dueNotifications) {
                try {
                    // Get tokens for the org
                    const userQuery = { org_id: notification.org_id, fcmToken: { $exists: true, $ne: null } };
                    
                    if (notification.target_user_ids && notification.target_user_ids.length > 0) {
                        userQuery._id = { $in: notification.target_user_ids };
                    }
                    
                    const users = await User.find(userQuery).select('fcmToken');
                    const tokens = users.map(u => u.fcmToken).filter(Boolean);

                    if (tokens.length > 0) {
                        const payload = {
                            notification: {
                                title: notification.title,
                                body: notification.message,
                            },
                            data: {}
                        };
                        
                        if (notification.redirectUrl) {
                            payload.data.route = notification.redirectUrl;
                        }

                        const response = await getMessaging().sendEachForMulticast({
                            tokens,
                            notification: payload.notification,
                            data: payload.data
                        });
                        
                        console.log(`[Cron] Sent scheduled notification to ${response.successCount} devices.`);
                    }

                    // Mark as sent regardless of whether devices were found (to prevent infinite retries)
                    notification.isSent = true;
                    await notification.save();

                } catch (err) {
                    console.error(`[Cron] Error sending scheduled notification ${notification._id}:`, err);
                }
            }
        } catch (error) {
            console.error('[Cron] Error sweeping scheduled notifications:', error);
        }
    }, 60000);
};

module.exports = { startCronJobs };
