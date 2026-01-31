import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Image, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { useGallery } from '../../context/GalleryContext';

export default function Gallery() {
    const { orgSlug } = useParams();
    const { getImages } = useGallery();

    const images = getImages(orgSlug);

    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
            // Fallback: open image in new tab
            window.open(imageSrc, '_blank');
        }
    };

    return (
        <div>
            {/* Hero Section with Video Background */}
            <section className="relative h-[25vh] min-h-[180px] overflow-hidden">
                {/* Video Background */}
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover blur-[2px]"
                >
                    <source src="/gallery-video.mp4" type="video/mp4" />
                </video>

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/50" />

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    {/* <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mb-4">
                        <Image className="w-7 h-7 md:w-8 md:h-8 text-white" />
                    </div> */}
                    <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Event Gallery</h1>
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl mx-auto">
                        Relive the best moments from our events.
                    </p>
                </div>
            </section>

            {/* Gallery Section */}
            <div className="py-8 md:py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Gallery Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                        {images.map((image, index) => (
                            <div
                                key={image.id}
                                className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden"
                            >
                                <img
                                    src={image.src}
                                    alt="Gallery image"
                                    onClick={() => openLightbox(index)}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors pointer-events-none" />
                                {/* Download Button */}
                                <button
                                    onClick={(e) => handleDownload(e, image.src, index)}
                                    className="absolute bottom-2 right-2 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                                    title="Download"
                                >
                                    <Download className="w-4 h-4 text-gray-700" />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {images.length === 0 && (
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
                                onClick={(e) => handleDownload(e, images[currentImageIndex].src, currentImageIndex)}
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
                                    src={images[currentImageIndex].src}
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
