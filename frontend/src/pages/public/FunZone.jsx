import { Gamepad2, Clock, Users, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Activities data - supports both online (with link) and physical activities
const activities = [
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
];

export default function FunZone() {
    return (
        <div className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                        <Gamepad2 className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Fun Zone</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Enjoy some activities
                    </p>
                </div>

                {/* Activities Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activities.map(activity => (
                        <div key={activity.id} className="card-hover group">
                            <div className="text-5xl mb-4">{activity.icon}</div>
                            <h3 className="text-xl font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {activity.title}
                            </h3>
                            <p className="text-text-light text-sm mb-4">{activity.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                {/* Activity Type Badge */}
                                <span className={`badge ${activity.type === 'online'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-green-100 text-green-700'
                                    }`}>
                                    {activity.type === 'online' ? '🌐 Online' : '🏃 Physical'}
                                </span>
                                <span className="badge badge-gray">
                                    <Users className="w-3 h-3 mr-1" />
                                    {activity.players}
                                </span>
                                <span className="badge badge-gray">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {activity.duration}
                                </span>
                            </div>

                            {activity.type === 'online' && activity.link ? (
                                <a
                                    href={activity.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn-primary w-full"
                                >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Play Now
                                </a>
                            ) : (
                                <div className="text-center py-2 px-4 bg-gray-100 rounded-lg text-gray-600 text-sm">
                                    Available at venue
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Empty State */}
                {activities.length === 0 && (
                    <div className="text-center py-12">
                        <Gamepad2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No activities available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
