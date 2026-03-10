import { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useOrg } from '../../context/OrgContext';
import { useAuth } from '../../hooks/useAuthHooks';
import { getSocket, joinOrg } from '../../services/socket';
import { useGetPollsQuery, useVotePollMutation } from '../../redux/slices/apiSlice';
import { BarChart3, AlertTriangle, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { VOTE_STORAGE_KEY } from '../../utils/constants';
import Loading from '../../components/common/Loading';

function PollVoteCard({ poll }) {
    const [votePoll, { isLoading: isVoting }] = useVotePollMutation();
    const [selectedOption, setSelectedOption] = useState(null);

    // If local storage says we voted but server doesn't, honor the server
    // (This handles the case where local storage is stale or cleared)
    const hasVoted = poll.hasVoted;
    const myVote = poll.myVote;

    const handleVoteSubmit = async () => {
        if (selectedOption === null || hasVoted) return;

        try {
            await votePoll({
                id: poll._id,
                optionIndex: selectedOption
            }).unwrap();

            // Store local fallback (not strictly necessary with socket, but good for immediate UI)
            const localVotes = JSON.parse(localStorage.getItem(VOTE_STORAGE_KEY) || '{}');
            localVotes[poll._id] = selectedOption;
            localStorage.setItem(VOTE_STORAGE_KEY, JSON.stringify(localVotes));
        } catch (err) {
            console.error('Failed to vote:', err);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-5">
            {/* Images */}
            {poll.images && poll.images.length > 0 && (
                poll.images.length === 1 ? (
                    <div>
                        <img src={poll.images[0].url} alt={poll.images[0].title || ''} className="w-full h-44 sm:h-52 object-cover" />
                        {poll.images[0].title && (
                            <p className="px-5 pt-2 text-xs text-gray-500">{poll.images[0].title}</p>
                        )}
                    </div>
                ) : (
                    <div className="flex overflow-x-auto gap-1 snap-x snap-mandatory">
                        {poll.images.map((img, i) => (
                            <div key={i} className="snap-center shrink-0 w-[70%] first:ml-0">
                                <img src={img.url} alt={img.title || ''} className="w-full h-44 sm:h-48 object-cover" />
                                {img.title && <p className="px-3 pt-1 text-xs text-gray-500 truncate">{img.title}</p>}
                            </div>
                        ))}
                    </div>
                )
            )}

            <div className="p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{poll.question}</h3>

                <div className="space-y-3">
                    {poll.options.map((opt, idx) => {
                        const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        const isSelected = selectedOption === idx;
                        const isMyVote = myVote === idx;

                        if (hasVoted) {
                            return (
                                <div key={idx} className="relative overflow-hidden rounded-xl border border-gray-200">
                                    {/* Background fill */}
                                    <div
                                        className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out ${isMyVote ? 'bg-primary-100' : 'bg-gray-100'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                    {/* Content */}
                                    <div className="relative px-4 py-3 flex items-center justify-between z-10">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${isMyVote ? 'text-primary-800' : 'text-gray-800'}`}>
                                                {opt.text}
                                            </span>
                                            {isMyVote && <span className="text-[10px] font-bold text-primary-600 bg-white px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm">Your Vote</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500">{opt.votes}</span>
                                            <span className="font-semibold text-gray-900 whitespace-nowrap">{pct}%</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        // Not voted yet
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedOption(idx)}
                                className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${isSelected
                                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-100'
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary-500' : 'border-gray-300'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />}
                                    </div>
                                    <span className={`text-sm ${isSelected ? 'font-medium text-primary-900' : 'text-gray-700'}`}>
                                        {opt.text}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {!hasVoted && (
                    <button
                        onClick={handleVoteSubmit}
                        disabled={selectedOption === null || isVoting}
                        className="mt-5 w-full py-3 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                        {isVoting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Vote'}
                    </button>
                )}

                {hasVoted && (
                    <div className="mt-4 text-center text-xs text-gray-500">
                        Total votes: <span className="font-medium text-gray-700">{poll.totalVotes}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LiveEngagement() {
    const { orgSlug } = useParams();
    const { currentOrg } = useOrg();
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);

    // Fallback to currentOrg slug if URL parameter is missing
    const activeSlug = orgSlug || currentOrg?.slug;

    // We fetch polls data which now includes quizzes and live_engagement_enabled flag
    const { data: pollData, isLoading, refetch } = useGetPollsQuery({ slug: activeSlug }, {
        skip: !activeSlug,
        refetchOnMountOrArgChange: true // Always refetch on mount for fresh data
    });

    useEffect(() => {
        setIsVisible(true);
        // Connect to org socket room
        const socket = getSocket();

        const onConnect = () => {
            if (activeSlug) joinOrg(activeSlug);
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);
        return () => socket.off('connect', onConnect);
    }, [activeSlug]);

    // Read feature flag and configuration from API response
    // Ensure we handle loading and missing data gracefully
    const liveEngagementEnabled = pollData ? (pollData.live_engagement_enabled ?? false) : false;
    const quizzes = (pollData?.quizzes || []).filter(q => q.isActive);
    const allPolls = pollData?.data || [];
    const activePolls = allPolls.filter(p => p.status === 'active');

    // Handle Quiz Click - redirect to quiz app with user data
    const handleQuizClick = (quiz) => {
        const callbackUrl = `${import.meta.env.VITE_API_BASE_URL}/polls/quiz-callback?slug=${activeSlug}`;
        const targetUrl = new URL(quiz.url);
        if (user?.email) targetUrl.searchParams.append('email', user.email);
        if (user?.name) targetUrl.searchParams.append('name', user.name);
        targetUrl.searchParams.append('callback', callbackUrl);

        window.open(targetUrl.toString(), '_blank');
    };

    if (isLoading) return <Loading />;

    // Feature disabled showing "Not Active"
    if (!liveEngagementEnabled) {
        return (
            <div className="bg-gray-50 min-h-screen pb-20">
                <section className={`relative h-[25vh] min-h-[180px] overflow-hidden transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-primary-800 to-purple-900" />
                    <img
                        src="/live-engagement-hero.jpg" alt="Live Engagement"
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
                        onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-60')}
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                        <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md text-white rounded-2xl mb-3 border border-white/20 shadow-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">Live Engagement</h1>
                        <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
                            Participate in live polls and interactive quizzes!
                        </p>
                    </div>
                </section>

                <div className={`transition-all duration-700 transform mt-12 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md mx-auto">
                        <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Not Active</h2>
                        <p className="text-gray-500 text-sm">
                            Live engagement is not active, your event organizer will turn it on.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Hero Section */}
            <section className={`relative h-[25vh] min-h-[180px] overflow-hidden transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-primary-800 to-purple-900" />
                <img
                    src="/live-engagement-hero.jpg" alt="Live Engagement"
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
                    onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-60')}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="inline-flex items-center justify-center p-2.5 bg-white/10 backdrop-blur-md text-white rounded-2xl mb-3 border border-white/20 shadow-xl">
                        <BarChart3 className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">Live Engagement</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
                        Participate in live polls and interactive quizzes!
                    </p>
                </div>
            </section>

            {/* Content Container */}
            <div className={`max-w-xl mx-auto space-y-6 mt-8 transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>

                {/* Quizzes Section */}
                {quizzes.length > 0 && (
                    <div className="px-4 mb-8">
                        <h2 className="text-sm border-b border-gray-200 pb-2 font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            Live Quizzes
                        </h2>
                        <div className="space-y-3">
                            {quizzes.map(quiz => (
                                <button
                                    key={quiz._id}
                                    onClick={() => handleQuizClick(quiz)}
                                    className="w-full bg-white hover:bg-primary-50 border border-gray-100 shadow-sm rounded-xl p-4 flex items-center justify-between transition-colors group text-left"
                                >
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                                            {quiz.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">Play now and earn points!</p>
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-full group-hover:bg-primary-100 transition-colors">
                                        <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Polls Section */}
                <div className="px-4">
                    {activePolls.length > 0 && (
                        <h2 className="text-sm border-b border-gray-200 pb-2 font-bold text-gray-800 uppercase tracking-wider mb-4">
                            Active Polls
                        </h2>
                    )}

                    {activePolls.length === 0 && quizzes.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <p className="text-gray-500">There are no quizzes or polls available right now.</p>
                        </div>
                    ) : (
                        activePolls.map(poll => (
                            <PollVoteCard key={poll._id} poll={poll} />
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}
