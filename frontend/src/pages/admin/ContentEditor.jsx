import { useState, useEffect } from 'react';
import { FileText, Save, Eye, Plus, Trash2, Phone, Mail, Link, HelpCircle, ChevronDown, ChevronUp, Home, Calendar, Shirt, Building, Clock, MapPin, Image, Check, X, Upload, Globe, Loader } from 'lucide-react';
import Input, { Textarea } from '../../components/forms/Input';
import { useAuth } from '../../hooks/useAuthHooks';
import { createMarkup, generateId } from '../../utils/helpers';
import {
    useGetPageContentQuery,
    useUpdatePageContentMutation,
    usePublishPageContentMutation,
    useUnpublishPageContentMutation
} from '../../redux/slices/apiSlice';

// Page options - removed gallery, leaderboard, notifications (separate pages)
const pageOptions = [
    { id: 'home', name: 'Home Page', type: 'structured' },
    { id: 'agenda', name: 'Agenda', type: 'structured' },
    { id: 'venue', name: 'Venue', type: 'structured' },
    { id: 'faq', name: 'FAQs', type: 'structured' },
    { id: 'funzone', name: 'Fun Zone', type: 'structured' },
    { id: 'helpdesk', name: 'Helpdesk', type: 'structured' },
];

// Icon options for home cards
const homeIconOptions = [
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'dress', label: 'Dress Code', icon: Shirt },
    { id: 'hotel', label: 'Hotel', icon: Building },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'clock', label: 'Clock', icon: Clock },
];

// Mock content storage
const initialContent = {
    home: {
        heroText: 'Join us for an unforgettable event where power takes center stage and celebrations turn into memorable moments.',
        countdownDate: '2026-02-15T09:00:00',
        aboutTitle: 'About The Event',
        aboutDescription: 'Event details are coming soon. Please check back later.',
        cards: [
            { id: 'card-1', icon: 'calendar', title: 'Date', description: 'TBA' },
            { id: 'card-2', icon: 'dress', title: 'Dress Code', description: 'Business casual (refer to dress code for specific days)' },
            { id: 'card-3', icon: 'hotel', title: 'Hotel', description: 'Hyatt Regency' },
            { id: 'card-4', icon: 'contact', title: 'Contact us', description: '' },
        ]
    },
    agenda: {
        heroText: 'Three days of inspiring sessions, networking opportunities, and unforgettable experiences.',
        days: [
            {
                id: 'day-1',
                title: 'Day 1',
                date: 'January 15, 2026',
                events: [
                    {
                        id: 'evt-1',
                        time: '9:00 AM - 10:00 AM',
                        title: 'Registration & Check-in',
                        location: 'Main Lobby',
                        description: 'Pick up your badges and welcome kit.',
                        dressCode: 'Casual',
                        images: [
                            'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=800'
                        ]
                    },
                    {
                        id: 'evt-2',
                        time: '10:00 AM - 11:30 AM',
                        title: 'Opening Ceremony',
                        location: 'Grand Hall',
                        description: 'Official start of the event with guest speakers.',
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
                        description: 'Experts discuss the impact of tourism on the environment.',
                        dressCode: 'Business Casual',
                        images: []
                    }
                ]
            },
            {
                id: 'day-2',
                title: 'Day 2',
                date: 'January 16, 2026',
                events: [
                    {
                        id: 'evt-3',
                        time: '8:00 AM - 9:00 AM',
                        title: 'Morning Yoga',
                        location: 'Garden',
                        description: 'Start your day with a refreshing yoga session.',
                        dressCode: 'Sportswear',
                        images: [
                            'https://images.unsplash.com/photo-1544367563-121910aa662f?auto=format&fit=crop&q=80&w=800',
                            'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=800'
                        ]
                    },
                    {
                        id: 'evt-2-2',
                        time: '9:30 AM - 11:00 AM',
                        title: 'Workshop: Travel Photography',
                        location: 'Room B',
                        description: 'Learn tips and tricks for capturing stunning travel photos.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-3',
                        time: '11:30 AM - 1:00 PM',
                        title: 'Tech in Tourism',
                        location: 'Room C',
                        description: 'Exploring how technology is reshaping the travel industry.',
                        dressCode: 'Business Causal',
                        images: []
                    },
                    {
                        id: 'evt-2-4',
                        time: '1:00 PM - 2:00 PM',
                        title: 'Lunch Break',
                        location: 'Dining Area',
                        description: 'Refuel and relax.',
                        dressCode: 'Casual',
                        images: []
                    },
                    {
                        id: 'evt-2-5',
                        time: '7:00 PM - 11:00 PM',
                        title: 'Gala Night',
                        location: 'Ballroom',
                        description: 'A night of celebration, dining, and entertainment.',
                        dressCode: 'Black Tie',
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
            title: 'Accommodation: Hyatt Regency, Gurgaon',
            description: 'We welcome you to Hyatt Regency, Gurgaon. A premium 5-star business hotel with world-class event spaces.',
            details: 'Upon arrival, you will be greeted by the team to check in. Your stay includes bed and breakfast.',
            disclaimer: 'The hotel room is assigned strictly against occupancy. We do not permit additional guests.',
            hotelLink: 'https://www.hyatt.com',
            images: ['', '', '', ''],
        },
        inclusions: ['All Meals', 'Access to Pool and Gym', 'Bottled Mineral Water', 'Complimentary Wireless Internet Access'],
        exclusions: ['Room Service', 'Mini Bar', 'Laundry'],
        exclusionDisclaimer: 'Please note additional services will be payable by the guest.',
        complimentaryFacilities: {
            title: 'Complimentary Breakfast',
            items: [
                { icon: 'location', text: 'Location: Kitchen District' },
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
            { id: 'act-1', title: 'Travel Trivia', description: 'Test your knowledge of world destinations.', icon: '🌍', type: 'online', link: 'https://example.com/trivia', duration: '5 min', players: '1-4' },
            { id: 'act-2', title: 'Photo Hunt', description: 'Find hidden objects in travel photos.', icon: '📸', type: 'physical', link: '', duration: '10 min', players: '1-2' },
        ]
    },
    helpdesk: {
        phone: '+1 (555) 123-4567',
        email: 'support@example.com'
    }
};

const emojiOptions = ['🌍', '🗺️', '🧳', '✈️', '📸', '💱', '🎮', '🏆', '🎯', '🎲', '🃏', '🎪'];

export default function ContentEditor() {
    const { organization } = useAuth();
    const [selectedPage, setSelectedPage] = useState('home');
    const [content, setContent] = useState(initialContent);
    const [showPreview, setShowPreview] = useState(false);
    const [saved, setSaved] = useState(false);
    const [expandedFaq, setExpandedFaq] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // RTK Query hooks
    const { data: pageData, isLoading, refetch } = useGetPageContentQuery(selectedPage);
    const [updateContent, { isLoading: isSaving }] = useUpdatePageContentMutation();
    const [publishContent, { isLoading: isPublishing }] = usePublishPageContentMutation();
    const [unpublishContent, { isLoading: isUnpublishing }] = useUnpublishPageContentMutation();

    const currentPageConfig = pageOptions.find(p => p.id === selectedPage);

    // Load content from API when page changes or data updates
    useEffect(() => {
        if (pageData?.data?.content) {
            setContent(prev => ({
                ...prev,
                [selectedPage]: pageData.data.content
            }));
            setHasChanges(false);
        }
    }, [pageData, selectedPage]);

    // Refetch when page changes
    useEffect(() => {
        refetch();
    }, [selectedPage, refetch]);

    // Track changes
    const markAsChanged = () => {
        setHasChanges(true);
    };

    const handleSave = async () => {
        try {
            await updateContent({
                pageType: selectedPage,
                content: content[selectedPage]
            }).unwrap();
            setSaved(true);
            setHasChanges(false);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save content. Please try again.');
        }
    };

    const handlePublish = async () => {
        try {
            // Save first if there are changes
            if (hasChanges) {
                await updateContent({
                    pageType: selectedPage,
                    content: content[selectedPage]
                }).unwrap();
            }
            await publishContent(selectedPage).unwrap();
            alert(`${currentPageConfig?.name || selectedPage} published successfully!`);
            refetch();
        } catch (error) {
            console.error('Failed to publish:', error);
            alert('Failed to publish content. Please try again.');
        }
    };

    const handleUnpublish = async () => {
        try {
            await unpublishContent(selectedPage).unwrap();
            alert(`${currentPageConfig?.name || selectedPage} unpublished.`);
            refetch();
        } catch (error) {
            console.error('Failed to unpublish:', error);
            alert('Failed to unpublish content. Please try again.');
        }
    };

    const isPublished = pageData?.data?.isPublished || false;
    const lastUpdated = pageData?.data?.updatedAt ? new Date(pageData.data.updatedAt).toLocaleString() : null;

    // Home handlers
    const updateHome = (field, value) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                [field]: value
            }
        });
    };

    const addHomeCard = () => {
        const newCard = {
            id: generateId('card'),
            icon: 'calendar',
            title: '',
            description: ''
        };
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: [newCard, ...content.home.cards]
            }
        });
    };

    const updateHomeCard = (id, field, value) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: content.home.cards.map(card =>
                    card.id === id ? { ...card, [field]: value } : card
                )
            }
        });
    };

    const removeHomeCard = (id) => {
        setContent({
            ...content,
            home: {
                ...content.home,
                cards: content.home.cards.filter(card => card.id !== id)
            }
        });
    };

    // FAQ handlers
    const addFaqItem = () => {
        const newItem = { id: generateId('faq'), question: '', answer: '' };
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: [newItem, ...content.faq.items]
            }
        });
        setExpandedFaq(newItem.id);
    };

    const updateFaqItem = (id, field, value) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.map(item =>
                    item.id === id ? { ...item, [field]: value } : item
                )
            }
        });
    };

    const removeFaqItem = (id) => {
        setContent({
            ...content,
            faq: {
                ...content.faq,
                items: content.faq.items.filter(item => item.id !== id)
            }
        });
    };

    // Activity handlers
    const addActivity = () => {
        const newActivity = {
            id: generateId('act'),
            title: '',
            description: '',
            icon: '🎮',
            type: 'online',
            link: '',
            duration: '5 min',
            players: '1'
        };
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: [newActivity, ...content.funzone.activities]
            }
        });
    };

    const updateActivity = (id, field, value) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.map(act =>
                    act.id === id ? { ...act, [field]: value } : act
                )
            }
        });
    };

    const removeActivity = (id) => {
        setContent({
            ...content,
            funzone: {
                ...content.funzone,
                activities: content.funzone.activities.filter(act => act.id !== id)
            }
        });
    };

    // Helpdesk handlers
    const updateHelpdesk = (field, value) => {
        setContent({
            ...content,
            helpdesk: {
                ...content.helpdesk,
                [field]: value
            }
        });
    };
    const updateAgendaHeroText = (value) => {
        setContent({ ...content, agenda: { ...content.agenda, heroText: value } });
    };

    // Venue handlers
    const updateVenueEventVenue = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                eventVenue: {
                    ...content.venue.eventVenue,
                    [field]: value
                }
            }
        });
    };

    const updateVenueAccommodation = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                accommodation: {
                    ...content.venue.accommodation,
                    [field]: value
                }
            }
        });
    };

    const updateVenueAccommodationImage = (index, value) => {
        const newImages = [...content.venue.accommodation.images];
        newImages[index] = value;
        setContent({
            ...content,
            venue: {
                ...content.venue,
                accommodation: {
                    ...content.venue.accommodation,
                    images: newImages
                }
            }
        });
    };

    const updateVenueInclusion = (index, value) => {
        const newInclusions = [...content.venue.inclusions];
        newInclusions[index] = value;
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: newInclusions
            }
        });
    };

    const addVenueInclusion = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: [...content.venue.inclusions, '']
            }
        });
    };

    const removeVenueInclusion = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                inclusions: content.venue.inclusions.filter((_, i) => i !== index)
            }
        });
    };

    const updateVenueExclusion = (index, value) => {
        const newExclusions = [...content.venue.exclusions];
        newExclusions[index] = value;
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: newExclusions
            }
        });
    };

    const addVenueExclusion = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: [...content.venue.exclusions, '']
            }
        });
    };

    const removeVenueExclusion = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusions: content.venue.exclusions.filter((_, i) => i !== index)
            }
        });
    };

    const updateVenueExclusionDisclaimer = (value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                exclusionDisclaimer: value
            }
        });
    };

    const updateVenueComplimentary = (field, value) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    [field]: value
                }
            }
        });
    };

    const updateVenueComplimentaryItem = (index, field, value) => {
        const newItems = [...content.venue.complimentaryFacilities.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: newItems
                }
            }
        });
    };

    const addVenueComplimentaryItem = () => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: [...content.venue.complimentaryFacilities.items, { icon: 'location', text: '' }]
                }
            }
        });
    };

    const removeVenueComplimentaryItem = (index) => {
        setContent({
            ...content,
            venue: {
                ...content.venue,
                complimentaryFacilities: {
                    ...content.venue.complimentaryFacilities,
                    items: content.venue.complimentaryFacilities.items.filter((_, i) => i !== index)
                }
            }
        });
    };

    // Save venue content to localStorage
    const handleSaveVenue = () => {
        localStorage.setItem('venueContent', JSON.stringify(content.venue));
        handleSave();
    };

    // Agenda Handlers
    const addAgendaDay = () => {
        const newDay = { id: generateId(), title: `Day ${content.agenda.days.length + 1}`, date: '', events: [] };
        setContent({ ...content, agenda: { ...content.agenda, days: [...content.agenda.days, newDay] } });
    };
    const updateAgendaDay = (dayId, field, value) => {
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, [field]: value } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const removeAgendaDay = (dayId) => {
        setContent({ ...content, agenda: { ...content.agenda, days: content.agenda.days.filter(d => d.id !== dayId) } });
    };
    const addAgendaEvent = (dayId) => {
        const newEvent = { id: generateId(), time: '', title: '', location: '', description: '', dressCode: '', images: [] };
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, events: [...d.events, newEvent] } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const updateAgendaEvent = (dayId, evtId, field, value) => {
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, events: d.events.map(e => e.id === evtId ? { ...e, [field]: value } : e) } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const removeAgendaEvent = (dayId, evtId) => {
        const days = content.agenda.days.map(d => d.id === dayId ? { ...d, events: d.events.filter(e => e.id !== evtId) } : d);
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };
    const handleAgendaImageUpload = (dayId, evtId, idx, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => updateAgendaEventImage(dayId, evtId, idx, reader.result);
            reader.readAsDataURL(file);
        }
    };
    const updateAgendaEventImage = (dayId, evtId, idx, value) => {
        const days = content.agenda.days.map(d => {
            if (d.id !== dayId) return d;
            const events = d.events.map(e => {
                if (e.id !== evtId) return e;
                const images = [...(e.images || [])];
                while (images.length <= idx) images.push('');
                images[idx] = value;
                return { ...e, images };
            });
            return { ...d, events };
        });
        setContent({ ...content, agenda: { ...content.agenda, days } });
    };

    const renderEditor = () => {
        switch (selectedPage) {
            case 'agenda': return renderAgendaEditor();
            case 'home':
                return renderHomeEditor();
            case 'venue':
                return renderVenueEditor();
            case 'faq':
                return renderFaqEditor();
            case 'funzone':
                return renderFunzoneEditor();
            case 'helpdesk':
                return renderHelpdeskEditor();
            default:
                return renderHtmlEditor();
        }
    };

    const renderHomeEditor = () => (
        <div className="space-y-8">
            {/* Hero Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Home className="w-4 h-4" /> Hero Section
                </h4>
                <div className="space-y-4">
                    <Textarea
                        label="Hero Text"
                        value={content.home.heroText}
                        onChange={(e) => updateHome('heroText', e.target.value)}
                        placeholder="Text displayed on the video hero section"
                        rows={3}
                    />
                    <Input
                        label="Countdown End Date & Time"
                        type="datetime-local"
                        value={content.home.countdownDate.slice(0, 16)}
                        onChange={(e) => updateHome('countdownDate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                        After this date/time passes, "The Event Has Started" message will be shown instead of the countdown.
                    </p>
                </div>
            </div>

            {/* About Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">About Section</h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <Input
                        label="Title"
                        value={content.home.aboutTitle}
                        onChange={(e) => updateHome('aboutTitle', e.target.value)}
                        placeholder="About The Event"
                    />
                    <Input
                        label="Description"
                        value={content.home.aboutDescription}
                        onChange={(e) => updateHome('aboutDescription', e.target.value)}
                        placeholder="Event details description"
                    />
                </div>
            </div>

            {/* Event Detail Cards */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Event Detail Cards</h4>
                        <p className="text-xs text-gray-500">Add cards to display event information</p>
                    </div>
                    <button onClick={addHomeCard} className="btn-secondary btn-sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Card
                    </button>
                </div>

                {content.home.cards.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                        No cards added. Click "Add Card" to get started.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {content.home.cards.map((card, index) => (
                            <div key={card.id} className="border rounded-lg p-4 bg-gray-50">
                                <div className="flex items-start justify-between mb-3">
                                    <span className="text-xs text-gray-400">Card #{index + 1}</span>
                                    <button
                                        onClick={() => removeHomeCard(card.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="grid md:grid-cols-3 gap-4">
                                    {/* Icon Selector */}
                                    <div>
                                        <label className="form-label">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {homeIconOptions.map(opt => {
                                                const IconComp = opt.icon;
                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => updateHomeCard(card.id, 'icon', opt.id)}
                                                        className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center ${card.icon === opt.id
                                                            ? 'border-primary-500 bg-primary-50'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                            }`}
                                                        title={opt.label}
                                                    >
                                                        <IconComp className="w-5 h-5 text-gray-700" />
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Input
                                        label="Title"
                                        value={card.title}
                                        onChange={(e) => updateHomeCard(card.id, 'title', e.target.value)}
                                        placeholder="Card title"
                                    />

                                    {/* Description */}
                                    <Input
                                        label="Description"
                                        value={card.description}
                                        onChange={(e) => updateHomeCard(card.id, 'description', e.target.value)}
                                        placeholder="Card description (optional)"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderHtmlEditor = () => (
        <>
            <Textarea
                rows={15}
                value={content[selectedPage] || ''}
                onChange={(e) => setContent({
                    ...content,
                    [selectedPage]: e.target.value
                })}
                placeholder="Enter HTML content for this page..."
                className="font-mono text-sm"
            />
            <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm text-blue-700">
                <p className="font-medium mb-1">HTML Supported:</p>
                <p>You can use HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.</p>
            </div>
        </>
    );

    const renderFaqEditor = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                    <HelpCircle className="w-4 h-4 inline mr-1" />
                    Add questions and answers for the FAQ page
                </p>
                <button onClick={addFaqItem} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Question
                </button>
            </div>

            {content.faq.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No FAQ items. Click "Add Question" to get started.
                </div>
            ) : (
                <div className="space-y-3">
                    {content.faq.items.map((item, index) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden">
                            <div
                                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                                onClick={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 w-6">#{index + 1}</span>
                                    <span className="font-medium text-gray-800">
                                        {item.question || 'New Question'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFaqItem(item.id); }}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    {expandedFaq === item.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                </div>
                            </div>
                            {expandedFaq === item.id && (
                                <div className="p-4 space-y-3 border-t">
                                    <Input
                                        label="Question"
                                        value={item.question}
                                        onChange={(e) => updateFaqItem(item.id, 'question', e.target.value)}
                                        placeholder="Enter the question..."
                                    />
                                    <Textarea
                                        label="Answer"
                                        value={item.answer}
                                        onChange={(e) => updateFaqItem(item.id, 'answer', e.target.value)}
                                        placeholder="Enter the answer..."
                                        rows={3}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderFunzoneEditor = () => (
        <div className="space-y-6">
            {/* Activities */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="font-medium text-gray-700">Activities</p>
                        <p className="text-sm text-gray-500">Add activity cards for the Fun Zone page</p>
                    </div>
                    <button onClick={addActivity} className="btn-secondary btn-sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Activity
                    </button>
                </div>

                {content.funzone.activities.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No activities yet. Click "Add Activity" to get started.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {content.funzone.activities.map((activity) => (
                            <div key={activity.id} className="border rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Icon Selector */}
                                    <div>
                                        <label className="form-label">Icon</label>
                                        <div className="flex flex-wrap gap-2">
                                            {emojiOptions.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => updateActivity(activity.id, 'icon', emoji)}
                                                    className={`w-10 h-10 text-xl rounded-lg border-2 ${activity.icon === emoji
                                                        ? 'border-primary-500 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <Input
                                        label="Title"
                                        value={activity.title}
                                        onChange={(e) => updateActivity(activity.id, 'title', e.target.value)}
                                        placeholder="Activity name"
                                    />

                                    {/* Description */}
                                    <div className="col-span-2">
                                        <Input
                                            label="Description"
                                            value={activity.description}
                                            onChange={(e) => updateActivity(activity.id, 'description', e.target.value)}
                                            placeholder="Brief description of the activity"
                                        />
                                    </div>

                                    {/* Type Selector */}
                                    <div>
                                        <label className="form-label">Activity Type</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateActivity(activity.id, 'type', 'online')}
                                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${activity.type === 'online'
                                                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                <Link className="w-4 h-4 inline mr-1" />
                                                Online
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateActivity(activity.id, 'type', 'physical')}
                                                className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium ${activity.type === 'physical'
                                                    ? 'bg-green-100 border-green-300 text-green-700'
                                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                🏃 Physical
                                            </button>
                                        </div>
                                    </div>

                                    {/* Link (for online only) */}
                                    {activity.type === 'online' && (
                                        <Input
                                            label="Game Link"
                                            value={activity.link}
                                            onChange={(e) => updateActivity(activity.id, 'link', e.target.value)}
                                            placeholder="https://example.com/game"
                                        />
                                    )}

                                    {/* Duration & Players */}
                                    <Input
                                        label="Duration"
                                        value={activity.duration}
                                        onChange={(e) => updateActivity(activity.id, 'duration', e.target.value)}
                                        placeholder="5 min"
                                    />
                                    <Input
                                        label="Players"
                                        value={activity.players}
                                        onChange={(e) => updateActivity(activity.id, 'players', e.target.value)}
                                        placeholder="1-4"
                                    />
                                </div>

                                <div className="flex justify-end mt-4">
                                    <button
                                        onClick={() => removeActivity(activity.id)}
                                        className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                        <Trash2 className="w-4 h-4 inline mr-1" />
                                        Remove Activity
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    const renderHelpdeskEditor = () => (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                    Set up contact information for your helpdesk page. Users will see these details to reach support.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="form-label flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        Phone Number
                    </label>
                    <Input
                        value={content.helpdesk.phone}
                        onChange={(e) => updateHelpdesk('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                    />
                </div>

                <div>
                    <label className="form-label flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        Email Address
                    </label>
                    <Input
                        type="email"
                        value={content.helpdesk.email}
                        onChange={(e) => updateHelpdesk('email', e.target.value)}
                        placeholder="support@example.com"
                    />
                </div>
            </div>

            {/* Preview Card */}
            <div className="mt-8">
                <p className="form-label mb-3">Preview</p>
                <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="font-semibold text-lg mb-4">Contact Support</h3>
                    <div className="space-y-3">
                        {content.helpdesk.phone && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Phone</p>
                                    <p className="font-medium">{content.helpdesk.phone}</p>
                                </div>
                            </div>
                        )}
                        {content.helpdesk.email && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Email</p>
                                    <p className="font-medium">{content.helpdesk.email}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderAgendaEditor = () => (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h4 className="font-semibold text-dark-900 mb-4">Hero Section</h4>
                <Textarea
                    label="Hero Text"
                    value={content.agenda.heroText || ''}
                    onChange={(e) => updateAgendaHeroText(e.target.value)}
                    placeholder="Text displayed below 'Event Agenda'"
                    rows={2}
                />
            </div>

            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-medium text-gray-700">Agenda Management</p>
                    <p className="text-sm text-gray-500">Manage days and timeline events</p>
                </div>
                <button onClick={addAgendaDay} className="btn-secondary btn-sm">
                    <Plus className="w-4 h-4 mr-1" /> Add Day
                </button>
            </div>
            {content.agenda.days.map((day, dayIdx) => (
                <div key={day.id} className="border rounded-lg p-6 bg-white mb-6">
                    <div className="flex justify-between items-start mb-4 border-b pb-4">
                        <div className="grid md:grid-cols-2 gap-4 flex-1 mr-4">
                            <Input label="Day Title" value={day.title} onChange={(e) => updateAgendaDay(day.id, 'title', e.target.value)} placeholder="Day 1" />
                            <Input label="Date" value={day.date} onChange={(e) => updateAgendaDay(day.id, 'date', e.target.value)} placeholder="January 15, 2026" />
                        </div>
                        <button onClick={() => removeAgendaDay(day.id)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-4">
                        {day.events.map((evt, evtIdx) => (
                            <div key={evt.id} className="bg-gray-50 p-4 rounded-lg border">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs font-bold text-gray-500">Event #{evtIdx + 1}</span>
                                    <button onClick={() => removeAgendaEvent(day.id, evt.id)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                                </div>
                                <div className="grid md:grid-cols-2 gap-3 mb-3">
                                    <Input label="Time" value={evt.time} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'time', e.target.value)} placeholder="09:00 - 10:00" />
                                    <Input label="Title" value={evt.title} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'title', e.target.value)} placeholder="Event Title" />
                                    <Input label="Location" value={evt.location} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'location', e.target.value)} placeholder="Location" />
                                    <Input label="Dress Code" value={evt.dressCode} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'dressCode', e.target.value)} placeholder="Casual" />
                                    <div className="md:col-span-2">
                                        <Input label="Description" value={evt.description} onChange={(e) => updateAgendaEvent(day.id, evt.id, 'description', e.target.value)} placeholder="Event details..." />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-2 block">Images (Max 4)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {[0, 1, 2, 3].map(imgIdx => (
                                            <div key={imgIdx} className="relative aspect-square bg-gray-200 rounded overflow-hidden">
                                                {(evt.images && evt.images[imgIdx]) ? (
                                                    <>
                                                        <img src={evt.images[imgIdx]} className="w-full h-full object-cover" />
                                                        <button onClick={() => updateAgendaEventImage(day.id, evt.id, imgIdx, '')} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full"><X className="w-3 h-3" /></button>
                                                    </>
                                                ) : (
                                                    <label className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-gray-300">
                                                        <Plus className="w-4 h-4 text-gray-500" />
                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAgendaImageUpload(day.id, evt.id, imgIdx, e)} />
                                                    </label>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => addAgendaEvent(day.id)} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2">
                            <Plus className="w-4 h-4" /> Add Event
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const handleImageUpload = (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                updateVenueAccommodationImage(index, reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const renderVenueEditor = () => (
        <div className="space-y-8">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                    Configure venue and accommodation details.
                    <br />
                    <strong>Note:</strong> You can upload up to 4 images max. Images can be uploaded directly or provided as URLs.
                </p>
            </div>

            {/* Event Venue Section */}
            <div className="border-b pb-6">
                <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    Event Venue
                </h4>
                <div className="grid gap-4">
                    <Input
                        label="Section Title"
                        value={content.venue.eventVenue.title}
                        onChange={(e) => updateVenueEventVenue('title', e.target.value)}
                        placeholder="Event Venue"
                    />
                    <Textarea
                        label="Address"
                        value={content.venue.eventVenue.address}
                        onChange={(e) => updateVenueEventVenue('address', e.target.value)}
                        placeholder="Enter venue address"
                        rows={2}
                    />
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Google Maps Link (optional)"
                            value={content.venue.eventVenue.googleMapsLink}
                            onChange={(e) => updateVenueEventVenue('googleMapsLink', e.target.value)}
                            placeholder="https://maps.google.com/..."
                        />
                        <Input
                            label="Apple Maps Link (optional)"
                            value={content.venue.eventVenue.appleMapsLink}
                            onChange={(e) => updateVenueEventVenue('appleMapsLink', e.target.value)}
                            placeholder="https://maps.apple.com/..."
                        />
                    </div>
                </div>
            </div>

            {/* Accommodation Section */}
            <div className="border-b pb-6">
                <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Building className="w-4 h-4 text-primary-500" />
                    Accommodation / Hotel
                </h4>
                <div className="grid gap-4">
                    <Input
                        label="Title"
                        value={content.venue.accommodation.title}
                        onChange={(e) => updateVenueAccommodation('title', e.target.value)}
                        placeholder="Accommodation: Hotel Name"
                    />
                    <Textarea
                        label="Description"
                        value={content.venue.accommodation.description}
                        onChange={(e) => updateVenueAccommodation('description', e.target.value)}
                        placeholder="Describe the hotel..."
                        rows={3}
                    />
                    <Textarea
                        label="Details"
                        value={content.venue.accommodation.details}
                        onChange={(e) => updateVenueAccommodation('details', e.target.value)}
                        placeholder="Check-in details, what's included..."
                        rows={3}
                    />
                    <Textarea
                        label="Disclaimer"
                        value={content.venue.accommodation.disclaimer}
                        onChange={(e) => updateVenueAccommodation('disclaimer', e.target.value)}
                        placeholder="Any disclaimers about the accommodation..."
                        rows={2}
                    />
                    <Input
                        label="Hotel Website Link"
                        value={content.venue.accommodation.hotelLink}
                        onChange={(e) => updateVenueAccommodation('hotelLink', e.target.value)}
                        placeholder="https://hotel-website.com"
                    />

                    {/* Images */}
                    <div>
                        <label className="form-label flex items-center gap-2 mb-3">
                            <Image className="w-4 h-4" />
                            Hotel Images (Max 4)
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {content.venue.accommodation.images.map((img, idx) => (
                                <div key={idx} className="border p-4 rounded-lg bg-gray-50">
                                    <div className="mb-3">
                                        <label className="text-xs font-medium text-gray-700 block mb-1">Image {idx + 1}</label>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    value={img?.length > 50 ? '(Uploaded Image Data)' : img}
                                                    onChange={(e) => updateVenueAccommodationImage(idx, e.target.value)}
                                                    placeholder="https://..."
                                                    disabled={img?.startsWith('data:')}
                                                />
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageUpload(idx, e)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <button className="btn-secondary h-full px-3">
                                                    Upload
                                                </button>
                                            </div>
                                            {img && (
                                                <button
                                                    onClick={() => updateVenueAccommodationImage(idx, '')}
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded"
                                                    title="Remove Image"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="aspect-video bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                                        {img ? (
                                            <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                                        ) : (
                                            <span className="text-xs text-gray-400">No image selected</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inclusions & Exclusions */}
            <div className="border-b pb-6">
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Inclusions */}
                    <div>
                        <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-500" />
                            Room Inclusions
                        </h4>
                        <div className="space-y-2">
                            {content.venue.inclusions.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => updateVenueInclusion(idx, e.target.value)}
                                        placeholder="e.g., Complimentary Breakfast"
                                    />
                                    <button
                                        onClick={() => removeVenueInclusion(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueInclusion}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Inclusion
                            </button>
                        </div>
                    </div>

                    {/* Exclusions */}
                    <div>
                        <h4 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <X className="w-4 h-4 text-red-500" />
                            Room Exclusions
                        </h4>
                        <div className="space-y-2">
                            {content.venue.exclusions.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => updateVenueExclusion(idx, e.target.value)}
                                        placeholder="e.g., Mini Bar"
                                    />
                                    <button
                                        onClick={() => removeVenueExclusion(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueExclusion}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Exclusion
                            </button>
                        </div>
                        <div className="mt-4">
                            <Textarea
                                label="Exclusion Disclaimer"
                                value={content.venue.exclusionDisclaimer}
                                onChange={(e) => updateVenueExclusionDisclaimer(e.target.value)}
                                placeholder="e.g., Additional services will be payable..."
                                rows={2}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Complimentary Facilities */}
            <div>
                <h4 className="font-semibold text-dark-900 mb-4">Complimentary Facilities</h4>
                <div className="grid gap-4">
                    <Input
                        label="Section Title"
                        value={content.venue.complimentaryFacilities.title}
                        onChange={(e) => updateVenueComplimentary('title', e.target.value)}
                        placeholder="e.g., Complimentary Breakfast"
                    />
                    <div>
                        <label className="form-label mb-2">Facility Details</label>
                        <div className="space-y-2">
                            {content.venue.complimentaryFacilities.items.map((item, idx) => (
                                <div key={idx} className="flex gap-2 items-center">
                                    <select
                                        value={item.icon}
                                        onChange={(e) => updateVenueComplimentaryItem(idx, 'icon', e.target.value)}
                                        className="form-input w-32"
                                    >
                                        <option value="location">📍 Location</option>
                                        <option value="time">🕐 Time</option>
                                        <option value="info">ℹ️ Info</option>
                                    </select>
                                    <Input
                                        value={item.text}
                                        onChange={(e) => updateVenueComplimentaryItem(idx, 'text', e.target.value)}
                                        placeholder="e.g., Location: Restaurant Name"
                                        className="flex-1"
                                    />
                                    <button
                                        onClick={() => removeVenueComplimentaryItem(idx)}
                                        className="text-red-500 hover:text-red-700 p-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addVenueComplimentaryItem}
                                className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                                <Plus className="w-4 h-4" />
                                Add Detail
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Content Editor</h1>
                    <p className="text-text-light">Edit dynamic content for public pages</p>
                </div>
                {lastUpdated && (
                    <div className="text-sm text-gray-500">
                        Last updated: {lastUpdated}
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-4 gap-6">
                {/* Page Selector */}
                <div className="lg:col-span-1">
                    <div className="card">
                        <h3 className="font-semibold text-dark-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary-500" />
                            Pages
                        </h3>
                        <div className="space-y-1">
                            {pageOptions.map(page => (
                                <button
                                    key={page.id}
                                    onClick={() => { setSelectedPage(page.id); setShowPreview(false); }}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedPage === page.id
                                        ? 'bg-primary-100 text-primary-700 font-medium'
                                        : 'text-text-light hover:bg-gray-100'
                                        }`}
                                >
                                    {page.name}
                                    {page.type === 'structured' && (
                                        <span className="ml-2 text-xs text-gray-400">(Structured)</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Editor */}
                <div className="lg:col-span-3">
                    <div className="card">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-dark-900">
                                    Editing: {currentPageConfig?.name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    {isPublished ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <Globe className="w-3 h-3 mr-1" />
                                            Published
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Draft
                                        </span>
                                    )}
                                    {hasChanges && (
                                        <span className="text-xs text-amber-600">• Unsaved changes</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {currentPageConfig?.type === 'html' && (
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className={`btn-secondary btn-sm ${showPreview ? 'bg-primary-100' : ''}`}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        {showPreview ? 'Edit' : 'Preview'}
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || isLoading}
                                    className="btn-secondary btn-sm"
                                >
                                    {isSaving ? (
                                        <Loader className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4 mr-1" />
                                    )}
                                    {saved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Draft'}
                                </button>
                                {isPublished ? (
                                    <button
                                        onClick={handleUnpublish}
                                        disabled={isUnpublishing}
                                        className="btn-secondary btn-sm text-amber-600 border-amber-300 hover:bg-amber-50"
                                    >
                                        {isUnpublishing ? (
                                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <X className="w-4 h-4 mr-1" />
                                        )}
                                        Unpublish
                                    </button>
                                ) : (
                                    <button
                                        onClick={handlePublish}
                                        disabled={isPublishing}
                                        className="btn-primary btn-sm"
                                    >
                                        {isPublishing ? (
                                            <Loader className="w-4 h-4 mr-1 animate-spin" />
                                        ) : (
                                            <Upload className="w-4 h-4 mr-1" />
                                        )}
                                        {isPublishing ? 'Publishing...' : 'Publish'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {currentPageConfig?.type === 'html' && showPreview ? (
                        <div className="border rounded-lg p-6 min-h-[400px] bg-gray-50">
                            <div
                                className="prose max-w-none"
                                dangerouslySetInnerHTML={createMarkup(content[selectedPage])}
                            />
                            {!content[selectedPage]?.trim() && (
                                <p className="text-text-muted italic">No content to preview</p>
                            )}
                        </div>
                    ) : isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader className="w-8 h-8 animate-spin text-primary-500" />
                            <span className="ml-2 text-gray-500">Loading content...</span>
                        </div>
                    ) : (
                        renderEditor()
                    )}
                </div>
            </div>
        </div>
    );
}
