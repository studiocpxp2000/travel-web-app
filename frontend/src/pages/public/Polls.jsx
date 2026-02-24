import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket, joinOrg } from '../../services/socket';
import { BarChart3, CheckCircle2, Loader2, Lock, Vote } from 'lucide-react';
import { useUserAuth } from '../../hooks/useAuthHooks';
import {
    useGetPollsQuery,
    useVotePollMutation
} from '../../redux/slices/apiSlice';

// ─── Poll Card (User View) ───────────────────────────────────────────────────

function PollVoteCard({ poll, onVote, isVoting }) {
    const [selected, setSelected] = useState(null);
    const hasVoted = poll.hasVoted;
    const myVote = poll.myVote;
    const isActive = poll.status === 'active';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                {/* Question */}
                <h3 className="text-base font-semibold text-gray-900 leading-snug mb-1">{poll.question}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <Vote className="w-3.5 h-3.5" />
                    <span>{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</span>
                    {!isActive && (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide">
                            <Lock className="w-2.5 h-2.5" /> Closed
                        </span>
                    )}
                </div>

                {/* Options */}
                <div className="space-y-2.5">
                    {poll.options.map((opt, i) => {
                        const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                        const isMyVote = hasVoted && myVote === i;
                        const isSelected = selected === i;

                        // If user hasn't voted and poll is active: show radio options
                        if (!hasVoted && isActive) {
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelected(i)}
                                    className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${isSelected
                                        ? 'border-primary-500 bg-primary-50 text-primary-700 ring-1 ring-primary-200'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-primary-500' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-primary-500" />}
                                        </div>
                                        <span>{opt.text}</span>
                                    </div>
                                </button>
                            );
                        }

                        // After voting or closed: show percentage bars
                        return (
                            <div key={i} className="relative">
                                <div className={`px-4 py-3 rounded-xl border text-sm transition-all ${isMyVote
                                    ? 'border-primary-300 bg-primary-50'
                                    : 'border-gray-100 bg-gray-50'
                                    }`}>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isMyVote && <CheckCircle2 className="w-4 h-4 text-primary-500 shrink-0" />}
                                            <span className={`truncate ${isMyVote ? 'text-primary-700 font-semibold' : 'text-gray-700 font-medium'}`}>
                                                {opt.text}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold ml-2 shrink-0 ${isMyVote ? 'text-primary-600' : 'text-gray-500'}`}>
                                            {pct}%
                                        </span>
                                    </div>

                                    {/* Progress bar background */}
                                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-700 ease-out ${isMyVote ? 'bg-primary-100' : 'bg-gray-100'
                                                }`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Vote Button */}
                {!hasVoted && isActive && (
                    <button
                        onClick={() => selected !== null && onVote(poll._id, selected)}
                        disabled={selected === null || isVoting}
                        className="w-full mt-4 py-2.5 px-4 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                    >
                        {isVoting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        ) : (
                            <><Vote className="w-4 h-4" /> Cast Vote</>
                        )}
                    </button>
                )}

                {hasVoted && (
                    <p className="mt-3 text-xs text-center text-green-600 font-medium flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> You voted for this poll
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Polls() {
    const { orgSlug } = useParams();
    const { isAuthenticated } = useUserAuth();

    const { data: pollData, isLoading } = useGetPollsQuery(
        { slug: orgSlug },
        { skip: !orgSlug || !isAuthenticated }
    );
    const [votePoll, { isLoading: isVoting }] = useVotePollMutation();

    // Read polls_enabled from API response (not stale OrgContext)
    const pollsEnabled = pollData?.polls_enabled ?? true; // default true until data loads
    const allPolls = pollData?.data || [];
    const activePolls = allPolls.filter(p => p.status === 'active');

    // Socket room
    useEffect(() => {
        const socket = getSocket();
        const onConnect = () => { if (orgSlug) joinOrg(orgSlug); };
        if (socket.connected) onConnect();
        socket.on('connect', onConnect);
        return () => socket.off('connect', onConnect);
    }, [orgSlug]);

    const handleVote = async (pollId, optionIndex) => {
        try {
            await votePoll({ id: pollId, optionIndex }).unwrap();
        } catch (err) {
            console.error('Vote failed:', err);
        }
    };

    // Feature disabled (only after data has loaded)
    if (!isLoading && !pollsEnabled) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Polls Coming Soon</h2>
                <p className="text-gray-400 text-sm max-w-sm">
                    Polls are not available right now. Check back later!
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
            {/* Header */}
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900">Polls</h1>
                <p className="text-sm text-gray-500 mt-1">Vote and see live results</p>
            </div>

            {/* Loading */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : activePolls.length === 0 ? (
                <div className="text-center py-16">
                    <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-600 mb-1">No Active Polls</h3>
                    <p className="text-sm text-gray-400">There are no polls available right now.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {activePolls.map(poll => (
                        <PollVoteCard
                            key={poll._id}
                            poll={poll}
                            onVote={handleVote}
                            isVoting={isVoting}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
