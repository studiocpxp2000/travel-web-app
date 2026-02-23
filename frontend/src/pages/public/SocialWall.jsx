import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Image, X, ChevronLeft, ChevronRight, Download, Camera, Send, Loader2, RefreshCw } from 'lucide-react';
import { getSocket, joinOrg } from '../../services/socket';
import { useUserAuth } from '../../hooks/useAuthHooks';
import {
    useGetWallPostsQuery,
    useUploadWallPostMutation,
    useDownloadWallPostsMutation
} from '../../redux/slices/apiSlice';

// ─── Skeleton ──────────────────────────────────────────────────────────────────

const WallSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl" />
        ))}
    </div>
);

// ─── Camera Modal ──────────────────────────────────────────────────────────────
// Uses getUserMedia to open the real camera, with front/back switch.
// Captures a photo from the live video feed.

function CameraModal({ onClose, onCapture, isUploading }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    // Start camera stream
    const startCamera = useCallback(async (facing) => {
        // Stop existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setCameraReady(false);
        setCameraError(null);

        try {
            const constraints = {
                video: {
                    facingMode: facing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setCameraReady(true);
                };
            }
        } catch (err) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera access was denied. Please allow camera permission and try again.');
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                setCameraError('No camera found on this device.');
            } else if (err.name === 'OverconstrainedError') {
                // Facing mode not available, try without constraint
                try {
                    const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    streamRef.current = fallback;
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallback;
                        videoRef.current.onloadedmetadata = () => {
                            videoRef.current.play();
                            setCameraReady(true);
                        };
                    }
                } catch {
                    setCameraError('Unable to access camera.');
                }
            } else {
                setCameraError('Unable to access camera. Please check permissions.');
            }
        }
    }, []);

    useEffect(() => {
        startCamera(facingMode);
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, [facingMode, startCamera]);

    const handleSwitchCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        // Mirror front camera
        if (facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (!blob) return;
            const capturedFile = new File([blob], `wall-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
            setPreview(canvas.toDataURL('image/jpeg', 0.92));

            // Stop camera stream after capture
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        }, 'image/jpeg', 0.92);
    };

    const handleRetake = () => {
        setPreview(null);
        setFile(null);
        startCamera(facingMode);
    };

    const handlePost = () => {
        if (!file) return;
        onCapture(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
                    <h3 className="font-semibold text-gray-900 text-base">Share a Moment</h3>
                    <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Camera / Preview area */}
                <div className="relative bg-black flex-1 min-h-0">
                    {!preview ? (
                        <>
                            {/* Live viewfinder */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
                                style={{ minHeight: '280px', maxHeight: '400px' }}
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Camera loading state */}
                            {!cameraReady && !cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                                    <div className="text-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin mx-auto mb-2" />
                                        <p className="text-white/70 text-sm">Opening camera…</p>
                                    </div>
                                </div>
                            )}

                            {/* Camera error */}
                            {cameraError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 px-6">
                                    <div className="text-center">
                                        <Camera className="w-10 h-10 text-red-400 mx-auto mb-3" />
                                        <p className="text-white text-sm mb-4">{cameraError}</p>
                                        <button onClick={() => startCamera(facingMode)} className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                                            Try Again
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Camera controls overlay */}
                            {cameraReady && (
                                <div className="absolute bottom-0 left-0 right-0 pb-4 pt-8 bg-gradient-to-t from-black/60 to-transparent flex items-center justify-center gap-6">
                                    {/* Switch camera */}
                                    <button onClick={handleSwitchCamera} className="p-3 bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-colors" title="Switch camera">
                                        <RefreshCw className="w-5 h-5" />
                                    </button>
                                    {/* Capture */}
                                    <button onClick={handleCapture} className="w-16 h-16 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-colors flex items-center justify-center" title="Take photo">
                                        <div className="w-12 h-12 rounded-full bg-white" />
                                    </button>
                                    {/* Spacer for symmetry */}
                                    <div className="w-11" />
                                </div>
                            )}
                        </>
                    ) : (
                        /* Photo preview */
                        <div className="relative">
                            <img src={preview} alt="Captured" className="w-full object-cover" style={{ minHeight: '280px', maxHeight: '400px' }} />
                        </div>
                    )}
                </div>

                {/* Bottom actions */}
                <div className="px-4 py-3 border-t border-gray-100 shrink-0">
                    {preview ? (
                        <div className="flex gap-3">
                            <button onClick={handleRetake} disabled={isUploading} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                                Retake
                            </button>
                            <button onClick={handlePost} disabled={isUploading} className="flex-1 py-2.5 px-4 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                                {isUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Posting…</> : <><Send className="w-4 h-4" /> Post</>}
                            </button>
                        </div>
                    ) : (
                        <button onClick={onClose} className="w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SocialWall() {
    const { orgSlug } = useParams();
    const { user } = useUserAuth();

    const { data: wallData, isLoading } = useGetWallPostsQuery({ slug: orgSlug }, { skip: !orgSlug });
    const [uploadWallPost, { isLoading: isUploading }] = useUploadWallPostMutation();
    const [downloadWallPosts] = useDownloadWallPostsMutation();

    const images = wallData?.data || [];
    const wallEnabled = wallData?.wall_enabled ?? false;
    const uploadEnabled = wallData?.wall_upload_enabled ?? false;

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [showCamera, setShowCamera] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const socket = getSocket();
        const onConnect = () => { if (orgSlug) joinOrg(orgSlug); };
        if (socket.connected) onConnect();
        socket.on('connect', onConnect);
        return () => socket.off('connect', onConnect);
    }, [orgSlug]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Lightbox
    const openLightbox = (index) => { setCurrentImageIndex(index); setLightboxOpen(true); };
    const closeLightbox = () => setLightboxOpen(false);
    const goToPrev = () => setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1);
    const goToNext = () => setCurrentImageIndex((prev) => prev === images.length - 1 ? 0 : prev + 1);

    // Selection
    const toggleSelection = (id) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) newSelection.delete(id); else newSelection.add(id);
        setSelectedItems(newSelection);
    };

    // Download
    const handleDownload = async (e, imageSrc, index) => {
        e.stopPropagation();
        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `wall-image-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch { /* fallback */ }
    };

    const handleBulkDownload = async (type) => {
        try {
            setIsDownloading(true);
            const orgId = images[0]?.org_id;
            if (!orgId) { setIsDownloading(false); return; }
            const blob = await downloadWallPosts({ org_id: orgId, ids: type === 'all' ? 'all' : [...selectedItems] }).unwrap();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `wall-download-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            if (type === 'selected') { setSelectedItems(new Set()); setIsSelectionMode(false); }
        } catch { alert('Download failed. Please try again.'); }
        finally { setIsDownloading(false); }
    };

    // Upload
    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('org_slug', orgSlug);
        try {
            await uploadWallPost(formData).unwrap();
            setShowCamera(false);
            showToast('Your photo has been shared! 🎉');
        } catch (err) {
            showToast(err?.data?.message || 'Failed to post photo.', 'error');
        }
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                    {toast.message}
                </div>
            )}

            {/* Hero Section with Image Background */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900" />
                <img
                    src="/wall-hero.jpg" alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-700"
                    onLoad={(e) => e.target.classList.replace('opacity-0', 'opacity-60')}
                />
                <div className="absolute inset-0 bg-black/40" />
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3">Social Wall</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
                        Share your moments from this event. Photos update in real time!
                    </p>
                    {images.length > 0 && (
                        <div className="flex gap-3 flex-wrap justify-center mt-5">
                            <button onClick={() => handleBulkDownload('all')} className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm" disabled={isDownloading}>
                                <Download className="w-4 h-4" />
                                {isDownloading ? 'Zipping...' : 'Download All'}
                            </button>
                            <button onClick={() => { setIsSelectionMode(!isSelectionMode); setSelectedItems(new Set()); }} className={`px-4 py-2 rounded-lg font-medium transition-colors border text-sm ${isSelectionMode ? 'bg-primary-600 text-white border-primary-600' : 'bg-transparent text-white border-white hover:bg-white/10'}`}>
                                {isSelectionMode ? 'Done Selecting' : 'Select Photos'}
                            </button>
                            {isSelectionMode && selectedItems.size > 0 && (
                                <button onClick={() => handleBulkDownload('selected')} className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm" disabled={isDownloading}>
                                    <Download className="w-4 h-4" /> Download ({selectedItems.size})
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Upload Button Bar — below hero */}
            {wallEnabled && uploadEnabled && (
                <div className="bg-gradient-to-r from-primary-50 to-indigo-50 border-b border-primary-100">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            <Camera className="w-4 h-4 inline mr-1.5 text-primary-500" />
                            Capture & share your favorite moments
                        </p>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="bg-primary-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
                        >
                            <Camera className="w-4 h-4" />
                            Share a Moment
                        </button>
                    </div>
                </div>
            )}

            {/* Gallery Grid Section */}
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Feature Disabled */}
                    {!isLoading && !wallEnabled && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                                <Image className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-semibold text-gray-700 mb-1">Wall isn't active yet</h3>
                            <p className="text-sm text-gray-500">Check back soon — your event organizer will turn it on.</p>
                        </div>
                    )}

                    {wallEnabled && (
                        <>
                            {isLoading ? (
                                <WallSkeleton />
                            ) : images.length === 0 ? (
                                <div className="text-center py-16">
                                    <Camera className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <h3 className="font-semibold text-gray-700 mb-1">No posts yet</h3>
                                    <p className="text-sm text-gray-500">Be the first to share a moment!</p>
                                    {uploadEnabled && (
                                        <button onClick={() => setShowCamera(true)} className="mt-4 bg-primary-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-primary-700 transition-colors">
                                            <Camera className="w-4 h-4 mr-1.5 inline" /> Take a Photo
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                    {images.map((image, index) => (
                                        <div key={image._id} className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                                            <img
                                                src={image.imageUrl}
                                                alt={`Wall post ${index + 1}`}
                                                loading={index < 4 ? "eager" : "lazy"}
                                                fetchPriority={index < 4 ? "high" : "auto"}
                                                decoding="async"
                                                onClick={() => isSelectionMode ? toggleSelection(image._id) : openLightbox(index)}
                                                className={`w-full h-full object-cover transition-transform duration-300 ${isSelectionMode ? '' : 'group-hover:scale-110'}`}
                                            />
                                            {/* Poster name */}
                                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-6 pb-2 px-3 pointer-events-none">
                                                <p className="text-xs text-white font-medium truncate">
                                                    {image.is_moderator ? '📌 Moderator' : image.user_name_snapshot || 'User'}
                                                </p>
                                            </div>
                                            {/* Selection */}
                                            {isSelectionMode && (
                                                <div className="absolute top-2 right-2 z-20">
                                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors cursor-pointer ${selectedItems.has(image._id) ? 'bg-primary-500 border-primary-500' : 'bg-black/40 border-white'}`}
                                                        onClick={(e) => { e.stopPropagation(); toggleSelection(image._id); }}>
                                                        {selectedItems.has(image._id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                            <button onClick={(e) => handleDownload(e, image.imageUrl, index)} className="absolute top-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white" title="Download">
                                                <Download className="w-4 h-4 text-gray-700" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* Lightbox */}
                    {lightboxOpen && images.length > 0 && (
                        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                            <button onClick={closeLightbox} className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-8 h-8" /></button>
                            <button onClick={(e) => handleDownload(e, images[currentImageIndex].imageUrl, currentImageIndex)} className="absolute top-4 right-16 p-2 text-white hover:bg-white/10 rounded-lg transition-colors" title="Download"><Download className="w-8 h-8" /></button>
                            <button onClick={goToPrev} className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronLeft className="w-8 h-8" /></button>
                            <button onClick={goToNext} className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronRight className="w-8 h-8" /></button>
                            <div className="max-w-5xl max-h-[80vh] mx-4">
                                <img src={images[currentImageIndex].imageUrl} alt="Wall post" className="max-w-full max-h-[80vh] object-contain rounded-lg" />
                            </div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center">
                                <p className="text-white/80 text-sm font-medium">{images[currentImageIndex].is_moderator ? '📌 Moderator' : images[currentImageIndex].user_name_snapshot}</p>
                                <p className="text-white/40 text-xs mt-0.5">{currentImageIndex + 1} / {images.length}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Camera Modal */}
            {showCamera && <CameraModal onClose={() => setShowCamera(false)} onCapture={handleUpload} isUploading={isUploading} />}
        </div>
    );
}
