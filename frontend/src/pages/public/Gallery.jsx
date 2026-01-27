import { useState } from 'react';
import { Image, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Sample gallery images (using placeholder data)
const galleryImages = [
    { id: 1, src: 'https://picsum.photos/800/600?random=1', title: 'Opening Ceremony', category: 'Events' },
    { id: 2, src: 'https://picsum.photos/800/600?random=2', title: 'Keynote Speech', category: 'Events' },
    { id: 3, src: 'https://picsum.photos/800/600?random=3', title: 'Networking Session', category: 'Networking' },
    { id: 4, src: 'https://picsum.photos/800/600?random=4', title: 'Workshop 1', category: 'Workshops' },
    { id: 5, src: 'https://picsum.photos/800/600?random=5', title: 'Panel Discussion', category: 'Events' },
    { id: 6, src: 'https://picsum.photos/800/600?random=6', title: 'Coffee Break', category: 'Networking' },
    { id: 7, src: 'https://picsum.photos/800/600?random=7', title: 'Workshop 2', category: 'Workshops' },
    { id: 8, src: 'https://picsum.photos/800/600?random=8', title: 'Gala Dinner', category: 'Events' },
    { id: 9, src: 'https://picsum.photos/800/600?random=9', title: 'Team Photo', category: 'Networking' },
    { id: 10, src: 'https://picsum.photos/800/600?random=10', title: 'Award Ceremony', category: 'Events' },
    { id: 11, src: 'https://picsum.photos/800/600?random=11', title: 'Venue Tour', category: 'Workshops' },
    { id: 12, src: 'https://picsum.photos/800/600?random=12', title: 'Closing Party', category: 'Networking' },
];

const categories = ['All', 'Events', 'Networking', 'Workshops'];

export default function Gallery() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const filteredImages = activeCategory === 'All'
        ? galleryImages
        : galleryImages.filter(img => img.category === activeCategory);

    const openLightbox = (index) => {
        setCurrentImageIndex(index);
        setLightboxOpen(true);
    };

    const closeLightbox = () => {
        setLightboxOpen(false);
    };

    const goToPrev = () => {
        setCurrentImageIndex((prev) =>
            prev === 0 ? filteredImages.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentImageIndex((prev) =>
            prev === filteredImages.length - 1 ? 0 : prev + 1
        );
    };

    return (
        <div className="py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center mx-auto mb-4">
                        <Image className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-dark-900 mb-4">Event Gallery</h1>
                    <p className="text-lg text-text-light max-w-2xl mx-auto">
                        Relive the best moments from our events.
                    </p>
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setActiveCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === category
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Gallery Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image, index) => (
                        <div
                            key={image.id}
                            onClick={() => openLightbox(index)}
                            className="cursor-pointer group relative aspect-square rounded-xl overflow-hidden"
                        >
                            <img
                                src={image.src}
                                alt={image.title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-4">
                                <p className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    {image.title}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Lightbox */}
                {lightboxOpen && (
                    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
                        <button
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-8 h-8" />
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
                                src={filteredImages[currentImageIndex].src}
                                alt={filteredImages[currentImageIndex].title}
                                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                            />
                            <p className="text-white text-center mt-4 text-lg">
                                {filteredImages[currentImageIndex].title}
                            </p>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                            {currentImageIndex + 1} / {filteredImages.length}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
