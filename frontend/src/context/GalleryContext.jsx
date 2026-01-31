import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { generateId } from '../utils/helpers';

const GalleryContext = createContext(null);

// Default sample images per org (no titles or categories)
const getDefaultImages = (orgSlug) => [
    { id: 'img-001', src: 'https://picsum.photos/800/600?random=1', createdAt: new Date().toISOString() },
    { id: 'img-002', src: 'https://picsum.photos/800/600?random=2', createdAt: new Date().toISOString() },
    { id: 'img-003', src: 'https://picsum.photos/800/600?random=3', createdAt: new Date().toISOString() },
];

export function GalleryProvider({ children }) {
    const [galleries, setGalleries] = useState({});

    // Load galleries from localStorage on mount
    useEffect(() => {
        const loadGalleries = () => {
            const storedGalleries = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith('gallery_')) {
                    try {
                        storedGalleries[key] = JSON.parse(localStorage.getItem(key));
                    } catch (e) {
                        console.error('Error parsing gallery:', key, e);
                    }
                }
            }
            setGalleries(storedGalleries);
        };

        loadGalleries();

        // Listen for storage events (cross-tab sync)
        const handleStorageChange = (e) => {
            if (e.key?.startsWith('gallery_')) {
                if (e.newValue) {
                    try {
                        setGalleries(prev => ({
                            ...prev,
                            [e.key]: JSON.parse(e.newValue)
                        }));
                    } catch (err) {
                        console.error('Error parsing gallery update:', err);
                    }
                } else {
                    // Key was removed
                    setGalleries(prev => {
                        const updated = { ...prev };
                        delete updated[e.key];
                        return updated;
                    });
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Get images for a specific org
    const getImages = useCallback((orgSlug) => {
        const key = `gallery_${orgSlug}`;
        if (galleries[key]) {
            return galleries[key];
        }
        // Return default images if no custom gallery exists
        return getDefaultImages(orgSlug);
    }, [galleries]);

    // Add image to org gallery
    const addImage = useCallback((orgSlug, imageData) => {
        const key = `gallery_${orgSlug}`;
        const currentImages = galleries[key] || getDefaultImages(orgSlug);

        const newImage = {
            id: generateId('img'),
            src: imageData.src,
            createdAt: new Date().toISOString(),
        };

        const updatedImages = [newImage, ...currentImages];

        // Save to localStorage
        localStorage.setItem(key, JSON.stringify(updatedImages));

        // Update state
        setGalleries(prev => ({
            ...prev,
            [key]: updatedImages
        }));

        return newImage;
    }, [galleries]);

    // Remove image from org gallery
    const removeImage = useCallback((orgSlug, imageId) => {
        const key = `gallery_${orgSlug}`;
        const currentImages = galleries[key] || getDefaultImages(orgSlug);

        const updatedImages = currentImages.filter(img => img.id !== imageId);

        // Save to localStorage
        localStorage.setItem(key, JSON.stringify(updatedImages));

        // Update state
        setGalleries(prev => ({
            ...prev,
            [key]: updatedImages
        }));
    }, [galleries]);

    const value = {
        getImages,
        addImage,
        removeImage,
    };

    return (
        <GalleryContext.Provider value={value}>
            {children}
        </GalleryContext.Provider>
    );
}

export function useGallery() {
    const context = useContext(GalleryContext);
    if (!context) {
        throw new Error('useGallery must be used within a GalleryProvider');
    }
    return context;
}

export default GalleryContext;
