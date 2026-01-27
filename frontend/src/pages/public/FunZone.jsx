import { Gamepad2, Trophy, Clock, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const games = [
    {
        id: 1,
        title: 'Travel Trivia',
        description: 'Test your knowledge of world destinations and travel facts.',
        icon: '🌍',
        players: '1-4',
        duration: '5 min',
        difficulty: 'Easy',
    },
    {
        id: 2,
        title: 'Destination Match',
        description: 'Match famous landmarks with their countries.',
        icon: '🗺️',
        players: '1',
        duration: '3 min',
        difficulty: 'Medium',
    },
    {
        id: 3,
        title: 'Packing Challenge',
        description: 'Pack your suitcase efficiently in this puzzle game.',
        icon: '🧳',
        players: '1',
        duration: '5 min',
        difficulty: 'Hard',
    },
    {
        id: 4,
        title: 'Flight Simulator',
        description: 'Navigate through different weather conditions.',
        icon: '✈️',
        players: '1',
        duration: '10 min',
        difficulty: 'Hard',
    },
    {
        id: 5,
        title: 'Photo Hunt',
        description: 'Find hidden objects in travel photos.',
        icon: '📸',
        players: '1-2',
        duration: '5 min',
        difficulty: 'Easy',
    },
    {
        id: 6,
        title: 'Currency Exchange',
        description: 'Quick math game with world currencies.',
        icon: '💱',
        players: '1',
        duration: '3 min',
        difficulty: 'Medium',
    },
];

const difficultyColors = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
};

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
                        Take a break and enjoy some travel-themed games! Earn points and climb the leaderboard.
                    </p>
                </div>

                {/* Games Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games.map(game => (
                        <div key={game.id} className="card-hover group cursor-pointer">
                            <div className="text-5xl mb-4">{game.icon}</div>
                            <h3 className="text-xl font-semibold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">
                                {game.title}
                            </h3>
                            <p className="text-text-light text-sm mb-4">{game.description}</p>

                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`badge ${difficultyColors[game.difficulty]}`}>
                                    {game.difficulty}
                                </span>
                                <span className="badge badge-gray">
                                    <Users className="w-3 h-3 mr-1" />
                                    {game.players}
                                </span>
                                <span className="badge badge-gray">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {game.duration}
                                </span>
                            </div>

                            <button className="btn-primary w-full">
                                Play Now
                            </button>
                        </div>
                    ))}
                </div>

                {/* Leaderboard CTA */}
                <div className="mt-12 text-center">
                    <div className="card bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                        <Trophy className="w-12 h-12 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Check Your Ranking!</h2>
                        <p className="mb-4 opacity-90">See how you compare against other players.</p>
                        <Link to="/leaderboard" className="btn bg-white text-orange-600 hover:bg-gray-100">
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
