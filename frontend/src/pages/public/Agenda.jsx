import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Info, X } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';

// Default content matching the structure in ContentEditor
const defaultAgendaContent = {
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
};

export default function Agenda() {
    const { orgSlug } = useParams();
    const { data } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'agenda' },
        { skip: !orgSlug }
    );

    // Use API content or fallback to defaults
    const agendaContent = data?.data?.content || defaultAgendaContent;

    const [selectedImage, setSelectedImage] = useState(null); // For lightbox/modal

    return (
        <div>
            {/* Hero Section with Video Background */}
            <section className="relative h-[40vh] min-h-[300px] overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/agenda-video.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Event Agenda</h1>
                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        {agendaContent.heroText || 'Three days of inspiring sessions, networking opportunities, and unforgettable experiences.'}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-16 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-16">
                        {agendaContent.days.map((day) => (
                            <div key={day.id} className="relative">
                                {/* Day Header */}
                                <div className="sticky top-20 z-30 bg-gray-50/95 backdrop-blur-sm py-4 mb-8 flex items-center gap-4 border-b border-gray-200">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg transform -rotate-3">
                                        <Calendar className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-dark-900">{day.title}</h2>
                                        <p className="text-primary-600 font-medium">{day.date}</p>
                                    </div>
                                </div>

                                {/* Events List */}
                                <div className="ml-7 pl-10 border-l-2 border-dashed border-gray-300 space-y-10 relative">
                                    {day.events.map((event) => (
                                        <div key={event.id} className="relative group">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[2.85rem] top-1.5 w-6 h-6 rounded-full bg-white border-4 border-primary-500 z-10 group-hover:scale-125 transition-transform duration-300 ring-4 ring-gray-50" />

                                            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-primary-600 font-bold mb-1">
                                                            <Clock className="w-4 h-4" />
                                                            {event.time}
                                                        </div>
                                                        <h3 className="text-xl font-bold text-dark-900 leading-tight">{event.title}</h3>
                                                    </div>
                                                    {event.dressCode && (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                                                            <Info className="w-3 h-3" />
                                                            {event.dressCode}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                                                    <MapPin className="w-4 h-4" />
                                                    {event.location}
                                                </div>

                                                {event.description && (
                                                    <p className="text-gray-600 leading-relaxed mb-4">
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Images Grid */}
                                                {event.images && event.images.some(img => img) && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                                        {event.images.filter(img => img).map((img, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="aspect-square rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group/image"
                                                                onClick={() => setSelectedImage(img)}
                                                            >
                                                                <img
                                                                    src={img}
                                                                    alt={`${event.title} highlight ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.src = 'https://placehold.co/400x400?text=Event+Image'; }}
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/10 transition-colors" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Image Modal/Lightbox */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white hover:text-gray-300 focus:outline-none p-2"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Event Fullscreen"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
