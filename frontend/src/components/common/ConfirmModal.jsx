import { AlertTriangle, Trash2, Archive, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'delete',
    confirmText,
    loading = false
}) {
    if (!isOpen) return null;

    const isDelete = type === 'delete';
    const isArchive = type === 'archive';

    const getIcon = () => {
        if (isDelete) return <Trash2 className="w-8 h-8 text-red-500" />;
        if (isArchive) return <Archive className="w-8 h-8 text-yellow-500" />;
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    };

    const getButtonColor = () => {
        if (isDelete) return 'bg-red-500 hover:bg-red-600';
        if (isArchive) return 'bg-yellow-500 hover:bg-yellow-600';
        return 'bg-primary-500 hover:bg-primary-600';
    };

    const getDefaultConfirmText = () => {
        if (confirmText) return confirmText;
        if (isDelete) return 'Delete Permanently';
        if (isArchive) return 'Archive';
        return 'Confirm';
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDelete ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                        {getIcon()}
                    </div>
                </div>

                {/* Content */}
                <div className="text-center">
                    <h3 className="text-xl font-bold text-dark-900 mb-2">
                        {title || (isDelete ? 'Delete Item?' : 'Archive Item?')}
                    </h3>
                    <p className="text-gray-600">
                        {message || (isDelete
                            ? 'This action cannot be undone. The item will be permanently removed.'
                            : 'This item will be archived and hidden from the main list. You can restore it later.'
                        )}
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2 ${getButtonColor()}`}
                    >
                        {loading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        ) : (
                            getDefaultConfirmText()
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
