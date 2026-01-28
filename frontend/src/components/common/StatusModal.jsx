import { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export default function StatusModal({ isOpen, onClose, type = 'success', title, message, autoClose = true }) {
    useEffect(() => {
        if (isOpen && autoClose) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, autoClose, onClose]);

    if (!isOpen) return null;

    const isSuccess = type === 'success';

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                {/* Modal */}
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fade-in"
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
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isSuccess ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {isSuccess ? (
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            ) : (
                                <XCircle className="w-10 h-10 text-red-500" />
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <h3 className={`text-xl font-bold mb-2 ${isSuccess ? 'text-green-700' : 'text-red-700'
                            }`}>
                            {title || (isSuccess ? 'Success!' : 'Error!')}
                        </h3>
                        <p className="text-gray-600">
                            {message || (isSuccess ? 'Operation completed successfully.' : 'Something went wrong. Please try again.')}
                        </p>
                    </div>

                    {/* Button */}
                    <button
                        onClick={onClose}
                        className={`w-full mt-6 py-2 rounded-lg font-medium transition-colors ${isSuccess
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                    >
                        {isSuccess ? 'Continue' : 'Try Again'}
                    </button>
                </div>
            </div>
        </>
    );
}
