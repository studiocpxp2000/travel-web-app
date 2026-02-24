import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket, joinOrg, joinAdminRoom } from '../../services/socket';
import {
    BarChart3, Plus, Trash2, X, ToggleLeft, ToggleRight,
    Loader2, AlertTriangle, Image, Camera
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import {
    useGetPollsQuery,
    useGetOrganizationByIdQuery,
    useCreatePollMutation,
    useTogglePollStatusMutation,
    useTogglePollsFeatureMutation,
    useDeletePollMutation
} from '../../redux/slices/apiSlice';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';

// ─── Create Poll Form ─────────────────────────────────────────────────────────

function CreatePollForm({ currentSlug, onSuccess, onError }) {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [imageFiles, setImageFiles] = useState([]);     // { file, preview, title }
    const fileInputRef = useRef(null);
    const [createPoll, { isLoading }] = useCreatePollMutation();

    const addOption = () => {
        if (options.length < 6) setOptions([...options, '']);
    };

    const removeOption = (index) => {
        if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
    };

    const updateOption = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const handleImagesSelect = (e) => {
        const files = Array.from(e.target.files || []);
        const remaining = 5 - imageFiles.length;
        if (remaining <= 0) { onError?.('Maximum 5 images allowed'); return; }
        const toAdd = files.slice(0, remaining);
        const oversized = toAdd.find(f => f.size > 10 * 1024 * 1024);
        if (oversized) { onError?.('Each image must be under 10MB'); return; }

        const newItems = toAdd.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            title: ''
        }));
        setImageFiles(prev => [...prev, ...newItems]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (idx) => {
        setImageFiles(prev => {
            URL.revokeObjectURL(prev[idx].preview);
            return prev.filter((_, i) => i !== idx);
        });
    };

    const updateImageTitle = (idx, title) => {
        setImageFiles(prev => prev.map((item, i) => i === idx ? { ...item, title } : item));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedQuestion = question.trim();
        const trimmedOptions = options.map(o => o.trim()).filter(o => o);

        if (!trimmedQuestion) { onError?.('Question is required'); return; }
        if (trimmedOptions.length < 2) { onError?.('At least 2 options are required'); return; }

        const formData = new FormData();
        formData.append('question', trimmedQuestion);
        formData.append('options', JSON.stringify(trimmedOptions.map(text => ({ text }))));
        if (currentSlug) formData.append('org_slug', currentSlug);

        // Append images + titles
        if (imageFiles.length > 0) {
            imageFiles.forEach(item => formData.append('images', item.file));
            formData.append('imageTitles', JSON.stringify(imageFiles.map(item => item.title.trim())));
        }

        try {
            await createPoll(formData).unwrap();
            setQuestion('');
            setOptions(['', '']);
            imageFiles.forEach(item => URL.revokeObjectURL(item.preview));
            setImageFiles([]);
            onSuccess?.('Poll created and notification sent to users! 🎉');
        } catch (err) {
            onError?.(err?.data?.message || 'Failed to create poll.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <Plus className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-gray-900">Create New Poll</h2>
            </div>

            {/* Question */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What do you think about…"
                    maxLength={500}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Optional Images (up to 5) */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images ({imageFiles.length}/5, optional)</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesSelect} />

                {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        {imageFiles.map((item, idx) => (
                            <div key={idx} className="relative group">
                                <img src={item.preview} alt="" className="h-28 w-full rounded-lg object-cover" />
                                <button type="button" onClick={() => removeImage(idx)}
                                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <X className="w-3 h-3" />
                                </button>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateImageTitle(idx, e.target.value)}
                                    placeholder="Title (optional)"
                                    className="mt-1 w-full px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {imageFiles.length < 5 && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors flex items-center gap-2">
                        <Camera className="w-4 h-4" /> {imageFiles.length > 0 ? 'Add More Images' : 'Add Images'}
                    </button>
                )}
            </div>

            {/* Options */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options ({options.length}/6)</label>
                <div className="space-y-2">
                    {options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 w-5 text-center">{i + 1}</span>
                            <input
                                type="text"
                                value={opt}
                                onChange={(e) => updateOption(i, e.target.value)}
                                placeholder={`Option ${i + 1}`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            />
                            {options.length > 2 && (
                                <button type="button" onClick={() => removeOption(i)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                {options.length < 6 && (
                    <button type="button" onClick={addOption} className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Add Option
                    </button>
                )}
            </div>

            {/* Submit */}
            <button type="submit" disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><BarChart3 className="w-4 h-4" /> Create Poll</>}
            </button>
        </form>
    );
}

// ─── Poll Card ────────────────────────────────────────────────────────────────

function PollCard({ poll, onToggle, onDelete, isToggling }) {
    const isActive = poll.status === 'active';

    return (
        <div className={`bg-white rounded-xl border p-5 transition-colors ${isActive ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm leading-snug">{poll.question}</h3>
                    <p className="text-xs text-gray-500 mt-1">{poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button onClick={() => onToggle(poll._id)} disabled={isToggling}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                        {isActive ? 'Active' : 'Disabled'}
                    </button>
                    <button onClick={() => onDelete(poll)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Images */}
            {poll.images && poll.images.length > 0 && (
                <div className={`mb-3 ${poll.images.length === 1 ? '' : 'grid grid-cols-2 gap-2'}`}>
                    {poll.images.map((img, i) => (
                        <div key={i} className="relative">
                            <img src={img.url} alt={img.title || ''} className={`w-full ${poll.images.length === 1 ? 'h-40' : 'h-28'} object-cover rounded-lg`} />
                            {img.title && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{img.title}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Results bars */}
            <div className="space-y-2">
                {poll.options.map((opt, i) => {
                    const pct = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                    return (
                        <div key={i}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-700 font-medium truncate mr-2">{opt.text}</span>
                                <span className="text-gray-500 shrink-0">{opt.votes} ({pct}%)</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PollManager() {
    const { orgSlug } = useParams();
    const { user } = useAuth();

    const { data: orgData } = useGetOrganizationByIdQuery(
        (!orgSlug && user?.org_id) ? user.org_id : undefined,
        { skip: !!orgSlug || !user?.org_id }
    );
    const currentSlug = orgSlug || orgData?.data?.slug;

    const { data: pollData, isLoading } = useGetPollsQuery({ slug: currentSlug }, { skip: !currentSlug });
    const [togglePollStatus, { isLoading: isToggling }] = useTogglePollStatusMutation();
    const [togglePollsFeature, { isLoading: isTogglingFeature }] = useTogglePollsFeatureMutation();
    const [deletePoll] = useDeletePollMutation();

    const polls = pollData?.data || [];
    const pollsEnabled = pollData?.polls_enabled ?? false;

    // Socket rooms
    useEffect(() => {
        const socket = getSocket();
        const onConnect = () => { if (currentSlug) { joinOrg(currentSlug); joinAdminRoom(currentSlug); } };
        if (socket.connected) onConnect();
        socket.on('connect', onConnect);
        return () => socket.off('connect', onConnect);
    }, [currentSlug]);

    // State
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, poll: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });

    const showStatus = (type, title, message) => setStatusModal({ isOpen: true, type, title, message });

    const handleToggleFeature = async () => {
        try {
            const payload = {};
            if (currentSlug) payload.org_slug = currentSlug;
            await togglePollsFeature(payload).unwrap();
        } catch (err) {
            showStatus('error', 'Toggle Failed', err?.data?.message || 'Could not update poll settings.');
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            await togglePollStatus(id).unwrap();
        } catch (err) {
            showStatus('error', 'Toggle Failed', err?.data?.message || 'Failed to toggle poll status.');
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm.poll) return;
        try {
            await deletePoll(deleteConfirm.poll._id).unwrap();
            showStatus('success', 'Poll Deleted', 'The poll has been removed.');
        } catch (err) {
            showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete poll.');
        }
        setDeleteConfirm({ isOpen: false, poll: null });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Polls</h1>
                    <p className="text-text-light">
                        Create and manage polls for your audience
                        <span className="ml-2 text-green-600 text-sm font-medium">• Real-time sync enabled</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                    <BarChart3 className="w-4 h-4" />
                    <span className="font-medium">{polls.length}</span> poll{polls.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Feature Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-800">Polls Feature</p>
                        <p className="text-xs text-gray-500">Show or hide the polls page for all users</p>
                    </div>
                    <button onClick={handleToggleFeature} disabled={isTogglingFeature}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${pollsEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {isTogglingFeature ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : pollsEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {pollsEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                </div>
            </div>

            {/* Create Poll */}
            <CreatePollForm
                currentSlug={currentSlug}
                onSuccess={(msg) => showStatus('success', 'Poll Created', msg)}
                onError={(msg) => showStatus('error', 'Error', msg)}
            />

            {/* Poll List */}
            {isLoading ? (
                <div className="space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-xl" />)}
                </div>
            ) : polls.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-600 mb-1">No polls yet</h3>
                    <p className="text-sm text-gray-400">Create your first poll above to start gathering feedback.</p>
                    {!pollsEnabled && (
                        <div className="flex items-center justify-center gap-2 mt-3 text-amber-600 text-sm">
                            <AlertTriangle className="w-4 h-4" /><span>Polls feature is currently disabled</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {polls.map(poll => (
                        <PollCard
                            key={poll._id}
                            poll={poll}
                            onToggle={handleToggleStatus}
                            onDelete={(poll) => setDeleteConfirm({ isOpen: true, poll })}
                            isToggling={isToggling}
                        />
                    ))}
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, poll: null })}
                onConfirm={handleDelete}
                title="Delete Poll"
                message="Are you sure you want to delete this poll? All votes will be lost."
                confirmText="Delete"
                confirmStyle="danger"
            />

            {/* Status Modal */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
            />
        </div>
    );
}
