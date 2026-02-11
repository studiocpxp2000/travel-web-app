import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Clock, MapPin, Info, X } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';
import Loading from '../../components/common/Loading';

export default function Agenda() {
    const { orgSlug } = useParams();
    const { data, isLoading } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'agenda' },
        { skip: !orgSlug }
    );

    // Use API content
    const agendaContent = data?.data?.content;

    const [selectedImage, setSelectedImage] = useState(null); // For lightbox/modal

    if (isLoading) {
        return <Loading />;
    }

    if (!agendaContent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Agenda Coming Soon</h2>
                    <p className="text-gray-500 mt-2">The event schedule is being finalized. Please check back later.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section with Video Background */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
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
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">Event Agenda</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        {agendaContent.heroText || 'Three days of inspiring sessions, networking opportunities, and unforgettable experiences.'}
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-8 md:py-12 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="space-y-8 md:space-y-12">
                        {agendaContent.days.map((day) => (
                            <div key={day.id} className="relative">
                                {/* Day Header */}
                                <div className="sticky top-20 z-30 bg-gray-50/95 backdrop-blur-sm py-3 md:py-4 mb-6 md:mb-8 flex items-center gap-3 md:gap-4 border-b border-gray-200">
                                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg transform -rotate-3">
                                        <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-dark-900">{day.title}</h2>
                                        <p className="text-sm md:text-base text-primary-600 font-medium">{day.date}</p>
                                    </div>
                                </div>

                                {/* Events List */}
                                <div className="ml-5 md:ml-6 pl-6 md:pl-8 border-l-2 border-dashed border-gray-300 space-y-6 md:space-y-8 relative">
                                    {day.events.map((event) => (
                                        <div key={event.id} className="relative group">
                                            {/* Timeline Dot */}
                                            <div className="absolute -left-[1.95rem] md:-left-[2.45rem] top-1.5 w-4 h-4 md:w-5 md:h-5 rounded-full bg-white border-2 md:border-4 border-primary-500 z-10 group-hover:scale-125 transition-transform duration-300 ring-2 md:ring-4 ring-gray-50" />

                                            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100">
                                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4 mb-2 md:mb-3">
                                                    <div>
                                                        <div className="flex items-center gap-2 text-primary-600 font-bold mb-1 text-xs md:text-sm">
                                                            <Clock className="w-3 h-3 md:w-4 md:h-4" />
                                                            {event.time}
                                                        </div>
                                                        <h3 className="text-base md:text-xl font-bold text-dark-900 leading-tight">{event.title}</h3>
                                                    </div>
                                                    {event.dressCode && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-gray-100 text-gray-600 text-[10px] md:text-xs font-semibold uppercase tracking-wider whitespace-nowrap self-start">
                                                            <Info className="w-3 h-3" />
                                                            {event.dressCode}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-500 text-xs md:text-sm mb-3">
                                                    <MapPin className="w-3 h-3 md:w-4 md:h-4" />
                                                    {event.location}
                                                </div>

                                                {event.description && (
                                                    <p className="text-gray-600 leading-relaxed mb-4 text-sm md:text-base">
                                                        {event.description}
                                                    </p>
                                                )}

                                                {/* Images Grid */}
                                                {event.images && event.images.some(img => img) && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mt-3 md:mt-4">
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
