const mongoose = require('mongoose');

/**
 * PageContent Schema
 * Stores structured page content for each public page type per organization.
 * 
 * Design:
 * - One document per page type per organization (enforced by compound unique index)
 * - Content stored as Mixed type to accommodate different page structures
 * - Supports draft/published workflow via isPublished flag
 * - Tracks modifications for audit trail
 */
const pageContentSchema = new mongoose.Schema({
    org_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: [true, 'Organization ID is required'],
        index: true
    },
    pageType: {
        type: String,
        enum: ['home', 'agenda', 'venue', 'faq', 'funzone', 'helpdesk'],
        required: [true, 'Page type is required']
    },
    content: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Content is required'],
        default: {}
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Compound unique index: one document per page type per org
pageContentSchema.index({ org_id: 1, pageType: 1 }, { unique: true });

// Pre-save hook to increment version on updates
pageContentSchema.pre('save', function (next) {
    if (!this.isNew && this.isModified('content')) {
        this.version += 1;
    }
    next();
});

// Static method to get default content for a page type
pageContentSchema.statics.getDefaultContent = function (pageType) {
    const defaults = {
        home: {
            heroText: 'Join us for an unforgettable event where power takes center stage and celebrations turn into memorable moments.',
            countdownDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
            aboutTitle: 'About The Event',
            aboutDescription: 'Event details are coming soon. Please check back later.',
            cards: [
                { id: 'card-1', icon: 'calendar', title: 'Date', description: 'TBA' },
                { id: 'card-2', icon: 'dress', title: 'Dress Code', description: 'Business casual' },
                { id: 'card-3', icon: 'hotel', title: 'Hotel', description: 'TBA' },
                { id: 'card-4', icon: 'contact', title: 'Contact us', description: '' },
            ]
        },
        agenda: {
            heroText: 'Three days of inspiring sessions, networking opportunities, and unforgettable experiences.',
            days: [
                {
                    id: 'day-1',
                    title: 'Day 1',
                    date: 'Coming Soon',
                    events: [
                        {
                            id: 'evt-1',
                            time: '9:00 AM - 10:00 AM',
                            title: 'Registration & Check-in',
                            location: 'Main Lobby',
                            description: 'Pick up your badges and welcome kit.',
                            dressCode: 'Casual',
                            images: []
                        },
                        {
                            id: 'evt-2',
                            time: '10:00 AM - 11:30 AM',
                            title: 'Opening Ceremony',
                            location: 'Grand Hall',
                            description: 'Official start of the event with guest speakers.',
                            dressCode: 'Formal',
                            images: []
                        }
                    ]
                }
            ]
        },
        venue: {
            eventVenue: {
                title: 'Event Venue',
                address: 'Address to be announced.',
                googleMapsLink: '',
                appleMapsLink: '',
            },
            accommodation: {
                title: 'Accommodation',
                description: 'Accommodation details coming soon.',
                details: '',
                disclaimer: '',
                hotelLink: '',
                images: ['', '', '', ''],
            },
            inclusions: ['All Meals', 'Complimentary Wi-Fi'],
            exclusions: ['Room Service', 'Mini Bar'],
            exclusionDisclaimer: 'Please note additional services will be payable by the guest.',
            complimentaryFacilities: {
                title: 'Complimentary Breakfast',
                items: [
                    { icon: 'location', text: 'Location: Restaurant' },
                    { icon: 'time', text: 'Time: 7:30 am to 9:00 am' },
                ],
            },
        },
        faq: {
            items: [
                { id: 'faq-1', question: 'How do I register for the event?', answer: 'You can register by clicking the "Register" button on our website.' },
                { id: 'faq-2', question: 'What should I bring?', answer: 'Please bring your QR code (printed or on your phone) and a valid ID.' },
            ]
        },
        funzone: {
            description: 'Enjoy some activities',
            activities: [
                { id: 'act-1', title: 'Travel Trivia', description: 'Test your knowledge of world destinations.', icon: '🌍', type: 'online', link: '', duration: '5 min', players: '1-4' },
            ]
        },
        helpdesk: {
            phone: '+1 (555) 123-4567',
            email: 'support@example.com'
        }
    };

    return defaults[pageType] || {};
};

module.exports = mongoose.model('PageContent', pageContentSchema);
