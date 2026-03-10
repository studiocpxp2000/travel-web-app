import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Shirt, Building, Mail, Clock } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';
import Loading from '../../components/common/Loading';

// Icon mapping for event detail cards
const iconMap = {
    'calendar': Calendar,
    'dress': Shirt,
    'hotel': Building,
    'contact': Mail,
    'clock': Clock,
};

export default function Home() {
    const { orgSlug } = useParams();
    const { data, isLoading } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'home' },
        { skip: !orgSlug }
    );

    // Use API content
    const homeContent = data?.data?.content;

    // Derived state for countdown
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [eventStarted, setEventStarted] = useState(false);



    // Countdown timer effect
    useEffect(() => {
        if (!homeContent?.countdownDate) return;

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
    }, [homeContent?.countdownDate]);

    if (isLoading) return <Loading />;

    if (!homeContent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Event Coming Soon</h1>
                    <p className="text-gray-400">We are preparing something amazing for you.</p>
                </div>
            </div>
        );
    }

    const formatNumber = (num) => String(num).padStart(2, '0');

    return (
        <div>
            {/* Hero Section with Video Background */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/home-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto mb-4 md:mb-6 leading-relaxed">
                        {homeContent.heroText}
                    </p>

                    {/* Countdown or Event Started Message */}
                    {eventStarted ? (
                        <h2 className="text-xl md:text-3xl font-bold text-white">
                            The Event has Started!
                        </h2>
                    ) : (
                        <div className="flex items-center gap-2 md:gap-6">
                            <div className="text-center">
                                <div className="text-2xl md:text-5xl font-bold text-white">
                                    {formatNumber(timeLeft.days)}
                                </div>
                                <div className="text-xs md:text-sm text-gray-300 mt-1">Days</div>
                            </div>
                            <span className="text-xl md:text-4xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-2xl md:text-5xl font-bold text-white">
                                    {formatNumber(timeLeft.hours)}
                                </div>
                                <div className="text-xs md:text-sm text-gray-300 mt-1">Hours</div>
                            </div>
                            <span className="text-xl md:text-4xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-2xl md:text-5xl font-bold text-white">
                                    {formatNumber(timeLeft.minutes)}
                                </div>
                                <div className="text-xs md:text-sm text-gray-300 mt-1">Mins</div>
                            </div>
                            <span className="text-xl md:text-4xl font-bold text-white/60">:</span>
                            <div className="text-center">
                                <div className="text-2xl md:text-5xl font-bold text-white">
                                    {formatNumber(timeLeft.seconds)}
                                </div>
                                <div className="text-xs md:text-sm text-gray-300 mt-1">Secs</div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* About Section */}
            <section className="py-6 md:py-12 bg-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-xl md:text-3xl font-bold text-dark-900 mb-2 md:mb-4">
                        {homeContent.aboutTitle}
                    </h2>
                    <p className="text-sm md:text-lg text-primary-600">
                        {homeContent.aboutDescription}
                    </p>
                </div>
            </section>

            {/* Event Details Cards */}
            <section className="py-6 md:py-12 bg-gray-50">
                <div className="max-w-6xl mx-auto px-4">
                    <h2 className="text-xl md:text-3xl font-bold text-center text-dark-900 mb-6 md:mb-10">
                        Event Details
                    </h2>

                    <div className={`grid gap-3 md:gap-6 ${homeContent.cards.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                        homeContent.cards.length === 2 ? 'grid-cols-2 max-w-2xl mx-auto' :
                            homeContent.cards.length === 3 ? 'grid-cols-2 md:grid-cols-3' :
                                'grid-cols-2 lg:grid-cols-4'
                        }`}>
                        {homeContent.cards.map((card) => {
                            const IconComponent = iconMap[card.icon] || Calendar;
                            return (
                                <div key={card.id} className="bg-white rounded-xl border border-gray-200 p-3 md:p-6 text-center hover:shadow-lg transition-shadow">
                                    <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 md:mb-4">
                                        <IconComponent className="w-5 h-5 md:w-8 md:h-8 text-gray-700" />
                                    </div>
                                    <h3 className="text-xs md:text-lg font-semibold text-primary-600 mb-1 md:mb-2">
                                        {card.title}
                                    </h3>
                                    {card.description && (
                                        <p className="text-[10px] md:text-sm text-gray-600 leading-relaxed">
                                            {card.description}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

        </div>
    );
}
