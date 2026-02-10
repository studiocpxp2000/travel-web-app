import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useGetLeaderboardQuery } from '../../redux/slices/apiSlice';
import { useOrg } from '../../context/OrgContext';
import { skipToken } from '@reduxjs/toolkit/query/react';

/* const leaderboardData = [ ... ] */ // Removed mock data

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
    const { currentOrg } = useOrg();
    const { data: leaderboardRes, isLoading } = useGetLeaderboardQuery(
        currentOrg?._id ? { org_id: currentOrg._id } : skipToken
    );
    const leaderboardData = leaderboardRes?.data || [];

    // Transform backend data to match UI needs
    // Backend returns Score objects populated with user.
    const uiData = leaderboardData.map((score, index) => ({
        rank: index + 1,
        // user_name_snapshot is reliable if user is deleted, score.user.name is live
        name: score.user?.name || score.user_name_snapshot || 'Anonymous',
        points: score.current_score || 0,
        avatar: '👤' // Default avatar
    }));

    if (isLoading) return <div className="p-10 text-center">Loading Leaderboard...</div>;

    // Safety check for empty data - Show placeholders if needed or just empty
    const displayData = [...uiData];
    if (displayData.length > 0 && displayData.length < 3) {
        // Optional: Add placeholders to fill podium if needed, but let's just show real data
    }

    // Top 3 for Podium
    const topThree = [
        displayData.find(d => d.rank === 1),
        displayData.find(d => d.rank === 2),
        displayData.find(d => d.rank === 3),
    ];

    return (
        <div>
            {/* Hero Section */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden bg-primary-900">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px] transition-opacity duration-1000"
                    onCanPlay={(e) => e.target.classList.remove('opacity-0')}
                >
                    <source src="/leaderboard-video.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-black/50" />
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
                    {/* Top 3 Podium - Only show if we have enough data */}
                    {displayData.length >= 3 && (
                        <div className="flex justify-center items-end gap-2 sm:gap-4 mb-8 md:mb-12">
                            {/* 2nd Place */}
                            <div className="text-center flex-shrink-0">
                                <div className="text-3xl sm:text-4xl mb-2">{topThree[1].avatar}</div>
                                <div className="w-20 sm:w-24 h-20 bg-gradient-to-t from-gray-300 to-gray-200 rounded-t-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-bold text-gray-600">2</span>
                                </div>
                                <div className="w-20 sm:w-24 bg-white p-2 rounded-b-lg shadow">
                                    <p className="font-medium text-xs sm:text-sm truncate">{topThree[1].name}</p>
                                    <p className="text-xs text-primary-600 font-bold">{topThree[1].points} pts</p>
                                </div>
                            </div>

                            {/* 1st Place */}
                            <div className="text-center flex-shrink-0">
                                <div className="text-4xl sm:text-5xl mb-2">{topThree[0].avatar}</div>
                                <div className="w-24 sm:w-28 h-28 bg-gradient-to-t from-yellow-400 to-yellow-300 rounded-t-lg flex items-center justify-center relative">
                                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-700 absolute -top-4" />
                                    <span className="text-2xl sm:text-3xl font-bold text-yellow-700">1</span>
                                </div>
                                <div className="w-24 sm:w-28 bg-white p-2 sm:p-3 rounded-b-lg shadow">
                                    <p className="font-semibold text-sm sm:text-base truncate">{topThree[0].name}</p>
                                    <p className="text-xs sm:text-sm text-primary-600 font-bold">{topThree[0].points} pts</p>
                                </div>
                            </div>

                            {/* 3rd Place */}
                            <div className="text-center flex-shrink-0">
                                <div className="text-3xl sm:text-4xl mb-2">{topThree[2].avatar}</div>
                                <div className="w-20 sm:w-24 h-16 bg-gradient-to-t from-orange-400 to-orange-300 rounded-t-lg flex items-center justify-center">
                                    <span className="text-xl sm:text-2xl font-bold text-orange-700">3</span>
                                </div>
                                <div className="w-20 sm:w-24 bg-white p-2 rounded-b-lg shadow">
                                    <p className="font-medium text-xs sm:text-sm truncate">{topThree[2].name}</p>
                                    <p className="text-xs text-primary-600 font-bold">{topThree[2].points} pts</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Full Leaderboard */}
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Rank</th>
                                        <th className="text-left py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Player</th>
                                        {/* Removed Games Column */}
                                        <th className="text-right py-3 px-3 sm:px-4 text-xs font-semibold text-text-light uppercase">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayData.map((player, idx) => (
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
                                            <td className="py-3 sm:py-4 px-3 sm:px-4 text-right">
                                                <span className="font-bold text-primary-600">{player.points}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {displayData.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="py-8 text-center text-gray-500">
                                                No scores yet. Be the first to play!
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Stats */}
                    {displayData.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-6 md:mt-8 max-w-lg mx-auto">
                            <div className="card text-center p-3 sm:p-4">
                                <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 mx-auto mb-1 sm:mb-2" />
                                <p className="text-lg sm:text-2xl font-bold text-dark-900">{displayData[0].points}</p>
                                <p className="text-xs sm:text-sm text-text-light">Highest Score</p>
                            </div>
                            <div className="card text-center p-3 sm:p-4">
                                <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 mx-auto mb-1 sm:mb-2" />
                                <p className="text-lg sm:text-2xl font-bold text-dark-900">{displayData.length}</p>
                                <p className="text-xs sm:text-sm text-text-light">Total Players</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
