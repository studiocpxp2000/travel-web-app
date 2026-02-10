import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Image, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { getSocket, disconnectSocket, joinOrg } from '../../services/socket';
import { useDispatch } from 'react-redux';
import { apiSlice, useGetGalleryQuery, useDownloadGalleryMutation } from '../../redux/slices/apiSlice';

const GallerySkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 animate-pulse">
        {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl" />
        ))}
    </div>
);

export default function Gallery() {
    const { orgSlug } = useParams();
    const dispatch = useDispatch();

    // Fetch Gallery
    const { data: galleryData, isLoading } = useGetGalleryQuery({ slug: orgSlug });
    const [downloadGallery] = useDownloadGalleryMutation();

    const images = galleryData?.data || [];

    // State
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Initial Mobile Detection for Performance
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Socket.io Connection
    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => {
            if (orgSlug) {
                joinOrg(orgSlug);
            }
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);

        const handleUpdate = () => {
            dispatch(apiSlice.util.invalidateTags(['Gallery']));
        };

        socket.on('gallery_update', handleUpdate);
        socket.on('gallery_delete', handleUpdate);
        socket.on('gallery_delete_bulk', handleUpdate);

        return () => {
            socket.off('connect', onConnect);
            socket.off('gallery_update', handleUpdate);
            socket.off('gallery_delete', handleUpdate);
            socket.off('gallery_delete_bulk', handleUpdate);
        };
    }, [orgSlug, dispatch]);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const goToPrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentImageIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    const toggleSelection = (id) => {
        const newSelection = new Set(selectedItems);
        if (newSelection.has(id)) {
            newSelection.delete(id);
        } else {
            newSelection.add(id);
        }
        setSelectedItems(newSelection);
    };

    const handleDownload = async (e, imageSrc, index) => {
        e.stopPropagation();
        try {
            const response = await fetch(imageSrc);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gallery-image-${index + 1}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            window.open(imageSrc, '_blank');
        }
    };

    const handleBulkDownload = async (type) => {
        try {
            setIsDownloading(true);
            const orgId = images.length > 0 ? images[0].org_id : null;
            if (!orgId) {
                alert('Unable to identify organization for download.');
                setIsDownloading(false);
                return;
            }

            const payload = {
                org_id: orgId,
                ids: type === 'all' ? 'all' : [...selectedItems]
            };

            const blob = await downloadGallery(payload).unwrap();

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `gallery-download-${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            if (type === 'selected') {
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            }
        } catch (err) {
            console.error('Download failed', err);
            alert('Download failed. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section with Video Background */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden bg-primary-900">
                {/* Video Background with Poster for Performance - Desktop Only */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/gallery-hero-poster.jpg"
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px] transition-opacity duration-1000"
                    onCanPlay={(e) => e.target.classList.remove('opacity-0')}
                >
                    <source src="/gallery-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Event Gallery</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto mb-6">
                        Relive the best moments from our events.
                    </p>

                    {/* Public Actions */}
                    <div className="flex gap-3">
                        {images.length > 0 && (
                            <>
                                <button
                                    onClick={() => handleBulkDownload('all')}
                                    className="bg-white text-gray-900 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
                                    disabled={isDownloading}
                                >
                                    <Download className="w-4 h-4" />
                                    {isDownloading ? 'Zipping...' : 'Download All'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsSelectionMode(!isSelectionMode);
                                        setSelectedItems(new Set());
                                    }}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors border ${isSelectionMode ? 'bg-primary-600 text-white border-primary-600' : 'bg-transparent text-white border-white hover:bg-white/10'}`}
                                >
                                    {isSelectionMode ? 'Done Selecting' : 'Select Photos'}
                                </button>
                                {isSelectionMode && selectedItems.size > 0 && (
                                    <button
                                        onClick={() => handleBulkDownload('selected')}
                                        className="bg-primary-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
                                        disabled={isDownloading}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download ({selectedItems.size})
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Gallery Grid */}
                    {isLoading ? (
                        <GallerySkeleton />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                            {images.map((image, index) => (
                                <div
                                    key={image._id}
                                    className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                                >
                                    <img
                                        src={image.url}
                                        alt={`Gallery item ${index + 1}`}
                                        loading={index < 4 ? "eager" : "lazy"}
                                        fetchPriority={index < 4 ? "high" : "auto"}
                                        decoding="async"
                                        onClick={() => {
                                            if (isSelectionMode) {
                                                toggleSelection(image._id);
                                            } else {
                                                openLightbox(index);
                                            }
                                        }}
                                        className={`w-full h-full object-cover transition-transform duration-300 ${isSelectionMode ? '' : 'group-hover:scale-110'}`}
                                    />

                                    {/* Selection Checkbox - Visible in Select Mode */}
                                    {isSelectionMode && (
                                        <div className="absolute top-2 right-2 z-20">
                                            <div
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.has(image._id) ? 'bg-primary-500 border-primary-500' : 'bg-black/40 border-white'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelection(image._id);
                                                }}
                                            >
                                                {selectedItems.has(image._id) && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                                    {/* Download Button */}
                                    <button
                                        onClick={(e) => handleDownload(e, image.url, index)}
                                        className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4 text-gray-700" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && images.length === 0 && (
                        <div className="text-center py-12">
                            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No images in the gallery yet.</p>
                        </div>
                    )}

                    {/* Lightbox */}
                    {lightboxOpen && images.length > 0 && (
                        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                            <button
                                onClick={closeLightbox}
                                className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            {/* Download button in lightbox */}
                            <button
                                onClick={(e) => handleDownload(e, images[currentImageIndex].url, currentImageIndex)}
                                className="absolute top-4 right-16 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Download"
                            >
                                <Download className="w-8 h-8" />
                            </button>

                            <button
                                onClick={goToPrev}
                                className="absolute left-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>

                            <button
                                onClick={goToNext}
                                className="absolute right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>

                            <div className="max-w-5xl max-h-[80vh] mx-4">
                                <img
                                    src={images[currentImageIndex].url}
                                    alt="Gallery image"
                                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                />
                            </div>

                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                                {currentImageIndex + 1} / {images.length}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
