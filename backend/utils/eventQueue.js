// In-memory Queue for processing Socket emissions in batches
// Prevents Node.js event loop block when 1000 users emit simultaneously.

class EventQueue {
    constructor(batchSize = 25, intervalMs = 1000) {
        this.queue = [];
        this.isProcessing = false;
        this.batchSize = batchSize; // Number of broadcasts per interval
        this.intervalMs = intervalMs;
    }

    /**
     * Enqueue a socket emission
     * @param {string} roomOrUser - The target room or user socket ID
     * @param {string} eventName - The socket event name (e.g., 'poll_status_update')
     * @param {any} data - The payload to send
     */
    enqueue(roomOrUser, eventName, data) {
        this.queue.push({ roomOrUser, eventName, data });
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    processQueue() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const io = global.io;
        if (!io) {
            console.warn('Socket.io instance not globally available on global.io');
            // Check again shortly
            setTimeout(() => this.processQueue(), this.intervalMs);
            return;
        }

        // Dequeue a batch and emit
        const batch = this.queue.splice(0, this.batchSize);
        batch.forEach(({ roomOrUser, eventName, data }) => {
            try {
                io.to(roomOrUser).emit(eventName, data);
            } catch (e) {
                console.error(`Queue emit failed for event: ${eventName}`, e);
            }
        });

        // Continue processing if elements remain
        if (this.queue.length > 0) {
            setTimeout(() => this.processQueue(), this.intervalMs);
        } else {
            this.isProcessing = false;
        }
    }
}

// Instantiate a global instance, tuning the batching specifically for avoiding bottlenecks
// 50 operations per 500ms -> 100 per sec -> Scales gracefully without stalling the HTTP threads.
const globalEventQueue = new EventQueue(50, 500);

module.exports = globalEventQueue;
