import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Image, Plus, Trash2, Upload, Link as LinkIcon, X, Edit2, Save } from 'lucide-react';
import { useGallery } from '../../context/GalleryContext';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/forms/Input';
import Modal from '../../components/common/Modal';
import ConfirmModal from '../../components/common/ConfirmModal';
import StatusModal from '../../components/common/StatusModal';

const categories = ['Events', 'Networking', 'Workshops', 'Venue', 'Team', 'Other'];

export default function GalleryManager() {
    const { orgSlug } = useParams();
    const { organization } = useAuth();
    const { getImages, addImage, removeImage, updateImage } = useGallery();

    const currentSlug = orgSlug || organization?.slug;
    const images = getImages(currentSlug);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingImage, setEditingImage] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, image: null });
    const [statusModal, setStatusModal] = useState({ isOpen: false, type: '', title: '', message: '' });

    const [formData, setFormData] = useState({
        src: '',
        title: '',
        category: 'Events',
    });

    const fileInputRef = useRef(null);

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                showStatus('error', 'File Too Large', 'Please select an image under 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, src: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.src) {
            showStatus('error', 'Image Required', 'Please provide an image URL or upload a file.');
            return;
        }

        if (!formData.title.trim()) {
            showStatus('error', 'Title Required', 'Please enter a title for the image.');
            return;
        }

        if (editingImage) {
            updateImage(currentSlug, editingImage.id, {
                title: formData.title,
                category: formData.category,
                src: formData.src,
            });
            showStatus('success', 'Image Updated', 'The image has been updated successfully.');
        } else {
            addImage(currentSlug, formData);
            showStatus('success', 'Image Added', 'The image has been added to the gallery and is now visible on the public page!');
        }

        closeModal();
    };

    const handleEdit = (image) => {
        setEditingImage(image);
        setFormData({
            src: image.src,
            title: image.title,
            category: image.category,
        });
        setIsModalOpen(true);
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
        setEditingImage(null);
        setFormData({ src: '', title: '', category: 'Events' });
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
                    Add Image
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
                            Open the public gallery in another tab to see changes in real-time!
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
                            alt={image.title}
                            className="w-full h-full object-cover"
                        />

                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                                onClick={() => handleEdit(image)}
                                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-5 h-5 text-gray-700" />
                            </button>
                            <button
                                onClick={() => setDeleteConfirm({ isOpen: true, image })}
                                className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                                title="Delete"
                            >
                                <Trash2 className="w-5 h-5 text-red-600" />
                            </button>
                        </div>

                        {/* Info overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white font-medium text-sm truncate">{image.title}</p>
                            <p className="text-white/70 text-xs">{image.category}</p>
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
                        Add First Image
                    </button>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={editingImage ? 'Edit Image' : 'Add Image to Gallery'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Image Preview */}
                    <div className="flex justify-center">
                        <div className="w-48 h-36 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
                            {formData.src ? (
                                <img
                                    src={formData.src}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Image className="w-12 h-12 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* URL Input */}
                    <div>
                        <label className="form-label flex items-center gap-1">
                            <LinkIcon className="w-4 h-4" /> Image URL
                        </label>
                        <Input
                            placeholder="https://example.com/image.jpg"
                            value={formData.src}
                            onChange={(e) => setFormData({ ...formData, src: e.target.value })}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <span className="text-xs text-gray-400">OR</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="form-label flex items-center gap-1">
                            <Upload className="w-4 h-4" /> Upload Image
                        </label>
                        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors">
                            <Upload className="w-5 h-5 text-gray-500" />
                            <span className="text-sm text-gray-600">Click to select file</span>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp,image/avif"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP, AVIF (max 5MB)</p>
                    </div>

                    {/* Title */}
                    <Input
                        label="Image Title"
                        placeholder="Enter image title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                    />

                    {/* Category */}
                    <div>
                        <label className="form-label">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="form-input"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={closeModal} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            <Save className="w-4 h-4 mr-2" />
                            {editingImage ? 'Save Changes' : 'Add Image'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, image: null })}
                onConfirm={handleDelete}
                title="Delete Image"
                message={`Are you sure you want to delete "${deleteConfirm.image?.title}"? This action cannot be undone.`}
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
