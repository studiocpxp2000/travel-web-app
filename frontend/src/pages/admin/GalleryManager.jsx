import { useState, useEffect, useRef } from 'react';
import { getSocket, disconnectSocket, joinOrg, joinAdminRoom } from '../../services/socket';
import { useParams } from 'react-router-dom';
import { Image, Plus, Trash2, Upload, X } from 'lucide-react';
// import { useGallery } from '../../context/GalleryContext'; // Removed
import { useAuth } from '../../hooks/useAuthHooks';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';
// import { io } from 'socket.io-client'; // Removed
import { useDispatch } from 'react-redux';
import { apiSlice, useGetGalleryQuery, useUploadGalleryItemMutation, useDeleteGalleryItemMutation, useDeleteGalleryItemsMutation } from '../../redux/slices/apiSlice';

export default function GalleryManager() {
    const { orgSlug } = useParams();
    const { user } = useAuth(); // Get user to access org_id

    // Fetch organization details to get the slug if not provided in params
    const { data: orgData } = apiSlice.useGetOrganizationByIdQuery(user?.org_id, {
        skip: !!orgSlug || !user?.org_id
    });

    const currentSlug = orgSlug || orgData?.data?.slug;

    // API Hooks
    const dispatch = useDispatch();
    const { data: galleryData, isLoading } = useGetGalleryQuery({ slug: currentSlug }, { skip: !currentSlug });
    const [uploadGalleryItem, { isLoading: isUploading }] = useUploadGalleryItemMutation();
    const [deleteGalleryItem] = useDeleteGalleryItemMutation();
    const [deleteGalleryItems] = useDeleteGalleryItemsMutation();

    const images = galleryData?.data || [];



    // Socket.io Connection
    useEffect(() => {
        const socket = getSocket();

        const onConnect = () => {
            console.log('Connected to socket');
            if (currentSlug) {
                joinOrg(currentSlug);
                joinAdminRoom(currentSlug);
            }
        };

        if (socket.connected) {
            onConnect();
        }

        socket.on('connect', onConnect);

        const handleUpdate = () => {
            console.log('Gallery update received');
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
    }, [currentSlug, dispatch]);


    const [selectedItems, setSelectedItems] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);



    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, image: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });
    const [previewImages, setPreviewImages] = useState([]);
    // const [isUploading, setIsUploading] = useState(false); // Managed by hook

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

        // setIsUploading(true); // Handled by hook

        try {
            // Upload images one by one or in batch if backend supports it.
            // My mutation expects formData or body.
            // Backend `contentController` usually handles multipart/form-data for files.
            // But my `apiSlice` `uploadGalleryItem` sends `body: formData` and is POST.
            // If backend expects multipart, I must send FormData.
            // `previewImages` has `file` object.

            let successCount = 0;

            // Parallel uploads
            await Promise.all(previewImages.map(async (preview) => {
                const formData = new FormData();
                formData.append('file', preview.file); // Backend expects 'file' field
                formData.append('org_slug', currentSlug); // If needed

                await uploadGalleryItem(formData).unwrap();
                successCount++;
            }));

            showStatus('success', 'Images Uploaded', `${successCount} image${successCount > 1 ? 's have' : ' has'} been added to the gallery!`);
            closeModal();
        } catch (err) {
            console.error(err);
            showStatus('error', 'Upload Failed', err?.data?.message || 'Some images failed to upload.');
        }
        // setIsUploading(false); // Handled by hook
    };

    const handleDelete = async () => {
        if (deleteConfirm.image) {
            try {
                await deleteGalleryItem(deleteConfirm.image._id).unwrap();
                showStatus('success', 'Image Deleted', 'The image has been removed from the gallery.');
            } catch (err) {
                showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete image.');
            }
        } else if (deleteConfirm.isBulk) {
            try {
                await deleteGalleryItems([...selectedItems]).unwrap();
                showStatus('success', 'Images Deleted', `${selectedItems.size} images have been removed.`);
                setSelectedItems(new Set());
                setIsSelectionMode(false);
            } catch (err) {
                showStatus('error', 'Delete Failed', err?.data?.message || 'Failed to delete images.');
            }
        }
        setDeleteConfirm({ isOpen: false, image: null, isBulk: false });
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

    const selectAll = () => {
        if (selectedItems.size === images.length) {
            setSelectedItems(new Set());
        } else {
            const allIds = images.map(img => img._id);
            setSelectedItems(new Set(allIds));
        }
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
                <div className="flex gap-2">
                    {images.length > 0 && (
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedItems(new Set());
                            }}
                            className={`btn-secondary ${isSelectionMode ? 'bg-gray-200' : ''}`}
                        >
                            {isSelectionMode ? 'Cancel Selection' : 'Select Images'}
                        </button>
                    )}
                    {isSelectionMode && selectedItems.size > 0 && (
                        <button
                            onClick={() => setDeleteConfirm({ isOpen: true, isBulk: true })}
                            className="btn-danger"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete ({selectedItems.size})
                        </button>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-primary"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Upload Images
                    </button>
                </div>
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
                        key={image._id}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200"
                    >
                        <img
                            src={image.url}
                            alt="Gallery image"
                            className="w-full h-full object-cover"
                            onClick={() => {
                                if (isSelectionMode) toggleSelection(image._id);
                            }}
                        />

                        {/* Selection Checkbox */}
                        {isSelectionMode && (
                            <div className="absolute top-2 right-2 z-10">
                                <input
                                    type="checkbox"
                                    checked={selectedItems.has(image._id)}
                                    onChange={() => toggleSelection(image._id)}
                                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        )}

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
                title={deleteConfirm.isBulk ? "Delete Multiple Images" : "Delete Image"}
                message={deleteConfirm.isBulk
                    ? `Are you sure you want to delete ${selectedItems.size} images? This action cannot be undone.`
                    : "Are you sure you want to delete this image? This action cannot be undone."
                }
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
