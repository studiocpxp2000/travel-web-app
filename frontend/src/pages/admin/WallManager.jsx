import { useState, useEffect, useRef } from 'react';
import { getSocket, joinOrg, joinAdminRoom } from '../../services/socket';
import { useParams } from 'react-router-dom';
import {
    Layers, Trash2, X, ToggleLeft, ToggleRight,
    Camera, Users, Loader2, AlertTriangle, Upload, Plus, Download,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuthHooks';
import {
    useGetWallPostsQuery,
    useGetOrganizationByIdQuery,
    useDeleteWallPostMutation,
    useToggleWallFeatureMutation,
    useAdminUploadWallPostsMutation,
    useDownloadWallPostsMutation,
    useDeleteWallPostsMutation
} from '../../redux/slices/apiSlice';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';

// ─── Feature Toggle Card ──────────────────────────────────────────────────────

function FeatureToggleCard({ wallEnabled, uploadEnabled, onToggle, isToggling }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-gray-900">Wall Settings</h2>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                    <p className="text-sm font-medium text-gray-800">Social Wall</p>
                    <p className="text-xs text-gray-500">Show or hide the wall for all users</p>
                </div>
                <button onClick={() => onToggle({ wall_enabled: !wallEnabled })} disabled={isToggling}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${wallEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : wallEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {wallEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <div>
                    <p className="text-sm font-medium text-gray-800">User Uploads</p>
                    <p className="text-xs text-gray-500">Let users post photos from their camera</p>
                </div>
                <button onClick={() => onToggle({ wall_upload_enabled: !uploadEnabled })} disabled={isToggling || !wallEnabled}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${uploadEnabled && wallEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={!wallEnabled ? 'Enable Wall first' : ''}>
                    {isToggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (uploadEnabled && wallEnabled) ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {uploadEnabled && wallEnabled ? 'Enabled' : 'Disabled'}
                </button>
            </div>
        </div>
    );
}

// ─── Admin Upload Card ────────────────────────────────────────────────────────

function AdminUploadCard({ currentSlug, onSuccess, onError }) {
    const [files, setFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);
    const [adminUploadWallPosts, { isLoading: isUploading }] = useAdminUploadWallPostsMutation();

    const handleFilesSelected = (e) => {
        const selected = Array.from(e.target.files || []);
        if (selected.length === 0) return;
        const valid = selected.filter(f => f.size <= 10 * 1024 * 1024);
        if (valid.length < selected.length) onError?.('Some files exceeded 10MB and were skipped.');
        setFiles(prev => [...prev, ...valid]);
        valid.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPreviews(prev => [...prev, { name: file.name, url: reader.result }]);
            reader.readAsDataURL(file);
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        const formData = new FormData();
        files.forEach(f => formData.append('images', f));
        if (currentSlug) formData.append('org_slug', currentSlug);
        try {
            const result = await adminUploadWallPosts(formData).unwrap();
            setFiles([]); setPreviews([]);
            onSuccess?.(`${result.count} photo${result.count !== 1 ? 's' : ''} uploaded successfully!`);
        } catch (err) {
            onError?.(err?.data?.message || 'Upload failed. Please try again.');
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary-600" />
                <h2 className="font-semibold text-gray-900">Upload Photos</h2>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFilesSelected} />
            {previews.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 mb-4">
                    {previews.map((p, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                            <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                            <button onClick={() => removeFile(i)} className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-primary-400 hover:text-primary-500 transition-colors">
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            )}
            <div className="flex gap-3">
                {previews.length === 0 ? (
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 font-medium text-sm flex items-center justify-center gap-2 hover:border-primary-400 hover:text-primary-500 hover:bg-primary-50 transition-colors">
                        <Camera className="w-5 h-5" /> Select Images
                    </button>
                ) : (
                    <>
                        <button onClick={() => { setFiles([]); setPreviews([]); }} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Clear</button>
                        <button onClick={handleUpload} disabled={isUploading} className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {files.length}…</> : <><Upload className="w-4 h-4" /> Upload {files.length} Photo{files.length !== 1 ? 's' : ''}</>}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WallManager() {
    const { orgSlug } = useParams();
    const { user } = useAuth();

    const { data: orgData } = useGetOrganizationByIdQuery(
        (!orgSlug && user?.org_id) ? user.org_id : undefined,
        { skip: !!orgSlug || !user?.org_id }
    );
    const currentSlug = orgSlug || orgData?.data?.slug;

    const { data: wallData, isLoading } = useGetWallPostsQuery({ slug: currentSlug }, { skip: !currentSlug });
    const [deleteWallPost] = useDeleteWallPostMutation();
    const [deleteWallPosts] = useDeleteWallPostsMutation();
    const [downloadWallPosts] = useDownloadWallPostsMutation();
    const [toggleWallFeature, { isLoading: isToggling }] = useToggleWallFeatureMutation();

    const posts = wallData?.data || [];
    const wallEnabled = wallData?.wall_enabled ?? false;
    const uploadEnabled = wallData?.wall_upload_enabled ?? false;

    // Socket rooms
    useEffect(() => {
        const socket = getSocket();
        const onConnect = () => { if (currentSlug) { joinOrg(currentSlug); joinAdminRoom(currentSlug); } };
        if (socket.connected) onConnect();
        socket.on('connect', onConnect);
        return () => socket.off('connect', onConnect);
    }, [currentSlug]);

    // State
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, post: null, isBulk: false });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });

    const showStatus = (type, title, message) => setStatusModal({ isOpen: true, type, title, message });

    // Lightbox
    const openLightbox = (index) => { setCurrentImageIndex(index); setLightboxOpen(true); };
    const closeLightbox = () => setLightboxOpen(false);
    const goToPrev = () => setCurrentImageIndex((prev) => prev === 0 ? posts.length - 1 : prev - 1);
    const goToNext = () => setCurrentImageIndex((prev) => prev === posts.length - 1 ? 0 : prev + 1);

    // Selection
    const toggleSelection = (id) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedItems(newSelection);
    };
    const selectAll = () => {
        if (selectedItems.size === posts.length) setSelectedItems(new Set());
        else setSelectedItems(new Set(posts.map(p => p._id)));
    };

    // Download
    const handleBulkDownload = async (type) => {
        try {
            setIsDownloading(true);
            const orgId = posts[0]?.org_id;
            if (!orgId) { setIsDownloading(false); return; }
            const blob = await downloadWallPosts({ org_id: orgId, ids: type === 'all' ? 'all' : [...selectedItems] }).unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `wall-download-${Date.now()}.zip`;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            if (type === 'selected') { setSelectedItems(new Set()); setIsSelectionMode(false); }
        } catch { showStatus('error', 'Download Failed', 'Failed to download images.'); }
        finally { setIsDownloading(false); }
    };

    // Toggles
    const handleToggle = async (settings) => {
        try {
            const payload = { ...settings };
            if (currentSlug) payload.org_slug = currentSlug;
            await toggleWallFeature(payload).unwrap();
        } catch (err) {
            showStatus('error', 'Toggle Failed', err?.data?.message || 'Could not update wall settings.');
        }
    };

    // Delete
    const handleDelete = async () => {
        if (deleteConfirm.isBulk) {
            try {
                await deleteWallPosts([...selectedItems]).unwrap();
                showStatus('success', 'Posts Deleted', `${selectedItems.size} posts have been removed.`);
                setSelectedItems(new Set()); setIsSelectionMode(false);
            } catch (err) {
                showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete posts.');
            }
        } else if (deleteConfirm.post) {
            try {
                await deleteWallPost(deleteConfirm.post._id).unwrap();
                showStatus('success', 'Post Deleted', 'The wall post has been removed.');
            } catch (err) {
                showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete post.');
            }
        }
        setDeleteConfirm({ isOpen: false, post: null, isBulk: false });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Social Wall</h1>
                    <p className="text-text-light">
                        Manage user photo posts and feature settings
                        <span className="ml-2 text-green-600 text-sm font-medium">• Real-time sync enabled</span>
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 rounded-lg px-3 py-2">
                    <Camera className="w-4 h-4" />
                    <span className="font-medium">{posts.length}</span> post{posts.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Feature Toggles */}
            <FeatureToggleCard wallEnabled={wallEnabled} uploadEnabled={uploadEnabled} onToggle={handleToggle} isToggling={isToggling} />

            {/* Admin Upload */}
            <AdminUploadCard currentSlug={currentSlug} onSuccess={(msg) => showStatus('success', 'Upload Complete', msg)} onError={(msg) => showStatus('error', 'Upload Error', msg)} />

            {/* Action Bar */}
            {posts.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => handleBulkDownload('all')} className="btn-secondary flex items-center gap-2" disabled={isDownloading}>
                        <Download className="w-4 h-4" /> {isDownloading ? 'Zipping...' : 'Download All'}
                    </button>
                    <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedItems(new Set()); }}
                        className={`btn-secondary ${isSelectionMode ? 'bg-primary-100 text-primary-700 border-primary-300' : ''}`}>
                        {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
                    {isSelectionMode && (
                        <>
                            <button onClick={selectAll} className="btn-secondary text-sm">
                                {selectedItems.size === posts.length ? 'Deselect All' : 'Select All'}
                            </button>
                            {selectedItems.size > 0 && (
                                <>
                                    <button onClick={() => handleBulkDownload('selected')} className="btn-secondary flex items-center gap-2" disabled={isDownloading}>
                                        <Download className="w-4 h-4" /> Download ({selectedItems.size})
                                    </button>
                                    <button onClick={() => setDeleteConfirm({ isOpen: true, isBulk: true })} className="btn-danger flex items-center gap-2">
                                        <Trash2 className="w-4 h-4" /> Delete ({selectedItems.size})
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Posts Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                    {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-gray-200 rounded-xl" />)}
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="font-medium text-gray-600 mb-1">No posts yet</h3>
                    <p className="text-sm text-gray-400">{wallEnabled ? "Users haven't shared anything yet." : 'Enable the wall so users can start sharing.'}</p>
                    {!wallEnabled && (
                        <div className="flex items-center justify-center gap-2 mt-3 text-amber-600 text-sm">
                            <AlertTriangle className="w-4 h-4" /><span>Wall is currently disabled</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {posts.map((post, index) => (
                        <div key={post._id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer">
                            <img
                                src={post.imageUrl} alt="" loading="lazy"
                                onClick={() => isSelectionMode ? toggleSelection(post._id) : openLightbox(index)}
                                className={`w-full h-full object-cover transition-transform duration-300 ${isSelectionMode ? '' : 'group-hover:scale-105'}`}
                            />
                            {/* Poster name overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-8 pb-2.5 px-3 pointer-events-none">
                                <p className="text-xs text-white font-medium truncate">{post.is_moderator ? '📌 Moderator' : post.user_name_snapshot}</p>
                            </div>

                            {/* Selection Checkbox */}
                            {isSelectionMode && (
                                <div className="absolute top-2 left-2 z-20">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.has(post._id) ? 'bg-primary-500 border-primary-500' : 'bg-black/40 border-white'}`}
                                        onClick={(e) => { e.stopPropagation(); toggleSelection(post._id); }}>
                                        {selectedItems.has(post._id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                </div>
                            )}

                            {/* Hover delete */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ isOpen: true, post }); }}
                                    className="p-1.5 bg-white/90 rounded-lg hover:bg-red-50" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxOpen && posts.length > 0 && (
                <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                    <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg"><X className="w-8 h-8" /></button>
                    <button onClick={goToPrev} className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-lg"><ChevronLeft className="w-8 h-8" /></button>
                    <button onClick={goToNext} className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-lg"><ChevronRight className="w-8 h-8" /></button>
                    <div className="max-w-5xl max-h-[80vh] mx-4">
                        <img src={posts[currentImageIndex].imageUrl} alt="Wall post" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                    </div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                        <p className="text-white/80 text-sm font-medium">{posts[currentImageIndex].is_moderator ? '📌 Moderator' : posts[currentImageIndex].user_name_snapshot}</p>
                        <p className="text-white/40 text-xs mt-0.5">{currentImageIndex + 1} / {posts.length}</p>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmModal isOpen={deleteConfirm.isOpen} onClose={() => setDeleteConfirm({ isOpen: false, post: null, isBulk: false })} onConfirm={handleDelete}
                title={deleteConfirm.isBulk ? "Delete Multiple Posts" : "Delete Wall Post"}
                message={deleteConfirm.isBulk ? `Are you sure you want to delete ${selectedItems.size} posts? This cannot be undone.` : "Are you sure you want to delete this wall post? This cannot be undone."}
                confirmText="Delete" confirmStyle="danger" />

            {/* Status Modal */}
            <StatusModal isOpen={statusModal.isOpen} onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                type={statusModal.type} title={statusModal.title} message={statusModal.message} />
        </div>
    );
}
