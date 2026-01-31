import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Plus, Trash2, Upload, X } from 'lucide-react';
import { useGallery } from '../../context/GalleryContext';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';

export default function GalleryManager() {
    const { orgSlug } = useParams();
    const { organization } = useAuth();
    const { getImages, addImage, removeImage } = useGallery();

    const currentSlug = orgSlug || organization?.slug;
    const images = getImages(currentSlug);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, image: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
    const [previewImages, setPreviewImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef(null);

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate files and create previews
        const validFiles = [];
        const previews = [];

        files.forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                showStatus('error', 'File Too Large', `${file.name} exceeds 5MB limit and was skipped.`);
                return;
            }
            validFiles.push(file);
        });

        if (validFiles.length === 0) return;

        // Read all valid files
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previews.push({
                    file,
                    src: reader.result,
                    name: file.name
                });
                // Update state when all files are read
                if (previews.length === validFiles.length) {
                    setPreviewImages(prev => [...prev, ...previews]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removePreview = (index) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (previewImages.length === 0) {
            showStatus('error', 'No Images', 'Please select at least one image to upload.');
            return;
        }

        setIsUploading(true);

        // Add all images
        previewImages.forEach(preview => {
            addImage(currentSlug, { src: preview.src });
        });

        const count = previewImages.length;
        showStatus('success', 'Images Uploaded', `${count} image${count > 1 ? 's have' : ' has'} been added to the gallery!`);

        closeModal();
        setIsUploading(false);
    };

    const handleDelete = () => {
        if (deleteConfirm.image) {
            removeImage(currentSlug, deleteConfirm.image.id);
            showStatus('success', 'Image Deleted', 'The image has been removed from the gallery.');
        }
        setDeleteConfirm({ isOpen: false, image: null });
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPreviewImages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-dark-900">Gallery Manager</h1>
                    <p className="text-text-light">
                        Upload and manage images for your public gallery
                        <span className="ml-2 text-green-600 text-sm font-medium">• Real-time sync enabled</span>
                    </p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Upload Images
                </button>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Image className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <p className="font-medium text-blue-900">Real-Time Gallery Sync</p>
                        <p className="text-sm text-blue-700">
                            Images added here will instantly appear on the public gallery page.
                            You can upload multiple images at once!
                        </p>
                    </div>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                    >
                        <img
                            src={image.src}
                            alt="Gallery image"
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay with delete button */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => setDeleteConfirm({ isOpen: true, image })}
                                className="p-3 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {images.length === 0 && (
                <div className="text-center py-12">
                    <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No images yet</h3>
                    <p className="text-gray-500 mb-4">Start adding images to your gallery</p>
                    <button onClick={() => setIsModalOpen(true)} className="btn-primary">
                        <Plus className="w-5 h-5 mr-2" />
                        Upload Images
                    </button>
                </div>
            )}

            {/* Upload Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Upload Images to Gallery"
            >
                <div className="space-y-4">
                    {/* File Upload Area */}
                    <div>
                        <label className="flex flex-col items-center justify-center gap-3 px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                            <Upload className="w-10 h-10 text-gray-400" />
                            <div className="text-center">
                                <span className="text-sm font-medium text-gray-700">Click to select images</span>
                                <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP, AVIF (max 5MB each)</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                                multiple
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>

                    {/* Preview Grid */}
                    {previewImages.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                Selected Images ({previewImages.length})
                            </p>
                            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto p-1">
                                {previewImages.map((preview, index) => (
                                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                            src={preview.src}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removePreview(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            className="btn-primary"
                            disabled={previewImages.length === 0 || isUploading}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            {isUploading ? 'Uploading...' : `Upload ${previewImages.length || ''} Image${previewImages.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, image: null })}
                onConfirm={handleDelete}
                title="Delete Image"
                message="Are you sure you want to delete this image? This action cannot be undone."
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
