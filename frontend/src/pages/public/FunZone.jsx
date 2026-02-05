import { useParams } from 'react-router-dom';
import { Gamepad2, Clock, Users, ExternalLink } from 'lucide-react';
import { useGetPublicPageContentQuery } from '../../redux/slices/apiSlice';

// Default activities - fallback when API returns nothing
const defaultFunzoneContent = {
    description: 'Take a break and enjoy some fun activities!',
    activities: [
        {
            id: 1,
            title: 'Travel Trivia',
            description: 'Test your knowledge of world destinations and travel facts.',
            icon: '🌍',
            players: '1-4',
            duration: '5 min',
            type: 'online',
            link: 'https://example.com/trivia',
        },
        {
            id: 2,
            title: 'Destination Match',
            description: 'Match famous landmarks with their countries.',
            icon: '🗺️',
            players: '1',
            duration: '3 min',
            type: 'online',
            link: 'https://example.com/match',
        },
        {
            id: 3,
            title: 'Packing Challenge',
            description: 'Pack your suitcase efficiently in this puzzle game.',
            icon: '🧳',
            players: '1',
            duration: '5 min',
            type: 'physical',
            link: '',
        },
        {
            id: 4,
            title: 'Photo Hunt',
            description: 'Find hidden objects in travel photos.',
            icon: '📸',
            players: '1-2',
            duration: '5 min',
            type: 'physical',
            link: '',
        },
        {
            id: 5,
            title: 'Currency Exchange',
            description: 'Quick math game with world currencies.',
            icon: '💱',
            players: '1',
            duration: '3 min',
            type: 'online',
            link: 'https://example.com/currency',
        },
        {
            id: 6,
            title: 'Team Building',
            description: 'Fun team activities and group challenges.',
            icon: '🎯',
            players: '4-10',
            duration: '20 min',
            type: 'physical',
            link: '',
        },
    ]
};

export default function FunZone() {
    const { orgSlug } = useParams();
    const { data } = useGetPublicPageContentQuery(
        { orgSlug, pageType: 'funzone' },
        { skip: !orgSlug }
    );

    // Use API content or fallback to defaults
    const funzoneContent = data?.data?.content || defaultFunzoneContent;
    const activities = funzoneContent.activities || [];

    return (
        <div>
            {/* Hero Section with Video Background - consistent with other pages */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/funzone-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Fun Zone</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        Take a break and enjoy some activities! Earn points and climb the leaderboard.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Activities Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {activities.map(activity => (
                            <div key={activity.id} className="card-hover group">
                                <div className="text-4xl md:text-5xl mb-3 md:mb-4">{activity.icon}</div>
                                <h3 className="text-lg md:text-xl font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
                                    {activity.title}
                                </h3>
                                <p className="text-text-light text-xs md:text-sm mb-3 md:mb-4">{activity.description}</p>

                                <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                                    {/* Activity Type Badge */}
                                    <span className={`badge text-xs ${activity.type === 'online'
                                        ? 'bg-blue-100 text-blue-700'
                                        : 'bg-green-100 text-green-700'
                                        }`}>
                                        {activity.type === 'online' ? '🌐 Online' : '🏃 Physical'}
                                    </span>
                                    <span className="badge badge-gray text-xs">
                                        <Users className="w-3 h-3 mr-1" />
                                        {activity.players}
                                    </span>
                                    <span className="badge badge-gray text-xs">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {activity.duration}
                                    </span>
                                </div>

                                {activity.type === 'online' && activity.link ? (
                                    <a
                                        href={activity.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-primary w-full text-sm"
                                    >
                                        <ExternalLink className="w-4 h-4 mr-2" />
                                        Play Now
                                    </a>
                                ) : (
                                    <div className="text-center py-2 px-4 bg-gray-100 rounded-lg text-gray-600 text-xs md:text-sm">
                                        Available at venue
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {activities.length === 0 && (
                        <div className="text-center py-12">
                            <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No activities available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
