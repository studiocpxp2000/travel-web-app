/**
 * Seed Default Page Content
 * 
 * This script creates default page content for all organizations.
 * Run: node scripts/seed_page_content.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Models
const Organization = require('../models/Organization');
const PageContent = require('../models/PageContent');

// Realistic default content for each page type
const defaultContents = {
    home: {
        heroText: 'Join us for an unforgettable event where power takes center stage and celebrations turn into memorable moments.',
        countdownDate: '2026-03-15T09:00:00',
        aboutTitle: 'About The Event',
        aboutDescription: 'This exclusive gathering brings together industry leaders, innovators, and visionaries for three days of inspiring sessions, networking opportunities, and unforgettable experiences.',
        cards: [
            { id: 'card-1', icon: 'calendar', title: 'Date', description: 'March 15-17, 2026' },
            { id: 'card-2', icon: 'dress', title: 'Dress Code', description: 'Business casual (refer to dress code for specific days)' },
            { id: 'card-3', icon: 'hotel', title: 'Hotel', description: 'Hyatt Regency' },
            { id: 'card-4', icon: 'contact', title: 'Contact us', description: 'support@event.com' },
        ]
    },
    agenda: {
        heroText: 'Three days of inspiring sessions, networking opportunities, and unforgettable experiences.',
        days: [
            {
                id: 'day-1',
                title: 'Day 1',
                date: 'March 15, 2026',
                events: [
                    {
                        id: 'evt-1-1',
                        time: '9:00 AM - 10:00 AM',
                        title: 'Registration & Check-in',
                        location: 'Main Lobby',
                        description: 'Pick up your badges and welcome kit. Meet the organizing team and network with fellow attendees.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-1-2',
                        time: '10:00 AM - 11:30 AM',
                        title: 'Opening Ceremony',
                        location: 'Grand Hall',
                        description: 'Official start of the event with keynote speeches from industry leaders.',
                        dressCode: 'Formal',
                        images: []
                    },
                    {
                        id: 'evt-1-3',
                        time: '11:45 AM - 1:00 PM',
                        title: 'Keynote: Future of Travel',
                        location: 'Grand Hall',
                        description: 'Insights into global travel trends for the coming decade.',
                        dressCode: 'Business Casual',
                        images: []
                    },
                    {
                        id: 'evt-1-4',
                        time: '1:00 PM - 2:00 PM',
                        title: 'Networking Lunch',
                        location: 'Dining Area',
                        description: 'Enjoy a buffet lunch while networking with fellow attendees.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-1-5',
                        time: '2:30 PM - 4:00 PM',
                        title: 'Panel Discussion: Sustainable Tourism',
                        location: 'Room A',
                        description: 'Experts discuss the impact of tourism on the environment and sustainable practices.',
                        dressCode: 'Business Casual',
                        images: []
                    },
                    {
                        id: 'evt-1-6',
                        time: '7:00 PM - 10:00 PM',
                        title: 'Welcome Dinner',
                        location: 'Rooftop Restaurant',
                        description: 'An elegant dinner to kick off the event with great food and entertainment.',
                        dressCode: 'Smart Casual',
                        images: []
                    }
                ]
            },
            {
                id: 'day-2',
                title: 'Day 2',
                date: 'March 16, 2026',
                events: [
                    {
                        id: 'evt-2-1',
                        time: '8:00 AM - 9:00 AM',
                        title: 'Morning Yoga',
                        location: 'Garden',
                        description: 'Start your day with a refreshing yoga session led by a certified instructor.',
                        dressCode: 'Sportswear',
                        images: []
                    },
                    {
                        id: 'evt-2-2',
                        time: '9:30 AM - 11:00 AM',
                        title: 'Workshop: Travel Photography',
                        location: 'Room B',
                        description: 'Learn tips and tricks for capturing stunning travel photos from professional photographers.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-3',
                        time: '11:30 AM - 1:00 PM',
                        title: 'Tech in Tourism',
                        location: 'Room C',
                        description: 'Exploring how technology is reshaping the travel industry with AI, VR, and mobile solutions.',
                        dressCode: 'Business Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-4',
                        time: '1:00 PM - 2:00 PM',
                        title: 'Lunch Break',
                        location: 'Dining Area',
                        description: 'Refuel and relax with a variety of cuisines.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-5',
                        time: '2:30 PM - 5:00 PM',
                        title: 'Breakout Sessions',
                        location: 'Various Rooms',
                        description: 'Choose from a variety of specialized sessions based on your interests.',
                        dressCode: 'Business Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-6',
                        time: '7:00 PM - 11:00 PM',
                        title: 'Gala Night',
                        location: 'Ballroom',
                        description: 'A night of celebration, dining, entertainment, and awards ceremony.',
                        dressCode: 'Black Tie',
                        images: []
                    }
                ]
            },
            {
                id: 'day-3',
                title: 'Day 3',
                date: 'March 17, 2026',
                events: [
                    {
                        id: 'evt-3-1',
                        time: '9:00 AM - 10:30 AM',
                        title: 'Leadership Insights',
                        location: 'Grand Hall',
                        description: 'Learn from top executives about leadership in the modern business landscape.',
                        dressCode: 'Business Casual',
                        images: []
                    },
                    {
                        id: 'evt-3-2',
                        time: '11:00 AM - 12:30 PM',
                        title: 'Closing Ceremony',
                        location: 'Grand Hall',
                        description: 'Wrap up the event with final remarks, acknowledgments, and announcements.',
                        dressCode: 'Formal',
                        images: []
                    },
                    {
                        id: 'evt-3-3',
                        time: '12:30 PM - 2:00 PM',
                        title: 'Farewell Lunch',
                        location: 'Dining Area',
                        description: 'Final networking opportunity over a delicious farewell lunch.',
                        dressCode: 'Casual',
                        images: []
                    }
                ]
            }
        ]
    },
    venue: {
        eventVenue: {
            title: 'Event Venue',
            address: 'Grand Convention Center, 123 Business District, Mumbai, Maharashtra 400001',
            googleMapsLink: 'https://maps.google.com/?q=Grand+Convention+Center+Mumbai',
            appleMapsLink: 'https://maps.apple.com/?q=Grand+Convention+Center+Mumbai',
        },
        accommodation: {
            title: 'Accommodation: Hyatt Regency',
            description: 'We welcome you to Hyatt Regency, a premium 5-star business hotel with world-class event spaces., conveniently located in the heart of the business district.',
            details: 'Upon arrival, you will be greeted by our team to check in. Your stay includes bed and breakfast. The room will be assigned upon arrival based on availability.',
            disclaimer: 'The hotel room is assigned strictly against occupancy. We do not permit additional guests.',
            hotelLink: 'https://www.hyatt.com',
            images: [
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1600',
                'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1600',
                'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1600',
                ''
            ],
        },
        inclusions: [
            'All Meals (Breakfast, Lunch, Dinner)',
            'Access to Pool and Gym',
            'Bottled Mineral Water',
            'Complimentary Wireless Internet Access',
            'Iron and Ironing Board',
            'In-room Safe',
            'Daily Housekeeping'
        ],
        exclusions: [
            'Room Service',
            'Mini Bar',
            'Laundry Services',
            'Spa Treatments'
        ],
        exclusionDisclaimer: 'Please note additional services which sit outside of the event programme will be payable by the guest.',
        complimentaryFacilities: {
            title: 'Complimentary Breakfast',
            items: [
                { icon: 'location', text: 'Location: Kitchen District Restaurant' },
                { icon: 'time', text: 'Time: 7:30 AM to 9:30 AM' },
            ],
        },
    },
    faq: {
        items: [
            {
                id: 'faq-1',
                question: 'How do I register for the event?',
                answer: 'You can register by clicking the "Register" button on our website and filling out the registration form. You will receive a confirmation email with your QR code.'
            },
            {
                id: 'faq-2',
                question: 'Can I register on the day of the event?',
                answer: 'Yes, on-site registration is available, but we recommend registering in advance to save time and ensure your spot.'
            },
            {
                id: 'faq-3',
                question: 'Is registration free?',
                answer: 'Registration fees vary by event. Please check the specific event page for pricing details.'
            },
            {
                id: 'faq-4',
                question: 'What should I bring to the event?',
                answer: 'Please bring your QR code (printed or on your phone), a valid ID, and any materials mentioned in your confirmation email.'
            },
            {
                id: 'faq-5',
                question: 'Is there a dress code?',
                answer: 'The dress code varies by session. Please refer to the agenda for specific dress code requirements for each event.'
            },
            {
                id: 'faq-6',
                question: 'Will food and beverages be provided?',
                answer: 'Yes, meals and refreshments are included with your registration. Please inform us of any dietary restrictions during registration.'
            },
            {
                id: 'faq-7',
                question: 'Is there Wi-Fi at the venue?',
                answer: 'Yes, complimentary Wi-Fi is available throughout the venue. Network details will be provided at check-in.'
            },
            {
                id: 'faq-8',
                question: 'What if I lose my QR code?',
                answer: 'No worries! Visit the registration desk with your ID, and we will help you retrieve your information.'
            },
            {
                id: 'faq-9',
                question: 'Can I cancel my registration?',
                answer: 'Yes, you can cancel up to 48 hours before the event for a full refund. Please contact our support team.'
            },
            {
                id: 'faq-10',
                question: 'Is parking available?',
                answer: 'Yes, complimentary parking is available for all registered attendees. Show your QR code at the parking entrance.'
            }
        ]
    },
    funzone: {
        description: 'Take a break and enjoy some fun activities! Compete with fellow attendees and climb the leaderboard.',
        activities: [
            {
                id: 'act-1',
                title: 'Travel Trivia',
                description: 'Test your knowledge of world destinations, landmarks, and travel facts.',
                icon: '🌍',
                type: 'online',
                link: '',
                duration: '5 min',
                players: '1-4'
            },
            {
                id: 'act-2',
                title: 'Destination Match',
                description: 'Match famous landmarks with their countries in this memory game.',
                icon: '🗺️',
                type: 'online',
                link: '',
                duration: '3 min',
                players: '1'
            },
            {
                id: 'act-3',
                title: 'Packing Challenge',
                description: 'Pack your suitcase efficiently in this physical puzzle game.',
                icon: '🧳',
                type: 'physical',
                link: '',
                duration: '5 min',
                players: '1'
            },
            {
                id: 'act-4',
                title: 'Photo Hunt',
                description: 'Find hidden objects in travel photos across the venue.',
                icon: '📸',
                type: 'physical',
                link: '',
                duration: '10 min',
                players: '1-2'
            },
            {
                id: 'act-5',
                title: 'Currency Exchange',
                description: 'Quick math game with world currencies.',
                icon: '💱',
                type: 'online',
                link: '',
                duration: '3 min',
                players: '1'
            },
            {
                id: 'act-6',
                title: 'Team Building',
                description: 'Fun team activities and group challenges at the activity booth.',
                icon: '🎯',
                type: 'physical',
                link: '',
                duration: '20 min',
                players: '4-10'
            }
        ]
    },
    helpdesk: {
        phone: '+91 98765 43210',
        email: 'support@travelagency.com'
    }
};

const seedPageContent = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Connected to MongoDB');

        // Get all organizations
        const organizations = await Organization.find({});
        console.log(`📦 Found ${organizations.length} organizations`);

        if (organizations.length === 0) {
            console.log('⚠️  No organizations found. Please create organizations first.');
            process.exit(1);
        }

        const pageTypes = ['home', 'agenda', 'venue', 'faq', 'funzone', 'helpdesk'];
        let created = 0;
        let skipped = 0;

        for (const org of organizations) {
            console.log(`\n📂 Processing organization: ${org.name} (${org.slug})`);

            for (const pageType of pageTypes) {
                // Check if content already exists
                const existing = await PageContent.findOne({
                    org_id: org._id,
                    pageType
                });

                if (existing) {
                    console.log(`   ⏭️  ${pageType}: Already exists (version ${existing.version})`);
                    skipped++;
                    continue;
                }

                // Create new content
                await PageContent.create({
                    org_id: org._id,
                    pageType,
                    content: defaultContents[pageType],
                    isPublished: true, // Published by default
                    version: 1
                });

                console.log(`   ✅ ${pageType}: Created and published`);
                created++;
            }
        }

        console.log('\n========================================');
        console.log(`✅ Seeding complete!`);
        console.log(`   Created: ${created} page content documents`);
        console.log(`   Skipped: ${skipped} (already exist)`);
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding page content:', error);
        process.exit(1);
    }
};

// Run the seeder
seedPageContent();
