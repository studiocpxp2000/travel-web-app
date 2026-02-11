import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, ExternalLink, CheckCircle, XCircle, Coffee, Utensils, Wifi, Dumbbell } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';
import Loading from '../../components/common/Loading';

export default function Venue() {
    const { orgSlug } = useParams();
    const { data, isLoading } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'venue' },
        { skip: !orgSlug }
    );

    // Use API content
    const venueContent = data?.data?.content;
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    if (isLoading) {
        return <Loading />;
    }

    if (!venueContent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">Venue Details Coming Soon</h2>
                    <p className="text-gray-500 mt-2">We are finalizing the location. Please check back later.</p>
                </div>
            </div>
        );
    }

    const { eventVenue, accommodation, inclusions, exclusions, exclusionDisclaimer, complimentaryFacilities } = venueContent;

    // Get valid images (non-empty strings)
    const validImages = accommodation.images?.filter(img => img && img.trim() !== '') || [];

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
                    <source src="/venue-video.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Venue & Hotel</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        Event location and accommodation details.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-8 md:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Event Venue Section */}
                    <section className="mb-8 md:mb-12">
                        <h2 className="text-xl md:text-2xl font-bold text-dark-900 mb-4 pb-2 border-b-2 border-gray-200">
                            {eventVenue.title}
                        </h2>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-primary-500 mt-1 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-dark-900 text-sm md:text-base">Address</p>
                                <p className="text-text-light text-sm md:text-base">{eventVenue.address}</p>
                            </div>
                        </div>

                        {/* Map Links */}
                        {(eventVenue.googleMapsLink || eventVenue.appleMapsLink) && (
                            <div className="flex flex-wrap gap-2 mt-4">
                                {eventVenue.googleMapsLink && (
                                    <a
                                        href={eventVenue.googleMapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium">G</span>
                                        <span>Google Maps</span>
                                    </a>
                                )}
                                {eventVenue.appleMapsLink && (
                                    <a
                                        href={eventVenue.appleMapsLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        <span className="font-medium">🍎</span>
                                        <span>Apple Maps</span>
                                    </a>
                                )}
                            </div>
                        )}
                    </section>

                    {/* Accommodation Section */}
                    <section className="mb-8 md:mb-12">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Left - Text Content */}
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-dark-900 mb-4">
                                    {accommodation.title}
                                </h2>
                                <p className="text-text-light text-sm md:text-base mb-4 leading-relaxed">
                                    {accommodation.description}
                                </p>
                                <p className="text-text-light text-sm md:text-base mb-4 leading-relaxed">
                                    {accommodation.details}
                                </p>
                                {accommodation.disclaimer && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        <span className="text-red-500 font-medium">*Disclaimer:</span>{' '}
                                        <span className="italic">{accommodation.disclaimer}</span>
                                    </p>
                                )}
                                {accommodation.hotelLink && (
                                    <a
                                        href={accommodation.hotelLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Visit Hotel Website
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                )}
                            </div>

                            {/* Right - Images */}
                            {validImages.length > 0 && (
                                <div className="space-y-3">
                                    {/* Main Image */}
                                    <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={validImages[activeImageIndex]}
                                            alt="Hotel"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.src = 'https://placehold.co/600x400?text=Hotel+Image';
                                            }}
                                        />
                                    </div>
                                    {/* Thumbnail Grid */}
                                    {validImages.length > 1 && (
                                        <div className={`grid gap-2 ${validImages.length === 2 ? 'grid-cols-2' : validImages.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                                            {validImages.slice(0, 4).map((img, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIndex(idx)}
                                                    className={`aspect-video rounded-lg overflow-hidden bg-gray-100 border-2 transition-all ${activeImageIndex === idx ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
                                                        }`}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Hotel ${idx + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.target.src = 'https://placehold.co/200x150?text=Image';
                                                        }}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Inclusions & Exclusions */}
                    <section className="mb-8 md:mb-12 border-t pt-8">
                        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                            {/* Inclusions */}
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 mb-4">Room Inclusions & Facilities</h3>
                                <ul className="space-y-2">
                                    {inclusions.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm md:text-base">
                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 fill-green-50" />
                                            <span className="text-text-light">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Exclusions */}
                            <div>
                                <h3 className="text-lg font-semibold text-dark-900 mb-4">Room Exclusions</h3>
                                <ul className="space-y-2">
                                    {exclusions.map((item, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm md:text-base">
                                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 fill-red-50" />
                                            <span className="text-text-light">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                {exclusionDisclaimer && (
                                    <p className="text-xs text-gray-500 mt-4 italic">
                                        <span className="text-red-500 font-medium">*Disclaimer:</span> {exclusionDisclaimer}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Complimentary Facilities */}
                    {complimentaryFacilities && complimentaryFacilities.items?.length > 0 && (
                        <section className="mb-8">
                            <h3 className="text-base md:text-lg font-semibold text-dark-900 mb-3">
                                {complimentaryFacilities.title}
                            </h3>
                            <div className="space-y-1">
                                {complimentaryFacilities.items.map((item, idx) => (
                                    <p key={idx} className="flex items-center gap-2 text-sm text-text-light">
                                        <span className="text-primary-500">
                                            {item.icon === 'location' ? '📍' : item.icon === 'time' ? '🕐' : '•'}
                                        </span>
                                        {item.text}
                                    </p>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
