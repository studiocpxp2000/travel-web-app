import { useState, useEffect } from 'react';
import { Calendar, Shirt, Building, Mail, Clock } from 'lucide-react';

// Icon mapping for event detail cards
const iconMap = {
    'calendar': Calendar,
    'dress': Shirt,
    'hotel': Building,
    'contact': Mail,
    'clock': Clock,
};

// Default home content (would typically come from content editor/API)
const defaultHomeContent = {
    heroText: 'Join us for an unforgettable event where power takes center stage and celebrations turn into memorable moments.',
    countdownDate: '2026-02-15T09:00:00', // ISO date format for countdown
    aboutTitle: 'About The Event',
    aboutDescription: 'Event details are coming soon. Please check back later.',
    cards: [
        { id: 'card-1', icon: 'calendar', title: 'Date', description: 'TBA' },
        { id: 'card-2', icon: 'dress', title: 'Dress Code', description: 'Business casual (refer to dress code for specific days)' },
        { id: 'card-3', icon: 'hotel', title: 'Hotel', description: 'Hyatt Regency' },
        { id: 'card-4', icon: 'contact', title: 'Contact us', description: '' },
    ]
};

export default function Home() {
    const [homeContent] = useState(defaultHomeContent);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [eventStarted, setEventStarted] = useState(false);

    // Countdown timer effect
    useEffect(() => {
        const calculateTimeLeft = () => {
            const targetDate = new Date(homeContent.countdownDate).getTime();
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference <= 0) {
                setEventStarted(true);
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((difference % (1000 * 60)) / 1000),
            };
        };

        // Initial calculation
        setTimeLeft(calculateTimeLeft());

        // Update every second
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [homeContent.countdownDate]);

    const formatNumber = (num) => String(num).padStart(2, '0');

    return (
        <div>
            {/* Hero Section with Video Background */}
            <section className="relative h-[60vh] min-h-[400px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover"
                >
                    <source src="/home-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-8">
                        {homeContent.heroText}
                    </p>

                    {/* Countdown or Event Started Message */}
                    {eventStarted ? (
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            The Event has Started!
                        </h2>
                    ) : (
                        <div className="flex items-center gap-4 md:gap-8">
                            <div className="text-center">
                                <div className="text-4xl md:text-6xl font-bold text-white">
                                    {formatNumber(timeLeft.days)}
                                </div>
                                <div className="text-sm md:text-base text-gray-300 mt-1">Days</div>
                            </div>
                            <span className="text-3xl md:text-5xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-4xl md:text-6xl font-bold text-white">
                                    {formatNumber(timeLeft.hours)}
                                </div>
                                <div className="text-sm md:text-base text-gray-300 mt-1">Hours</div>
                            </div>
                            <span className="text-3xl md:text-5xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-4xl md:text-6xl font-bold text-white">
                                    {formatNumber(timeLeft.minutes)}
                                </div>
                                <div className="text-sm md:text-base text-gray-300 mt-1">Minutes</div>
                            </div>
                            <span className="text-3xl md:text-5xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-4xl md:text-6xl font-bold text-white">
                                    {formatNumber(timeLeft.seconds)}
                                </div>
                                <div className="text-sm md:text-base text-gray-300 mt-1">Seconds</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* About Section */}
            <section className="py-12 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-dark-900 mb-4">
                        {homeContent.aboutTitle}
                    </h2>
                    <p className="text-lg text-primary-600">
                        {homeContent.aboutDescription}
                    </p>
                </div>
            </section>

            {/* Event Details Cards */}
            <section className="py-12 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-dark-900 mb-10">
                        Event Details
                    </h2>

                    <div className={`grid gap-6 ${homeContent.cards.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                            homeContent.cards.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' :
                                homeContent.cards.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                        }`}>
                        {homeContent.cards.map((card) => {
                            const IconComponent = iconMap[card.icon] || Calendar;
                            return (
                                <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                        <IconComponent className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-primary-600 mb-2">
                                        {card.title}
                                    </h3>
                                    {card.description && (
                                        <p className="text-gray-600 text-sm">
                                            {card.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-6 bg-dark-900 text-center">
                <p className="text-gray-400 text-sm">
                    © {new Date().getFullYear()} Event Portal. All Rights Reserved.
                </p>
            </footer>
        </div>
    );
}
