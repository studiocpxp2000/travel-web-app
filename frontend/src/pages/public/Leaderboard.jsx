import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

const leaderboardData = [
    { rank: 1, name: 'Alice Johnson', points: 2850, games: 24, avatar: '👩' },
    { rank: 2, name: 'Bob Smith', points: 2720, games: 22, avatar: '👨' },
    { rank: 3, name: 'Carol White', points: 2650, games: 20, avatar: '👩‍🦰' },
    { rank: 4, name: 'David Brown', points: 2480, games: 19, avatar: '👨‍🦱' },
    { rank: 5, name: 'Emma Davis', points: 2350, games: 18, avatar: '👩‍🦳' },
    { rank: 6, name: 'Frank Wilson', points: 2200, games: 17, avatar: '👴' },
    { rank: 7, name: 'Grace Lee', points: 2100, games: 16, avatar: '👧' },
    { rank: 8, name: 'Henry Chen', points: 1980, games: 15, avatar: '👦' },
    { rank: 9, name: 'Ivy Martinez', points: 1850, games: 14, avatar: '👩‍🦲' },
    { rank: 10, name: 'Jack Taylor', points: 1720, games: 13, avatar: '🧔' },
];

const getRankIcon = (rank) => {
    switch (rank) {
        case 1:
            return <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center"><Trophy className="w-4 h-4 text-yellow-800" /></div>;
        case 2:
            return <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center"><Medal className="w-4 h-4 text-gray-600" /></div>;
        case 3:
            return <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center"><Award className="w-4 h-4 text-orange-800" /></div>;
        default:
            return <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">{rank}</div>;
    }
};

export default function Leaderboard() {
    return (
        <div>
            {/* Hero Section with Video Background - same style as Home */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/leaderboard-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Leaderboard</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed">
                        Top players ranked by total points earned in the Fun Zone.
                    </p>
                </div>
            </section>

            {/* Main Content */}
            <div className="py-8 md:py-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Top 3 Podium */}
                    <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 md:mb-12">
                        {/* 2nd Place */}
                        <div className="text-center flex-shrink-0">
                            <div className="text-3xl sm:text-4xl mb-2">{leaderboardData[1].avatar}</div>
                            <div className="w-20 sm:w-24 h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg flex items-center justify-center">
                                <span className="text-xl sm:text-2xl font-bold text-gray-600">2</span>
                            </div>
                            <div className="w-20 sm:w-24 bg-white p-2 rounded-b-lg shadow">
                                <p className="font-medium text-xs sm:text-sm truncate">{leaderboardData[1].name}</p>
                                <p className="text-xs text-primary-600 font-bold">{leaderboardData[1].points} pts</p>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="text-center flex-shrink-0">
                            <div className="text-4xl sm:text-5xl mb-2">{leaderboardData[0].avatar}</div>
                            <div className="w-24 sm:w-28 h-28 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg flex items-center justify-center relative">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-700 absolute -top-4" />
                                <span className="text-2xl sm:text-3xl font-bold text-yellow-700">1</span>
                            </div>
                            <div className="w-24 sm:w-28 bg-white p-2 sm:p-3 rounded-b-lg shadow">
                                <p className="font-semibold text-sm sm:text-base truncate">{leaderboardData[0].name}</p>
                                <p className="text-xs sm:text-sm text-primary-600 font-bold">{leaderboardData[0].points} pts</p>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="text-center flex-shrink-0">
                            <div className="text-3xl sm:text-4xl mb-2">{leaderboardData[2].avatar}</div>
                            <div className="w-20 sm:w-24 h-16 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg flex items-center justify-center">
                                <span className="text-xl sm:text-2xl font-bold text-orange-700">3</span>
                            </div>
                            <div className="w-20 sm:w-24 bg-white p-2 rounded-b-lg shadow">
                                <p className="font-medium text-xs sm:text-sm truncate">{leaderboardData[2].name}</p>
                                <p className="text-xs text-primary-600 font-bold">{leaderboardData[2].points} pts</p>
                            </div>
                        </div>
                    </div>

                    {/* Full Leaderboard */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Rank</th>
                                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Player</th>
                                        <th className="text-right py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase hidden sm:table-cell">Games</th>
                                        <th className="text-right py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboardData.map((player, idx) => (
                                        <tr key={player.rank} className={`border-b border-gray-100 ${idx < 3 ? 'bg-yellow-50/50' : ''}`}>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                {getRankIcon(player.rank)}
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4">
                                                <div className="flex items-center gap-2 sm:gap-3">
                                                    <span className="text-xl sm:text-2xl">{player.avatar}</span>
                                                    <span className="font-medium text-dark-900 text-sm sm:text-base">{player.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-right text-text-light hidden sm:table-cell">{player.games}</td>
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                                                <span className="font-bold text-primary-600">{player.points}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 md:mt-8">
                        <div className="card text-center p-3 sm:p-4">
                            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                            <p className="text-lg sm:text-2xl font-bold text-dark-900">2,850</p>
                            <p className="text-xs sm:text-sm text-text-light">Highest Score</p>
                        </div>
                        <div className="card text-center p-3 sm:p-4">
                            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                            <p className="text-lg sm:text-2xl font-bold text-dark-900">158</p>
                            <p className="text-xs sm:text-sm text-text-light">Total Players</p>
                        </div>
                        <div className="card text-center p-3 sm:p-4">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-1 sm:mb-2" />
                            <p className="text-lg sm:text-2xl font-bold text-dark-900">1,234</p>
                            <p className="text-xs sm:text-sm text-text-light">Games Played</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
